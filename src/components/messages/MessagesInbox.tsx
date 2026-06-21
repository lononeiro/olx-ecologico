import Link from "next/link";
import { ChatBox } from "@/components/forms/ChatBox";
import type { InboxConversation, InboxMessage } from "@/services/mensagens-inbox.service";

type Props = {
  basePath: string;
  currentUserId: number;
  conversations: InboxConversation[];
  selected: InboxConversation | null;
  selectedMessages: InboxMessage[];
  search: string;
  filter: string;
  page: number;
};

const PAGE_SIZE = 8;

const FILTERS = [
  { value: "todas", label: "Todas" },
  { value: "pre_accept", label: "Pre-aceite" },
  { value: "coleta", label: "Coletas" },
  { value: "abertas", label: "Abertas" },
  { value: "encerradas", label: "Encerradas" },
  { value: "concluidas", label: "Concluidas" },
];

export function MessagesInbox({
  basePath,
  currentUserId,
  conversations,
  selected,
  selectedMessages,
  search,
  filter,
  page,
}: Props) {
  const filtered = conversations.filter((item) => {
    const matchesFilter =
      filter === "pre_accept"
        ? item.type === "pre_accept"
        : filter === "coleta"
          ? item.type === "coleta"
          : filter === "abertas"
            ? item.canSend
            : filter === "encerradas"
              ? item.type === "pre_accept" && item.status === "encerrada"
              : filter === "concluidas"
                ? item.type === "coleta" && item.status === "concluida"
                : true;

    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q ||
      [item.title, item.otherPartyName, item.material, item.lastMessage ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(q);

    return matchesFilter && matchesSearch;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const pageItems = filtered.slice(pageStart, pageStart + PAGE_SIZE);

  const queryFor = (overrides: { page?: number; c?: string }) => {
    const params = new URLSearchParams();
    params.set("filter", filter);
    if (search) params.set("q", search);
    const c = overrides.c ?? selected?.id;
    if (c) params.set("c", c);
    const targetPage = overrides.page ?? currentPage;
    if (targetPage > 1) params.set("page", String(targetPage));
    return `${basePath}?${params.toString()}`;
  };

  return (
    <div className="page-enter">
      <style>{`
        .messages-shell {
          display: grid;
          grid-template-columns: minmax(280px, 380px) minmax(0, 1fr);
          gap: 1rem;
          align-items: stretch;
          min-height: calc(100vh - 210px);
        }
        .messages-list,
        .messages-thread {
          border: 1px solid var(--border);
          background: var(--surface);
          box-shadow: var(--shadow);
          border-radius: 24px;
          min-height: 0;
        }
        .messages-list {
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }
        .messages-list-body {
          flex: 1;
          min-height: 0;
          overflow-y: auto;
          padding: .75rem;
          display: grid;
          gap: .65rem;
          align-content: start;
          scrollbar-width: none; /* Firefox */
          -ms-overflow-style: none; /* Edge antigo */
        }
        .messages-thread {
          padding: 1rem;
          display: flex;
          flex-direction: column;
        }
          .messages-list-body::-webkit-scrollbar {
  display: none; /* Chrome, Edge, Safari */
}
        .messages-filter-row {
          display: flex;
          gap: .5rem;
          flex-wrap: wrap;
          margin-bottom: .75rem;
        }
        .message-list-item {
          display: block;
          padding: .9rem;
          border-radius: 18px;
          border: 1px solid var(--border);
          background: var(--surface);
          text-decoration: none;
          color: inherit;
          transition: border-color .18s ease, background .18s ease, transform .18s ease;
        }
        .message-list-item:hover,
        .message-list-item.is-active {
          border-color: rgba(30,122,50,.35);
          background: rgba(30,122,50,.05);
          transform: translateY(-1px);
        }
        .message-list-top {
          display: flex;
          justify-content: space-between;
          gap: .5rem;
          align-items: flex-start;
        }
        .message-type-badge,
        .message-status-badge {
          display: inline-flex;
          align-items: center;
          border-radius: 999px;
          padding: .25rem .5rem;
          font-size: .68rem;
          font-weight: 800;
          white-space: nowrap;
        }
        .message-type-badge {
          background: rgba(29,111,168,.1);
          color: var(--blue);
        }
        .message-type-badge.pre {
          background: rgba(30,122,50,.1);
          color: var(--green);
        }
        .message-status-badge {
          background: var(--surface-2);
          color: var(--text-muted);
        }
        .messages-pagination {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: .5rem;
          padding: .6rem .75rem;
          border-top: 1px solid var(--border);
          flex-shrink: 0;
        }
        .messages-page-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border-radius: 12px;
          border: 1px solid var(--border);
          background: var(--surface);
          color: var(--text);
          font-size: 1rem;
          font-weight: 700;
          text-decoration: none;
          transition: border-color .18s ease, background .18s ease;
        }
        .messages-page-btn:hover {
          border-color: rgba(30,122,50,.35);
          background: rgba(30,122,50,.05);
        }
        .messages-page-btn.is-disabled {
          opacity: .4;
          pointer-events: none;
        }
        .messages-page-info {
          font-size: .82rem;
          font-weight: 600;
          color: var(--text-muted);
        }
        @media (max-width: 900px) {
          .messages-shell {
            grid-template-columns: 1fr;
          }
          .messages-list,
          .messages-thread {
            min-height: auto;
          }
        }
      `}</style>

      <section className="card" style={{ marginBottom: "1rem", background: "var(--surface)", border: "1px solid var(--border)" }}>
        <form action={basePath} style={{ display: "grid", gap: ".75rem" }}>
          <label htmlFor="message-search" className="sr-only">Buscar conversas</label>
          <input
            id="message-search"
            name="q"
            defaultValue={search}
            className="input-field"
            placeholder="Buscar por solicitação, pessoa, material ou última mensagem"
          />
          <input type="hidden" name="filter" value={filter} />
          <div className="messages-filter-row">
            {FILTERS.map((item) => (
              <Link
                key={item.value}
                href={`${basePath}?filter=${item.value}${search ? `&q=${encodeURIComponent(search)}` : ""}`}
                className={filter === item.value ? "btn btn-primary" : "btn btn-secondary"}
                style={{ padding: ".5rem .8rem", fontSize: ".8rem" }}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </form>
      </section>

      <section className="messages-shell">
        <aside className="messages-list" aria-label="Conversas">
          <div style={{ padding: "1rem 1rem .75rem", borderBottom: "1px solid var(--border)" }}>
            <p className="section-label">Inbox</p>
            <h2 style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--text)" }}>
              {filtered.length} conversa{filtered.length === 1 ? "" : "s"}
            </h2>
          </div>
          <div className="messages-list-body">
            {filtered.length === 0 ? (
              <div style={{ padding: "1rem", color: "var(--text-muted)", fontSize: ".9rem", lineHeight: 1.55 }}>
                Nenhuma conversa encontrada.
              </div>
            ) : (
              pageItems.map((item) => (
                <ConversationLink
                  key={item.id}
                  item={item}
                  href={queryFor({ c: item.id })}
                  active={selected?.id === item.id}
                />
              ))
            )}
          </div>

          {totalPages > 1 ? (
            <nav className="messages-pagination" aria-label="Paginacao de conversas">
              {currentPage > 1 ? (
                <Link className="messages-page-btn" href={queryFor({ page: currentPage - 1 })} rel="prev" aria-label="Pagina anterior">
                  ←
                </Link>
              ) : (
                <span className="messages-page-btn is-disabled" aria-disabled="true">←</span>
              )}
              <span className="messages-page-info">
                Página {currentPage} de {totalPages}
              </span>
              {currentPage < totalPages ? (
                <Link className="messages-page-btn" href={queryFor({ page: currentPage + 1 })} rel="next" aria-label="Próxima página">
                  →
                </Link>
              ) : (
                <span className="messages-page-btn is-disabled" aria-disabled="true">→</span>
              )}
            </nav>
          ) : null}
        </aside>

        <article className="messages-thread">
          {selected ? (
            <>
              <div style={{ padding: ".25rem .25rem 1rem", borderBottom: "1px solid var(--border)", marginBottom: "1rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: ".75rem", alignItems: "flex-start", flexWrap: "wrap" }}>
                  <div>
                    <p className="section-label">{selected.type === "pre_accept" ? "Pre-aceite" : "Coleta"}</p>
                    <h2 style={{ fontSize: "1.35rem", lineHeight: 1.2, fontWeight: 800, color: "var(--text)" }}>
                      {selected.title}
                    </h2>
                    <p style={{ color: "var(--text-muted)", marginTop: ".35rem", fontSize: ".88rem" }}>
                      {selected.otherPartyName} - {selected.material}
                    </p>
                  </div>
                  <div style={{ display: "flex", gap: ".5rem", flexWrap: "wrap" }}>
                    <span className="message-status-badge">{selected.statusLabel}</span>
                    <Link className="btn btn-secondary" href={selected.detailHref} style={{ padding: ".45rem .75rem", fontSize: ".78rem" }}>
                      Ver detalhes
                    </Link>
                  </div>
                </div>
              </div>
              <ChatBox
                conversaId={selected.type === "pre_accept" ? selected.dbId : undefined}
                coletaId={selected.type === "coleta" ? selected.dbId : undefined}
                currentUserId={currentUserId}
                initialMessages={selectedMessages}
                apiPath={selected.messageApiPath}
                emptyText="Nenhuma mensagem nessa conversa"
                placeholder={selected.canSend ? "Escreva uma mensagem..." : "Conversa encerrada"}
                disabled={!selected.canSend}
                disabledText="Esta conversa não está mais aberta para novas mensagens."
              />
            </>
          ) : (
            <div style={{ flex: 1, minHeight: 360, display: "grid", placeItems: "center", color: "var(--text-muted)", textAlign: "center", lineHeight: 1.55 }}>
              <div>
                <p style={{ fontWeight: 800, color: "var(--text)", marginBottom: ".3rem" }}>
                  Selecione uma conversa
                </p>
                <p>As mensagens de coletas e de pré-aceite aparecem juntas nesta página.</p>
              </div>
            </div>
          )}
        </article>
      </section>
    </div>
  );
}

function ConversationLink({
  item,
  href,
  active,
}: {
  item: InboxConversation;
  href: string;
  active: boolean;
}) {
  return (
    <Link href={href} className={`message-list-item ${active ? "is-active" : ""}`}>
      <div className="message-list-top">
        <div style={{ minWidth: 0 }}>
          <p style={{ fontWeight: 800, color: "var(--text)", lineHeight: 1.25, marginBottom: ".25rem" }}>
            {item.title}
          </p>
          <p style={{ color: "var(--text-muted)", fontSize: ".8rem", lineHeight: 1.4 }}>
            {item.otherPartyName} - {item.material}
          </p>
        </div>
        <span className={`message-type-badge ${item.type === "pre_accept" ? "pre" : ""}`}>
          {item.type === "pre_accept" ? "Pre-aceite" : "Coleta"}
        </span>
      </div>
      <p style={{ marginTop: ".7rem", color: item.lastMessage ? "var(--text)" : "var(--text-faint)", fontSize: ".84rem", lineHeight: 1.45 }}>
        {item.lastMessage ?? "Nenhuma mensagem ainda"}
      </p>
      <div style={{ marginTop: ".7rem", display: "flex", justifyContent: "space-between", gap: ".5rem", alignItems: "center" }}>
        <span className="message-status-badge">{item.statusLabel}</span>
        <time style={{ color: "var(--text-faint)", fontSize: ".72rem" }}>
          {formatDate(item.lastMessageAt ?? item.createdAt)}
        </time>
      </div>
    </Link>
  );
}

function formatDate(date: Date) {
  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}
