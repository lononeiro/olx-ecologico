import { useState } from "react";
import { router } from "expo-router";
import { useMutation } from "@tanstack/react-query";
import {
  AppButton,
  AppCard,
  AppField,
  AppScreen,
  MessageBanner,
  SectionHeader,
} from "@/components/AppUI";
import { getReadableErrorMessage, requestPasswordReset } from "@/lib/api";

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [resetLink, setResetLink] = useState("");
  const [tone, setTone] = useState<"success" | "error">("success");

  const mutation = useMutation({
    mutationFn: async () => requestPasswordReset(email.trim()),
    onSuccess: (data) => {
      setTone("success");
      setMessage(data.mensagem);
      setResetLink(data.resetLink ?? "");
    },
    onError: (error) => {
      setTone("error");
      setMessage(
        getReadableErrorMessage(error, "Nao foi possivel solicitar a recuperacao.")
      );
      setResetLink("");
    },
  });

  return (
    <AppScreen>
      <AppCard>
        <SectionHeader
          eyebrow="RECUPERAR SENHA"
          title="Solicitar redefinicao"
          description="O backend segue a mesma semantica do web: sempre responde com mensagem generica quando necessario."
        />
      </AppCard>

      {!!message && <MessageBanner message={message} tone={tone} />}
      {!!resetLink && <MessageBanner message={resetLink} tone="success" />}

      <AppCard>
        <AppField
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="seu@email.com"
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <AppButton
          label={mutation.isPending ? "Enviando..." : "Solicitar recuperacao"}
          onPress={() => mutation.mutate()}
          disabled={mutation.isPending}
        />
        <AppButton
          label="Ja tenho token para reset"
          tone="secondary"
          onPress={() => router.push("/reset-password")}
        />
      </AppCard>
    </AppScreen>
  );
}
