import type { Metadata } from "next";
import { Playfair_Display, DM_Sans } from "next/font/google";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { TransitionLink } from "@/components/ui/TransitionLink";

const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-display" });
const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-body" });

export const metadata: Metadata = {
  title: "Sobre o ECOnecta — Como funciona e como medimos o impacto",
  description:
    "Entenda a plataforma ECOnecta e a metodologia usada para estimar o impacto ambiental das coletas: CO₂ evitado, água e energia poupadas e árvores preservadas.",
};

const FATORES = [
  { material: "Metal / alumínio", co2: "8,0", agua: "15", energia: "9,0", arvores: "—" },
  { material: "Plástico", co2: "1,8", agua: "20", energia: "5,8", arvores: "—" },
  { material: "Papel / papelão", co2: "1,1", agua: "26", energia: "4,0", arvores: "0,017" },
  { material: "Vidro", co2: "0,3", agua: "2", energia: "0,6", arvores: "—" },
  { material: "Orgânico", co2: "0,5", agua: "0", energia: "0,2", arvores: "—" },
  { material: "Eletrônico", co2: "1,4", agua: "10", energia: "6,0", arvores: "—" },
  { material: "Óleo", co2: "3,0", agua: "25", energia: "2,0", arvores: "—" },
  { material: "Têxtil", co2: "3,6", agua: "100", energia: "2,0", arvores: "—" },
  { material: "Madeira", co2: "0,9", agua: "5", energia: "1,0", arvores: "0,008" },
  { material: "Borracha / pneu", co2: "2,5", agua: "8", energia: "3,0", arvores: "—" },
];

