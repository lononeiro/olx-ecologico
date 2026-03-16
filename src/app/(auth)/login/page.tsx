"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Playfair_Display, DM_Sans } from "next/font/google";
import { TransitionLink } from "@/components/ui/TransitionLink";

const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-display" });
const dmSans   = DM_Sans({ subsets: ["latin"], variable: "--font-body" });

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm]       = useState({ email: "", senha: "" });
  const [erro, setErro]       = useState("");
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setLoading(true);
    const res = await signIn("credentials", {
      email: form.email, password: form.senha, redirect: false,
    });
    setLoading(false);
    if (res?.error) { setErro("Email ou senha inválidos."); return; }
    router.push("/dashboard");
    router.refresh();
  }

  const inputStyle = (name: string): React.CSSProperties => ({
    width: "100%", background: "rgba(255,255,255,.04)",
    border: `1px solid ${focused === name ? "#86d25a" : "rgba(255,255,255,.1)"}`,
    borderRadius: "12px", padding: ".85rem 1rem", color: "#f0f7ec",
    fontSize: ".95rem", outline: "none", transition: "border-color .2s, box-shadow .2s",
    boxShadow: focused === name ? "0 0 0 3px rgba(134,210,90,.12)" : "none",
    fontFamily: "var(--font-body)",
    boxSizing: "border-box",
  });

  return (
    <div
      className={`${playfair.variable} ${dmSans.variable}`}
      style={{ fontFamily: "var(--font-body)", minHeight: "100vh",
        background: "#0b150b", display: "flex", overflow: "hidden" }}
    >
      <style>{`
        @keyframes fadeUp   { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse-ring{0%,100%{transform:scale(1);opacity:.15} 50%{transform:scale(1.08);opacity:.25}}
        @keyframes drift    { 0%,100%{transform:translate(0,0) rotate(0deg)} 50%{transform:translate(12px,-18px) rotate(6deg)} }
        @keyframes drift2   { 0%,100%{transform:translate(0,0) rotate(0deg)} 50%{transform:translate(-10px,14px) rotate(-5deg)} }
        .a1{animation:fadeUp .6s ease both .1s}
        .a2{animation:fadeUp .6s ease both .25s}
        .a3{animation:fadeUp .6s ease both .4s}
        .a4{animation:fadeUp .6s ease both .55s}
        .a5{animation:fadeUp .6s ease both .7s}
        ::placeholder{color:rgba(255,255,255,.2)!important}
        input:-webkit-autofill{-webkit-box-shadow:0 0 0 1000px #131f13 inset!important;-webkit-text-fill-color:#f0f7ec!important}
      `}</style>

      {/* ── PAINEL ESQUERDO (decorativo) ─────────────────────── */}
      <div style={{ flex: "0 0 45%", background: "linear-gradient(145deg,#0f2010,#162b16)",
        position: "relative", display: "flex", flexDirection: "column",
        justifyContent: "center", alignItems: "center", padding: "3rem",
        borderRight: "1px solid rgba(134,210,90,.08)", overflow: "hidden" }}
        className="hidden-mobile"
      >
        {/* Rings decorativos */}
        {[200,280,360,440].map((size, i) => (
          <div key={size} style={{
            position: "absolute", width: size, height: size,
            border: "1px solid rgba(134,210,90,.08)",
            borderRadius: "50%", top: "50%", left: "50%",
            transform: "translate(-50%,-50%)",
            animation: `pulse-ring ${4 + i}s ease-in-out infinite ${i * .5}s`,
          }}/>
        ))}

        {/* Blobs */}
        <div style={{ position:"absolute", width:300, height:300, borderRadius:"50%",
          background:"radial-gradient(circle, rgba(134,210,90,.08) 0%, transparent 70%)",
          top:"20%", left:"10%", animation:"drift 10s ease-in-out infinite" }}/>
        <div style={{ position:"absolute", width:200, height:200, borderRadius:"50%",
          background:"radial-gradient(circle, rgba(74,222,128,.06) 0%, transparent 70%)",
          bottom:"15%", right:"10%", animation:"drift2 13s ease-in-out infinite" }}/>

        {/* Conteúdo */}
        <div style={{ position:"relative", textAlign:"center", zIndex:1 }}>
          <div style={{ fontSize:"4rem", marginBottom:"1.5rem", lineHeight:1 }}>♻</div>
          <h2 style={{ fontFamily:"var(--font-display)", fontSize:"2.2rem",
            color:"#f0f7ec", fontWeight:700, lineHeight:1.2, marginBottom:"1rem" }}>
            Bem-vindo<br/>de volta.
          </h2>
          <p style={{ color:"#4a6b44", fontSize:".95rem", lineHeight:1.7, maxWidth:"280px" }}>
            Acesse sua conta e continue contribuindo para um mundo mais sustentável.
          </p>

          {/* Mini stats */}
          <div style={{ display:"flex", gap:"2rem", justifyContent:"center",
            marginTop:"3rem", paddingTop:"2rem",
            borderTop:"1px solid rgba(255,255,255,.06)" }}>
            {/* {[{n:"10+", l:"Materiais"},{n:"100%",l:"Gratuito"},{n:"3",l:"Perfis"}].map(s=>(
              <div key={s.l} style={{ textAlign:"center" }}>
                <div style={{ fontFamily:"var(--font-display)", fontSize:"1.5rem",
                  color:"#86d25a", fontWeight:700 }}>{s.n}</div>
                <div style={{ color:"#3a5e36", fontSize:".75rem", marginTop:".2rem" }}>{s.l}</div>
              </div>
            ))} */}
          </div>
        </div>
      </div>

      {/* ── PAINEL DIREITO (formulário) ───────────────────────── */}
      <div style={{ flex:1, display:"flex", flexDirection:"column",
        justifyContent:"center", alignItems:"center", padding:"2rem",
        minHeight:"100vh" }}>

        {/* Voltar */}
        <div style={{ position:"absolute", top:"1.5rem", right:"2rem" }}>
          <TransitionLink href="/" style={{ color:"#3a5e36", fontSize:".85rem",
            textDecoration:"none", display:"flex", alignItems:"center", gap:".4rem" }}>
            ← Início
          </TransitionLink>
        </div>

        <div style={{ width:"100%", maxWidth:"400px" }}>

          {/* Header */}
          <div className="a1" style={{ marginBottom:"2.5rem" }}>
            <div style={{ fontFamily:"var(--font-display)", fontSize:"2rem",
              color:"#f0f7ec", fontWeight:700, marginBottom:".4rem" }}>
              Entrar
            </div>
            <p style={{ color:"#4a6b44", fontSize:".9rem" }}>
              Não tem conta?{" "}
              <TransitionLink href="/register"
                style={{ color:"#86d25a", textDecoration:"none", fontWeight:500 }}>
                Criar agora
              </TransitionLink>
            </p>
          </div>

          {/* Erro */}
          {erro && (
            <div className="a2" style={{ background:"rgba(239,68,68,.1)",
              border:"1px solid rgba(239,68,68,.3)", borderRadius:"12px",
              padding:".85rem 1rem", color:"#f87171", fontSize:".88rem",
              marginBottom:"1.5rem", display:"flex", alignItems:"center", gap:".5rem" }}>
              ⚠ {erro}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display:"flex", flexDirection:"column", gap:"1.2rem" }}>
            <div className="a2">
              <label style={{ display:"block", color:"#5a7a54", fontSize:".8rem",
                fontWeight:600, textTransform:"uppercase", letterSpacing:"1px",
                marginBottom:".5rem" }}>
                Email
              </label>
              <input
                type="email" required placeholder="seu@email.com"
                style={inputStyle("email")}
                value={form.email}
                onChange={e => setForm({...form, email: e.target.value})}
                onFocus={() => setFocused("email")}
                onBlur={() => setFocused(null)}
              />
            </div>

            <div className="a3">
              <label style={{ display:"block", color:"#5a7a54", fontSize:".8rem",
                fontWeight:600, textTransform:"uppercase", letterSpacing:"1px",
                marginBottom:".5rem" }}>
                Senha
              </label>
              <input
                type="password" required placeholder="••••••••"
                style={inputStyle("senha")}
                value={form.senha}
                onChange={e => setForm({...form, senha: e.target.value})}
                onFocus={() => setFocused("senha")}
                onBlur={() => setFocused(null)}
              />
            </div>

            <div className="a4" style={{ paddingTop:".4rem" }}>
              <button
                type="submit" disabled={loading}
                style={{ width:"100%", background: loading
                  ? "rgba(134,210,90,.4)"
                  : "linear-gradient(135deg,#86d25a,#4ade80)",
                  color:"#0a1a0a", fontWeight:700, fontSize:"1rem",
                  padding:"1rem", borderRadius:"12px", border:"none",
                  cursor: loading ? "not-allowed" : "pointer",
                  transition:"all .25s", letterSpacing:".3px",
                  fontFamily:"var(--font-body)",
                  boxShadow: loading ? "none" : "0 8px 32px rgba(134,210,90,.25)",
                }}
              >
                {loading ? "Entrando..." : "Entrar →"}
              </button>
            </div>
          </form>

          {/* Divider */}
          <div className="a5" style={{ display:"flex", alignItems:"center",
            gap:"1rem", margin:"2rem 0" }}>
            <div style={{ flex:1, height:"1px", background:"rgba(255,255,255,.07)" }}/>
            <span style={{ color:"#2a4a2a", fontSize:".78rem" }}>ou</span>
            <div style={{ flex:1, height:"1px", background:"rgba(255,255,255,.07)" }}/>
          </div>

          <div className="a5">
            <TransitionLink href="/register"
              style={{ display:"block", textAlign:"center",
                border:"1px solid rgba(134,210,90,.2)", borderRadius:"12px",
                padding:".9rem", color:"#86d25a", textDecoration:"none",
                fontSize:".9rem", transition:"all .2s",
                background:"rgba(134,210,90,.04)" }}>
              Criar uma conta grátis
            </TransitionLink>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .hidden-mobile { display: none !important; }
        }
      `}</style>
    </div>
  );
}