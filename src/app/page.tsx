import { Playfair_Display, DM_Sans } from "next/font/google";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { TransitionLink } from "@/components/ui/TransitionLink";

const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-display" });
const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-body" });

export default function Home() {
  return (
    <main
      className={`${playfair.variable} ${dmSans.variable}`}
      style={{
        fontFamily: "var(--font-body)",
        background: "var(--landing-bg)",
        minHeight: "100vh",
        overflowX: "hidden",
      }}
    >
      <style>{`
        html {
          scroll-behavior: smooth;
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(32px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes floatLeaf {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50%       { transform: translateY(-18px) rotate(4deg); }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes marquee {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        .anim-1 { animation: fadeUp .8s ease both .1s; }
        .anim-2 { animation: fadeUp .8s ease both .3s; }
        .anim-3 { animation: fadeUp .8s ease both .5s; }
        .anim-4 { animation: fadeUp .8s ease both .7s; }
        .leaf   { animation: floatLeaf 6s ease-in-out infinite; }
        .leaf2  { animation: floatLeaf 8s ease-in-out infinite .5s; }
        .leaf3  { animation: floatLeaf 7s ease-in-out infinite 1s; }
        .spin   { animation: spin-slow 18s linear infinite; }
        .marquee-track { animation: marquee 22s linear infinite; }
        .btn-glow:hover { transition: box-shadow 0.3s ease; box-shadow: 0 0 40px rgba(47,141,71,.28); }
        .card-hover { transition: transform .3s ease, box-shadow .3s ease; }
        .card-hover:hover { transform: translateY(-6px); box-shadow: 0 24px 60px rgba(0,0,0,.18); }
        .underline-green {
          background: linear-gradient(90deg, var(--landing-accent), var(--landing-accent-2));
          background-repeat: no-repeat;
          background-size: 100% 3px;
          background-position: 0 100%;
        }
      `}</style>

      <nav
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "1.4rem 2.5rem",
          borderBottom: "1px solid var(--landing-border)",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "2rem",
            color: "var(--landing-accent)",
            letterSpacing: ".5px",
          }}
        >
          ♻ ECOnecta
        </span>
        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          <ThemeToggle compact />
          <TransitionLink
            href="/login"
            style={{ color: "var(--landing-muted)", fontSize: "1rem", textDecoration: "none" }}
          >
            Entrar
          </TransitionLink>

          <TransitionLink
            href="/register"
            className="btn-glow"
            style={{
              background: "rgba(47,141,71,.12)",
              border: "1px solid rgba(47,141,71,.34)",
              color: "var(--landing-accent)",
              padding: ".45rem 1.1rem",
              borderRadius: "50px",
              fontSize: "1rem",
              textDecoration: "none",
            }}
          >
            Criar conta
          </TransitionLink>
        </div>
      </nav>

      <section
        style={{
          position: "relative",
          padding: "6rem 2.5rem 5rem",
          maxWidth: "1100px",
          margin: "0 auto",
        }}
      >
        <span
          className="leaf"
          style={{
            position: "absolute",
            top: "4rem",
            right: "6rem",
            fontSize: "5rem",
            opacity: 0.12,
            userSelect: "none",
          }}
        >
          🌿
        </span>
        <span
          className="leaf2"
          style={{
            position: "absolute",
            top: "12rem",
            right: "2rem",
            fontSize: "3.5rem",
            opacity: 0.08,
            userSelect: "none",
          }}
        >
          🍃
        </span>
        <span
          className="leaf3"
          style={{
            position: "absolute",
            top: "2rem",
            left: "62%",
            fontSize: "2.5rem",
            opacity: 0.1,
            userSelect: "none",
          }}
        >
          ♻
        </span>

        <div
          className="anim-1"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: ".5rem",
            background: "rgba(47,141,71,.1)",
            border: "1px solid rgba(47,141,71,.28)",
            borderRadius: "50px",
            padding: ".35rem 1rem .35rem .5rem",
            marginBottom: "2rem",
          }}
        >
          <span
            style={{
              background: "var(--landing-accent)",
              borderRadius: "50px",
              padding: ".15rem .55rem",
              fontSize: ".7rem",
              fontWeight: 700,
              color: "#fff",
              textTransform: "uppercase",
              letterSpacing: "1px",
            }}
          >
            Novo
          </span>
          <span style={{ color: "var(--landing-accent)", fontSize: ".82rem" }}>
            Plataforma de coleta inteligente
          </span>
        </div>

        <h1
          className="anim-2"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(2.8rem, 6vw, 5.2rem)",
            lineHeight: 1.1,
            color: "var(--landing-text)",
            fontWeight: 700,
            maxWidth: "720px",
            marginBottom: "1.8rem",
          }}
        >
          Reciclar ficou <span className="underline-green">simples</span> de verdade.
        </h1>

        <p
          className="anim-3"
          style={{
            color: "var(--landing-muted)",
            fontSize: "clamp(1rem, 2vw, 1.2rem)",
            maxWidth: "540px",
            lineHeight: 1.7,
            marginBottom: "3rem",
          }}
        >
          Conectamos cidadãos a empresas de reciclagem. Solicite uma coleta em minutos,
          acompanhe tudo em tempo real e faça sua parte pelo planeta.
        </p>

        <div className="anim-4" style={{ display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "center" }}>
          <TransitionLink
            href="/login"
            className="btn-glow"
            style={{
              background: "linear-gradient(135deg, var(--landing-accent), var(--landing-accent-2))",
              color: "#fff",
              fontWeight: 700,
              fontSize: "1.05rem",
              padding: ".85rem 2.2rem",
              borderRadius: "50px",
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: ".5rem",
              transition: "box-shadow .25s",
            }}
          >
            Comece agora →
          </TransitionLink>
          <a href="#como-funciona" style={{ color: "var(--landing-muted)", fontSize: ".95rem", textDecoration: "none" }}>
            Como funciona ↓
          </a>
        </div>

        <div
          className="anim-4"
          style={{
            display: "flex",
            gap: "3rem",
            marginTop: "5rem",
            paddingTop: "2.5rem",
            borderTop: "1px solid var(--landing-border)",
            flexWrap: "wrap",
          }}
        >
          {[
            { n: "3", label: "Tipos de usuário" },
            { n: "10+", label: "Materiais aceitos" },
            { n: "100%", label: "Gratuito para usar" },
          ].map((s) => (
            <div key={s.label}>
              <div
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "2.2rem",
                  color: "var(--landing-accent)",
                  fontWeight: 700,
                }}
              >
                {s.n}
              </div>
              <div style={{ color: "var(--landing-soft)", fontSize: ".85rem", marginTop: ".15rem" }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      <div
        style={{
          borderTop: "1px solid var(--landing-border)",
          borderBottom: "1px solid var(--landing-border)",
          padding: "1rem 0",
          overflow: "hidden",
          background: "rgba(47,141,71,.04)",
        }}
      >
        <div
          className="marquee-track"
          style={{
            display: "flex",
            gap: "3rem",
            whiteSpace: "nowrap",
            width: "max-content",
          }}
        >
          {Array(4)
            .fill(["♻", "♻", "♻", "♻", "♻", "♻", "♻", "♻", "♻", "♻", "♻", "♻", "♻"])
            .flat()
            .map((item, i) => (
              <span key={i} style={{ color: "var(--landing-soft)", fontSize: ".85rem", fontWeight: 500 }}>
                {item}
              </span>
            ))}
        </div>
      </div>

      <section
        id="como-funciona"
        style={{
          padding: "7rem 2.5rem",
          maxWidth: "1100px",
          margin: "0 auto",
        }}
      >
        <div style={{ marginBottom: "4rem" }}>
          <span
            style={{
              color: "var(--landing-accent)",
              fontSize: ".8rem",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "2px",
            }}
          >
            Como funciona
          </span>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(2rem, 4vw, 3rem)",
              color: "var(--landing-text)",
              marginTop: ".6rem",
              fontWeight: 700,
            }}
          >
            Três passos. Um planeta melhor.
          </h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.5rem" }}>
          {[
            {
              num: "01",
              icon: "📦",
              title: "Solicite a coleta",
              desc: "Crie uma solicitação com tipo de material, quantidade e endereço. Nossa equipe revisa e aprova em até 24h.",
              color: "rgba(47,141,71,.09)",
              accent: "var(--landing-accent)",
            },
            {
              num: "02",
              icon: "🏭",
              title: "Empresa aceita",
              desc: "Empresas parceiras visualizam sua solicitação e aceitam a coleta. Você recebe um código de confirmação.",
              color: "rgba(29,111,168,.09)",
              accent: "var(--blue)",
            },
            {
              num: "03",
              icon: "🚛",
              title: "Coleta realizada",
              desc: "Acompanhe o status em tempo real — 'A caminho', 'Em coleta', 'Concluída'. Troque mensagens com a empresa.",
              color: "rgba(107,63,168,.09)",
              accent: "var(--purple)",
            },
          ].map((step) => (
            <div
              key={step.num}
              className="card-hover"
              style={{
                background: step.color,
                border: `1px solid ${step.accent}22`,
                borderRadius: "20px",
                padding: "2.2rem",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: "1.5rem",
                  right: "1.5rem",
                  fontFamily: "var(--font-display)",
                  fontSize: "4rem",
                  fontWeight: 700,
                  color: `${step.accent}18`,
                  lineHeight: 1,
                }}
              >
                {step.num}
              </div>
              <div style={{ fontSize: "2.2rem", marginBottom: "1.2rem" }}>{step.icon}</div>
              <h3
                style={{
                  fontFamily: "var(--font-display)",
                  color: step.accent,
                  fontSize: "1.3rem",
                  marginBottom: ".8rem",
                  fontWeight: 700,
                }}
              >
                {step.title}
              </h3>
              <p style={{ color: "var(--landing-muted)", fontSize: ".92rem", lineHeight: 1.7 }}>{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section style={{ padding: "4rem 2.5rem 7rem", maxWidth: "1100px", margin: "0 auto" }}>
        <div style={{ marginBottom: "3.5rem" }}>
          <span
            style={{
              color: "var(--landing-accent)",
              fontSize: ".8rem",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "2px",
            }}
          >
            Quem usa
          </span>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(2rem, 4vw, 3rem)",
              color: "var(--landing-text)",
              marginTop: ".6rem",
              fontWeight: 700,
            }}
          >
            Uma plataforma, dois papéis.
          </h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "1.5rem"}}>
          {[
            {
              role: "Cidadão",
              items: ["Crie solicitações de coleta", "Envie fotos dos materiais", "Acompanhe o status", "Chat com a empresa"],
              cta: "Criar conta grátis",
              href: "/register",
            },
            {
              role: "Empresa",
              items: ["Veja coletas disponíveis", "Aceite solicitações", "Atualize o status", "Comunique-se com usuários"],
              cta: "Cadastrar empresa",
              href: "/login",
            },
          ].map((r) => (
            <div
              key={r.role}
              className="card-hover"
              style={{
                background: "var(--landing-panel)",
                border: "1px solid var(--landing-border)",
                borderRadius: "20px",
                padding: "2rem",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div style={{ fontSize: "2rem", marginBottom: ".8rem" }} />
              <h3
                style={{
                  fontFamily: "var(--font-display)",
                  color: "var(--landing-text)",
                  fontSize: "1.4rem",
                  marginBottom: "1.2rem",
                }}
              >
                {r.role}
              </h3>
              <ul
                style={{
                  listStyle: "none",
                  padding: 0,
                  margin: "0 0 2rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: ".6rem",
                  flex: 1,
                }}
              >
                {r.items.map((item) => (
                  <li
                    key={item}
                    style={{
                      color: "var(--landing-muted)",
                      fontSize: ".88rem",
                      display: "flex",
                      alignItems: "center",
                      gap: ".6rem",
                    }}
                  >
                    <span style={{ color: "var(--landing-accent)", fontSize: ".7rem" }}>◆</span>
                    {item}
                  </li>
                ))}
              </ul>
              <TransitionLink
                href={r.href}
                style={{
                  textAlign: "center",
                  border: "1px solid rgba(47,141,71,.3)",
                  color: "var(--landing-accent)",
                  padding: ".6rem 1rem",
                  borderRadius: "50px",
                  fontSize: ".85rem",
                  textDecoration: "none",
                  display: "block",
                }}
              >
                {r.cta}
              </TransitionLink>
            </div>
          ))}
        </div>
      </section>

      <section
        style={{
          padding: "6rem 2.5rem",
          textAlign: "center",
          background: "linear-gradient(180deg, var(--landing-bg) 0%, var(--landing-panel-2) 100%)",
          borderTop: "1px solid var(--landing-border)",
        }}
      >
        <div style={{ position: "relative", display: "inline-block", marginBottom: "2rem" }}>
          <div
            className="spin"
            style={{
              width: "80px",
              height: "80px",
              border: "2px solid rgba(47,141,71,.2)",
              borderTopColor: "var(--landing-accent)",
              borderRadius: "50%",
              margin: "0 auto",
            }}
          />
          <span
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.8rem",
              color: "var(--landing-accent)",
            }}
          >
            ♻
          </span>
        </div>
        <h2
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(2rem, 5vw, 3.8rem)",
            color: "var(--landing-text)",
            fontWeight: 700,
            marginBottom: "1.2rem",
            lineHeight: 1.15,
          }}
        >
          Pronto para começar?
        </h2>
        <p
          style={{
            color: "var(--landing-muted)",
            fontSize: "1.1rem",
            maxWidth: "480px",
            margin: "0 auto 2.5rem",
            lineHeight: 1.7,
          }}
        >
          Crie sua conta em menos de 1 minuto e solicite sua primeira coleta hoje mesmo.
        </p>
        <TransitionLink
          href="/login"
          className="btn-glow"
          style={{
            background: "linear-gradient(135deg, var(--landing-accent), var(--landing-accent-2))",
            color: "#fff",
            fontWeight: 700,
            fontSize: "1.1rem",
            padding: "1rem 2.8rem",
            borderRadius: "50px",
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            gap: ".5rem",
            transition: "box-shadow .25s",
          }}
        >
          Comece agora — é grátis →
        </TransitionLink>
      </section>

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
        <span style={{ fontFamily: "var(--font-display)", color: "var(--landing-soft)", fontSize: "1rem" }}>
          ♻ ECOnecta
        </span>
        <span style={{ color: "var(--landing-soft)", fontSize: ".8rem" }}>
          Feito com 💚 para um planeta mais sustentável
        </span>
      </footer>
    </main>
  );
}
