"use client";

import { useState } from "react";

interface RatingStarsProps {
  mode: "input" | "display";
  value?: number;
  onChange?: (nota: number) => void;
  size?: number;
}

export function RatingStars({ mode, value = 0, onChange, size = 24 }: RatingStarsProps) {
  const [hovered, setHovered] = useState(0);

  if (mode === "display") {
    return (
      <div style={{ display: "flex", gap: 2 }} aria-label={`Avaliação: ${value} de 5`}>
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill={star <= Math.round(value) ? "var(--yellow, #facc15)" : "none"}
            stroke={star <= Math.round(value) ? "var(--yellow, #facc15)" : "var(--border)"}
            strokeWidth="1.5"
          >
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        ))}
      </div>
    );
  }

  const active = hovered || value;

  return (
    <div style={{ display: "flex", gap: 4 }} role="group" aria-label="Selecionar avaliação">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          aria-label={`${star} estrela${star > 1 ? "s" : ""}`}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange?.(star)}
          style={{ background: "none", border: "none", padding: 2, cursor: "pointer", lineHeight: 0 }}
        >
          <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill={star <= active ? "var(--yellow, #facc15)" : "none"}
            stroke={star <= active ? "var(--yellow, #facc15)" : "var(--border)"}
            strokeWidth="1.5"
            style={{ transition: "fill .1s, stroke .1s" }}
          >
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        </button>
      ))}
    </div>
  );
}
