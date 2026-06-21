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
const TOAST_DURACAO = 6000;
const MAX_TOASTS = 3;

export function NotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notificacao[]>([]);
  const [naoLidas, setNaoLidas] = useState(0);
  const [toasts, setToasts] = useState<Notificacao[]>([]);
  const wrapRef = useRef<HTMLDivElement>(null);

  const removerToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const empilharToasts = useCallback((novas: Notificacao[]) => {
    if (novas.length === 0) return;
    setToasts((prev) => [...novas, ...prev].slice(0, MAX_TOASTS));
    novas.forEach((n) => {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== n.id));
      }, TOAST_DURACAO);
    });
  }, []);

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
            // Preview imersivo: o stream só entrega notificações realmente
            // novas (id > lastId), então toda chegada merece um toast.
            empilharToasts(filtradas.slice().reverse());
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

  const abrirToast = useCallback(
    (n: Notificacao) => {
      removerToast(n.id);
      abrirNotificacao(n);
    },
    [removerToast, abrirNotificacao]
  );

  const badge = naoLidas > 9 ? "9+" : String(naoLidas);

  return (
    <div className="notif-wrap" ref={wrapRef}>
      {toasts.length > 0 && (
        <div className="notif-toasts" role="status" aria-live="polite">
          {toasts.map((n) => (
            <div
              key={n.id}
              className={`notif-toast tipo-${n.tipo}`}
              onClick={() => abrirToast(n)}
              role={n.href ? "button" : undefined}
              tabIndex={n.href ? 0 : undefined}
              onKeyDown={(e) => {
                if (n.href && (e.key === "Enter" || e.key === " ")) {
                  e.preventDefault();
                  abrirToast(n);
                }
              }}
            >
              <span className="notif-toast-icon" aria-hidden="true">
                <TipoIcon tipo={n.tipo} />
              </span>
              <span className="notif-toast-body">
                <span className="notif-toast-title">{n.titulo}</span>
                <span className="notif-toast-desc">{n.descricao}</span>
              </span>
              <button
                type="button"
                className="notif-toast-close"
                aria-label="Dispensar notificação"
                onClick={(e) => {
                  e.stopPropagation();
                  removerToast(n.id);
                }}
              >
                <CloseIcon />
              </button>
              <span className="notif-toast-bar" aria-hidden="true" />
            </div>
          ))}
        </div>
      )}
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

function CloseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

function TipoIcon({ tipo }: { tipo: string }) {
  const props = {
    width: 18,
    height: 18,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  switch (tipo) {
    case "solicitacao_aprovada":
    case "coleta_aceita":
      return (
        <svg {...props}>
          <path d="M20 6 9 17l-5-5" />
        </svg>
      );
    case "solicitacao_rejeitada":
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="9" />
          <path d="M15 9l-6 6M9 9l6 6" />
        </svg>
      );
    case "coleta_status":
      return (
        <svg {...props}>
          <path d="M10 17h4V5H2v12h3" />
          <path d="M20 17h2v-3.34a4 4 0 0 0-1.17-2.83L19 9h-5v8h1" />
          <circle cx="7.5" cy="17.5" r="2.5" />
          <circle cx="17.5" cy="17.5" r="2.5" />
        </svg>
      );
    case "nova_mensagem":
      return (
        <svg {...props}>
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      );
    case "avaliacao_recebida":
      return (
        <svg {...props} fill="currentColor" stroke="none">
          <path d="M12 2l2.9 6.26 6.1.53-4.6 4.02 1.36 6.19L12 16.9 6.24 19l1.36-6.19-4.6-4.02 6.1-.53z" />
        </svg>
      );
    default:
      return <BellIcon />;
  }
}
