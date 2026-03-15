"use client";
import { useRouter } from "next/navigation";
import { useTransition } from "@/components/ui/PageTransition";

interface Props {
  href: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
}

/**
 * Substitui <Link> nos botões de navegação principal.
 * Dispara o fade-out antes de mudar de rota.
 */
export function TransitionLink({ href, children, style, className }: Props) {
  const router = useRouter();
  const { startTransition } = useTransition();

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    startTransition(() => router.push(href));
  }

  return (
    <a href={href} onClick={handleClick} style={style} className={className}>
      {children}
    </a>
  );
}