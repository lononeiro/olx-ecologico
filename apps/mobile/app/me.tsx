import { useEffect, useMemo, useState } from "react";
import { router } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Linking, StyleSheet, Text, View } from "react-native";
import { profileUpdateSchema } from "@shared";
import { MapPin, RefreshCw, LogOut } from "lucide-react-native";
import {
  AppButton,
  AppCard,
  AppField,
  AppScreen,
  BottomNavigation,
  InfoRow,
  LoadingCard,
  MessageBanner,
  SectionHeader,
  StatusBadge,
} from "@/components/AppUI";
import { useAuth } from "@/contexts/AuthContext";
import {
  getMyProfile,
  getReadableErrorMessage,
  type MobileProfileResponse,
  updateMyProfile,
} from "@/lib/api";
import { withAutoRefresh } from "@/lib/session";
import { colors, spacing, typography } from "@/theme/tokens";
import { USUARIO_TABS, EMPRESA_TABS } from "@/lib/tabs";

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
  const { accessToken, isLoading, refreshSession, signOut, updateUser, user } =
    useAuth();
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
    queryFn: async () =>
      withAutoRefresh(accessToken, refreshSession, (token) => getMyProfile(token)),
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
        throw new Error(
          parsed.error.issues[0]?.message ?? "Revise os dados do perfil."
        );
      }

      return withAutoRefresh(accessToken, refreshSession, (token) =>
        updateMyProfile(token, parsed.data)
      );
    },
    onSuccess: async (profile) => {
      setFeedbackTone("success");
      setFeedback("Perfil atualizado com sucesso.");
      setForm(getProfileForm(profile));
      await updateUser({
        id: profile.id,
        name: profile.nome,
        email: profile.email,
        role: profile.role.nome as "usuario" | "empresa",
      });
      queryClient.setQueryData(["me", user?.id], profile);
    },
    onError: (error) => {
      setFeedbackTone("error");
      setFeedback(
        getReadableErrorMessage(error, "Não foi possível salvar o perfil.")
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
      setFeedback("Adicione um endereço antes de abrir a localização.");
      return;
    }

    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      endereco
    )}`;

    const supported = await Linking.canOpenURL(url);
    if (!supported) {
      setFeedbackTone("error");
      setFeedback("Não foi possível abrir o aplicativo de mapas.");
      return;
    }

    await Linking.openURL(url);
  };

  if (isLoading) {
    return (
      <AppScreen>
        <LoadingCard text="Preparando sua conta..." />
      </AppScreen>
    );
  }

  if (!user) return null;

  const tabs = user.role === "empresa" ? EMPRESA_TABS : USUARIO_TABS;

  return (
    <AppScreen footer={<BottomNavigation items={tabs} activeKey="me" />}>
      <AppCard>
        <View style={styles.heroTop}>
          <View style={styles.identityBadge}>
            <Text style={styles.identityInitial}>{user.name.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={styles.heroText}>
            <Text style={styles.heroEyebrow}>MINHA CONTA</Text>
            <Text style={styles.heroName}>{user.name}</Text>
            <Text style={styles.heroSubtitle}>
              Seus dados pessoais e informações de contato em um resumo claro para uso no app.
            </Text>
          </View>
        </View>

        <View style={styles.metaRow}>
          <StatusBadge kind="solicitacao" value={profileQuery.data?.status ?? "aprovada"} />
          <View style={styles.metaChip}>
            <Text style={styles.metaChipText}>{user.role}</Text>
          </View>
        </View>
      </AppCard>

      {profileQuery.isLoading && <LoadingCard text="Carregando perfil..." />}
      {!!feedback && <MessageBanner message={feedback} tone={feedbackTone} />}
      {profileQuery.error && (
        <MessageBanner
          message={getReadableErrorMessage(
            profileQuery.error,
            "Não foi possível carregar o perfil."
          )}
          tone="error"
        />
      )}

      {profileQuery.data && (
        <>
          <AppCard>
            <SectionHeader
              eyebrow="RESUMO"
              title="Dados da conta"
              description="Informações principais da sua conta e do seu tipo de acesso."
            />
            <InfoRow label="Nome" value={profileQuery.data.nome} />
            <InfoRow label="Email" value={profileQuery.data.email} />
            <InfoRow label="Perfil" value={profileQuery.data.role.nome} />
            <InfoRow
              label="Telefone"
              value={profileQuery.data.telefone ?? "Não informado"}
            />
            <InfoRow
              label="Endereço"
              value={profileQuery.data.endereco ?? "Não informado"}
            />
            <InfoRow label="Criado em" value={createdAtLabel} />
          </AppCard>

          <AppCard>
            <SectionHeader
              eyebrow="EDIÇÃO"
              title="Atualizar dados"
              description="Nome, telefone e endereço seguem o mesmo contrato validado pelo backend."
            />

            <AppField
              label="Nome"
              value={form.nome}
              onChangeText={(value) => {
                if (feedback) setFeedback("");
                setForm((current) => ({ ...current, nome: value }));
              }}
              placeholder="Seu nome completo"
            />
            <AppField
              label="Telefone"
              value={form.telefone}
              onChangeText={(value) => {
                if (feedback) setFeedback("");
                setForm((current) => ({ ...current, telefone: value }));
              }}
              placeholder="Telefone para contato"
            />
            <AppField
              label="Endereço"
              value={form.endereco}
              onChangeText={(value) => {
                if (feedback) setFeedback("");
                setForm((current) => ({ ...current, endereco: value }));
              }}
              placeholder="Endereço para coletas"
              multiline
            />

            <View style={styles.actions}>
              <AppButton
                label={saveProfileMutation.isPending ? "Salvando..." : "Salvar alterações"}
                onPress={() => saveProfileMutation.mutate()}
                disabled={saveProfileMutation.isPending}
              />
              <AppButton
                label="Abrir no mapa"
                tone="secondary"
                icon={MapPin}
                onPress={openInMaps}
              />
            </View>
          </AppCard>

          {profileQuery.data.company && (
            <AppCard>
              <SectionHeader
                eyebrow="EMPRESA"
                title="Vínculo empresarial"
                description="Dados exibidos quando a sua conta possui empresa associada."
              />
              <InfoRow label="CNPJ" value={profileQuery.data.company.cnpj} />
              <InfoRow
                label="Descrição"
                value={profileQuery.data.company.descricao ?? "Não informada"}
              />
              <InfoRow label="Cadastro da empresa" value={companyCreatedAtLabel} />
            </AppCard>
          )}
        </>
      )}

      <AppCard tone="subtle">
        <SectionHeader
          eyebrow="AÇÕES"
          title="Conta e sessão"
          description="Atualize os dados, recarregue o perfil ou encerre sua sessão no dispositivo."
        />
        <AppButton
          label="Atualizar perfil"
          tone="secondary"
          icon={RefreshCw}
          onPress={() => {
            setFeedback("");
            void profileQuery.refetch();
          }}
        />
        <AppButton
          label="Sair"
          tone="danger"
          icon={LogOut}
          onPress={async () => {
            await signOut();
            router.replace("/login");
          }}
        />
      </AppCard>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  heroTop: {
    flexDirection: "row",
    gap: spacing.lg,
    alignItems: "flex-start",
  },
  identityBadge: {
    width: 62,
    height: 62,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  identityInitial: {
    ...typography.sectionTitle,
    color: colors.white,
  },
  heroText: {
    flex: 1,
    gap: spacing.xs,
  },
  heroEyebrow: {
    ...typography.eyebrow,
    color: colors.accent,
  },
  heroName: {
    ...typography.title,
    color: colors.text,
    letterSpacing: -0.8,
  },
  heroSubtitle: {
    ...typography.body,
    color: colors.textSoft,
  },
  metaRow: {
    flexDirection: "row",
    gap: spacing.sm,
    flexWrap: "wrap",
    alignItems: "center",
  },
  metaChip: {
    backgroundColor: colors.primarySoft,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  metaChipText: {
    ...typography.meta,
    color: colors.primary,
    textTransform: "uppercase",
  },
  actions: {
    gap: spacing.sm,
  },
});
