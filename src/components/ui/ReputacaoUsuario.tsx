import { RatingStars } from "@/components/ui/RatingStars";

interface Props {
  media: number;
  total: number;
  starSize?: number;
  /** Texto quando ainda não há avaliações. */
  vazioLabel?: string;
}

/**
 * Exibe a reputação (média + nº de avaliações) que um cidadão recebeu das
 * empresas. Usado no perfil e nas telas de aceite (antes da empresa aceitar).
 */
export function ReputacaoUsuario({ media, total, starSize = 14, vazioLabel = "Sem avaliações ainda" }: Props) {
  if (total <= 0) {
    return (
      <span style={{ fontSize: ".8rem", color: "var(--text-faint)", fontWeight: 500 }}>
        {vazioLabel}
      </span>
    );
  }

  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
      <RatingStars mode="display" value={media} size={starSize} />
      <strong style={{ fontSize: ".85rem", color: "var(--text)", fontWeight: 700 }}>
        {media.toFixed(1)}
      </strong>
      <span style={{ fontSize: ".78rem", color: "var(--text-faint)" }}>
        ({total} {total === 1 ? "avaliação" : "avaliações"})
      </span>
    </span>
  );
}
