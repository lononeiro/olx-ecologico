"use client";

import { useState } from "react";
import { Playfair_Display, DM_Sans } from "next/font/google";
import { TransitionLink } from "@/components/ui/TransitionLink";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-display" });
const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-body" });

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [erro, setErro] = useState("");
  const [devLink, setDevLink] = useState<string | null>(null);
  const [focused, setFocused] = useState(false);

  const inputStyle = (isFocused: boolean): React.CSSProperties => ({
    width: "100%",
    background: "var(--auth-surface)",
    border: `1px solid ${isFocused ? "var(--auth-accent)" : "var(--auth-border)"}`,
    borderRadius: "12px",
    padding: ".85rem 1rem",
    color: "var(--auth-text)",
    fontSize: ".95rem",
    outline: "none",
    transition: "border-color .2s, box-shadow .2s",
    boxShadow: isFocused ? "0 0 0 3px rgba(47,141,71,.12)" : "none",
    fontFamily: "var(--font-body)",
    boxSizing: "border-box" as const,
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      setSent(true);
      if (data.resetLink) setDevLink(data.resetLink);
    } catch {
      setErro("Erro ao enviar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className={`${playfair.variable} ${dmSans.variable}`}
      style={{ fontFamily: "var(--font-body)", minHeight: "100vh", background: "var(--auth-bg)", display: "flex", overflow: "hidden" }}
    >
      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse-ring { 0%, 100% { transform: scale(1); opacity: .15; } 50% { transform: scale(1.08); opacity: .25; } }
        @keyframes drift { 0%, 100% { transform: translate(0,0) rotate(0deg); } 50% { transform: translate(12px,-18px) rotate(6deg); } }
        .a1 { animation: fadeUp .6s ease both .1s; }
        .a2 { animation: fadeUp .6s ease both .25s; }
        .a3 { animation: fadeUp .6s ease both .4s; }
        ::placeholder { color: var(--auth-soft) !important; }
        input:-webkit-autofill { -webkit-box-shadow: 0 0 0 1000px var(--auth-autofill) inset !important; -webkit-text-fill-color: var(--auth-text) !important; }
        @media (max-width: 768px) { .hidden-mobile { display: none !important; } }
      `}</style>

      {/* Left decorative panel */}
      <div
        className="hidden-mobile"
        style={{ flex: "0 0 45%", background: "linear-gradient(145deg,var(--auth-panel),var(--auth-panel-2))", position: "relative", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: "3rem", borderRight: "1px solid var(--auth-border-soft)", overflow: "hidden" }}
      >
        {[200, 280, 360, 440].map((size, i) => (
          <div key={size} style={{ position: "absolute", width: size, height: size, border: "1px solid rgba(47,141,71,.12)", borderRadius: "50%", top: "50%", left: "50%", transform: "translate(-50%,-50%)", animation: `pulse-ring ${4 + i}s ease-in-out infinite ${i * 0.5}s` }} />
        ))}
        <div style={{ position: "absolute", width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, rgba(47,141,71,.14) 0%, transparent 70%)", top: "20%", left: "10%", animation: "drift 10s ease-in-out infinite" }} />
        <div style={{ position: "relative", textAlign: "center", zIndex: 1 }}>
          <div style={{ fontSize: "3.5rem", marginBottom: "1.5rem", lineHeight: 1, color: "var(--auth-accent)" }}>
            ♻
          </div>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "2.2rem", color: "var(--auth-text)", fontWeight: 700, lineHeight: 1.2, marginBottom: "1rem" }}>
            Recuperar<br />acesso
          </h2>
          <p style={{ color: "var(--auth-muted)", fontSize: ".95rem", lineHeight: 1.7, maxWidth: "280px" }}>
            Informe seu e-mail e enviaremos um link para redefinir sua senha.
          </p>
        </div>
      </div>

      {/* Right form panel */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: "2rem", minHeight: "100vh" }}>
        <div style={{ position: "absolute", top: "1.5rem", right: "2rem", display: "flex", alignItems: "center", gap: ".7rem" }}>
          <ThemeToggle compact />
          <TransitionLink href="/login" style={{ color: "var(--auth-muted)", fontSize: ".85rem", textDecoration: "none", display: "flex", alignItems: "center", gap: ".4rem" }}>
            ← Login
          </TransitionLink>
        </div>

        <div style={{ width: "100%", maxWidth: "400px" }}>
          {!sent ? (
            <>
              <div className="a1" style={{ marginBottom: "2.5rem" }}>
                <div style={{ fontFamily: "var(--font-display)", fontSize: "2rem", color: "var(--auth-text)", fontWeight: 700, marginBottom: ".4rem" }}>
                  Esqueceu a senha?
                </div>
                <p style={{ color: "var(--auth-muted)", fontSize: ".9rem" }}>
                  Lembrou?{" "}
                  <TransitionLink href="/login" style={{ color: "var(--auth-accent)", textDecoration: "none", fontWeight: 500 }}>
                    Voltar ao login
                  </TransitionLink>
                </p>
              </div>

              {erro && (
                <div className="a2" style={{ background: "var(--auth-danger-bg)", border: "1px solid var(--auth-danger-border)", borderRadius: "12px", padding: ".85rem 1rem", color: "var(--auth-danger)", fontSize: ".88rem", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: ".5rem" }}>
                  ! {erro}
                </div>
              )}

              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
                <div className="a2">
                  <label style={labelStyle}>Email</label>
                  <input
                    type="email"
                    required
                    placeholder="seu@email.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    style={inputStyle(focused)}
                  />
                </div>

                <div className="a3">
                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      width: "100%",
                      background: loading ? "rgba(47,141,71,.45)" : "linear-gradient(135deg,var(--auth-accent),var(--auth-accent-2))",
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
                    {loading ? "Enviando..." : "Enviar link de recuperacao →"}
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="a1">
              <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>✓</div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: "1.8rem", color: "var(--auth-text)", fontWeight: 700, marginBottom: ".75rem" }}>
                Link enviado!
              </div>
              <p style={{ color: "var(--auth-muted)", fontSize: ".95rem", lineHeight: 1.7, marginBottom: "2rem" }}>
                Se o e-mail <strong style={{ color: "var(--auth-text)" }}>{email}</strong> estiver cadastrado, voce receberá as instrucoes em breve.
              </p>

              {devLink && (
                <div style={{ background: "var(--auth-surface)", border: "1px solid var(--auth-border)", borderRadius: "12px", padding: "1rem", marginBottom: "1.5rem" }}>
                  <p style={{ fontSize: ".72rem", textTransform: "uppercase", letterSpacing: "1px", color: "var(--auth-soft)", fontWeight: 700, marginBottom: ".5rem" }}>
                    Link (ambiente de desenvolvimento)
                  </p>
                  <a href={devLink} style={{ fontSize: ".8rem", color: "var(--auth-accent)", wordBreak: "break-all", textDecoration: "underline" }}>
                    {devLink}
                  </a>
                </div>
              )}

              <TransitionLink
                href="/login"
                style={{ display: "block", textAlign: "center", background: "linear-gradient(135deg,var(--auth-accent),var(--auth-accent-2))", color: "var(--auth-button-text)", borderRadius: "12px", padding: "1rem", textDecoration: "none", fontWeight: 700, boxShadow: "0 8px 32px rgba(47,141,71,.25)" }}
              >
                Voltar ao login
              </TransitionLink>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
