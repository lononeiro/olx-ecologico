"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Notificacao = {
  id: number;
  tipo: string;
  titulo: string;
  descricao: string;
  href: string | null;
  lida: boolean;
  createdAt: string;
};

const LIMITE_LISTA = 30;

export function NotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notificacao[]>([]);
  const [naoLidas, setNaoLidas] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Carga inicial da lista (o stream só envia as novas a partir de agora).
  useEffect(() => {
    let active = true;
    fetch("/api/notificacoes")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!active || !data) return;
        setItems(data.notificacoes ?? []);
        setNaoLidas(data.naoLidas ?? 0);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  // Conexão em tempo real via Server-Sent Events.
  useEffect(() => {
    const es = new EventSource("/api/notificacoes/stream");

    es.addEventListener("init", (event) => {
      try {
        const data = JSON.parse((event as MessageEvent).data);
        if (typeof data.naoLidas === "number") setNaoLidas(data.naoLidas);
      } catch {}
    });

    es.addEventListener("notificacoes", (event) => {
      try {
        const data = JSON.parse((event as MessageEvent).data);
        const novas: Notificacao[] = data.novas ?? [];
        if (novas.length > 0) {
          setItems((prev) => {
            const existentes = new Set(prev.map((n) => n.id));
            const filtradas = novas.filter((n) => !existentes.has(n.id));
            return [...filtradas.reverse(), ...prev].slice(0, LIMITE_LISTA);
          });
        }
        if (typeof data.naoLidas === "number") setNaoLidas(data.naoLidas);
      } catch {}
    });

    // O navegador reconecta automaticamente em caso de erro/timeout.
    es.onerror = () => {};

    return () => es.close();
  }, []);

  // Fecha o painel ao clicar fora.
  useEffect(() => {
    if (!open) return;
    const onClick = (event: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const marcarTodas = useCallback(async () => {
    setItems((prev) => prev.map((n) => ({ ...n, lida: true })));
    setNaoLidas(0);
    await fetch("/api/notificacoes", { method: "PATCH" }).catch(() => {});
  }, []);

  const abrirNotificacao = useCallback(
    (n: Notificacao) => {
      setOpen(false);
      if (!n.lida) {
        setItems((prev) =>
          prev.map((x) => (x.id === n.id ? { ...x, lida: true } : x))
        );
        setNaoLidas((c) => Math.max(0, c - 1));
        fetch(`/api/notificacoes/${n.id}`, { method: "PATCH" }).catch(() => {});
      }
      if (n.href) router.push(n.href);
    },
    [router]
  );

  const badge = naoLidas > 9 ? "9+" : String(naoLidas);

  return (
    <div className="notif-wrap" ref={wrapRef}>
      <button
        type="button"
        className="app-notification-button"
        aria-label="Notificações"
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <BellIcon />
        {naoLidas > 0 && <span className="notif-badge">{badge}</span>}
      </button>

      {open && (
        <div className="notif-panel" role="menu">
          <div className="notif-panel-head">
            <span className="notif-panel-title">Notificações</span>
            {naoLidas > 0 && (
              <button type="button" className="notif-mark" onClick={marcarTodas}>
                Marcar todas como lidas
              </button>
            )}
          </div>

          <div className="notif-list">
            {items.length === 0 ? (
              <p className="notif-empty">Você ainda não tem notificações.</p>
            ) : (
              items.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  className={`notif-item${n.lida ? "" : " is-unread"}`}
                  onClick={() => abrirNotificacao(n)}
                >
                  <span className="notif-item-dot" aria-hidden="true" />
                  <span className="notif-item-body">
                    <span className="notif-item-title">{n.titulo}</span>
                    <span className="notif-item-desc">{n.descricao}</span>
                    <span className="notif-item-time">
                      {formatarTempoRelativo(n.createdAt)}
                    </span>
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function formatarTempoRelativo(iso: string) {
  const data = new Date(iso);
  const diffMs = Date.now() - data.getTime();
  const min = Math.floor(diffMs / 60000);

  if (min < 1) return "agora";
  if (min < 60) return `há ${min} min`;

  const horas = Math.floor(min / 60);
  if (horas < 24) return `há ${horas} h`;

  const dias = Math.floor(horas / 24);
  if (dias < 7) return `há ${dias} d`;

  return data.toLocaleDateString("pt-BR");
}

function BellIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 8-3 8h18s-3-1-3-8" />
      <path d="M13.7 21a2 2 0 0 1-3.4 0" />
    </svg>
  );
}
