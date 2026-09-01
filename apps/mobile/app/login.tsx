import { useRef, useState } from "react";
import { router } from "expo-router";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Recycle } from "lucide-react-native";
import { loginSchema } from "@shared";
import {
  AppButton,
  AppField,
  AppScreen,
  Icon,
  MessageBanner,
} from "@/components/AppUI";
import { useAuth } from "@/contexts/AuthContext";
import { getReadableErrorMessage } from "@/lib/api";
import { getHomeRouteForRole } from "@/lib/navigation";
import { colors, radius, shadows, spacing, typography } from "@/theme/tokens";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [emailError, setEmailError] = useState("");
  const [senhaError, setSenhaError] = useState("");
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);
  const passwordRef = useRef<TextInput>(null);
  const { signIn } = useAuth();

  const validar = async () => {
    const result = loginSchema.safeParse({ email: email.trim(), senha });
    if (!result.success) {
      let nextEmailError = "";
      let nextSenhaError = "";
      for (const issue of result.error.issues) {
        if (issue.path[0] === "email" && !nextEmailError) {
          nextEmailError = issue.message;
        }
        if (issue.path[0] === "senha" && !nextSenhaError) {
          nextSenhaError = issue.message;
        }
      }
      setEmailError(nextEmailError);
      setSenhaError(nextSenhaError);
      return;
    }

    setEmailError("");
    setSenhaError("");

    try {
      setLoading(true);
      setFormError("");
      const sessionUser = await signIn(email.trim(), senha);
      router.replace(getHomeRouteForRole(sessionUser.role) as any);
    } catch (error) {
      setFormError(
        getReadableErrorMessage(error, "Não foi possível entrar agora.")
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppScreen scroll={false}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.page}>
          <View style={styles.brand}>
            <View style={styles.logoBadge}>
              <Icon icon={Recycle} size={30} color={colors.white} strokeWidth={2} />
            </View>
            <Text style={styles.brandName}>ECOnecta</Text>
            <Text style={styles.brandTagline}>Reciclagem que conecta</Text>
          </View>

          <View style={styles.heading}>
            <Text style={styles.title}>Entrar</Text>
            <Text style={styles.subtitle}>
              Ainda não tem conta?{" "}
              <Text style={styles.link} onPress={() => router.push("/register")}>
                Criar agora
              </Text>
            </Text>
          </View>

          {!!formError && <MessageBanner message={formError} tone="error" />}

          <View style={styles.form}>
            <AppField
              label="Email"
              value={email}
              onChangeText={(value) => {
                if (emailError) setEmailError("");
                if (formError) setFormError("");
                setEmail(value);
              }}
              placeholder="seu@email.com"
              error={emailError}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              textContentType="emailAddress"
              returnKeyType="next"
              blurOnSubmit={false}
              onSubmitEditing={() => passwordRef.current?.focus()}
            />

            <View>
              <AppField
                ref={passwordRef}
                label="Senha"
                value={senha}
                onChangeText={(value) => {
                  if (senhaError) setSenhaError("");
                  if (formError) setFormError("");
                  setSenha(value);
                }}
                placeholder="Digite sua senha"
                error={senhaError}
                secureTextEntry
                secureToggle
                autoComplete="password"
                textContentType="password"
                returnKeyType="go"
                onSubmitEditing={validar}
              />
              <Pressable
                style={styles.forgotWrap}
                onPress={() => router.push("/forgot-password")}
                hitSlop={8}
              >
                <Text style={styles.forgot}>Esqueci minha senha</Text>
              </Pressable>
            </View>
          </View>

          <AppButton
            label={loading ? "Entrando..." : "Entrar"}
            onPress={validar}
            loading={loading}
          />

          <View style={styles.divider}>
            <View style={styles.line} />
            <Text style={styles.dividerText}>ou</Text>
            <View style={styles.line} />
          </View>

          <AppButton
            label="Criar uma conta grátis"
            tone="secondary"
            onPress={() => router.push("/register")}
          />
        </View>
      </KeyboardAvoidingView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  page: {
    flex: 1,
    justifyContent: "center",
    gap: spacing.lg,
    maxWidth: 420,
    width: "100%",
    alignSelf: "center",
  },
  brand: {
    alignItems: "center",
    gap: spacing.sm,
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.button,
  },
  brandName: {
    ...typography.eyebrow,
    color: colors.primary,
    letterSpacing: 2,
  },
  brandTagline: {
    ...typography.meta,
    color: colors.textFaint,
    fontWeight: "500",
  },
  heading: {
    alignItems: "center",
    gap: spacing.xs,
  },
  title: {
    ...typography.title,
    fontSize: 30,
    lineHeight: 36,
    color: colors.text,
    letterSpacing: -0.6,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSoft,
    textAlign: "center",
  },
  link: {
    color: colors.primary,
    fontFamily: typography.bodyStrong.fontFamily,
    fontWeight: "600",
  },
  form: {
    gap: spacing.md,
  },
  forgotWrap: {
    alignSelf: "flex-end",
    marginTop: spacing.xs,
  },
  forgot: {
    ...typography.meta,
    color: colors.textSoft,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginVertical: spacing.xs,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: colors.stroke,
  },
  dividerText: {
    ...typography.meta,
    color: colors.textFaint,
  },
});
