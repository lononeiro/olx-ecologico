import { Home, ClipboardList, Truck, MessageCircle, User } from "lucide-react-native";
import type { TabItem } from "@/components/ui/BottomNavigation";

export const USUARIO_TABS: TabItem[] = [
  { key: "home", label: "Início", icon: Home, route: "/home" },
  { key: "solicitacoes", label: "Solicitações", icon: ClipboardList, route: "/solicitacoes" },
  { key: "mensagens", label: "Mensagens", icon: MessageCircle, route: "/mensagens" },
  { key: "me", label: "Perfil", icon: User, route: "/me" },
];

export const EMPRESA_TABS: TabItem[] = [
  { key: "home", label: "Início", icon: Home, route: "/empresa" },
  { key: "solicitacoes", label: "Solicitações", icon: ClipboardList, route: "/empresa/solicitacoes" },
  { key: "coletas", label: "Coletas", icon: Truck, route: "/empresa/coletas" },
  { key: "mensagens", label: "Mensagens", icon: MessageCircle, route: "/empresa/mensagens" },
  { key: "me", label: "Perfil", icon: User, route: "/me" },
];
