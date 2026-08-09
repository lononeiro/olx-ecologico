// Registro (no cliente) das conversas atualmente abertas na tela.
// O ChatBox registra sua chave enquanto está montado; o NotificationBell
// consulta esse registro para não exibir toast de um chat que já está aberto.
//
// A chave espelha o id usado pela inbox e pelo href das notificações:
//   "coleta:<id>"  |  "pre_accept:<id>"

const activeChats = new Set<string>();

export function chatKeyFor(ids: {
  coletaId?: number | null;
  conversaId?: number | null;
}): string | null {
  if (ids.conversaId) return `pre_accept:${ids.conversaId}`;
  if (ids.coletaId) return `coleta:${ids.coletaId}`;
  return null;
}

/** Registra um chat como aberto e devolve a função de limpeza. */
export function registerActiveChat(key: string | null): () => void {
  if (!key) return () => {};
  activeChats.add(key);
  return () => {
    activeChats.delete(key);
  };
}

export function isChatActive(key: string | null): boolean {
  return !!key && activeChats.has(key);
}
