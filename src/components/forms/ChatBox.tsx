"use client";

import { useEffect, useRef, useState } from "react";

interface Mensagem {
  id: number;
  mensagem: string;
  createdAt: string | Date;
  remetente: { id: number; nome: string };
}

interface Props {
  coletaId?: number;
  conversaId?: number;
  currentUserId: number;
  initialMessages?: Mensagem[];
  apiPath?: string;
  emptyText?: string;
  placeholder?: string;
  disabled?: boolean;
  disabledText?: string;
}

export function ChatBox({
  coletaId,
  conversaId,
  currentUserId,
  initialMessages = [],
  apiPath,
  emptyText = "Nenhuma mensagem ainda",
  placeholder = "Digite uma mensagem...",
  disabled = false,
  disabledText = "Esta conversa não está disponível para novas mensagens.",
}: Props) {
  const threadId = conversaId ?? coletaId;
  const resolvedApiPath = apiPath ?? `/api/mensagens/${coletaId}`;
  const [mensagens, setMensagens] = useState<Mensagem[]>(initialMessages);
  const [texto, setTexto] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(initialMessages.length === 0);
  const [erro, setErro] = useState("");

  const containerRef = useRef<HTMLDivElement>(null);
  const shouldScrollOnNextUpdateRef = useRef(false);
  const lastMessageSignatureRef = useRef(getMessageSignature(initialMessages));
  const lastMessageIdRef = useRef(getLastMessageId(initialMessages));

  function scrollToBottom() {
    const el = containerRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }

  function isNearBottom() {
    const el = containerRef.current;
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  }

  useEffect(() => {
    if (shouldScrollOnNextUpdateRef.current) {
      scrollToBottom();
      shouldScrollOnNextUpdateRef.current = false;
    }
  }, [mensagens]);

  useEffect(() => {
    let disposed = false;
    let firstLoad = true;
    let controller: AbortController | null = null;

    async function carregarMensagens() {
      if (document.hidden) return;

      controller?.abort();
      controller = new AbortController();

      const params = new URLSearchParams();
      if (firstLoad) params.set("audit", "1");
      else if (lastMessageIdRef.current) params.set("sinceId", String(lastMessageIdRef.current));

      try {
        const query = params.toString();
        const res = await fetch(`${resolvedApiPath}${query ? `?${query}` : ""}`, {
          signal: controller.signal,
        });

        if (!res.ok) {
          setErro("Não foi possível carregar a conversa.");
          return;
        }

        const loadedMessages: Mensagem[] = await res.json();
        if (disposed) return;

        setErro("");
        setMensagens((current) => {
          const nextMessages = firstLoad
            ? loadedMessages
            : mergeMessages(current, loadedMessages);
          const nextSignature = getMessageSignature(nextMessages);

          if (nextSignature === lastMessageSignatureRef.current) return current;

          shouldScrollOnNextUpdateRef.current = isNearBottom();
          lastMessageSignatureRef.current = nextSignature;
          lastMessageIdRef.current = getLastMessageId(nextMessages);
          return nextMessages;
        });
      } catch (error: any) {
        if (error?.name !== "AbortError") {
          setErro("Não foi possível carregar a conversa.");
        }
      } finally {
        firstLoad = false;
        if (!disposed) setLoadingMessages(false);
      }
    }

    carregarMensagens();
    const interval = setInterval(carregarMensagens, 10000);
    const onVisibilityChange = () => {
      if (!document.hidden) carregarMensagens();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      disposed = true;
      controller?.abort();
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [resolvedApiPath]);

  async function handleEnviar(e: React.FormEvent) {
    e.preventDefault();
    if (disabled) return;
    if (!texto.trim()) return;

    setLoading(true);
    setErro("");

    const res = await fetch(resolvedApiPath, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mensagem: texto.trim() }),
    });

    setLoading(false);

    if (res.ok) {
      const novaMensagem = await res.json();
      shouldScrollOnNextUpdateRef.current = true;
      setMensagens((prev) => {
        const nextMessages = mergeMessages(prev, [novaMensagem]);
        lastMessageSignatureRef.current = getMessageSignature(nextMessages);
        lastMessageIdRef.current = getLastMessageId(nextMessages);
        return nextMessages;
      });
      setTexto("");
      return;
    }

    setErro("Não foi possível enviar a mensagem.");
  }

  return (
    <div className="chat-box-root" style={{ display: "flex", flexDirection: "column", gap: ".75rem", flex: 1, minHeight: 0 }}>
      <div
        ref={containerRef}
        className="chat-box-messages"
        style={{
          flex: 1,
          minHeight: 260,
          maxHeight: 480,
          overflowY: "auto",
          padding: "1rem",
          background: "var(--surface-2)",
          borderRadius: "var(--radius-sm)",
          border: "1px solid var(--border)",
          display: "flex",
          flexDirection: "column",
          gap: ".6rem",
        }}
      >
        {loadingMessages ? (
          <div style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--text-faint)",
            fontSize: ".85rem",
          }}>
            Carregando conversa...
          </div>
        ) : mensagens.length === 0 ? (
          <div style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--text-faint)",
            fontSize: ".85rem",
            gap: ".5rem",
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            {emptyText}
          </div>
        ) : (
          mensagens.map((m) => {
            const isOwn = m.remetente.id === currentUserId;
            return (
              <div key={m.id} className="chat-message-row" style={{ display: "flex", justifyContent: isOwn ? "flex-end" : "flex-start" }}>
                <div
                  className={isOwn ? "chat-bubble chat-bubble-own" : "chat-bubble chat-bubble-other"}
                  style={{
                    maxWidth: "72%",
                    padding: ".6rem .9rem",
                    borderRadius: isOwn ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                    background: isOwn ? "var(--green)" : "var(--surface)",
                    color: isOwn ? "var(--surface)" : "var(--text)",
                    border: isOwn ? "none" : "1px solid var(--border)",
                    boxShadow: "var(--shadow-sm)",
                    fontSize: ".875rem",
                    lineHeight: 1.5,
                  }}
                >
                  {!isOwn && (
                    <p style={{ fontSize: ".7rem", fontWeight: 700, color: "var(--green)", marginBottom: ".25rem" }}>
                      {m.remetente.nome}
                    </p>
                  )}
                  <p style={{ wordBreak: "break-word" }}>{m.mensagem}</p>
                  <p style={{
                    fontSize: ".65rem",
                    marginTop: ".3rem",
                    textAlign: "right",
                    color: isOwn ? "rgba(255,255,255,.65)" : "var(--text-faint)",
                  }}>
                    {new Date(m.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      <form className="chat-box-form" onSubmit={handleEnviar} style={{ display: "flex", gap: ".5rem" }}>
        <label htmlFor={`chat-message-${threadId}`} className="sr-only">
          Nova mensagem
        </label>
        <input
          id={`chat-message-${threadId}`}
          type="text"
          className="input-field"
          placeholder={placeholder}
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          disabled={loading || disabled}
          style={{ flex: 1 }}
        />
        <button
          type="submit"
          disabled={loading || disabled || !texto.trim()}
          className="btn btn-primary"
          style={{ flexShrink: 0, color: "var(--surface)" }}
          aria-label="Enviar mensagem"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="m22 2-7 20-4-9-9-4Z" />
            <path d="M22 2 11 13" />
          </svg>
          {loading ? "..." : "Enviar"}
        </button>
      </form>

      {disabled ? (
        <p role="status" style={{ fontSize: ".78rem", color: "var(--text-muted)", marginTop: "-.25rem" }}>
          {disabledText}
        </p>
      ) : erro ? (
        <p role="alert" style={{ fontSize: ".78rem", color: "var(--red)", marginTop: "-.25rem" }}>
          {erro}
        </p>
      ) : null}
    </div>
  );
}

function getMessageSignature(messages: Mensagem[]) {
  const lastMessage = messages[messages.length - 1];
  return `${messages.length}:${lastMessage?.id ?? "none"}:${String(lastMessage?.createdAt ?? "none")}`;
}

function getLastMessageId(messages: Mensagem[]) {
  return messages[messages.length - 1]?.id ?? null;
}

function mergeMessages(current: Mensagem[], incoming: Mensagem[]) {
  if (incoming.length === 0) return current;

  const seen = new Set(current.map((message) => message.id));
  const merged = [...current];

  for (const message of incoming) {
    if (!seen.has(message.id)) merged.push(message);
  }

  return merged.sort((a, b) => a.id - b.id);
}
