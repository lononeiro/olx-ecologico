import type { LucideIcon } from "lucide-react-native";
import { colors } from "@/theme/tokens";

export function Icon({
  icon: LucideIconComponent,
  size = 20,
  color = colors.textSoft,
  strokeWidth = 1.75,
}: {
  icon: LucideIcon;
  size?: number;
  color?: string;
  strokeWidth?: number;
}) {
  return (
    <LucideIconComponent size={size} color={color} strokeWidth={strokeWidth} />
  );
}

export type { LucideIcon };
