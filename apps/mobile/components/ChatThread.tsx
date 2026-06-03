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
  threadId,
  accessToken,
  currentUserId,
  messages,
  title = "Conversa",
  description,
  emptyText = "Nenhuma mensagem ainda. Inicie a conversa por aqui.",
  placeholder = "Escreva uma mensagem",
  queryKey,
  onSend,
}: {
  coletaId?: number;
  threadId?: number;
  accessToken: string;
  currentUserId: number;
  messages: MessageItem[];
  title?: string;
  description?: string;
  emptyText?: string;
  placeholder?: string;
  queryKey?: unknown[];
  onSend?: (mensagem: string) => Promise<MessageItem>;
}) {
  const queryClient = useQueryClient();
  const resolvedThreadId = threadId ?? coletaId;
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");

  const sendMutation = useMutation({
    mutationFn: async () => {
      if (!mensagem.trim()) {
        throw new Error("Digite uma mensagem antes de enviar.");
      }

      if (onSend) return onSend(mensagem.trim());
      if (!coletaId) throw new Error("Conversa nao configurada.");

      return sendMensagem(accessToken, coletaId, mensagem.trim());
    },
    onSuccess: () => {
      setMensagem("");
      setErro("");
      void queryClient.invalidateQueries({ queryKey: queryKey ?? ["detail", resolvedThreadId] });
    },
    onError: (error) => {
      setErro(getReadableErrorMessage(error, "Nao foi possivel enviar a mensagem."));
    },
  });

  return (
    <AppCard>
      <Text style={{ fontSize: 18, fontWeight: "700", color: appColors.text }}>
        {title}
      </Text>
      {!!description && (
        <Text style={{ color: appColors.textSoft, lineHeight: 20 }}>
          {description}
        </Text>
      )}

      {messages.length === 0 ? (
        <Text style={{ color: appColors.textSoft }}>
          {emptyText}
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
                  borderColor: own ? "#d6ead6" : appColors.stroke,
                  gap: 6,
                }}
              >
                <Text style={{ color: appColors.textSoft, fontSize: 12, fontWeight: "700" }}>
                  {item.remetente.nome}
                </Text>
                <Text style={{ color: appColors.text, lineHeight: 20 }}>
                  {item.mensagem}
                </Text>
                <Text style={{ color: appColors.textSoft, fontSize: 11 }}>
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
        placeholder={placeholder}
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
