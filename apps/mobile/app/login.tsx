import { useState } from "react";
import { router } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { loginSchema } from "@shared";
import {
  AppButton,
  AppCard,
  AppField,
  AppScreen,
  MessageBanner,
  SectionHeader,
} from "@/components/AppUI";
import { useAuth } from "@/contexts/AuthContext";
import { getReadableErrorMessage } from "@/lib/api";
import { getHomeRouteForRole } from "@/lib/navigation";
import { colors, spacing, typography } from "@/theme/tokens";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [messageTone, setMessageTone] = useState<"success" | "error">("error");
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();

  const validar = async () => {
    const result = loginSchema.safeParse({ email, senha });
    if (!result.success) {
      const issue = result.error.issues[0];
      setMessageTone("error");
      setMensagem(issue?.message ?? "Revise os dados informados.");
      return;
    }

    try {
      setLoading(true);
      setMessageTone("success");
      setMensagem("Entrando na sua conta...");
      const sessionUser = await signIn(email.trim(), senha);
      router.replace(getHomeRouteForRole(sessionUser.role) as any);
    } catch (error) {
      setMessageTone("error");
      setMensagem(
        getReadableErrorMessage(error, "Nao foi possivel entrar agora.")
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppScreen scroll={false}>
      <View style={styles.page}>
        <View style={styles.heroCard}>
          <View style={styles.heroBadge} />
          <SectionHeader
            eyebrow="ECONECTA MOBILE"
            title="Entre e acompanhe tudo no app"
            description="Autenticacao mobile com sessao persistida, refresh automatico e acesso imediato ao fluxo do seu perfil."
          />
          <View style={styles.heroMetrics}>
            <View style={styles.metric}>
              <Text style={styles.metricValue}>Token</Text>
              <Text style={styles.metricLabel}>sessao segura</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metric}>
              <Text style={styles.metricValue}>Perfil</Text>
              <Text style={styles.metricLabel}>fluxo por role</Text>
            </View>
          </View>
        </View>

        <AppCard>
          <SectionHeader
            eyebrow="ACESSO"
            title="Entrar"
            description="Use o mesmo email e a mesma senha ja cadastrados no sistema."
          />

          {!!mensagem && <MessageBanner message={mensagem} tone={messageTone} />}

          <AppField
            label="Email"
            value={email}
            onChangeText={(value) => {
              if (mensagem) setMensagem("");
              setEmail(value);
            }}
            placeholder="seu@email.com"
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            textContentType="emailAddress"
          />

          <AppField
            label="Senha"
            value={senha}
            onChangeText={(value) => {
              if (mensagem) setMensagem("");
              setSenha(value);
            }}
            placeholder="Digite sua senha"
            secureTextEntry
            secureToggle
            autoComplete="password"
            textContentType="password"
            helper="Se voce ja tinha conta no web, a senha continua a mesma."
          />

          <View style={styles.ctaGroup}>
            <AppButton
              label={loading ? "Entrando..." : "Entrar"}
              onPress={validar}
              disabled={loading}
            />
            <AppButton
              label="Criar conta"
              tone="secondary"
              onPress={() => router.push("/register")}
            />
            <AppButton
              label="Recuperar senha"
              tone="ghost"
              onPress={() => router.push("/forgot-password")}
            />
          </View>
        </AppCard>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    justifyContent: "center",
    gap: spacing.lg,
  },
  heroCard: {
    backgroundColor: colors.primary,
    borderRadius: 30,
    padding: spacing.xl,
    gap: spacing.lg,
    shadowColor: colors.black,
    shadowOpacity: 0.18,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 14 },
    elevation: 5,
  },
  heroBadge: {
    width: 58,
    height: 58,
    borderRadius: 22,
    backgroundColor: "#3a8b61",
  },
  heroMetrics: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingTop: spacing.xs,
  },
  metric: {
    flex: 1,
    gap: 4,
  },
  metricValue: {
    ...typography.bodyStrong,
    color: colors.white,
  },
  metricLabel: {
    ...typography.meta,
    color: "#b8d2be",
  },
  metricDivider: {
    width: 1,
    alignSelf: "stretch",
    backgroundColor: "rgba(255,255,255,0.16)",
  },
  ctaGroup: {
    gap: spacing.sm,
  },
});
