import { getServerSession } from "next-auth";
import { MessagesInbox } from "@/components/messages/MessagesInbox";
import { authOptions } from "@/lib/auth";
import {
  buscarMensagensDaInbox,
  listarInboxMensagens,
} from "@/services/mensagens-inbox.service";

export const dynamic = "force-dynamic";

export default async function EmpresaMensagensPage({
  searchParams,
}: {
  searchParams: { c?: string; q?: string; filter?: string };
}) {
  const session = await getServerSession(authOptions);
  const userId = Number((session!.user as any).id);
  const conversations = await listarInboxMensagens(userId, "empresa");
  const selected =
    conversations.find((item) => item.id === searchParams.c) ?? conversations[0] ?? null;
  const selectedMessages = selected
    ? await buscarMensagensDaInbox(selected.id, userId, "empresa")
    : [];

  return (
    <MessagesInbox
      basePath="/empresa/mensagens"
      currentUserId={userId}
      conversations={conversations}
      selected={selected}
      selectedMessages={selectedMessages ?? []}
      search={searchParams.q ?? ""}
      filter={searchParams.filter ?? "todas"}
    />
  );
}
