import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { View } from "react-native";
import { ClipboardList, MapPin, Truck } from "lucide-react-native";
import {
  AppButton,
  AppCard,
  AppScreen,
  BottomNavigation,
  EmptyState,
  LoadingCard,
  MapaColetas,
  type MapaColetaItem,
  MessageBanner,
  MobileListItem,
  SectionHeader,
  StatRow,
} from "@/components/AppUI";
import {
  ApiError,
  getEmpresaColetas,
  getEmpresaSolicitacoesDisponiveis,
  getReadableErrorMessage,
} from "@/lib/api";
import { useProtectedRoute } from "@/lib/navigation";
import { resolveAccessToken } from "@/lib/session";
import { EMPRESA_TABS } from "@/lib/tabs";

export default function EmpresaHomeScreen() {
  const { accessToken, hasAccess, isLoading, refreshSession, user } =
    useProtectedRoute(["empresa"]);

  const disponiveisQuery = useQuery({
    queryKey: ["empresa", "disponiveis"],
    enabled: hasAccess && !isLoading,
    queryFn: async () => {
      const token = await resolveAccessToken(accessToken, refreshSession);
      if (!token) throw new Error("Sua sessão expirou. Entre novamente.");

      try {
        return await getEmpresaSolicitacoesDisponiveis(token);
      } catch (error) {
        if (!(error instanceof ApiError) || error.status !== 401) throw error;
        const refreshed = await refreshSession();
        if (!refreshed) throw new Error("Sua sessão expirou. Entre novamente.");
        return getEmpresaSolicitacoesDisponiveis(refreshed);
      }
    },
  });

  const coletasQuery = useQuery({
    queryKey: ["empresa", "coletas"],
    enabled: hasAccess && !isLoading,
    queryFn: async () => {
      const token = await resolveAccessToken(accessToken, refreshSession);
      if (!token) throw new Error("Sua sessão expirou. Entre novamente.");

      try {
        return await getEmpresaColetas(token);
      } catch (error) {
        if (!(error instanceof ApiError) || error.status !== 401) throw error;
        const refreshed = await refreshSession();
        if (!refreshed) throw new Error("Sua sessão expirou. Entre novamente.");
        return getEmpresaColetas(refreshed);
      }
    },
  });

  if (isLoading || !hasAccess || !user) {
    return (
      <AppScreen>
        <LoadingCard text="Carregando painel da empresa..." />
      </AppScreen>
    );
  }

  const disponiveis = disponiveisQuery.data ?? [];
  const coletas = coletasQuery.data ?? [];
  const mapaItems: MapaColetaItem[] = disponiveis
    .filter((item) => (item.endereco ?? "").trim().length > 0)
    .map((item) => ({
      id: item.id,
      titulo: item.titulo,
      materialNome: item.material.nome,
      quantidade: item.quantidade,
      endereco: item.endereco,
      imagemUrl: item.imagens?.[0]?.url ?? null,
    }));
  const ativas = coletas.filter(
    (item) => item.status !== "concluida" && item.status !== "cancelada"
  );
  const concluidas = coletas.filter((item) => item.status === "concluida").length;

  return (
    <AppScreen
      footer={<BottomNavigation items={EMPRESA_TABS} activeKey="home" />}
    >
      <SectionHeader
        eyebrow="PAINEL DA EMPRESA"
        title={user.name}
        description="Aceite solicitações aprovadas, acompanhe coletas e converse com solicitantes."
      />

      {(disponiveisQuery.error || coletasQuery.error) && (
        <MessageBanner
          message={getReadableErrorMessage(
            disponiveisQuery.error ?? coletasQuery.error,
            "Não foi possível carregar o painel da empresa."
          )}
          tone="error"
        />
      )}

      <View style={{ flexDirection: "row", gap: 12, flexWrap: "wrap" }}>
        <StatRow label="Disponíveis" value={disponiveis.length} />
        <StatRow label="Em andamento" value={ativas.length} />
        <StatRow label="Concluídas" value={concluidas} />
        <StatRow label="Total" value={coletas.length} />
      </View>

      <AppCard>
        <SectionHeader
          eyebrow="NO MAPA"
          title="Coletas disponíveis"
          description="Solicitações aprovadas com endereço, localizadas no mapa."
        />
        {disponiveisQuery.isLoading ? (
          <LoadingCard text="Carregando mapa..." />
        ) : mapaItems.length === 0 ? (
          <EmptyState
            icon={MapPin}
            title="Nada para mapear"
            description="Assim que houver solicitações aprovadas com endereço, elas aparecerão aqui no mapa."
          />
        ) : (
          <MapaColetas items={mapaItems} />
        )}
      </AppCard>

      <AppCard>
        <SectionHeader eyebrow="MINHAS COLETAS" title="Coletas em andamento" />
        {coletasQuery.isLoading ? (
          <LoadingCard text="Carregando coletas..." />
        ) : ativas.length === 0 ? (
          <EmptyState
            icon={Truck}
            title="Nenhuma coleta em andamento"
            description="Aceite uma solicitação disponível para iniciar uma coleta."
          />
        ) : (
          ativas.slice(0, 3).map((item) => (
            <MobileListItem
              key={item.id}
              icon={Truck}
              tone="primary"
              title={item.solicitacao.titulo}
              subtitle={item.solicitacao.user?.nome ?? item.solicitacao.material.nome}
              meta={item.status}
              onPress={() => router.push(`/empresa/coletas/${item.id}` as any)}
            />
          ))
        )}
        <AppButton
          label="Ver mais"
          tone="secondary"
          icon={Truck}
          onPress={() => router.push("/empresa/coletas" as any)}
        />
      </AppCard>

      <AppCard>
        <SectionHeader eyebrow="DISPONÍVEIS" title="Solicitações disponíveis" />
        {disponiveisQuery.isLoading ? (
          <LoadingCard text="Carregando solicitações..." />
        ) : disponiveis.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="Nenhuma solicitação disponível"
            description="Novas solicitações aprovadas aparecerão aqui para aceite."
          />
        ) : (
          disponiveis.slice(0, 3).map((item) => (
            <MobileListItem
              key={item.id}
              icon={ClipboardList}
              tone="primary"
              title={item.titulo}
              subtitle={`${item.quantidade} · ${item.material.nome}`}
              meta={item.status}
              onPress={() => router.push("/empresa/solicitacoes" as any)}
            />
          ))
        )}
        <AppButton
          label="Ver mais"
          tone="secondary"
          icon={ClipboardList}
          onPress={() => router.push("/empresa/solicitacoes" as any)}
        />
      </AppCard>

    </AppScreen>
  );
}
