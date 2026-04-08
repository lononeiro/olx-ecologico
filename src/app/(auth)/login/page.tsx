"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Playfair_Display, DM_Sans } from "next/font/google";
import { TransitionLink } from "@/components/ui/TransitionLink";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { PasswordField } from "@/components/ui/PasswordField";

const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-display" });
const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-body" });

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", senha: "" });
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setLoading(true);

    const res = await signIn("credentials", {
      email: form.email,
      password: form.senha,
      redirect: false,
    });

    setLoading(false);

    if (res?.error) {
      setErro("Email ou senha inválidos.");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  const inputStyle = (name: string): React.CSSProperties => ({
    width: "100%",
    background: "var(--auth-surface)",
    border: `1px solid ${focused === name ? "var(--auth-accent)" : "var(--auth-border)"}`,
    borderRadius: "12px",
    padding: ".85rem 1rem",
    color: "var(--auth-text)",
    fontSize: ".95rem",
    outline: "none",
    transition: "border-color .2s, box-shadow .2s",
    boxShadow: focused === name ? "0 0 0 3px rgba(47,141,71,.12)" : "none",
    fontFamily: "var(--font-body)",
    boxSizing: "border-box",
  });

  const labelStyle: React.CSSProperties = {
    display: "block",
    color: "var(--auth-soft)",
    fontSize: ".8rem",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "1px",
    marginBottom: ".5rem",
  };

  return (
    <div
      className={`${playfair.variable} ${dmSans.variable}`}
      style={{
        fontFamily: "var(--font-body)",
        minHeight: "100vh",
        background: "var(--auth-bg)",
        display: "flex",
        overflow: "hidden",
      }}
    >
      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse-ring { 0%, 100% { transform: scale(1); opacity: .15; } 50% { transform: scale(1.08); opacity: .25; } }
        @keyframes drift { 0%, 100% { transform: translate(0, 0) rotate(0deg); } 50% { transform: translate(12px, -18px) rotate(6deg); } }
        @keyframes drift2 { 0%, 100% { transform: translate(0, 0) rotate(0deg); } 50% { transform: translate(-10px, 14px) rotate(-5deg); } }
        .a1 { animation: fadeUp .6s ease both .1s; }
        .a2 { animation: fadeUp .6s ease both .25s; }
        .a3 { animation: fadeUp .6s ease both .4s; }
        .a4 { animation: fadeUp .6s ease both .55s; }
        .a5 { animation: fadeUp .6s ease both .7s; }
        ::placeholder { color: var(--auth-soft) !important; }
        input:-webkit-autofill { -webkit-box-shadow: 0 0 0 1000px var(--auth-autofill) inset !important; -webkit-text-fill-color: var(--auth-text) !important; }
        @media (max-width: 768px) { .hidden-mobile { display: none !important; } }
      `}</style>

      <div
        className="hidden-mobile"
        style={{
          flex: "0 0 45%",
          background: "linear-gradient(145deg,var(--auth-panel),var(--auth-panel-2))",
          position: "relative",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          padding: "3rem",
          borderRight: "1px solid var(--auth-border-soft)",
          overflow: "hidden",
        }}
      >
        {[200, 280, 360, 440].map((size, i) => (
          <div
            key={size}
            style={{
              position: "absolute",
              width: size,
              height: size,
              border: "1px solid rgba(47,141,71,.12)",
              borderRadius: "50%",
              top: "50%",
              left: "50%",
              transform: "translate(-50%,-50%)",
              animation: `pulse-ring ${4 + i}s ease-in-out infinite ${i * 0.5}s`,
            }}
          />
        ))}

        <div
          style={{
            position: "absolute",
            width: 300,
            height: 300,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(47,141,71,.14) 0%, transparent 70%)",
            top: "20%",
            left: "10%",
            animation: "drift 10s ease-in-out infinite",
          }}
        />
        <div
          style={{
            position: "absolute",
            width: 200,
            height: 200,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(88,184,117,.12) 0%, transparent 70%)",
            bottom: "15%",
            right: "10%",
            animation: "drift2 13s ease-in-out infinite",
          }}
        />

        <div style={{ position: "relative", textAlign: "center", zIndex: 1 }}>
          <div style={{ fontSize: "4rem", marginBottom: "1.5rem", lineHeight: 1, color: "var(--auth-accent)" }}>
            ♻
          </div>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "2.2rem",
              color: "var(--auth-text)",
              fontWeight: 700,
              lineHeight: 1.2,
              marginBottom: "1rem",
            }}
          >
            Bem-vindo
            <br />
            de volta.
          </h2>
          <p style={{ color: "var(--auth-muted)", fontSize: ".95rem", lineHeight: 1.7, maxWidth: "280px" }}>
            Acesse sua conta e continue contribuindo para um mundo mais sustentável.
          </p>
        </div>
      </div>

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          padding: "2rem",
          minHeight: "100vh",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "1.5rem",
            right: "2rem",
            display: "flex",
            alignItems: "center",
            gap: ".7rem",
          }}
        >
          <ThemeToggle compact />
          <TransitionLink
            href="/"
            style={{
              color: "var(--auth-muted)",
              fontSize: ".85rem",
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: ".4rem",
            }}
          >
            ← Início
          </TransitionLink>
        </div>

        <div style={{ width: "100%", maxWidth: "400px" }}>
          <div className="a1" style={{ marginBottom: "2.5rem" }}>
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "2rem",
                color: "var(--auth-text)",
                fontWeight: 700,
                marginBottom: ".4rem",
              }}
            >
              Entrar
            </div>
            <p style={{ color: "var(--auth-muted)", fontSize: ".9rem" }}>
              Ainda não tem conta?{" "}
              <TransitionLink
                href="/register"
                style={{ color: "var(--auth-accent)", textDecoration: "none", fontWeight: 500 }}
              >
                Criar agora
              </TransitionLink>
            </p>
          </div>

          {erro ? (
            <div
              className="a2"
              style={{
                background: "var(--auth-danger-bg)",
                border: "1px solid var(--auth-danger-border)",
                borderRadius: "12px",
                padding: ".85rem 1rem",
                color: "var(--auth-danger)",
                fontSize: ".88rem",
                marginBottom: "1.5rem",
                display: "flex",
                alignItems: "center",
                gap: ".5rem",
              }}
            >
              ! {erro}
            </div>
          ) : null}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
            <div className="a2">
              <label style={labelStyle}>Email</label>
              <input
                type="email"
                required
                placeholder="seu@email.com"
                style={inputStyle("email")}
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                onFocus={() => setFocused("email")}
                onBlur={() => setFocused(null)}
              />
            </div>

            <div className="a3">
              <PasswordField
                label="Senha"
                name="senha"
                value={form.senha}
                onChange={(senha) => setForm({ ...form, senha })}
                required
                placeholder="Digite sua senha"
                autoComplete="current-password"
                labelStyle={labelStyle}
                inputStyle={{ ...inputStyle("senha"), paddingRight: "6rem" }}
                hint="Se você já tem cadastro antigo, sua senha atual continua válida."
                wrapperStyle={{
                  borderRadius: "12px",
                }}
              />
            </div>

            <div className="a4" style={{ paddingTop: ".4rem" }}>
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: "100%",
                  background: loading
                    ? "rgba(47,141,71,.45)"
                    : "linear-gradient(135deg,var(--auth-accent),var(--auth-accent-2))",
                  color: "var(--auth-button-text)",
                  fontWeight: 700,
                  fontSize: "1rem",
                  padding: "1rem",
                  borderRadius: "12px",
                  border: "none",
                  cursor: loading ? "not-allowed" : "pointer",
                  transition: "all .25s",
                  letterSpacing: ".3px",
                  fontFamily: "var(--font-body)",
                  boxShadow: loading ? "none" : "0 8px 32px rgba(47,141,71,.25)",
                }}
              >
                {loading ? "Entrando..." : "Entrar →"}
              </button>
            </div>
          </form>

          <div className="a5" style={{ display: "flex", alignItems: "center", gap: "1rem", margin: "2rem 0" }}>
            <div style={{ flex: 1, height: "1px", background: "var(--auth-border-soft)" }} />
            <span style={{ color: "var(--auth-soft)", fontSize: ".78rem" }}>ou</span>
            <div style={{ flex: 1, height: "1px", background: "var(--auth-border-soft)" }} />
          </div>

          <div className="a5">
            <TransitionLink
              href="/register"
              style={{
                display: "block",
                textAlign: "center",
                border: "1px solid var(--auth-border)",
                borderRadius: "12px",
                padding: ".9rem",
                color: "var(--auth-accent)",
                textDecoration: "none",
                fontSize: ".9rem",
                transition: "all .2s",
                background: "var(--auth-surface)",
              }}
            >
              Criar uma conta grátis
            </TransitionLink>
          </div>
        </div>
      </div>
    </div>
  );
}
