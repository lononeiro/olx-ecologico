import { Redirect, router } from "expo-router";
import { Text, View } from "react-native";
import { AppButton, AppCard, AppScreen, SectionHeader } from "@/components/AppUI";
import { useAuth } from "@/contexts/AuthContext";
import { getHomeRouteForRole } from "@/lib/navigation";

export default function IndexScreen() {
  const { isLoading, user } = useAuth();

  if (!isLoading && user) {
    return <Redirect href={getHomeRouteForRole(user.role) as any} />;
  }

  return (
    <AppScreen>
      <AppCard>
        <SectionHeader
          eyebrow="ECONECTA MOBILE"
          title="Fluxo mobile alinhado ao web"
          description="Login, cadastro, perfil, solicitacoes, coletas e administracao foram organizados para toque e telas menores."
        />
      </AppCard>

      <AppCard>
        <View style={{ gap: 10 }}>
          <Text style={{ fontSize: 18, fontWeight: "700", color: "#122114" }}>
            Entrar ou criar conta
          </Text>
          <Text style={{ color: "#537156", lineHeight: 22 }}>
            O app usa os mesmos endpoints e validacoes da plataforma web, mas com navegacao nativa.
          </Text>
        </View>
        <AppButton label="Entrar" onPress={() => router.push("/login")} />
        <AppButton label="Criar conta" tone="secondary" onPress={() => router.push("/register")} />
        <AppButton
          label="Recuperar senha"
          tone="secondary"
          onPress={() => router.push("/forgot-password")}
        />
      </AppCard>
    </AppScreen>
  );
}
