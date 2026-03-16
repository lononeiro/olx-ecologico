"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Playfair_Display, DM_Sans } from "next/font/google";
import { TransitionLink } from "@/components/ui/TransitionLink";

const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-display" });
const dmSans   = DM_Sans({ subsets: ["latin"], variable: "--font-body" });

type Tipo = "usuario" | "empresa";

export default function RegisterPage() {
  const router = useRouter();
  const [tipo, setTipo]   = useState<Tipo>("usuario");
  const [form, setForm]   = useState({
    nome: "", email: "", senha: "", telefone: "", cnpj: "", descricao: "",
  });
  // Endereço separado em campos individuais
  const [endereco, setEndereco] = useState({
    rua: "", numero: "", complemento: "", bairro: "", cidade: "", uf: "",
  });
  const [erros, setErros]     = useState<Record<string, string[]>>({});
  const [erro, setErro]       = useState("");
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);

  /** Monta a string de endereço completo para salvar no banco */
  function montarEnderecoString() {
    const { rua, numero, complemento, bairro, cidade, uf } = endereco;
    const partes = [
      rua && numero ? `${rua}, ${numero}` : rua,
      complemento,
      bairro,
      cidade && uf ? `${cidade} - ${uf}` : cidade,
    ].filter(Boolean);
    return partes.join(", ");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(""); setErros({}); setLoading(true);

    const enderecoCompleto = montarEnderecoString();

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, tipo, endereco: enderecoCompleto }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      if (typeof data.error === "object") setErros(data.error);
      else setErro(data.error ?? "Erro ao criar conta.");
      return;
    }
    router.push("/login?registered=1");
  }

  const f = (key: keyof typeof form) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm({ ...form, [key]: e.target.value }),
    onFocus: () => setFocused(key),
    onBlur:  () => setFocused(null),
  });

  const fe = (key: keyof typeof endereco) => ({
    value: endereco[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      setEndereco({ ...endereco, [key]: e.target.value }),
    onFocus: () => setFocused(key),
    onBlur:  () => setFocused(null),
  });

  const inputStyle = (name: string): React.CSSProperties => ({
    width: "100%", background: "rgba(255,255,255,.04)",
    border: `1px solid ${focused === name ? "#86d25a" : "rgba(255,255,255,.1)"}`,
    borderRadius: "12px", padding: ".8rem 1rem", color: "#f0f7ec",
    fontSize: ".92rem", outline: "none", transition: "border-color .2s, box-shadow .2s",
    boxShadow: focused === name ? "0 0 0 3px rgba(134,210,90,.12)" : "none",
    fontFamily: "var(--font-body)", boxSizing: "border-box" as const,
  });

  const labelStyle: React.CSSProperties = {
    display: "block", color: "#5a7a54", fontSize: ".78rem",
    fontWeight: 600, textTransform: "uppercase", letterSpacing: "1px", marginBottom: ".45rem",
  };

  return (
    <div
      className={`${playfair.variable} ${dmSans.variable}`}
      style={{ fontFamily: "var(--font-body)", minHeight: "100vh",
        background: "#0b150b", display: "flex", overflow: "hidden" }}
    >
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes drift  { 0%,100%{transform:translate(0,0)} 50%{transform:translate(14px,-16px)} }
        @keyframes drift2 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(-10px,12px)} }
        @keyframes orbit  { from{transform:rotate(0deg) translateX(120px) rotate(0deg)} to{transform:rotate(360deg) translateX(120px) rotate(-360deg)} }
        .a1{animation:fadeUp .5s ease both .05s}
        .a2{animation:fadeUp .5s ease both .15s}
        .a3{animation:fadeUp .5s ease both .25s}
        .a4{animation:fadeUp .5s ease both .35s}
        .a5{animation:fadeUp .5s ease both .45s}
        .a6{animation:fadeUp .5s ease both .55s}
        ::placeholder{color:rgba(255,255,255,.18)!important}
        input:-webkit-autofill,textarea:-webkit-autofill{
          -webkit-box-shadow:0 0 0 1000px #131f13 inset!important;
          -webkit-text-fill-color:#f0f7ec!important
        }
        .tipo-btn { transition: all .2s; cursor: pointer; }
        .tipo-btn:hover { border-color: rgba(134,210,90,.4) !important; }
        .section-divider {
          display: flex; align-items: center; gap: .75rem;
          margin: .4rem 0 1rem;
        }
        .section-divider span {
          color: #2a4a2a; font-size: .72rem; font-weight: 600;
          text-transform: uppercase; letter-spacing: 1.5px; white-space: nowrap;
        }
        .section-divider hr {
          flex: 1; border: none; border-top: 1px solid rgba(255,255,255,.07);
        }
        @media (max-width: 768px) { .hidden-mobile { display: none !important; } }
      `}</style>

      {/* ── PAINEL ESQUERDO ──────────────────────────────────── */}
      <div style={{ flex: "0 0 42%", background: "linear-gradient(145deg,#0d1d0d,#142314)",
        position: "relative", display: "flex", flexDirection: "column",
        justifyContent: "space-between", padding: "3rem",
        borderRight: "1px solid rgba(134,210,90,.07)", overflow: "hidden" }}
        className="hidden-mobile"
      >
        <div style={{ position: "absolute", width: 400, height: 400, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(134,210,90,.07) 0%, transparent 65%)",
          top: "-5%", left: "-10%", animation: "drift 12s ease-in-out infinite" }}/>
        <div style={{ position: "absolute", width: 300, height: 300, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(74,222,128,.05) 0%, transparent 65%)",
          bottom: "10%", right: "-5%", animation: "drift2 15s ease-in-out infinite" }}/>
        <div style={{ position: "absolute", top: "50%", left: "50%", width: 8, height: 8,
          marginTop: -4, marginLeft: -4 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#86d25a",
            opacity: .4, animation: "orbit 8s linear infinite" }}/>
        </div>

        <div style={{ position: "relative", zIndex: 1 }}>
          <TransitionLink href="/" style={{ textDecoration: "none",
            display: "flex", alignItems: "center", gap: ".6rem" }}>
            <span style={{ fontSize: "1.6rem" }}>♻</span>
            <span style={{ fontFamily: "var(--font-display)", color: "#86d25a",
              fontSize: "1.1rem", fontWeight: 700 }}>ECOleta</span>
          </TransitionLink>
        </div>

        <div style={{ position: "relative", zIndex: 1 }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "2.4rem",
            color: "#f0f7ec", fontWeight: 700, lineHeight: 1.2, marginBottom: "1.2rem" }}>
            Junte-se ao<br/>movimento.
          </h2>
          <p style={{ color: "#4a6b44", fontSize: ".92rem", lineHeight: 1.8,
            maxWidth: "260px", marginBottom: "2.5rem" }}>
            Milhares de pessoas e empresas já usam a plataforma para tornar a reciclagem mais fácil.
          </p>
          {["Cadastro 100% gratuito", "Solicitações aprovadas em 24h",
            "Acompanhe em tempo real", "Suporte via chat integrado"].map(item => (
            <div key={item} style={{ display: "flex", alignItems: "center",
              gap: ".75rem", marginBottom: ".9rem" }}>
              <div style={{ width: 22, height: 22, borderRadius: "50%",
                background: "rgba(134,210,90,.15)", border: "1px solid rgba(134,210,90,.3)",
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span style={{ color: "#86d25a", fontSize: ".65rem" }}>✓</span>
              </div>
              <span style={{ color: "#5a7a54", fontSize: ".88rem" }}>{item}</span>
            </div>
          ))}
        </div>

        <div style={{ position: "relative", zIndex: 1,
          borderTop: "1px solid rgba(255,255,255,.06)", paddingTop: "1.5rem" }}>
          <p style={{ color: "#2a4a2a", fontSize: ".78rem" }}>
            Já tem conta?{" "}
            <TransitionLink href="/login"
              style={{ color: "#86d25a", textDecoration: "none" }}>
              Fazer login →
            </TransitionLink>
          </p>
        </div>
      </div>

      {/* ── PAINEL DIREITO (form) ─────────────────────────────── */}
      <div style={{ flex: 1, overflowY: "auto", display: "flex",
        flexDirection: "column", alignItems: "center", padding: "3rem 2rem" }}>
        <div style={{ width: "100%", maxWidth: "460px" }}>

          {/* Header */}
          <div className="a1" style={{ marginBottom: "2rem" }}>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.9rem",
              color: "#f0f7ec", fontWeight: 700, marginBottom: ".3rem" }}>
              Criar conta
            </h1>
            <p style={{ color: "#3a5e36", fontSize: ".88rem" }}>
              Já tem conta?{" "}
              <TransitionLink href="/login"
                style={{ color: "#86d25a", textDecoration: "none", fontWeight: 500 }}>
                Entrar
              </TransitionLink>
            </p>
          </div>

          {/* Tipo switcher */}
          <div className="a2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr",
            gap: ".75rem", marginBottom: "1.8rem" }}>
            {(["usuario", "empresa"] as Tipo[]).map(t => (
              <button key={t} type="button" className="tipo-btn"
                onClick={() => setTipo(t)}
                style={{ padding: ".9rem", borderRadius: "12px", border: "1px solid",
                  borderColor: tipo === t ? "#86d25a" : "rgba(255,255,255,.1)",
                  background: tipo === t ? "rgba(134,210,90,.1)" : "rgba(255,255,255,.02)",
                  color: tipo === t ? "#86d25a" : "#4a6b44",
                  fontSize: ".88rem", fontWeight: tipo === t ? 600 : 400,
                  fontFamily: "var(--font-body)", display: "flex",
                  flexDirection: "column", alignItems: "center", gap: ".3rem" }}>
                <span style={{ fontSize: "1.4rem" }}>{t === "usuario" ? "" : ""}</span>
                {t === "usuario" ? "Cidadão" : "Empresa"}
              </button>
            ))}
          </div>

          {/* Erro global */}
          {erro && (
            <div style={{ background: "rgba(239,68,68,.1)", border: "1px solid rgba(239,68,68,.3)",
              borderRadius: "12px", padding: ".8rem 1rem", color: "#f87171",
              fontSize: ".85rem", marginBottom: "1.2rem" }}>
              ⚠ {erro}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>

            {/* ── Dados pessoais ── */}
            <div className="section-divider a3">
              <span>Dados pessoais</span><hr/>
            </div>

            <div className="a3">
              <label style={labelStyle}>{tipo === "empresa" ? "Nome da empresa" : "Nome completo"}</label>
              <input type="text" required placeholder={tipo === "empresa" ? "Nome da sua empresa" : "Seu nome completo"}
                style={inputStyle("nome")} {...f("nome")} />
              {erros.nome && <p style={{ color: "#f87171", fontSize: ".78rem", marginTop: ".3rem" }}>{erros.nome[0]}</p>}
            </div>

            <div className="a3" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: ".75rem" }}>
              <div>
                <label style={labelStyle}>Email</label>
                <input type="email" required placeholder="seu@email.com"
                  style={inputStyle("email")} {...f("email")} />
                {erros.email && <p style={{ color: "#f87171", fontSize: ".78rem", marginTop: ".3rem" }}>{erros.email[0]}</p>}
              </div>
              <div>
                <label style={labelStyle}>Telefone</label>
                <input type="text" placeholder="(11) 99999-0000"
                  style={inputStyle("telefone")} {...f("telefone")} />
              </div>
            </div>

            <div className="a4">
              <label style={labelStyle}>Senha</label>
              <input type="password" required placeholder="Mínimo 6 caracteres"
                style={inputStyle("senha")} {...f("senha")} />
              {erros.senha && <p style={{ color: "#f87171", fontSize: ".78rem", marginTop: ".3rem" }}>{erros.senha[0]}</p>}
            </div>

            {/* ── Endereço ── */}
            <div className="section-divider a4">
              <span>Endereço</span><hr/>
            </div>

            {/* Rua + Número */}
            <div className="a4" style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: ".75rem" }}>
              <div>
                <label style={labelStyle}>Rua / Avenida</label>
                <input type="text" placeholder="Ex: Rua das Flores"
                  style={inputStyle("rua")} {...fe("rua")} />
              </div>
              <div style={{ width: "90px" }}>
                <label style={labelStyle}>Número</label>
                <input type="text" placeholder="123"
                  style={inputStyle("numero")} {...fe("numero")} />
              </div>
            </div>

            {/* Complemento */}
            <div className="a4">
              <label style={labelStyle}>
                Complemento{" "}
                <span style={{ color: "#2a4a2a", fontWeight: 400, textTransform: "none",
                  letterSpacing: 0, fontSize: ".72rem" }}>(opcional)</span>
              </label>
              <input type="text" placeholder="Apto 42, Bloco B, Casa..."
                style={inputStyle("complemento")} {...fe("complemento")} />
            </div>

            {/* Bairro */}
            <div className="a5">
              <label style={labelStyle}>Bairro</label>
              <input type="text" placeholder="Ex: Centro"
                style={inputStyle("bairro")} {...fe("bairro")} />
            </div>

            {/* Cidade + UF */}
            <div className="a5" style={{ display: "grid", gridTemplateColumns: "1fr 80px", gap: ".75rem" }}>
              <div>
                <label style={labelStyle}>Cidade</label>
                <input type="text" placeholder="Ex: São Paulo"
                  style={inputStyle("cidade")} {...fe("cidade")} />
              </div>
              <div>
                <label style={labelStyle}>UF</label>
                <input type="text" placeholder="SP" maxLength={2}
                  style={{ ...inputStyle("uf"), textTransform: "uppercase" }}
                  {...fe("uf")}
                  onChange={e => setEndereco({ ...endereco, uf: e.target.value.toUpperCase() })}
                />
              </div>
            </div>

            {/* Preview do endereço montado */}
            {(endereco.rua || endereco.cidade) && (
              <div className="a5" style={{ background: "rgba(134,210,90,.05)",
                border: "1px solid rgba(134,210,90,.15)", borderRadius: "10px",
                padding: ".7rem 1rem" }}>
                <p style={{ color: "#3a5e36", fontSize: ".72rem", fontWeight: 600,
                  textTransform: "uppercase", letterSpacing: "1px", marginBottom: ".3rem" }}>
                  Prévia do endereço
                </p>
                <p style={{ color: "#86d25a", fontSize: ".85rem" }}>
                  {montarEnderecoString()}
                </p>
              </div>
            )}

            {/* ── Dados da empresa ── */}
            {tipo === "empresa" && (
              <>
                <div className="section-divider a5">
                  <span>Dados da empresa</span><hr/>
                </div>
                <div className="a5">
                  <label style={labelStyle}>CNPJ <span style={{ color: "#f87171" }}>*</span></label>
                  <input type="text" required placeholder="00.000.000/0001-00"
                    style={inputStyle("cnpj")} {...f("cnpj")} />
                </div>
                <div className="a5">
                  <label style={labelStyle}>Descrição da empresa</label>
                  <textarea rows={3} placeholder="Descreva os serviços da empresa..."
                    style={{ ...inputStyle("descricao"), resize: "none" }}
                    {...f("descricao")} />
                </div>
              </>
            )}

            {/* Submit */}
            <div className="a6" style={{ paddingTop: ".4rem" }}>
              <button type="submit" disabled={loading}
                style={{ width: "100%",
                  background: loading ? "rgba(134,210,90,.4)"
                    : "linear-gradient(135deg,#86d25a,#4ade80)",
                  color: "#0a1a0a", fontWeight: 700, fontSize: "1rem",
                  padding: "1rem", borderRadius: "12px", border: "none",
                  cursor: loading ? "not-allowed" : "pointer",
                  transition: "all .25s", fontFamily: "var(--font-body)",
                  boxShadow: loading ? "none" : "0 8px 32px rgba(134,210,90,.25)",
                }}>
                {loading ? "Criando conta..." : "Criar conta grátis →"}
              </button>
            </div>
          </form>

          <p className="a6" style={{ color: "#2a4a2a", fontSize: ".75rem",
            textAlign: "center", marginTop: "1.5rem", lineHeight: 1.6 }}>
            Ao criar uma conta você concorda com os termos de uso da plataforma.
          </p>
        </div>
      </div>
    </div>
  );
}