import { useEffect, useMemo, useState } from "react";
import { router } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { profileUpdateSchema } from "@shared";
import {
  ActivityIndicator,
  Linking,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "@/contexts/AuthContext";
import {
  ApiError,
  getMyProfile,
  getReadableErrorMessage,
  type MobileProfileResponse,
  updateMyProfile,
} from "@/lib/api";

type ProfileFormState = {
  nome: string;
  telefone: string;
  endereco: string;
};

const emptyForm: ProfileFormState = {
  nome: "",
  telefone: "",
  endereco: "",
};

function getProfileForm(profile: MobileProfileResponse): ProfileFormState {
  return {
    nome: profile.nome,
    telefone: profile.telefone ?? "",
    endereco: profile.endereco ?? "",
  };
}

export default function MeScreen() {
  const queryClient = useQueryClient();
  const {
    accessToken,
    isLoading,
    refreshSession,
    signOut,
    updateUser,
    user,
  } = useAuth();
  const [form, setForm] = useState<ProfileFormState>(emptyForm);
  const [feedback, setFeedback] = useState("");
  const [feedbackTone, setFeedbackTone] = useState<"success" | "error">("success");

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login");
    }
  }, [isLoading, user]);

  const profileQuery = useQuery({
    queryKey: ["me", user?.id],
    enabled: !!user && !isLoading,
    queryFn: async () => {
      const token = accessToken ?? (await refreshSession());
      if (!token) {
        throw new Error("Sua sessao expirou. Entre novamente.");
      }

      try {
        return await getMyProfile(token);
      } catch (error) {
        if (!(error instanceof ApiError) || error.status !== 401) {
          throw error;
        }

        const refreshedToken = await refreshSession();
        if (!refreshedToken) {
          throw new Error("Sua sessao expirou. Entre novamente.");
        }

        return getMyProfile(refreshedToken);
      }
    },
  });

  useEffect(() => {
    if (profileQuery.data) {
      setForm(getProfileForm(profileQuery.data));
    }
  }, [profileQuery.data]);

  const saveProfileMutation = useMutation({
    mutationFn: async () => {
      const parsed = profileUpdateSchema.safeParse(form);
      if (!parsed.success) {
        throw new Error(parsed.error.issues[0]?.message ?? "Revise os dados do perfil.");
      }

      const token = accessToken ?? (await refreshSession());
      if (!token) {
        throw new Error("Sua sessao expirou. Entre novamente.");
      }

      try {
        return await updateMyProfile(token, parsed.data);
      } catch (error) {
        if (!(error instanceof ApiError) || error.status !== 401) {
          throw error;
        }

        const refreshedToken = await refreshSession();
        if (!refreshedToken) {
          throw new Error("Sua sessao expirou. Entre novamente.");
        }

        return updateMyProfile(refreshedToken, parsed.data);
      }
    },
    onSuccess: async (profile) => {
      setFeedbackTone("success");
      setFeedback("Perfil atualizado com sucesso.");
      setForm(getProfileForm(profile));
      await updateUser({
        id: profile.id,
        name: profile.nome,
        email: profile.email,
        role: profile.role.nome as "usuario" | "admin" | "empresa",
      });
      queryClient.setQueryData(["me", user?.id], profile);
    },
    onError: (error) => {
      setFeedbackTone("error");
      setFeedback(
        getReadableErrorMessage(error, "Nao foi possivel salvar o perfil.")
      );
    },
  });

  const createdAtLabel = useMemo(() => {
    if (!profileQuery.data?.createdAt) return "";
    return new Date(profileQuery.data.createdAt).toLocaleString("pt-BR");
  }, [profileQuery.data?.createdAt]);

  const companyCreatedAtLabel = useMemo(() => {
    if (!profileQuery.data?.company?.createdAt) return "";
    return new Date(profileQuery.data.company.createdAt).toLocaleString("pt-BR");
  }, [profileQuery.data?.company?.createdAt]);

  const openInMaps = async () => {
    const endereco = form.endereco.trim();
    if (!endereco) {
      setFeedbackTone("error");
      setFeedback("Adicione um endereco antes de abrir a localizacao.");
      return;
    }

    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      endereco
    )}`;

    const supported = await Linking.canOpenURL(url);
    if (!supported) {
      setFeedbackTone("error");
      setFeedback("Nao foi possivel abrir o aplicativo de mapas.");
      return;
    }

    await Linking.openURL(url);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color="#1e7a32" />
      </SafeAreaView>
    );
  }

  if (!user) return null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f4f8f2" }}>
      <ScrollView contentContainerStyle={{ padding: 24, gap: 20 }}>
        <View
          style={{
            backgroundColor: "#ffffff",
            borderRadius: 24,
            padding: 24,
            gap: 10,
            borderWidth: 1,
            borderColor: "#d6ead6",
          }}
        >
          <Text style={{ fontSize: 12, fontWeight: "700", color: "#2f8d47", letterSpacing: 2 }}>
            SESSAO MOBILE
          </Text>
          <Text style={{ fontSize: 28, fontWeight: "700", color: "#122114" }}>
            Minha conta
          </Text>
          <Text style={{ color: "#537156", lineHeight: 22 }}>
            O app usa bearer token para consultar e atualizar `/api/users/me`,
            com refresh automatico quando a sessao expira.
          </Text>
        </View>

        {profileQuery.isLoading && (
          <StatusCard text="Carregando perfil..." />
        )}

        {!!feedback && (
          <MessageCard tone={feedbackTone} message={feedback} />
        )}

        {profileQuery.error && (
          <MessageCard
            tone="error"
            message={getReadableErrorMessage(
              profileQuery.error,
              "Nao foi possivel carregar o perfil."
            )}
          />
        )}

        {profileQuery.data && (
          <>
            <View style={{ gap: 16 }}>
              <InfoCard label="Nome" value={profileQuery.data.nome} />
              <InfoCard label="Email" value={profileQuery.data.email} />
              <InfoCard label="Perfil" value={profileQuery.data.role.nome} />
              <InfoCard
                label="Telefone"
                value={profileQuery.data.telefone ?? "Nao informado"}
              />
              <InfoCard
                label="Endereco"
                value={profileQuery.data.endereco ?? "Nao informado"}
              />
              <InfoCard label="Status" value={profileQuery.data.status} />
              <InfoCard label="Criado em" value={createdAtLabel} />
              {profileQuery.data.company && (
                <>
                  <InfoCard label="Empresa" value={profileQuery.data.company.cnpj} />
                  <InfoCard
                    label="Descricao da empresa"
                    value={profileQuery.data.company.descricao ?? "Nao informada"}
                  />
                  <InfoCard
                    label="Cadastro da empresa"
                    value={companyCreatedAtLabel}
                  />
                </>
              )}
            </View>

            <View
              style={{
                backgroundColor: "#ffffff",
                borderRadius: 24,
                padding: 20,
                gap: 14,
                borderWidth: 1,
                borderColor: "#d6ead6",
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: "700", color: "#2f8d47", letterSpacing: 2 }}>
                EDITAR PERFIL
              </Text>
              <Text style={{ fontSize: 22, fontWeight: "700", color: "#122114" }}>
                Dados atualizaveis
              </Text>
              <Text style={{ color: "#537156", lineHeight: 22 }}>
                Nome, telefone e endereco seguem o mesmo contrato validado no backend.
              </Text>

              <Field
                label="Nome"
                value={form.nome}
                onChangeText={(value) => {
                  setFeedback("");
                  setForm((current) => ({ ...current, nome: value }));
                }}
                placeholder="Seu nome completo"
              />
              <Field
                label="Telefone"
                value={form.telefone}
                onChangeText={(value) => {
                  setFeedback("");
                  setForm((current) => ({ ...current, telefone: value }));
                }}
                placeholder="Telefone para contato"
              />
              <Field
                label="Endereco"
                value={form.endereco}
                onChangeText={(value) => {
                  setFeedback("");
                  setForm((current) => ({ ...current, endereco: value }));
                }}
                placeholder="Endereco para coletas"
                multiline
              />

              <TouchableOpacity
                onPress={() => saveProfileMutation.mutate()}
                disabled={saveProfileMutation.isPending}
                style={{
                  backgroundColor: "#1e7a32",
                  borderRadius: 16,
                  paddingVertical: 16,
                  alignItems: "center",
                  opacity: saveProfileMutation.isPending ? 0.7 : 1,
                }}
              >
                <Text style={{ color: "#ffffff", fontWeight: "700" }}>
                  {saveProfileMutation.isPending ? "Salvando..." : "Salvar alteracoes"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={openInMaps}
                style={{
                  backgroundColor: "#eef7ec",
                  borderRadius: 16,
                  paddingVertical: 16,
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor: "#d6ead6",
                }}
              >
                <Text style={{ color: "#122114", fontWeight: "700" }}>
                  Ver localizacao no mapa
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        <TouchableOpacity
          onPress={() => {
            setFeedback("");
            void profileQuery.refetch();
          }}
          style={{
            backgroundColor: "#ffffff",
            borderRadius: 16,
            paddingVertical: 16,
            alignItems: "center",
            borderWidth: 1,
            borderColor: "#d6ead6",
          }}
        >
          <Text style={{ color: "#122114", fontWeight: "700" }}>Atualizar perfil</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={async () => {
            await signOut();
            router.replace("/login");
          }}
          style={{
            backgroundColor: "#1e7a32",
            borderRadius: 16,
            paddingVertical: 16,
            alignItems: "center",
          }}
        >
          <Text style={{ color: "#ffffff", fontWeight: "700" }}>Sair</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function Field({
  label,
  multiline,
  ...props
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  multiline?: boolean;
}) {
  return (
    <View style={{ gap: 8 }}>
      <Text style={{ color: "#537156", fontSize: 12, fontWeight: "700", letterSpacing: 1 }}>
        {label.toUpperCase()}
      </Text>
      <TextInput
        {...props}
        multiline={multiline}
        textAlignVertical={multiline ? "top" : "center"}
        style={{
          backgroundColor: "#ffffff",
          borderRadius: 16,
          paddingHorizontal: 16,
          paddingVertical: 14,
          minHeight: multiline ? 120 : undefined,
          borderWidth: 1,
          borderColor: "#d6ead6",
        }}
      />
    </View>
  );
}

function StatusCard({ text }: { text: string }) {
  return (
    <View
      style={{
        backgroundColor: "#ffffff",
        borderRadius: 20,
        padding: 20,
        alignItems: "center",
        gap: 12,
      }}
    >
      <ActivityIndicator size="small" color="#1e7a32" />
      <Text style={{ color: "#537156" }}>{text}</Text>
    </View>
  );
}

function MessageCard({
  tone,
  message,
}: {
  tone: "success" | "error";
  message: string;
}) {
  const isSuccess = tone === "success";

  return (
    <View
      style={{
        backgroundColor: isSuccess ? "#eef7ec" : "#fff1f1",
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        borderColor: isSuccess ? "#d6ead6" : "#f2b8b5",
      }}
    >
      <Text style={{ color: isSuccess ? "#1e7a32" : "#9f3029", fontWeight: "700" }}>
        {message}
      </Text>
    </View>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <View
      style={{
        backgroundColor: "#ffffff",
        borderRadius: 20,
        padding: 18,
        gap: 8,
        borderWidth: 1,
        borderColor: "#d6ead6",
      }}
    >
      <Text style={{ color: "#537156", fontSize: 12, fontWeight: "700", letterSpacing: 1 }}>
        {label.toUpperCase()}
      </Text>
      <Text style={{ color: "#122114", fontSize: 16, fontWeight: "600" }}>{value}</Text>
    </View>
  );
}
