import type { ReactNode } from "react";
import Link from "next/link";
import { formatarNumeroImpacto, formatarPeso, type ImpactoResumo } from "@/lib/impacto";

interface Props {
  resumo: ImpactoResumo;
  titulo?: string;
  descricao?: string;
}

/**
 * Card de impacto ambiental estimado, reutilizado nos painéis do cidadão e da
 * empresa. Recebe um ImpactoResumo já calculado (ver src/lib/impacto.ts).
 */
export function ImpactoAmbiental({
  resumo,
  titulo = "Seu impacto ambiental",
  descricao = "Estimativa a partir das coletas concluídas",
}: Props) {
  const peso = formatarPeso(resumo.kg);
  const semDados = resumo.kg <= 0;

  return (
    <section className="surface-card" aria-label="Impacto ambiental">
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div>
          <p className="section-label" style={{ marginBottom: 6 }}>Impacto ambiental</p>
          <h2 className="page-section-title">{titulo}</h2>
          <p className="page-section-description">
            {descricao} ·{" "}
            <Link href="/sobre#impacto" style={{ color: "var(--green-mid, #2F8D47)", fontWeight: 600 }}>
              Como calculamos?
            </Link>
          </p>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 6, justifyContent: "flex-end" }}>
            <strong style={{ fontSize: 30, fontWeight: 800, color: "var(--green-mid, #2F8D47)", lineHeight: 1 }}>{peso.valor}</strong>
            <span style={{ fontSize: 15, fontWeight: 700, color: "var(--text-muted)" }}>{peso.unidade}</span>
          </div>
          <p style={{ fontSize: 12, color: "var(--text-faint)", marginTop: 4 }}>reciclados (estimado)</p>
        </div>
      </div>

      {semDados ? (
        <p style={{ fontSize: 13, color: "var(--text-faint)", marginTop: 16 }}>
          As coletas concluídas ainda não têm quantidade estimável em peso. O impacto aparece aqui conforme as coletas forem finalizadas.
        </p>
      ) : (
        <div
          style={{
            marginTop: 20,
            display: "grid",
            gap: 12,
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
          }}
        >
          <ImpactoTile
            accent="#2F8D47"
            bg="rgba(47,141,71,.1)"
            icon={<IconCloud />}
            valor={formatarNumeroImpacto(resumo.co2)}
            unidade="kg"
            label="CO₂ evitado"
          />
          <ImpactoTile
            accent="#1D6FA8"
            bg="rgba(29,111,168,.1)"
            icon={<IconDrop />}
            valor={formatarNumeroImpacto(resumo.agua)}
            unidade="L"
            label="Água poupada"
          />
          <ImpactoTile
            accent="#B4791F"
            bg="rgba(180,121,31,.12)"
            icon={<IconBolt />}
            valor={formatarNumeroImpacto(resumo.energia)}
            unidade="kWh"
            label="Energia poupada"
          />
          <ImpactoTile
            accent="#2F8D47"
            bg="rgba(47,141,71,.1)"
            icon={<IconTree />}
            valor={resumo.arvores >= 1 ? Math.round(resumo.arvores).toLocaleString("pt-BR") : resumo.arvores.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}
            unidade={Math.round(resumo.arvores) === 1 ? "árvore" : "árvores"}
            label="Preservadas (equiv.)"
          />
        </div>
      )}

      <p style={{ fontSize: 11, color: "var(--text-faint)", marginTop: 16 }}>
        {resumo.informados > 0
          ? `${resumo.informados} de ${resumo.coletas} ${resumo.coletas === 1 ? "coleta com" : "coletas com"} peso informado; as demais são estimadas do texto. `
          : ""}
        Valores calculados com fatores médios de reciclagem, para fins de comunicação de impacto.
      </p>
    </section>
  );
}

function ImpactoTile({
  accent,
  bg,
  icon,
  valor,
  unidade,
  label,
}: {
  accent: string;
  bg: string;
  icon: ReactNode;
  valor: string;
  unidade: string;
  label: string;
}) {
  return (
    <div
      style={{
        borderRadius: 16,
        border: "1px solid var(--border)",
        background: "var(--surface)",
        padding: 16,
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      <span
        style={{
          width: 38,
          height: 38,
          borderRadius: 12,
          background: bg,
          color: accent,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {icon}
      </span>
      <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
        <strong style={{ fontSize: 22, fontWeight: 800, color: "var(--text)", lineHeight: 1 }}>{valor}</strong>
        <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)" }}>{unidade}</span>
      </div>
      <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{label}</span>
    </div>
  );
}

function IconCloud() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17.5 19a4.5 4.5 0 0 0 0-9 6 6 0 0 0-11.5 1.5A3.5 3.5 0 0 0 6 19Z" />
    </svg>
  );
}
function IconDrop() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2.5S5.5 9 5.5 14a6.5 6.5 0 0 0 13 0C18.5 9 12 2.5 12 2.5Z" />
    </svg>
  );
}
function IconBolt() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M13 2 4 14h7l-1 8 9-12h-7Z" />
    </svg>
  );
}
function IconTree() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2 6 11h3l-4 6h5v5h4v-5h5l-4-6h3Z" />
    </svg>
  );
}
