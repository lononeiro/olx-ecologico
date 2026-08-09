import { useMemo, useState } from "react";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { MapPin, ClipboardList } from "lucide-react-native";
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
import {
  getEmpresaSolicitacoesDisponiveis,
  getReadableErrorMessage,
} from "@/lib/api";
import { useProtectedRoute } from "@/lib/navigation";
import { withAutoRefresh } from "@/lib/session";
import { EMPRESA_TABS } from "@/lib/tabs";

export default function EmpresaSolicitacoesScreen() {
  const { accessToken, hasAccess, isLoading, refreshSession } =
    useProtectedRoute(["empresa"]);
  const [materialFilter, setMaterialFilter] = useState("todos");

  const query = useQuery({
    queryKey: ["empresa", "solicitacoes", "disponiveis"],
    enabled: hasAccess && !isLoading,
    queryFn: async () =>
      withAutoRefresh(accessToken, refreshSession, (token) =>
        getEmpresaSolicitacoesDisponiveis(token)
      ),
  });

  const materials = useMemo(() => {
    const names = new Set((query.data ?? []).map((item) => item.material.nome));
    return ["todos", ...Array.from(names)];
  }, [query.data]);

  const filtered = useMemo(() => {
    const items = query.data ?? [];
    if (materialFilter === "todos") return items;
    return items.filter((item) => item.material.nome === materialFilter);
  }, [query.data, materialFilter]);

  return (
    <AppScreen
      footer={<BottomNavigation items={EMPRESA_TABS} activeKey="solicitacoes" />}
    >
      <SectionHeader
        eyebrow="EMPRESA"
        title="Solicitações disponíveis"
        description="Estas solicitações já estão aprovadas para coleta e aguardam aceite de uma empresa."
      />

      {materials.length > 1 && (
        <FilterChipRow>
          {materials.map((name) => (
            <FilterChip
              key={name}
              label={name === "todos" ? "Todos" : name}
              active={materialFilter === name}
              onPress={() => setMaterialFilter(name)}
            />
          ))}
        </FilterChipRow>
      )}

      {query.isLoading && <LoadingCard text="Carregando solicitações..." />}
      {query.error && (
        <MessageBanner
          message={getReadableErrorMessage(
            query.error,
            "Não foi possível carregar as solicitações disponíveis."
          )}
          tone="error"
        />
      )}

      {!query.isLoading && filtered.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="Nenhuma solicitação disponível"
          description="Novas solicitações aprovadas aparecerão aqui assim que estiverem prontas para aceite."
        />
      ) : null}

      {filtered.map((item) => (
        <AppCard key={item.id}>
          <SectionHeader title={item.titulo} description={item.material.nome} />
          <StatusBadge kind="solicitacao" value={item.status} />
          <Text style={{ color: appColors.textSoft, fontSize: 15, lineHeight: 22 }}>
            {item.quantidade} · {item.material.nome}
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
            onPress={() => router.push(`/empresa/solicitacoes/${item.id}` as any)}
          />
        </AppCard>
      ))}
    </AppScreen>
  );
}
