import { useMemo, useState } from "react";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { MapPin, Truck } from "lucide-react-native";
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
import { getEmpresaColetas, getReadableErrorMessage } from "@/lib/api";
import { useProtectedRoute } from "@/lib/navigation";
import { withAutoRefresh } from "@/lib/session";
import { EMPRESA_TABS } from "@/lib/tabs";

const FILTERS = [
  { key: "todas", label: "Todas" },
  { key: "aceita", label: "Aceitas" },
  { key: "a_caminho", label: "A caminho" },
  { key: "em_coleta", label: "Em coleta" },
  { key: "concluida", label: "Concluídas" },
  { key: "cancelada", label: "Canceladas" },
];

export default function EmpresaColetasListScreen() {
  const { accessToken, hasAccess, isLoading, refreshSession } =
    useProtectedRoute(["empresa"]);
  const [filter, setFilter] = useState("todas");

  const query = useQuery({
    queryKey: ["empresa", "coletas", "list"],
    enabled: hasAccess && !isLoading,
    queryFn: async () =>
      withAutoRefresh(accessToken, refreshSession, (token) => getEmpresaColetas(token)),
  });

  const filtered = useMemo(() => {
    const items = query.data ?? [];
    if (filter === "todas") return items;
    return items.filter((item) => item.status === filter);
  }, [query.data, filter]);

  return (
    <AppScreen
      footer={<BottomNavigation items={EMPRESA_TABS} activeKey="coletas" />}
    >
      <SectionHeader
        eyebrow="EMPRESA"
        title="Minhas coletas"
        description="Gerencie o andamento das coletas aceitas e a comunicação com o solicitante."
      />

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

      {query.isLoading && <LoadingCard text="Carregando coletas..." />}
      {query.error && (
        <MessageBanner
          message={getReadableErrorMessage(query.error, "Não foi possível carregar as coletas.")}
          tone="error"
        />
      )}

      {!query.isLoading && filtered.length === 0 ? (
        <EmptyState
          icon={Truck}
          title="Nenhuma coleta encontrada"
          description="Aceite uma solicitação para iniciar o fluxo operacional."
        />
      ) : null}

      {filtered.map((item) => (
        <AppCard key={item.id}>
          <SectionHeader title={item.solicitacao.titulo} description={item.solicitacao.user?.nome} />
          <StatusBadge kind="coleta" value={item.status} />
          <Text style={{ color: appColors.textSoft, fontSize: 15, lineHeight: 22 }}>
            {item.solicitacao.material.nome} · {item.solicitacao.quantidade}
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Icon icon={MapPin} size={16} color={appColors.textFaint} />
            <Text
              style={{ color: appColors.textSoft, fontSize: 15, lineHeight: 22, flex: 1 }}
              numberOfLines={1}
            >
              {item.solicitacao.endereco}
            </Text>
          </View>
          <AppButton
            label="Gerenciar coleta"
            tone="secondary"
            onPress={() => router.push(`/empresa/coletas/${item.id}` as any)}
          />
        </AppCard>
      ))}
    </AppScreen>
  );
}
