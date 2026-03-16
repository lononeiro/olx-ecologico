"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface MaterialTipo { id: number; nome: string; }
interface UserProfile  { nome: string; endereco: string | null; }

type ModoEndereco = "perfil" | "novo";

export default function NovaSolicitacaoPage() {
  const router = useRouter();

  const [materiais, setMateriais]   = useState<MaterialTipo[]>([]);
  const [perfil, setPerfil]         = useState<UserProfile | null>(null);
  const [modoEndereco, setModo]     = useState<ModoEndereco>("perfil");

  const [form, setForm] = useState({
    titulo: "", descricao: "", quantidade: "", materialId: "", imagens: "",
  });

  // Campos separados do endereço novo
  const [endNovo, setEndNovo] = useState({
    rua: "", numero: "", complemento: "", bairro: "", cidade: "", uf: "",
  });

  const [erros, setErros]     = useState<Record<string, string[]>>({});
  const [erro, setErro]       = useState("");
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);

  // Busca materiais e perfil do usuário
  useEffect(() => {
    fetch("/api/materiais").then(r => r.json()).then(setMateriais);
    fetch("/api/users/me").then(r => r.json()).then(data => {
      setPerfil(data);
      // Se não tiver endereço no perfil, já abre o formulário novo
      if (!data.endereco) setModo("novo");
    });
  }, []);

  /** Monta a string de endereço novo a partir dos campos separados */
  function montarEnderecoNovo() {
    const { rua, numero, complemento, bairro, cidade, uf } = endNovo;
    return [
      rua && numero ? `${rua}, ${numero}` : rua,
      complemento,
      bairro,
      cidade && uf ? `${cidade} - ${uf}` : cidade || uf,
    ].filter(Boolean).join(", ");
  }

  function getEnderecoFinal() {
    if (modoEndereco === "perfil") return perfil?.endereco ?? "";
    return montarEnderecoNovo();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(""); setErros({}); setLoading(true);

    const endereco = getEnderecoFinal();
    if (!endereco.trim()) {
      setErro("Informe um endereço para a coleta.");
      setLoading(false);
      return;
    }
    if (endereco.trim().length < 5) {
      setErro("O endereço cadastrado no perfil é muito curto. Use a opção \"Informar outro\" e preencha o endereço completo.");
      setModo("novo");
      setLoading(false);
      return;
    }

    const imagens = form.imagens.split(/[\n,]/).map(u => u.trim()).filter(Boolean);

    const res = await fetch("/api/solicitacoes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, materialId: Number(form.materialId), endereco, imagens }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      if (typeof data.error === "object") {
        setErros(data.error);
        // Mostra resumo legível se disponível
        if (data.resumo) setErro("Verifique os campos: " + data.resumo);
      } else {
        setErro(data.error ?? "Erro ao criar solicitação.");
      }
      return;
    }
    router.push(`/dashboard/solicitacoes/${data.id}`);
  }

  const f = (key: keyof typeof form) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm({ ...form, [key]: e.target.value }),
    onFocus: () => setFocused(key),
    onBlur:  () => setFocused(null),
  });

  const fe = (key: keyof typeof endNovo) => ({
    value: endNovo[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      setEndNovo({ ...endNovo, [key]: e.target.value }),
    onFocus: () => setFocused(key),
    onBlur:  () => setFocused(null),
  });

  const labelStyle: React.CSSProperties = {
    display: "block", fontSize: ".78rem", fontWeight: 600,
    color: "var(--text-muted)", textTransform: "uppercase",
    letterSpacing: ".8px", marginBottom: ".4rem",
  };

  const inputStyle = (name: string): React.CSSProperties => ({
    width: "100%", fontFamily: "var(--font)", fontSize: ".92rem",
    color: "var(--text)", background: "var(--surface)",
    border: `1.5px solid ${focused === name ? "var(--green)" : "var(--border)"}`,
    borderRadius: "var(--radius-sm)", padding: ".65rem 1rem",
    outline: "none", transition: "var(--transition)", boxSizing: "border-box",
    boxShadow: focused === name ? "0 0 0 3px rgba(45,138,62,.1)" : "none",
  });

  const enderecoNovoPreviw = montarEnderecoNovo();

  return (
    <div style={{ maxWidth: 700 }}>

      {/* Header */}
      <div className="anim-fade-up" style={{ marginBottom: "2rem" }}>
        <Link href="/dashboard" style={{
          display: "inline-flex", alignItems: "center", gap: ".4rem",
          fontSize: ".82rem", color: "var(--text-muted)", textDecoration: "none",
          marginBottom: ".75rem", transition: "color .15s",
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m15 18-6-6 6-6"/>
          </svg>
          Voltar ao painel
        </Link>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--text)" }}>
          Nova Solicitação
        </h1>
        <p style={{ fontSize: ".88rem", color: "var(--text-muted)", marginTop: ".3rem" }}>
          Preencha os dados do material que deseja reciclar.
        </p>
      </div>

      {erro && (
        <div className="anim-fade-up" style={{
          background: "var(--red-light)", border: "1px solid rgba(192,57,43,.2)",
          borderRadius: "var(--radius-sm)", padding: ".85rem 1rem",
          color: "var(--red)", fontSize: ".88rem", marginBottom: "1.25rem",
          display: "flex", alignItems: "center", gap: ".5rem",
        }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/>
          </svg>
          {erro}
        </div>
      )}

      <div className="card anim-fade-up stagger-2">
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.35rem" }}>

          {/* ── Informações do material ─────────────────────── */}
          <div style={{ paddingBottom: "1.25rem", borderBottom: "1px solid var(--border)" }}>
            <p className="section-label" style={{ marginBottom: "1rem" }}>Informações do material</p>

            <div style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
              {/* Título */}
              <div>
                <label style={labelStyle}>Título <span style={{ color: "var(--red)" }}>*</span></label>
                <input type="text" required placeholder="Ex: Papelão e revistas para reciclagem"
                  style={inputStyle("titulo")} {...f("titulo")} />
                {erros.titulo && <p style={{ fontSize: ".78rem", color: "var(--red)", marginTop: ".3rem" }}>{erros.titulo[0]}</p>}
              </div>

              {/* Material + Quantidade */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <label style={labelStyle}>Tipo de material <span style={{ color: "var(--red)" }}>*</span></label>
                  <select required style={{ ...inputStyle("materialId"), cursor: "pointer" }} {...f("materialId")}>
                    <option value="">Selecionar...</option>
                    {materiais.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
                  </select>
                  {erros.materialId && <p style={{ fontSize: ".78rem", color: "var(--red)", marginTop: ".3rem" }}>{erros.materialId[0]}</p>}
                </div>
                <div>
                  <label style={labelStyle}>Quantidade <span style={{ color: "var(--red)" }}>*</span></label>
                  <input type="text" required placeholder="Ex: 5 sacos, ~10 kg"
                    style={inputStyle("quantidade")} {...f("quantidade")} />
                  {erros.quantidade && <p style={{ fontSize: ".78rem", color: "var(--red)", marginTop: ".3rem" }}>{erros.quantidade[0]}</p>}
                </div>
              </div>

              {/* Descrição */}
              <div>
                <label style={labelStyle}>Descrição <span style={{ color: "var(--red)" }}>*</span></label>
                <textarea required rows={4}
                  placeholder="Descreva o material, condições e informações relevantes..."
                  style={{ ...inputStyle("descricao"), resize: "none" }}
                  value={form.descricao}
                  onChange={e => setForm({ ...form, descricao: e.target.value })}
                  onFocus={() => setFocused("descricao")}
                  onBlur={() => setFocused(null)}
                />
                {erros.descricao && <p style={{ fontSize: ".78rem", color: "var(--red)", marginTop: ".3rem" }}>{erros.descricao[0]}</p>}
              </div>

              {/* Imagens */}
              <div>
                <label style={labelStyle}>
                  URLs de imagens{" "}
                  <span style={{ textTransform: "none", fontWeight: 400, letterSpacing: 0, fontSize: ".75rem" }}>
                    (opcional)
                  </span>
                </label>
                <textarea rows={2}
                  placeholder="https://exemplo.com/foto.jpg (uma por linha)"
                  style={{ ...inputStyle("imagens"), resize: "none" }}
                  value={form.imagens}
                  onChange={e => setForm({ ...form, imagens: e.target.value })}
                  onFocus={() => setFocused("imagens")}
                  onBlur={() => setFocused(null)}
                />
              </div>
            </div>
          </div>

          {/* ── Endereço de coleta ──────────────────────────── */}
          <div>
            <p className="section-label" style={{ marginBottom: "1rem" }}>Endereço de coleta</p>

            {/* Toggle */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: ".75rem", marginBottom: "1.25rem" }}>
              {/* Opção: usar endereço do perfil */}
              <button type="button"
                onClick={() => setModo("perfil")}
                disabled={!perfil?.endereco}
                style={{
                  padding: "1rem", borderRadius: "var(--radius-sm)",
                  border: `1.5px solid ${modoEndereco === "perfil" ? "var(--green)" : "var(--border)"}`,
                  background: modoEndereco === "perfil" ? "rgba(45,138,62,.06)" : "var(--surface)",
                  cursor: perfil?.endereco ? "pointer" : "not-allowed",
                  opacity: perfil?.endereco ? 1 : .45,
                  transition: "var(--transition)", textAlign: "left",
                  fontFamily: "var(--font)",
                }}>
                <div style={{ display: "flex", alignItems: "center", gap: ".5rem", marginBottom: ".4rem" }}>
                  <div style={{
                    width: 18, height: 18, borderRadius: "50%",
                    border: `2px solid ${modoEndereco === "perfil" ? "var(--green)" : "var(--border)"}`,
                    background: modoEndereco === "perfil" ? "var(--green)" : "transparent",
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                    transition: "var(--transition)",
                  }}>
                    {modoEndereco === "perfil" && (
                      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5">
                        <path d="M20 6 9 17l-5-5"/>
                      </svg>
                    )}
                  </div>
                  <span style={{
                    fontSize: ".85rem", fontWeight: 600,
                    color: modoEndereco === "perfil" ? "var(--green-dark)" : "var(--text)",
                  }}>
                    Usar do perfil
                  </span>
                </div>
                <p style={{
                  fontSize: ".78rem", color: "var(--text-muted)", lineHeight: 1.5,
                  paddingLeft: "1.6rem",
                  overflow: "hidden", textOverflow: "ellipsis",
                  display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const,
                }}>
                  {perfil?.endereco ?? "Sem endereço cadastrado"}
                </p>
              </button>

              {/* Opção: informar novo endereço */}
              <button type="button"
                onClick={() => setModo("novo")}
                style={{
                  padding: "1rem", borderRadius: "var(--radius-sm)",
                  border: `1.5px solid ${modoEndereco === "novo" ? "var(--green)" : "var(--border)"}`,
                  background: modoEndereco === "novo" ? "rgba(45,138,62,.06)" : "var(--surface)",
                  cursor: "pointer", transition: "var(--transition)", textAlign: "left",
                  fontFamily: "var(--font)",
                }}>
                <div style={{ display: "flex", alignItems: "center", gap: ".5rem", marginBottom: ".4rem" }}>
                  <div style={{
                    width: 18, height: 18, borderRadius: "50%",
                    border: `2px solid ${modoEndereco === "novo" ? "var(--green)" : "var(--border)"}`,
                    background: modoEndereco === "novo" ? "var(--green)" : "transparent",
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                    transition: "var(--transition)",
                  }}>
                    {modoEndereco === "novo" && (
                      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5">
                        <path d="M20 6 9 17l-5-5"/>
                      </svg>
                    )}
                  </div>
                  <span style={{
                    fontSize: ".85rem", fontWeight: 600,
                    color: modoEndereco === "novo" ? "var(--green-dark)" : "var(--text)",
                  }}>
                    Informar outro
                  </span>
                </div>
                <p style={{ fontSize: ".78rem", color: "var(--text-muted)", lineHeight: 1.5, paddingLeft: "1.6rem" }}>
                  Preencher um endereço diferente do perfil
                </p>
              </button>
            </div>

            {/* Formulário de endereço novo */}
            {modoEndereco === "novo" && (
              <div className="anim-scale-in" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>

                {/* Rua + Número */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 90px", gap: ".75rem" }}>
                  <div>
                    <label style={labelStyle}>Rua / Avenida</label>
                    <input type="text" placeholder="Ex: Rua das Flores"
                      style={inputStyle("rua")} {...fe("rua")} />
                  </div>
                  <div>
                    <label style={labelStyle}>Número</label>
                    <input type="text" placeholder="123"
                      style={inputStyle("numero")} {...fe("numero")} />
                  </div>
                </div>

                {/* Complemento */}
                <div>
                  <label style={labelStyle}>
                    Complemento{" "}
                    <span style={{ textTransform: "none", fontWeight: 400, letterSpacing: 0, fontSize: ".75rem" }}>
                      (opcional)
                    </span>
                  </label>
                  <input type="text" placeholder="Apto 42, Bloco B, Casa..."
                    style={inputStyle("complemento")} {...fe("complemento")} />
                </div>

                {/* Bairro */}
                <div>
                  <label style={labelStyle}>Bairro</label>
                  <input type="text" placeholder="Ex: Centro"
                    style={inputStyle("bairro")} {...fe("bairro")} />
                </div>

                {/* Cidade + UF */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 80px", gap: ".75rem" }}>
                  <div>
                    <label style={labelStyle}>Cidade</label>
                    <input type="text" placeholder="Ex: São Paulo"
                      style={inputStyle("cidade")} {...fe("cidade")} />
                  </div>
                  <div>
                    <label style={labelStyle}>UF</label>
                    <input type="text" placeholder="SP" maxLength={2}
                      style={{ ...inputStyle("uf"), textTransform: "uppercase" }}
                      value={endNovo.uf}
                      onChange={e => setEndNovo({ ...endNovo, uf: e.target.value.toUpperCase() })}
                      onFocus={() => setFocused("uf")}
                      onBlur={() => setFocused(null)}
                    />
                  </div>
                </div>

                {/* Preview */}
                {enderecoNovoPreviw && (
                  <div style={{
                    background: "rgba(45,138,62,.05)", border: "1px solid rgba(45,138,62,.15)",
                    borderRadius: "var(--radius-sm)", padding: ".7rem 1rem",
                  }}>
                    <p style={{ fontSize: ".72rem", fontWeight: 700, color: "var(--text-faint)",
                      textTransform: "uppercase", letterSpacing: "1px", marginBottom: ".3rem" }}>
                      Prévia do endereço
                    </p>
                    <p style={{ fontSize: ".88rem", color: "var(--green-dark)", fontWeight: 500 }}>
                      {enderecoNovoPreviw}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Erro de validação do endereço */}
            {erros.endereco && (
              <p style={{ fontSize: ".82rem", color: "var(--red)",
                display: "flex", alignItems: "center", gap: ".35rem" }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/>
                </svg>
                {erros.endereco[0]}
              </p>
            )}

            {/* Endereço do perfil selecionado */}
            {modoEndereco === "perfil" && perfil?.endereco && (
              <div className="anim-scale-in" style={{
                background: "rgba(45,138,62,.05)", border: "1px solid rgba(45,138,62,.15)",
                borderRadius: "var(--radius-sm)", padding: ".85rem 1rem",
                display: "flex", alignItems: "flex-start", gap: ".6rem",
              }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2" style={{ flexShrink: 0, marginTop: "2px" }}>
                  <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
                <p style={{ fontSize: ".88rem", color: "var(--green-dark)", fontWeight: 500, lineHeight: 1.5 }}>
                  {perfil.endereco}
                </p>
              </div>
            )}
          </div>

          {/* ── Ações ───────────────────────────────────────── */}
          <div style={{ display: "flex", gap: ".75rem", paddingTop: ".25rem" }}>
            <button type="submit" disabled={loading} className="btn btn-primary">
              {loading ? "Enviando..." : "Criar solicitação"}
            </button>
            <button type="button" onClick={() => router.back()} className="btn btn-secondary">
              Cancelar
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}