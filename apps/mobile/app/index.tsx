import { Link, Redirect } from "expo-router";
import { SafeAreaView, ScrollView, Text, View } from "react-native";
import { STATUS_SOLICITACAO_LABEL, solicitacaoCreateSchema } from "@shared";
import { useAuth } from "@/contexts/AuthContext";

const schemaFields = Object.keys(solicitacaoCreateSchema.shape);

export default function HomeScreen() {
  const { isLoading, user } = useAuth();

  if (!isLoading && user) {
    return <Redirect href="/me" />;
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f4f8f2" }}>
      <ScrollView contentContainerStyle={{ padding: 24, gap: 24 }}>
        <View
          style={{
            backgroundColor: "#ffffff",
            borderRadius: 24,
            padding: 24,
            gap: 16,
            shadowColor: "#12331a",
            shadowOpacity: 0.08,
            shadowRadius: 20,
            shadowOffset: { width: 0, height: 8 },
            elevation: 4,
          }}
        >
          <Text style={{ fontSize: 12, fontWeight: "700", color: "#2f8d47", letterSpacing: 2 }}>
            MOBILE FOUNDATION
          </Text>
          <Text style={{ fontSize: 32, fontWeight: "700", color: "#122114" }}>
            ECOnecta Mobile
          </Text>
          <Text style={{ fontSize: 16, lineHeight: 24, color: "#537156" }}>
            Base criada com Expo Router, React Query e pacote compartilhado para
            reaproveitar validacoes e contratos do web atual.
          </Text>
        </View>

        <View
          style={{
            backgroundColor: "#eef7ec",
            borderRadius: 24,
            padding: 20,
            gap: 12,
            borderWidth: 1,
            borderColor: "#d6ead6",
          }}
        >
          <Text style={{ fontSize: 18, fontWeight: "700", color: "#122114" }}>
            Shared ativo
          </Text>
          <Text style={{ color: "#537156", lineHeight: 22 }}>
            Campos reaproveitados do schema de solicitacao:
          </Text>
          {schemaFields.map((field) => (
            <Text key={field} style={{ color: "#1e7a32", fontWeight: "600" }}>
              - {field}
            </Text>
          ))}
          <Text style={{ marginTop: 8, color: "#537156", lineHeight: 22 }}>
            Status aprovados: {STATUS_SOLICITACAO_LABEL.aprovada},{" "}
            {STATUS_SOLICITACAO_LABEL.pendente} e{" "}
            {STATUS_SOLICITACAO_LABEL.rejeitada}.
          </Text>
        </View>

        <Link
          href="/login"
          style={{
            backgroundColor: "#1e7a32",
            color: "#ffffff",
            borderRadius: 16,
            paddingVertical: 16,
            textAlign: "center",
            fontWeight: "700",
            overflow: "hidden",
          }}
        >
          Entrar no app
        </Link>
      </ScrollView>
    </SafeAreaView>
  );
}
