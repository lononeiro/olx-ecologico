import { useEffect } from "react";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "@/contexts/AuthContext";
import { getMyProfile } from "@/lib/api";

export default function MeScreen() {
  const { accessToken, isLoading, refreshSession, signOut, user } = useAuth();

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
        throw new Error("Sessao indisponivel");
      }

      try {
        return await getMyProfile(token);
      } catch (error) {
        const refreshedToken = await refreshSession();
        if (!refreshedToken) throw error;
        return getMyProfile(refreshedToken);
      }
    },
  });

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
            Esta tela consome o endpoint protegido `/api/users/me` usando o token salvo no dispositivo.
          </Text>
        </View>

        {profileQuery.isLoading && (
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
            <Text style={{ color: "#537156" }}>Carregando perfil...</Text>
          </View>
        )}

        {profileQuery.error && (
          <View
            style={{
              backgroundColor: "#fff1f1",
              borderRadius: 20,
              padding: 20,
              borderWidth: 1,
              borderColor: "#f2b8b5",
            }}
          >
            <Text style={{ color: "#9f3029", fontWeight: "700" }}>Nao foi possivel carregar o perfil.</Text>
            <Text style={{ color: "#9f3029", marginTop: 6 }}>
              {(profileQuery.error as Error).message}
            </Text>
          </View>
        )}

        {profileQuery.data && (
          <View style={{ gap: 16 }}>
            <InfoCard label="Nome" value={profileQuery.data.nome} />
            <InfoCard label="Email" value={profileQuery.data.email} />
            <InfoCard label="Role" value={profileQuery.data.role.nome} />
            <InfoCard label="Telefone" value={profileQuery.data.telefone ?? "Nao informado"} />
            <InfoCard label="Endereco" value={profileQuery.data.endereco ?? "Nao informado"} />
            <InfoCard label="Status" value={profileQuery.data.status} />
            {profileQuery.data.company && (
              <InfoCard
                label="Empresa"
                value={`${profileQuery.data.company.cnpj} · ${profileQuery.data.company.descricao ?? "Sem descricao"}`}
              />
            )}
          </View>
        )}

        <TouchableOpacity
          onPress={() => profileQuery.refetch()}
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
