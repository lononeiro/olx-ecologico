"use client";
import { useState, useRef, useEffect } from "react";

interface Mensagem {
  id: number; mensagem: string; createdAt: string | Date;
  remetente: { id: number; nome: string };
}
interface Props {
  coletaId: number; currentUserId: number; initialMessages: Mensagem[];
}

export function ChatBox({ coletaId, currentUserId, initialMessages }: Props) {
  const [mensagens, setMensagens] = useState<Mensagem[]>(initialMessages);
  const [texto, setTexto]         = useState("");
  const [loading, setLoading]     = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const shouldScrollOnNextUpdateRef = useRef(false);
  const lastMessageSignatureRef = useRef(getMessageSignature(initialMessages));

  useEffect(() => {
    if (shouldScrollOnNextUpdateRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      shouldScrollOnNextUpdateRef.current = false;
    }
  }, [mensagens]);

  useEffect(() => {
    const interval = setInterval(async () => {
      const res = await fetch(`/api/mensagens/${coletaId}`);
      if (!res.ok) return;

      const nextMessages = await res.json();
      const nextSignature = getMessageSignature(nextMessages);

      if (nextSignature !== lastMessageSignatureRef.current) {
        shouldScrollOnNextUpdateRef.current = true;
        lastMessageSignatureRef.current = nextSignature;
        setMensagens(nextMessages);
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [coletaId]);

  async function handleEnviar(e: React.FormEvent) {
    e.preventDefault();
    if (!texto.trim()) return;
    setLoading(true);
    const res = await fetch(`/api/mensagens/${coletaId}`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mensagem: texto.trim() }),
    });
    setLoading(false);
    if (res.ok) {
      const novaMensagem = await res.json();
      shouldScrollOnNextUpdateRef.current = true;
      setMensagens(prev => {
        const nextMessages = [...prev, novaMensagem];
        lastMessageSignatureRef.current = getMessageSignature(nextMessages);
        return nextMessages;
      });
      setTexto("");
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: ".75rem", flex: 1, minHeight: 0 }}>
      {/* Messages */}
      <div style={{
        flex: 1, minHeight: 260, maxHeight: 480, overflowY: "auto", padding: "1rem",
        background: "var(--surface-2)", borderRadius: "var(--radius-sm)",
        border: "1px solid var(--border)",
        display: "flex", flexDirection: "column", gap: ".6rem",
      }}
      >
        {mensagens.length === 0 ? (
          <div style={{
            flex: 1, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            color: "var(--text-faint)", fontSize: ".85rem", gap: ".5rem",
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            Nenhuma mensagem ainda
          </div>
        ) : (
          mensagens.map(m => {
            const isOwn = m.remetente.id === currentUserId;
            return (
              <div key={m.id} style={{ display: "flex", justifyContent: isOwn ? "flex-end" : "flex-start" }}>
                <div style={{
                  maxWidth: "72%", padding: ".6rem .9rem",
                  borderRadius: isOwn ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                  background: isOwn ? "var(--green)" : "var(--surface)",
                  color: isOwn ? "var(--surface)" : "var(--text)",
                  border: isOwn ? "none" : "1px solid var(--border)",
                  boxShadow: "var(--shadow-sm)",
                  fontSize: ".875rem", lineHeight: 1.5,
                }}>
                  {!isOwn && (
                    <p style={{ fontSize: ".7rem", fontWeight: 700,
                      color: "var(--green)", marginBottom: ".25rem" }}>
                      {m.remetente.nome}
                    </p>
                  )}
                  <p style={{ wordBreak: "break-word" }}>{m.mensagem}</p>
                  <p style={{
                    fontSize: ".65rem", marginTop: ".3rem", textAlign: "right",
                    color: isOwn ? "rgba(255,255,255,.65)" : "var(--text-faint)",
                  }}>
                    {new Date(m.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleEnviar} style={{ display: "flex", gap: ".5rem" }}>
        <label htmlFor={`chat-message-${coletaId}`} className="sr-only">
          Nova mensagem
        </label>
        <input
          id={`chat-message-${coletaId}`}
          type="text" className="input-field" placeholder="Digite uma mensagem..."
          value={texto} onChange={e => setTexto(e.target.value)} disabled={loading}
          style={{ flex: 1 }}
        />
        <button type="submit" disabled={loading || !texto.trim()} className="btn btn-primary"
          style={{ flexShrink: 0, color: "var(--surface)" }} aria-label="Enviar mensagem">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>
          </svg>
          {loading ? "..." : "Enviar"}
        </button>
      </form>
    </div>
  );
}

function getMessageSignature(messages: Mensagem[]) {
  const lastMessage = messages[messages.length - 1];
  return `${messages.length}:${lastMessage?.id ?? "none"}:${String(lastMessage?.createdAt ?? "none")}`;
}