export default function SobrePage() {
  return (
    <main
      className={`${playfair.variable} ${dmSans.variable}`}
      style={{
        fontFamily: "var(--font-body)",
        background: "var(--landing-bg)",
        color: "var(--landing-text)",
        minHeight: "100vh",
        overflowX: "hidden",
      }}
    >
      <nav
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "1.4rem 2.5rem",
          borderBottom: "1px solid var(--landing-border)",
        }}
      >
        <TransitionLink
          href="/"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "1.6rem",
            color: "var(--landing-accent)",
            textDecoration: "none",
          }}
        >
          ♻ ECOnecta
        </TransitionLink>
        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          <ThemeToggle compact />
          <TransitionLink
            href="/login"
            style={{ color: "var(--landing-muted)", fontSize: "1rem", textDecoration: "none" }}
          >
            Entrar
          </TransitionLink>
        </div>
      </nav>

      <article style={{ maxWidth: 820, margin: "0 auto", padding: "4rem 1.5rem 6rem" }}>
        <p
          style={{
            color: "var(--landing-accent)",
            fontSize: ".8rem",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "2px",
          }}
        >
          Sobre a plataforma
        </p>
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(2.2rem, 5vw, 3.4rem)",
            fontWeight: 700,
            lineHeight: 1.15,
            margin: ".6rem 0 1.2rem",
          }}
        >
          Reciclar com impacto que dá pra medir.
        </h1>
        <p style={{ color: "var(--landing-muted)", fontSize: "1.1rem", lineHeight: 1.7, maxWidth: 640 }}>
          O ECOnecta conecta cidadãos a empresas de reciclagem: você solicita uma coleta,
          acompanha o andamento e conversa com a empresa. Além de facilitar a logística,
          a plataforma <strong>estima o impacto ambiental</strong> de cada coleta concluída — e
          aqui explicamos exatamente como esse número é calculado.
        </p>

        <Section title="Como funciona" eyebrow="Fluxo">
          <ol style={{ paddingLeft: "1.1rem", display: "grid", gap: ".6rem", color: "var(--landing-muted)", lineHeight: 1.7 }}>
            <li><strong style={{ color: "var(--landing-text)" }}>Solicite a coleta.</strong> Informe o material, a quantidade e o endereço.</li>
            <li><strong style={{ color: "var(--landing-text)" }}>Uma empresa aceita.</strong> Empresas parceiras visualizam e assumem a coleta.</li>
            <li><strong style={{ color: "var(--landing-text)" }}>Acompanhe até concluir.</strong> Status em tempo real e chat com a empresa.</li>
          </ol>
        </Section>

        <div id="impacto" style={{ scrollMarginTop: "2rem" }} />
        <Section title="Como calculamos o impacto ambiental" eyebrow="Metodologia">
          <p style={paragraph}>
            O impacto de cada coleta segue uma conta simples:
          </p>
          <div
            style={{
              margin: "1rem 0",
              padding: "1rem 1.2rem",
              borderRadius: 14,
              background: "rgba(47,141,71,.08)",
              border: "1px solid rgba(47,141,71,.22)",
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
              fontSize: ".95rem",
              color: "var(--landing-text)",
            }}
          >
            impacto = peso (kg) × fator do material
          </div>
          <p style={paragraph}>
            Somamos esse impacto de todas as coletas concluídas para chegar aos totais de
            <strong> CO₂ evitado, água e energia poupadas e árvores preservadas</strong> que
            aparecem no seu painel.
          </p>
        </Section>

        <Section title="De onde vem o peso" eyebrow="Modelo híbrido">
          <p style={paragraph}>
            Obter o peso em quilos é a parte mais delicada. Por isso usamos um modelo híbrido:
          </p>
          <ul style={{ display: "grid", gap: ".75rem", margin: "1rem 0", listStyle: "none", padding: 0 }}>
            <li style={bullet}>
              <span style={badgeOk}>Informado</span>
              <span style={{ color: "var(--landing-muted)", lineHeight: 1.6 }}>
                Quando você preenche o campo opcional <strong>“Peso aproximado”</strong> no cadastro,
                usamos esse valor diretamente. É a fonte mais confiável.
              </span>
            </li>
            <li style={bullet}>
              <span style={badgeEst}>Estimado</span>
              <span style={{ color: "var(--landing-muted)", lineHeight: 1.6 }}>
                Quando o peso não é informado, estimamos a partir do texto da quantidade
                (ex.: “50&nbsp;kg”, “10&nbsp;sacos”, “3&nbsp;caixas”), com regras fixas de conversão.
              </span>
            </li>
          </ul>
          <p style={paragraph}>
            Para deixar tudo transparente, o painel mostra <strong>quantas coletas têm peso informado
            versus estimado</strong>. Assim fica claro quanto do número vem de dado declarado e
            quanto vem de estimativa.
          </p>
        </Section>

        <Section title="Fatores por material" eyebrow="Referência">
          <p style={paragraph}>
            Cada material tem fatores próprios, por quilo reciclado. Metais, por exemplo, evitam
            muito mais CO₂ e energia do que o vidro, porque produzir alumínio a partir da matéria
            virgem é bem mais intensivo.
          </p>
          <div style={{ overflowX: "auto", margin: "1.2rem 0" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 520, fontSize: ".9rem" }}>
              <thead>
                <tr style={{ textAlign: "left", color: "var(--landing-soft)", fontSize: ".75rem", textTransform: "uppercase", letterSpacing: "1px" }}>
                  <th style={th}>Material</th>
                  <th style={th}>CO₂ (kg/kg)</th>
                  <th style={th}>Água (L/kg)</th>
                  <th style={th}>Energia (kWh/kg)</th>
                  <th style={th}>Árvores (por kg)</th>
                </tr>
              </thead>
              <tbody>
                {FATORES.map((f) => (
                  <tr key={f.material} style={{ borderTop: "1px solid var(--landing-border)" }}>
                    <td style={{ ...td, fontWeight: 600, color: "var(--landing-text)" }}>{f.material}</td>
                    <td style={td}>{f.co2}</td>
                    <td style={td}>{f.agua}</td>
                    <td style={td}>{f.energia}</td>
                    <td style={td}>{f.arvores}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p style={{ ...paragraph, fontSize: ".85rem", color: "var(--landing-soft)" }}>
            Os fatores são médias consolidadas a partir das referências abaixo, adaptadas para a
            unidade “por kg” e arredondadas. Comunicam a ordem de grandeza do impacto — não
            substituem uma contabilidade oficial de carbono.
          </p>
        </Section>

        <Section title="Fontes e referências" eyebrow="Base científica">
          <ul style={{ display: "grid", gap: ".8rem", listStyle: "none", padding: 0, margin: 0 }}>
            <Fonte
              titulo="CO₂ evitado por material"
              detalhe="Bureau of International Recycling (BIR), “Report on the Environmental Benefits of Recycling”, e U.S. EPA — WARM (Waste Reduction Model)."
              links={[
                { label: "bir.org", href: "https://www.bir.org" },
                { label: "epa.gov/warm", href: "https://www.epa.gov/warm" },
              ]}
            />
            <Fonte
              titulo="Energia e água poupadas"
              detalhe="The Aluminum Association (reciclar alumínio economiza ~95% da energia da produção primária) e estatísticas setoriais de reciclagem de papel (~26 mil L e ~4.100 kWh por tonelada)."
              links={[{ label: "aluminum.org", href: "https://www.aluminum.org" }]}
            />
            <Fonte
              titulo="Árvores preservadas"
              detalhe="Estimativa clássica de que reciclar 1 tonelada de papel evita o corte de cerca de 17 árvores."
              links={[]}
            />
            <Fonte
              titulo="Contexto brasileiro"
              detalhe="CEMPRE — Compromisso Empresarial para Reciclagem (CEMPRE Review e fichas por material) e dados de resíduos sólidos do Ministério do Meio Ambiente / SNIS."
              links={[{ label: "cempre.org.br", href: "https://cempre.org.br" }]}
            />
          </ul>
        </Section>

        <Section title="Limites e honestidade" eyebrow="Transparência">
          <ul style={{ display: "grid", gap: ".5rem", color: "var(--landing-muted)", lineHeight: 1.7, paddingLeft: "1.1rem" }}>
            <li>A estimativa por texto usa pesos médios para “sacos/caixas”, então é aproximada.</li>
            <li>Os fatores são médias e variam com tecnologia, logística e origem do material.</li>
            <li>Os valores representam <strong>impacto estimado</strong>, não uma medição auditada.</li>
          </ul>
          <p style={{ ...paragraph, marginTop: "1rem" }}>
            É por isso que incentivamos informar o peso: quanto mais coletas com peso declarado,
            mais preciso fica o seu impacto.
          </p>
        </Section>

        <div
          style={{
            marginTop: "3rem",
            padding: "1.6rem 1.8rem",
            borderRadius: 20,
            background: "var(--landing-panel)",
            border: "1px solid var(--landing-border)",
            display: "flex",
            gap: "1rem",
            alignItems: "center",
            flexWrap: "wrap",
            justifyContent: "space-between",
          }}
        >
          <div>
            <p style={{ fontFamily: "var(--font-display)", fontSize: "1.3rem", color: "var(--landing-text)" }}>
              Pronto para reciclar com impacto?
            </p>
            <p style={{ color: "var(--landing-muted)", fontSize: ".95rem", marginTop: ".3rem" }}>
              Crie sua conta e solicite sua primeira coleta.
            </p>
          </div>
          <TransitionLink
            href="/register"
            style={{
              background: "linear-gradient(135deg, var(--landing-accent), var(--landing-accent-2))",
              color: "#fff",
              fontWeight: 700,
              padding: ".8rem 1.8rem",
              borderRadius: "50px",
              textDecoration: "none",
              whiteSpace: "nowrap",
            }}
          >
            Criar conta grátis →
          </TransitionLink>
        </div>
      </article>

      <footer
        style={{
          borderTop: "1px solid var(--landing-border)",
          padding: "1.8rem 2.5rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <TransitionLink href="/" style={{ fontFamily: "var(--font-display)", color: "var(--landing-soft)", fontSize: "1rem", textDecoration: "none" }}>
          ♻ ECOnecta
        </TransitionLink>
        <span style={{ color: "var(--landing-soft)", fontSize: ".8rem" }}>
          Feito com 💚 para um planeta mais sustentável
        </span>
      </footer>
    </main>
  );
}

const paragraph: React.CSSProperties = {
  color: "var(--landing-muted)",
  fontSize: "1rem",
  lineHeight: 1.75,
};

const th: React.CSSProperties = { padding: ".6rem .7rem", fontWeight: 700 };
const td: React.CSSProperties = { padding: ".65rem .7rem", color: "var(--landing-muted)", whiteSpace: "nowrap" };

const bullet: React.CSSProperties = {
  display: "flex",
  gap: ".8rem",
  alignItems: "flex-start",
};

const badgeBase: React.CSSProperties = {
  flexShrink: 0,
  fontSize: ".72rem",
  fontWeight: 700,
  padding: ".25rem .7rem",
  borderRadius: "50px",
  textTransform: "uppercase",
  letterSpacing: ".5px",
  marginTop: ".1rem",
};
const badgeOk: React.CSSProperties = {
  ...badgeBase,
  background: "rgba(47,141,71,.14)",
  color: "var(--landing-accent)",
  border: "1px solid rgba(47,141,71,.3)",
};
const badgeEst: React.CSSProperties = {
  ...badgeBase,
  background: "rgba(180,121,31,.14)",
  color: "#B4791F",
  border: "1px solid rgba(180,121,31,.3)",
};

function Fonte({
  titulo,
  detalhe,
  links,
}: {
  titulo: string;
  detalhe: string;
  links: { label: string; href: string }[];
}) {
  return (
    <li
      style={{
        padding: "1rem 1.2rem",
        borderRadius: 14,
        background: "var(--landing-panel)",
        border: "1px solid var(--landing-border)",
      }}
    >
      <p style={{ fontWeight: 700, color: "var(--landing-text)", fontSize: ".95rem" }}>{titulo}</p>
      <p style={{ color: "var(--landing-muted)", fontSize: ".88rem", lineHeight: 1.6, marginTop: ".3rem" }}>
        {detalhe}
      </p>
      {links.length > 0 && (
        <div style={{ display: "flex", gap: ".8rem", flexWrap: "wrap", marginTop: ".5rem" }}>
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "var(--landing-accent)", fontSize: ".82rem", fontWeight: 600, textDecoration: "none" }}
            >
              {link.label} ↗
            </a>
          ))}
        </div>
      )}
    </li>
  );
}

function Section({ title, eyebrow, children }: { title: string; eyebrow: string; children: React.ReactNode }) {
  return (
    <section style={{ marginTop: "3rem" }}>
      <p
        style={{
          color: "var(--landing-accent)",
          fontSize: ".75rem",
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "1.6px",
          marginBottom: ".5rem",
        }}
      >
        {eyebrow}
      </p>
      <h2
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "clamp(1.5rem, 3vw, 2rem)",
          fontWeight: 700,
          marginBottom: "1rem",
          lineHeight: 1.2,
        }}
      >
        {title}
      </h2>
      {children}
    </section>
  );
}
