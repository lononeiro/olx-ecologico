"use client";
import { useState, useRef, useEffect } from "react";

interface Mensagem {
  id: number;
  mensagem: string;
  createdAt: string | Date;
  remetente: { id: number; nome: string };
}

interface Props {
  coletaId: number;
  currentUserId: number;
  initialMessages: Mensagem[];
}

export function ChatBox({ coletaId, currentUserId, initialMessages }: Props) {
  const [mensagens, setMensagens] = useState<Mensagem[]>(initialMessages);
  const [texto, setTexto] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Faz scroll automático para a última mensagem
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensagens]);

  // Polling leve para novas mensagens a cada 10 segundos
  useEffect(() => {
    const interval = setInterval(async () => {
      const res = await fetch(`/api/mensagens/${coletaId}`);
      if (res.ok) {
        const data = await res.json();
        setMensagens(data);
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [coletaId]);

  async function handleEnviar(e: React.FormEvent) {
    e.preventDefault();
    if (!texto.trim()) return;
    setLoading(true);

    const res = await fetch(`/api/mensagens/${coletaId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mensagem: texto.trim() }),
    });

    setLoading(false);

    if (res.ok) {
      const nova = await res.json();
      setMensagens((prev) => [...prev, nova]);
      setTexto("");
    }
  }

  return (
    <div className="flex flex-col">
      {/* Lista de mensagens */}
      <div className="h-64 overflow-y-auto space-y-3 mb-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
        {mensagens.length === 0 ? (
          <p className="text-center text-gray-400 text-sm mt-8">
            Nenhuma mensagem ainda. Inicie a conversa!
          </p>
        ) : (
          mensagens.map((m) => {
            const isOwn = m.remetente.id === currentUserId;
            return (
              <div
                key={m.id}
                className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-xs lg:max-w-sm rounded-2xl px-4 py-2 text-sm shadow-sm ${
                    isOwn
                      ? "bg-green-600 text-white rounded-br-sm"
                      : "bg-white text-gray-800 border border-gray-200 rounded-bl-sm"
                  }`}
                >
                  {!isOwn && (
                    <p className="text-xs font-semibold mb-1 text-green-700">
                      {m.remetente.nome}
                    </p>
                  )}
                  <p className="whitespace-pre-wrap break-words">{m.mensagem}</p>
                  <p
                    className={`text-xs mt-1 ${
                      isOwn ? "text-green-200" : "text-gray-400"
                    }`}
                  >
                    {new Date(m.createdAt).toLocaleTimeString("pt-BR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input de mensagem */}
      <form onSubmit={handleEnviar} className="flex gap-2">
        <input
          type="text"
          className="input-field flex-1"
          placeholder="Digite uma mensagem..."
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !texto.trim()}
          className="btn-primary px-5"
        >
          {loading ? "..." : "Enviar"}
        </button>
      </form>
    </div>
  );
}
