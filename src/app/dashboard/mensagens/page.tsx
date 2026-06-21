import { getServerSession } from "next-auth";
import { MessagesInbox } from "@/components/messages/MessagesInbox";
import { authOptions } from "@/lib/auth";
import {
  buscarMensagensDaInbox,
  listarInboxMensagens,
} from "@/services/mensagens-inbox.service";

export const dynamic = "force-dynamic";

export default async function DashboardMensagensPage({
  searchParams,
}: {
  searchParams: { c?: string; q?: string; filter?: string; page?: string };
}) {
  const session = await getServerSession(authOptions);
  const userId = Number((session!.user as any).id);
  const conversations = await listarInboxMensagens(userId, "usuario");
  const selected =
    conversations.find((item) => item.id === searchParams.c) ?? conversations[0] ?? null;
  const selectedMessages = selected
    ? await buscarMensagensDaInbox(selected.id, userId, "usuario")
    : [];

  return (
    <MessagesInbox
      basePath="/dashboard/mensagens"
      currentUserId={userId}
      conversations={conversations}
      selected={selected}
      selectedMessages={selectedMessages ?? []}
      search={searchParams.q ?? ""}
      filter={searchParams.filter ?? "todas"}
      page={Number(searchParams.page) || 1}
    />
  );
}
