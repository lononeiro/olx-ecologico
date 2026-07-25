import { Redirect } from "expo-router";
import { View } from "react-native";
import { useAuth } from "@/contexts/AuthContext";
import { getHomeRouteForRole } from "@/lib/navigation";
import { colors } from "@/theme/tokens";

export default function IndexScreen() {
  const { isLoading, user } = useAuth();

  // Enquanto restaura a sessão, evita piscar a tela de login.
  if (isLoading) {
    return <View style={{ flex: 1, backgroundColor: colors.canvas }} />;
  }

  // Logado: vai direto pro painel do perfil. Deslogado: abre no login moderno.
  if (user) {
    return <Redirect href={getHomeRouteForRole(user.role) as any} />;
  }

  return <Redirect href="/login" />;
}
