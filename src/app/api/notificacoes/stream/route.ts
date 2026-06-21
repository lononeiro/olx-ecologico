import { NextRequest } from "next/server";
import { autorizarRota, getUserId } from "@/lib/route-guard";
import {
  buscarNotificacoesDesde,
  contarNaoLidas,
  ultimaNotificacaoId,
} from "@/services/notificacao.service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// Mantém a conexão aberta o máximo permitido pelo ambiente; ao expirar,
// o EventSource do navegador reconecta sozinho enviando o Last-Event-ID.
export const maxDuration = 60;

const POLL_INTERVAL_MS = 4000;
const HEARTBEAT_MS = 25000;

// GET /api/notificacoes/stream — Server-Sent Events com as novas notificações.
// Autenticação via cookie de sessão (o EventSource envia cookies same-origin).
export async function GET(req: NextRequest) {
  const { session, error } = await autorizarRota(["usuario", "empresa", "admin"]);
  if (error) return error;

  const userId = getUserId(session!);
  const encoder = new TextEncoder();

  // Ponto de partida: Last-Event-ID (reconexão automática) tem prioridade,
  // depois o parâmetro de query, senão o id mais recente já existente.
  let lastId = await ultimaNotificacaoId(userId);
  const headerLastId = req.headers.get("last-event-id");
  const queryLastId = req.nextUrl.searchParams.get("lastEventId");
  const resume = headerLastId ?? queryLastId;
  if (resume && !Number.isNaN(Number(resume))) {
    lastId = Number(resume);
  }

  const stream = new ReadableStream({
    async start(controller) {
      let closed = false;

      const enqueue = (chunk: string) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(chunk));
        } catch {
          closed = true;
        }
      };

      const send = (event: string, data: unknown, id?: number) => {
        let payload = "";
        if (id !== undefined) payload += `id: ${id}\n`;
        payload += `event: ${event}\n`;
        payload += `data: ${JSON.stringify(data)}\n\n`;
        enqueue(payload);
      };

      // Estado inicial (contador de não lidas)
      try {
        const naoLidas = await contarNaoLidas(userId);
        send("init", { naoLidas, lastId });
      } catch {
        // ignora falha transitória na abertura
      }

      const tick = async () => {
        if (closed) return;
        try {
          const novas = await buscarNotificacoesDesde(userId, lastId);
          if (novas.length > 0) {
            lastId = novas[novas.length - 1].id;
            const naoLidas = await contarNaoLidas(userId);
            send("notificacoes", { novas, naoLidas }, lastId);
          }
        } catch {
          // erros transitórios não derrubam o stream
        }
      };

      const pollTimer = setInterval(tick, POLL_INTERVAL_MS);
      const heartbeatTimer = setInterval(() => enqueue(": keep-alive\n\n"), HEARTBEAT_MS);

      const cleanup = () => {
        if (closed) return;
        closed = true;
        clearInterval(pollTimer);
        clearInterval(heartbeatTimer);
        try {
          controller.close();
        } catch {
          // já fechado
        }
      };

      req.signal.addEventListener("abort", cleanup);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
