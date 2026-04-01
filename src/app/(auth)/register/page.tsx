"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Playfair_Display, DM_Sans } from "next/font/google";
import { TransitionLink } from "@/components/ui/TransitionLink";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-display" });
const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-body" });

type Tipo = "usuario" | "empresa";

export default function RegisterPage() {
  const router = useRouter();
  const [tipo, setTipo] = useState<Tipo>("usuario");
  const [form, setForm] = useState({
    nome: "", email: "", senha: "", telefone: "", cnpj: "", descricao: "",
  });
  const [endereco, setEndereco] = useState({
    rua: "", numero: "", complemento: "", bairro: "", cidade: "", uf: "",
  });
  const [erros, setErros] = useState<Record<string, string[]>>({});
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);

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
    width: "100%", background: "var(--auth-surface)",
    border: `1px solid ${focused === name ? "var(--auth-accent)" : "var(--auth-border)"}`,
    borderRadius: "12px", padding: ".8rem 1rem", color: "var(--auth-text)",
    fontSize: ".92rem", outline: "none", transition: "border-color .2s, box-shadow .2s",
    boxShadow: focused === name ? "0 0 0 3px rgba(47,141,71,.12)" : "none",
    fontFamily: "var(--font-body)", boxSizing: "border-box" as const,
  });

  const labelStyle: React.CSSProperties = {
    display: "block", color: "var(--auth-soft)", fontSize: ".78rem",
    fontWeight: 600, textTransform: "uppercase", letterSpacing: "1px", marginBottom: ".45rem",
  };

  return (
    <div
      className={`${playfair.variable} ${dmSans.variable}`}
      style={{ fontFamily: "var(--font-body)", minHeight: "100vh",
        background: "var(--auth-bg)", display: "flex", overflow: "hidden" }}
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
        ::placeholder{color:var(--auth-soft)!important}
        input:-webkit-autofill,textarea:-webkit-autofill{
          -webkit-box-shadow:0 0 0 1000px var(--auth-autofill) inset!important;
          -webkit-text-fill-color:var(--auth-text)!important
        }
        .tipo-btn { transition: all .2s; cursor: pointer; }
        .tipo-btn:hover { border-color: rgba(47,141,71,.4) !important; }
        .section-divider {
          display: flex; align-items: center; gap: .75rem;
          margin: .4rem 0 1rem;
        }
        .section-divider span {
          color: var(--auth-soft); font-size: .72rem; font-weight: 600;
          text-transform: uppercase; letter-spacing: 1.5px; white-space: nowrap;
        }
        .section-divider hr {
          flex: 1; border: none; border-top: 1px solid var(--auth-border-soft);
        }
        @media (max-width: 768px) { .hidden-mobile { display: none !important; } }
      `}</style>

      <div style={{ flex: "0 0 42%", background: "linear-gradient(145deg,var(--auth-panel),var(--auth-panel-2))",
        position: "relative", display: "flex", flexDirection: "column",
        justifyContent: "space-between", padding: "3rem",
        borderRight: "1px solid var(--auth-border-soft)", overflow: "hidden" }}
        className="hidden-mobile"
      >
        <div style={{ position: "absolute", width: 400, height: 400, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(47,141,71,.14) 0%, transparent 65%)",
          top: "-5%", left: "-10%", animation: "drift 12s ease-in-out infinite" }}/>
        <div style={{ position: "absolute", width: 300, height: 300, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(88,184,117,.12) 0%, transparent 65%)",
          bottom: "10%", right: "-5%", animation: "drift2 15s ease-in-out infinite" }}/>
        <div style={{ position: "absolute", top: "50%", left: "50%", width: 8, height: 8,
          marginTop: -4, marginLeft: -4 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--auth-accent)",
            opacity: .4, animation: "orbit 8s linear infinite" }}/>
        </div>

        <div style={{ position: "relative", zIndex: 1 }}>
          <TransitionLink href="/" style={{ textDecoration: "none",
            display: "flex", alignItems: "center", gap: ".6rem" }}>
            <span style={{ fontSize: "1.6rem" }}>♻</span>
            <span style={{ fontFamily: "var(--font-display)", color: "var(--auth-accent)",
              fontSize: "1.1rem", fontWeight: 700 }}>ECOleta</span>
          </TransitionLink>
        </div>

        <div style={{ position: "relative", zIndex: 1 }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "2.4rem",
            color: "var(--auth-text)", fontWeight: 700, lineHeight: 1.2, marginBottom: "1.2rem" }}>
            Junte-se ao<br/>movimento.
          </h2>
          <p style={{ color: "var(--auth-muted)", fontSize: ".92rem", lineHeight: 1.8,
            maxWidth: "260px", marginBottom: "2.5rem" }}>
            Milhares de pessoas e empresas ja usam a plataforma para tornar a reciclagem mais facil.
          </p>
          {["Cadastro 100% gratuito", "Solicitacoes aprovadas em 24h",
            "Acompanhe em tempo real", "Suporte via chat integrado"].map(item => (
            <div key={item} style={{ display: "flex", alignItems: "center",
              gap: ".75rem", marginBottom: ".9rem" }}>
              <div style={{ width: 22, height: 22, borderRadius: "50%",
                background: "rgba(47,141,71,.15)", border: "1px solid rgba(47,141,71,.3)",
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span style={{ color: "var(--auth-accent)", fontSize: ".65rem" }}>✓</span>
              </div>
              <span style={{ color: "var(--auth-soft)", fontSize: ".88rem" }}>{item}</span>
            </div>
          ))}
        </div>

        <div style={{ position: "relative", zIndex: 1,
          borderTop: "1px solid var(--auth-border-soft)", paddingTop: "1.5rem" }}>
          <p style={{ color: "var(--auth-soft)", fontSize: ".78rem" }}>
            Ja tem conta?{" "}
            <TransitionLink href="/login"
              style={{ color: "var(--auth-accent)", textDecoration: "none" }}>
              Fazer login →
            </TransitionLink>
          </p>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", display: "flex",
        flexDirection: "column", alignItems: "center", padding: "3rem 2rem" }}>
        <div style={{ width: "100%", maxWidth: "460px" }}>
          <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: ".7rem", marginBottom: "1rem" }}>
            <ThemeToggle compact />
            <TransitionLink href="/"
              style={{ color:"var(--auth-muted)", fontSize:".85rem", textDecoration:"none" }}>
              ← Inicio
            </TransitionLink>
          </div>

          <div className="a1" style={{ marginBottom: "2rem" }}>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.9rem",
              color: "var(--auth-text)", fontWeight: 700, marginBottom: ".3rem" }}>
              Criar conta
            </h1>
            <p style={{ color: "var(--auth-muted)", fontSize: ".88rem" }}>
              Ja tem conta?{" "}
              <TransitionLink href="/login"
                style={{ color: "var(--auth-accent)", textDecoration: "none", fontWeight: 500 }}>
                Entrar
              </TransitionLink>
            </p>
          </div>

          <div className="a2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr",
            gap: ".75rem", marginBottom: "1.8rem" }}>
            {(["usuario", "empresa"] as Tipo[]).map(t => (
              <button key={t} type="button" className="tipo-btn"
                onClick={() => setTipo(t)}
                style={{ padding: ".9rem", borderRadius: "12px", border: "1px solid",
                  borderColor: tipo === t ? "var(--auth-accent)" : "var(--auth-border)",
                  background: tipo === t ? "rgba(47,141,71,.1)" : "var(--auth-surface)",
                  color: tipo === t ? "var(--auth-accent)" : "var(--auth-muted)",
                  fontSize: ".88rem", fontWeight: tipo === t ? 600 : 400,
                  fontFamily: "var(--font-body)", display: "flex",
                  flexDirection: "column", alignItems: "center", gap: ".3rem" }}>
                <span style={{ fontSize: "1.4rem" }}>{t === "usuario" ? "" : ""}</span>
                {t === "usuario" ? "Cidadao" : "Empresa"}
              </button>
            ))}
          </div>

          {erro && (
            <div style={{ background: "var(--auth-danger-bg)", border: "1px solid var(--auth-danger-border)",
              borderRadius: "12px", padding: ".8rem 1rem", color: "var(--auth-danger)",
              fontSize: ".85rem", marginBottom: "1.2rem" }}>
              ! {erro}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div className="section-divider a3">
              <span>Dados pessoais</span><hr/>
            </div>

            <div className="a3">
              <label style={labelStyle}>{tipo === "empresa" ? "Nome da empresa" : "Nome completo"}</label>
              <input type="text" required placeholder={tipo === "empresa" ? "Nome da sua empresa" : "Seu nome completo"}
                style={inputStyle("nome")} {...f("nome")} />
              {erros.nome && <p style={{ color: "var(--auth-danger)", fontSize: ".78rem", marginTop: ".3rem" }}>{erros.nome[0]}</p>}
            </div>

            <div className="a3" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: ".75rem" }}>
              <div>
                <label style={labelStyle}>Email</label>
                <input type="email" required placeholder="seu@email.com"
                  style={inputStyle("email")} {...f("email")} />
                {erros.email && <p style={{ color: "var(--auth-danger)", fontSize: ".78rem", marginTop: ".3rem" }}>{erros.email[0]}</p>}
              </div>
              <div>
                <label style={labelStyle}>Telefone</label>
                <input type="text" placeholder="(11) 99999-0000"
                  style={inputStyle("telefone")} {...f("telefone")} />
              </div>
            </div>

            <div className="a4">
              <label style={labelStyle}>Senha</label>
              <input type="password" required placeholder="Minimo 6 caracteres"
                style={inputStyle("senha")} {...f("senha")} />
              {erros.senha && <p style={{ color: "var(--auth-danger)", fontSize: ".78rem", marginTop: ".3rem" }}>{erros.senha[0]}</p>}
            </div>

            <div className="section-divider a4">
              <span>Endereco</span><hr/>
            </div>

            <div className="a4" style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: ".75rem" }}>
              <div>
                <label style={labelStyle}>Rua / Avenida</label>
                <input type="text" placeholder="Ex: Rua das Flores"
                  style={inputStyle("rua")} {...fe("rua")} />
              </div>
              <div style={{ width: "90px" }}>
                <label style={labelStyle}>Numero</label>
                <input type="text" placeholder="123"
                  style={inputStyle("numero")} {...fe("numero")} />
              </div>
            </div>

            <div className="a4">
              <label style={labelStyle}>
                Complemento{" "}
                <span style={{ color: "var(--auth-soft)", fontWeight: 400, textTransform: "none",
                  letterSpacing: 0, fontSize: ".72rem" }}>(opcional)</span>
              </label>
              <input type="text" placeholder="Apto 42, Bloco B, Casa..."
                style={inputStyle("complemento")} {...fe("complemento")} />
            </div>

            <div className="a5">
              <label style={labelStyle}>Bairro</label>
              <input type="text" placeholder="Ex: Centro"
                style={inputStyle("bairro")} {...fe("bairro")} />
            </div>

            <div className="a5" style={{ display: "grid", gridTemplateColumns: "1fr 80px", gap: ".75rem" }}>
              <div>
                <label style={labelStyle}>Cidade</label>
                <input type="text" placeholder="Ex: Sao Paulo"
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

            {(endereco.rua || endereco.cidade) && (
              <div className="a5" style={{ background: "rgba(47,141,71,.05)",
                border: "1px solid rgba(47,141,71,.15)", borderRadius: "10px",
                padding: ".7rem 1rem" }}>
                <p style={{ color: "var(--auth-soft)", fontSize: ".72rem", fontWeight: 600,
                  textTransform: "uppercase", letterSpacing: "1px", marginBottom: ".3rem" }}>
                  Previa do endereco
                </p>
                <p style={{ color: "var(--auth-accent)", fontSize: ".85rem" }}>
                  {montarEnderecoString()}
                </p>
              </div>
            )}

            {tipo === "empresa" && (
              <>
                <div className="section-divider a5">
                  <span>Dados da empresa</span><hr/>
                </div>
                <div className="a5">
                  <label style={labelStyle}>CNPJ <span style={{ color: "var(--auth-danger)" }}>*</span></label>
                  <input type="text" required placeholder="00.000.000/0001-00"
                    style={inputStyle("cnpj")} {...f("cnpj")} />
                </div>
                <div className="a5">
                  <label style={labelStyle}>Descricao da empresa</label>
                  <textarea rows={3} placeholder="Descreva os servicos da empresa..."
                    style={{ ...inputStyle("descricao"), resize: "none" }}
                    {...f("descricao")} />
                </div>
              </>
            )}

            <div className="a6" style={{ paddingTop: ".4rem" }}>
              <button type="submit" disabled={loading}
                style={{ width: "100%",
                  background: loading ? "rgba(47,141,71,.45)"
                    : "linear-gradient(135deg,var(--auth-accent),var(--auth-accent-2))",
                  color: "var(--auth-button-text)", fontWeight: 700, fontSize: "1rem",
                  padding: "1rem", borderRadius: "12px", border: "none",
                  cursor: loading ? "not-allowed" : "pointer",
                  transition: "all .25s", fontFamily: "var(--font-body)",
                  boxShadow: loading ? "none" : "0 8px 32px rgba(47,141,71,.25)",
                }}>
                {loading ? "Criando conta..." : "Criar conta gratis →"}
              </button>
            </div>
          </form>

          <p className="a6" style={{ color: "var(--auth-muted)", fontSize: ".75rem",
            textAlign: "center", marginTop: "1.5rem", lineHeight: 1.6 }}>
            Ao criar uma conta voce concorda com os termos de uso da plataforma.
          </p>
        </div>
      </div>
    </div>
  );
}
