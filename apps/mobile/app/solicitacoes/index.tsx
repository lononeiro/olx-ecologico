import { useMemo, useState } from "react";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { MapPin, Plus, ClipboardList } from "lucide-react-native";
import { Text, View } from "react-native";
import {
  AppButton,
  AppCard,
  AppScreen,
  BottomNavigation,
  EmptyState,
  FilterChip,
  FilterChipRow,
  Icon,
  LoadingCard,
  MessageBanner,
  SectionHeader,
  StatusBadge,
  appColors,
} from "@/components/AppUI";
import { getReadableErrorMessage, getSolicitacoes } from "@/lib/api";
import { useProtectedRoute } from "@/lib/navigation";
import { withAutoRefresh } from "@/lib/session";
import { USUARIO_TABS } from "@/lib/tabs";

const FILTERS = [
  { key: "todas", label: "Todas" },
  { key: "aprovada", label: "Ativas" },
  { key: "com_coleta", label: "Com coleta" },
  { key: "cancelada", label: "Canceladas" },
  { key: "removida", label: "Removidas" },
];

export default function SolicitacoesListScreen() {
  const { accessToken, hasAccess, isLoading, refreshSession } =
    useProtectedRoute(["usuario"]);
  const [filter, setFilter] = useState("todas");

  const query = useQuery({
    queryKey: ["solicitacoes", "list"],
    enabled: hasAccess && !isLoading,
    queryFn: async () =>
      withAutoRefresh(accessToken, refreshSession, (token) => getSolicitacoes(token)),
  });

  const filtered = useMemo(() => {
    const items = query.data ?? [];
    if (filter === "todas") return items;
    if (filter === "com_coleta") return items.filter((item) => !!item.coleta);
    return items.filter((item) => item.status === filter);
  }, [query.data, filter]);

  return (
    <AppScreen
      footer={<BottomNavigation items={USUARIO_TABS} activeKey="solicitacoes" />}
    >
      <SectionHeader
        eyebrow="MINHAS SOLICITAÇÕES"
        title="Histórico completo"
        description="Acompanhe aceite de empresa e andamento da coleta."
      />
      <AppButton label="Nova solicitação" icon={Plus} onPress={() => router.push("/solicitacoes/new")} />

      <FilterChipRow>
        {FILTERS.map((item) => (
          <FilterChip
            key={item.key}
            label={item.label}
            active={filter === item.key}
            onPress={() => setFilter(item.key)}
          />
        ))}
      </FilterChipRow>

      {query.isLoading && <LoadingCard text="Carregando solicitações..." />}
      {query.error && (
        <MessageBanner
          message={getReadableErrorMessage(query.error, "Não foi possível carregar as solicitações.")}
          tone="error"
        />
      )}

      {!query.isLoading && filtered.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="Nenhuma solicitação encontrada"
          description="Crie sua primeira solicitação ou ajuste o filtro selecionado."
        />
      ) : null}

      {filtered.map((item) => (
        <AppCard key={item.id}>
          <SectionHeader title={item.titulo} description={item.material.nome} />
          <StatusBadge kind="solicitacao" value={item.status} />
          <Text style={{ color: appColors.textSoft, ...{ fontSize: 15, lineHeight: 22 } }}>
            {item.quantidade}
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Icon icon={MapPin} size={16} color={appColors.textFaint} />
            <Text
              style={{ color: appColors.textSoft, fontSize: 15, lineHeight: 22, flex: 1 }}
              numberOfLines={1}
            >
              {item.endereco}
            </Text>
          </View>
          <AppButton
            label="Ver detalhes"
            tone="secondary"
            onPress={() => router.push(`/solicitacoes/${item.id}` as any)}
          />
        </AppCard>
      ))}
    </AppScreen>
  );
}
