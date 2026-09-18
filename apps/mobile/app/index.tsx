import { useEffect, useState } from "react";
import { Redirect } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import { getHomeRouteForRole } from "@/lib/navigation";
import { IntroScreen } from "@/components/IntroScreen";

// Duração mínima da intro, mesmo que a sessão já tenha restaurado antes
// disso — evita um "flash" da animação que mal dá tempo de aparecer.
const INTRO_MIN_MS = 1400;

export default function IndexScreen() {
  const { isLoading, user } = useAuth();
  const [introElapsed, setIntroElapsed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIntroElapsed(true), INTRO_MIN_MS);
    return () => clearTimeout(timer);
  }, []);

  // Mostra a intro enquanto restaura a sessão E até o tempo mínimo passar.
  if (isLoading || !introElapsed) {
    return <IntroScreen />;
  }

  // Logado: vai direto pro painel do perfil. Deslogado: abre no login moderno.
  if (user) {
    return <Redirect href={getHomeRouteForRole(user.role) as any} />;
  }

  return <Redirect href="/login" />;
}
