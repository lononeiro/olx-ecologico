import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Text, View } from "react-native";
import { AppButton, AppCard, AppField, appColors } from "@/components/AppUI";
import {
  getReadableErrorMessage,
  sendMensagem,
  type MessageItem,
} from "@/lib/api";

export function ChatThread({
  coletaId,
  accessToken,
  currentUserId,
  messages,
}: {
  coletaId: number;
  accessToken: string;
  currentUserId: number;
  messages: MessageItem[];
}) {
  const queryClient = useQueryClient();
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");

  const sendMutation = useMutation({
    mutationFn: async () => {
      if (!mensagem.trim()) {
        throw new Error("Digite uma mensagem antes de enviar.");
      }

      return sendMensagem(accessToken, coletaId, mensagem.trim());
    },
    onSuccess: () => {
      setMensagem("");
      setErro("");
      void queryClient.invalidateQueries({ queryKey: ["detail", coletaId] });
    },
    onError: (error) => {
      setErro(getReadableErrorMessage(error, "Nao foi possivel enviar a mensagem."));
    },
  });

  return (
    <AppCard>
      <Text style={{ fontSize: 18, fontWeight: "700", color: appColors.text }}>
        Conversa
      </Text>

      {messages.length === 0 ? (
        <Text style={{ color: appColors.muted }}>
          Nenhuma mensagem ainda. Inicie a conversa por aqui.
        </Text>
      ) : (
        <View style={{ gap: 10 }}>
          {messages.map((item) => {
            const own = item.remetenteId === currentUserId;

            return (
              <View
                key={item.id}
                style={{
                  alignSelf: own ? "flex-end" : "flex-start",
                  maxWidth: "88%",
                  backgroundColor: own ? "#eef7ec" : "#ffffff",
                  borderRadius: 18,
                  padding: 14,
                  borderWidth: 1,
                  borderColor: own ? "#d6ead6" : appColors.border,
                  gap: 6,
                }}
              >
                <Text style={{ color: appColors.muted, fontSize: 12, fontWeight: "700" }}>
                  {item.remetente.nome}
                </Text>
                <Text style={{ color: appColors.text, lineHeight: 20 }}>
                  {item.mensagem}
                </Text>
                <Text style={{ color: appColors.muted, fontSize: 11 }}>
                  {new Date(item.createdAt).toLocaleString("pt-BR")}
                </Text>
              </View>
            );
          })}
        </View>
      )}

      <AppField
        label="Nova mensagem"
        value={mensagem}
        onChangeText={(value) => {
          setErro("");
          setMensagem(value);
        }}
        placeholder="Escreva para a outra parte"
        multiline
        error={erro}
      />
      <AppButton
        label={sendMutation.isPending ? "Enviando..." : "Enviar mensagem"}
        onPress={() => sendMutation.mutate()}
        disabled={sendMutation.isPending}
      />
    </AppCard>
  );
}
