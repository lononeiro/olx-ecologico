import { useMemo, useState } from "react";
import { useLocalSearchParams, router } from "expo-router";
import { useMutation } from "@tanstack/react-query";
import {
  AppButton,
  AppCard,
  AppField,
  AppScreen,
  MessageBanner,
  SectionHeader,
} from "@/components/AppUI";
import { getReadableErrorMessage, resetPassword as resetPasswordRequest } from "@/lib/api";
import { STRONG_PASSWORD_HINTS, getStrongPasswordIssues } from "@/lib/password";

export default function ResetPasswordScreen() {
  const params = useLocalSearchParams<{ token?: string; email?: string }>();
  const [token, setToken] = useState(params.token ?? "");
  const [email, setEmail] = useState(params.email ?? "");
  const [novaSenha, setNovaSenha] = useState("");
  const [message, setMessage] = useState("");
  const [tone, setTone] = useState<"success" | "error">("success");

  const passwordIssues = useMemo(
    () => getStrongPasswordIssues(novaSenha),
    [novaSenha]
  );

  const mutation = useMutation({
    mutationFn: async () => resetPasswordRequest(token.trim(), email.trim(), novaSenha),
    onSuccess: (data) => {
      setTone("success");
      setMessage(data.mensagem);
      setTimeout(() => router.replace("/login"), 1200);
    },
    onError: (error) => {
      setTone("error");
      setMessage(getReadableErrorMessage(error, "Nao foi possivel resetar a senha."));
    },
  });

  return (
    <AppScreen>
      <AppCard>
        <SectionHeader
          eyebrow="NOVA SENHA"
          title="Finalizar redefinicao"
          description="Use o token recebido e defina uma senha forte antes de voltar ao login."
        />
      </AppCard>

      {!!message && <MessageBanner message={message} tone={tone} />}

      <AppCard>
        <AppField
          label="Token"
          value={token}
          onChangeText={setToken}
          placeholder="Cole o token recebido"
          autoCapitalize="none"
        />
        <AppField
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="seu@email.com"
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <AppField
          label="Nova senha"
          value={novaSenha}
          onChangeText={setNovaSenha}
          placeholder="Digite a nova senha"
          secureTextEntry
          helper={STRONG_PASSWORD_HINTS.join(" | ")}
          error={novaSenha ? passwordIssues[0] : undefined}
        />
        <AppButton
          label={mutation.isPending ? "Atualizando..." : "Atualizar senha"}
          onPress={() => mutation.mutate()}
          disabled={mutation.isPending}
        />
      </AppCard>
    </AppScreen>
  );
}
