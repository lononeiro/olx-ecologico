import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { View } from "react-native";
import { Plus, ClipboardList, User as UserIcon, LogOut } from "lucide-react-native";
import {
  AppButton,
  AppCard,
  AppScreen,
  BottomNavigation,
  EmptyState,
  LoadingCard,
  MessageBanner,
  MobileListItem,
  SectionHeader,
  StatRow,
} from "@/components/AppUI";
import { useProtectedRoute } from "@/lib/navigation";
import { ApiError, getReadableErrorMessage, getSolicitacoes } from "@/lib/api";
import { resolveAccessToken } from "@/lib/session";
import { USUARIO_TABS } from "@/lib/tabs";

export default function HomeScreen() {
  const { accessToken, hasAccess, isLoading, refreshSession, signOut, user } =
    useProtectedRoute(["usuario"]);

  const solicitacoesQuery = useQuery({
    queryKey: ["solicitacoes", "usuario"],
    enabled: hasAccess && !isLoading,
    queryFn: async () => {
      const token = await resolveAccessToken(accessToken, refreshSession);
      if (!token) throw new Error("Sua sessão expirou. Entre novamente.");

      try {
        return await getSolicitacoes(token);
      } catch (error) {
        if (!(error instanceof ApiError) || error.status !== 401) throw error;
        const refreshed = await refreshSession();
        if (!refreshed) throw new Error("Sua sessão expirou. Entre novamente.");
        return getSolicitacoes(refreshed);
      }
    },
  });

  if (isLoading || !hasAccess || !user) {
    return (
      <AppScreen>
        <LoadingCard text="Carregando seu painel..." />
      </AppScreen>
    );
  }

  const solicitacoes = solicitacoesQuery.data ?? [];
  const stats = {
    total: solicitacoes.length,
    aguardandoEmpresa: solicitacoes.filter(
      (item) => item.status === "aprovada" && !item.coleta
    ).length,
    ativas: solicitacoes.filter(
      (item) =>
        item.coleta &&
        item.coleta.status !== "concluida" &&
        item.coleta.status !== "cancelada"
    ).length,
    concluidas: solicitacoes.filter(
      (item) => item.coleta?.status === "concluida"
    ).length,
  };

  return (
    <AppScreen
      footer={<BottomNavigation items={USUARIO_TABS} activeKey="home" />}
    >
      <SectionHeader
        eyebrow="MEU PAINEL"
        title={`Olá, ${user.name.split(" ")[0]}`}
        description="Acompanhe suas solicitações e coletas em andamento."
      />

      {solicitacoesQuery.isLoading && <LoadingCard text="Carregando solicitações..." />}
      {solicitacoesQuery.error && (
        <MessageBanner
          message={getReadableErrorMessage(
            solicitacoesQuery.error,
            "Não foi possível carregar o painel."
          )}
          tone="error"
        />
      )}

      <View style={{ flexDirection: "row", gap: 12, flexWrap: "wrap" }}>
        <StatRow label="Total" value={stats.total} />
        <StatRow label="Aguardando empresa" value={stats.aguardandoEmpresa} />
        <StatRow label="Em andamento" value={stats.ativas} />
        <StatRow label="Concluídas" value={stats.concluidas} />
      </View>

      <AppCard>
        <SectionHeader title="Ações rápidas" />
        <AppButton
          label="Nova solicitação"
          icon={Plus}
          onPress={() => router.push("/solicitacoes/new")}
        />
        <AppButton
          label="Minhas solicitações"
          tone="secondary"
          icon={ClipboardList}
          onPress={() => router.push("/solicitacoes" as any)}
        />
        <AppButton
          label="Meu perfil"
          tone="secondary"
          icon={UserIcon}
          onPress={() => router.push("/me")}
        />
        <AppButton
          label="Sair"
          tone="danger"
          icon={LogOut}
          onPress={async () => {
            await signOut();
            router.replace("/login");
          }}
        />
      </AppCard>

      <AppCard>
        <SectionHeader eyebrow="RECENTES" title="Solicitações recentes" />
        {!solicitacoesQuery.isLoading && solicitacoes.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="Nenhuma solicitação ainda"
            description="Crie sua primeira solicitação de coleta para iniciar o fluxo."
          />
        ) : (
          solicitacoes.slice(0, 3).map((item) => (
            <MobileListItem
              key={item.id}
              icon={ClipboardList}
              tone="primary"
              title={item.titulo}
              subtitle={`${item.material.nome} · ${item.quantidade}`}
              meta={new Date(item.createdAt).toLocaleDateString("pt-BR")}
              onPress={() => router.push(`/solicitacoes/${item.id}` as any)}
            />
          ))
        )}
      </AppCard>
    </AppScreen>
  );
}
