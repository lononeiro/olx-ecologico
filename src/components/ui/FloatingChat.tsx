"use client";

import { useEffect, useState } from "react";

type FloatingChatProps = {
  title: string;
  description?: string;
  messageCount: number;
  children: React.ReactNode;
};

export function FloatingChat({ title, description, messageCount, children }: FloatingChatProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;

    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const badgeLabel = messageCount > 99 ? "99+" : String(messageCount);

  return (
    <>
      {open ? (
        <button
          type="button"
          className="floating-chat-backdrop"
          onClick={() => setOpen(false)}
          aria-label="Fechar chat"
        />
      ) : null}

      <section
        className={`floating-chat-inline card chat-card ${open ? "is-open" : ""}`}
        role={open ? "dialog" : undefined}
        aria-modal={open ? true : undefined}
        aria-label={title}
      >
        <ChatHeader title={title} description={description} onClose={open ? () => setOpen(false) : undefined} />
        <div className="chat-card-body floating-chat-body">{children}</div>
      </section>

      <button
        type="button"
        className="floating-chat-button"
        onClick={() => setOpen(true)}
        aria-label="Abrir chat da coleta"
      >
        <MessageIcon />
        {messageCount > 0 ? <span>{badgeLabel}</span> : null}
      </button>
    </>
  );
}

function ChatHeader({
  title,
  description,
  onClose,
}: {
  title: string;
  description?: string;
  onClose?: () => void;
}) {
  return (
    <div className="floating-chat-header">
      <div>
        <p>
          <span className="floating-chat-status-dot" aria-hidden="true" />
          Online agora
        </p>
        <h2>{title}</h2>
        {description ? <span className="floating-chat-description">{description}</span> : null}
      </div>

      {onClose ? (
        <button type="button" className="floating-chat-close" onClick={onClose} aria-label="Fechar chat">
          <CloseIcon />
        </button>
      ) : null}
    </div>
  );
}

function MessageIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
      <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
      <path d="M8 9h8" />
      <path d="M8 13h5" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}
