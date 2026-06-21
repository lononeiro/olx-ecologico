"use client";

import { useMemo, useRef, useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  buildAddressString,
  formatCep,
  getMissingAddressFields,
  hasAddressDetails,
  normalizeCep,
  parseAddressString,
  type CepLookupResult,
} from "@/lib/address";

interface ProfileData {
  id: number;
  nome: string;
  email: string;
  telefone: string | null;
  endereco: string | null;
  status: string;
  createdAt: string | Date;
  role: {
    id: number;
    nome: string;
  };
  company: {
    id: number;
    cnpj: string;
    descricao: string | null;
    createdAt: string | Date;
  } | null;
}

interface Props {
  initialProfile: ProfileData;
}

export function ProfilePageClient({ initialProfile }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [profile, setProfile] = useState(initialProfile);
  const [formData, setFormData] = useState({
    nome: initialProfile.nome,
    telefone: initialProfile.telefone ?? "",
  });
  const [addressDraft, setAddressDraft] = useState(() =>
    parseAddressString(initialProfile.endereco)
  );
  const [cepLoading, setCepLoading] = useState(false);
  const [cepMessage, setCepMessage] = useState("");
  // Inicia com o CEP já salvo para não disparar busca automática ao abrir.
  const lastFetchedCepRef = useRef(normalizeCep(parseAddressString(initialProfile.endereco).cep));
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const createdAtLabel = useMemo(
    () =>
      new Date(profile.createdAt).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      }),
    [profile.createdAt]
  );
  const companyCreatedAtLabel = useMemo(
    () =>
      profile.company
        ? new Date(profile.company.createdAt).toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "long",
            year: "numeric",
          })
        : "",
    [profile.company]
  );

  const initials = useMemo(() => {
    const parts = profile.nome.split(" ").filter(Boolean);
    return (
      (parts.slice(0, 2).map((p) => p[0]).join("") || "U").toUpperCase()
    );
  }, [profile.nome]);

  const roleLabel = getRoleLabel(profile.role.nome);
  const isAtivo = (profile.status ?? "").toLowerCase() === "ativo";

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    let enderecoPayload = "";
    if (hasAddressDetails(addressDraft)) {
      const missing = getMissingAddressFields(addressDraft);
      if (missing.length > 0) {
        setError(`Complete o endereço: ${missing.join(", ")}.`);
        return;
      }
      enderecoPayload = buildAddressString(addressDraft);
    }

    const response = await fetch("/api/users/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...formData,
        endereco: enderecoPayload,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      const fieldErrors = data?.error;
      if (fieldErrors?.nome?.[0]) {
        setError(fieldErrors.nome[0]);
        return;
      }

      if (fieldErrors?.telefone?.[0]) {
        setError(fieldErrors.telefone[0]);
        return;
      }

      if (fieldErrors?.endereco?.[0]) {
        setError(fieldErrors.endereco[0]);
        return;
      }

      setError("Não foi possível salvar o perfil agora.");
      return;
    }

    setProfile(data);
    setFormData({
      nome: data.nome,
      telefone: data.telefone ?? "",
    });
    const parsed = parseAddressString(data.endereco);
    setAddressDraft(parsed);
    lastFetchedCepRef.current = normalizeCep(parsed.cep);
    setSuccess("Perfil atualizado com sucesso.");
    startTransition(() => router.refresh());
  };

  const buscarCep = async () => {
    const cep = normalizeCep(addressDraft.cep);

    if (cep.length !== 8) {
      setCepMessage("Informe um CEP com 8 dígitos.");
      return;
    }

    setCepLoading(true);
    setCepMessage("");
    lastFetchedCepRef.current = cep;

    try {
      const response = await fetch(`/api/cep/${cep}`);
      const data = await response.json();

      if (!response.ok) {
        setCepMessage(data.error ?? "Não foi possível consultar o CEP.");
        return;
      }

      const cepData = data as CepLookupResult;
      setAddressDraft((current) => ({
        ...current,
        cep: normalizeCep(cepData.cep),
        rua: cepData.rua || current.rua,
        bairro: cepData.bairro || current.bairro,
        cidade: cepData.cidade || current.cidade,
        uf: (cepData.uf || current.uf).toUpperCase(),
        complemento: current.complemento || cepData.complemento || "",
      }));
      setCepMessage("CEP encontrado. Revise os dados e informe o número.");
    } catch {
      setCepMessage("Não foi possível consultar o CEP.");
    } finally {
      setCepLoading(false);
    }
  };

  useEffect(() => {
    const cep = normalizeCep(addressDraft.cep);
    if (cep.length !== 8 || cepLoading || lastFetchedCepRef.current === cep) {
      return;
    }

    void buscarCep();
  }, [addressDraft.cep, cepLoading]);

  const handleAddressDraftChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setAddressDraft((current) => ({
      ...current,
      [name]:
        name === "cep"
          ? normalizeCep(value)
          : name === "uf"
            ? value.toUpperCase().slice(0, 2)
            : value,
    }));
  };

  const addressPreview = useMemo(() => buildAddressString(addressDraft), [addressDraft]);

  return (
    <div className="page-enter profile-page">
      <style>{`
        .profile-page { display: grid; gap: 1.25rem; max-width: 1080px; margin: 0 auto; }

        .profile-hero {
          display: flex;
          align-items: center;
          gap: 1.25rem;
          padding: 1.5rem 1.6rem;
          background: linear-gradient(135deg, rgba(30,122,50,.10), var(--surface) 60%);
        }
        .profile-hero-avatar {
          width: 78px; height: 78px;
          border-radius: 50%;
          display: grid; place-items: center;
          font-size: 1.75rem; font-weight: 800; color: #fff;
          background: linear-gradient(135deg, var(--green), var(--green-dark));
          box-shadow: 0 10px 26px rgba(30,122,50,.30);
          flex-shrink: 0;
        }
        .profile-hero-info { min-width: 0; display: grid; gap: .32rem; }
        .profile-hero-info h1 {
          font-size: clamp(1.4rem, 3vw, 1.95rem);
          font-weight: 800; color: var(--text);
          line-height: 1.1; letter-spacing: -.02em;
        }
        .profile-hero-meta { display: flex; flex-wrap: wrap; gap: .45rem; margin-top: .1rem; }
        .profile-chip {
          display: inline-flex; align-items: center; gap: .35rem;
          padding: .26rem .66rem; border-radius: 999px;
          font-size: .74rem; font-weight: 700; white-space: nowrap;
          background: var(--surface-3); color: var(--text-muted);
        }
        .profile-chip.is-role { background: rgba(30,122,50,.12); color: var(--green-dark); }
        .profile-chip.is-ativo { background: rgba(30,122,50,.12); color: var(--green-dark); }
        .profile-chip .dot { width: 7px; height: 7px; border-radius: 50%; background: currentColor; }
        .profile-hero-sub { font-size: .85rem; color: var(--text-muted); word-break: break-word; }

        .profile-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.5fr) minmax(0, 1fr);
          gap: 1.25rem; align-items: start;
        }
        @media (max-width: 860px) { .profile-grid { grid-template-columns: 1fr; } }

        .profile-card { display: grid; gap: 1.1rem; }
        .profile-card-head h2 { font-size: 1.05rem; font-weight: 700; color: var(--text); }
        .profile-card-head p { margin-top: .2rem; font-size: .84rem; color: var(--text-muted); line-height: 1.5; }

        .profile-field { display: grid; gap: .42rem; }
        .profile-field > .label { font-size: .78rem; font-weight: 600; color: var(--text-muted); }

        .profile-aside { display: grid; gap: 1.25rem; align-content: start; }

        .profile-details { margin: 0; display: grid; }
        .profile-details > div {
          display: flex; align-items: baseline; justify-content: space-between;
          gap: 1rem; padding: .72rem 0; border-bottom: 1px solid var(--border);
        }
        .profile-details > div:last-child { border-bottom: 0; padding-bottom: 0; }
        .profile-details > div:first-child { padding-top: 0; }
        .profile-details dt { font-size: .82rem; color: var(--text-muted); flex-shrink: 0; }
        .profile-details dd {
          margin: 0; font-size: .9rem; font-weight: 600; color: var(--text);
          text-align: right; word-break: break-word;
        }
        .profile-details dd.mono { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }

        .profile-desc-block { padding-top: .72rem; border-top: 1px solid var(--border); }
        .profile-desc-block .label { font-size: .82rem; color: var(--text-muted); }
        .profile-desc-block p { margin-top: .3rem; font-size: .9rem; color: var(--text); line-height: 1.6; }

        .profile-empty { font-size: .88rem; color: var(--text-muted); line-height: 1.6; }

        .profile-alert { padding: .85rem 1.1rem; border-radius: 14px; font-size: .88rem; font-weight: 500; }
        .profile-alert.is-error { background: var(--red-light); border: 1px solid rgba(184,50,40,.2); color: var(--red); }
        .profile-alert.is-success { background: rgba(30,122,50,.08); border: 1px solid rgba(30,122,50,.2); color: var(--green-dark); }

        .profile-address-box, .profile-builder {
          padding: 1rem 1.1rem; border-radius: 14px;
          background: var(--surface-3); border: 1px solid var(--border);
          display: grid; gap: .85rem;
        }
        .profile-builder-head { display: grid; gap: .15rem; }
        .profile-builder-head .label { font-size: .82rem; font-weight: 700; color: var(--text); }
        .profile-builder-hint { font-size: .78rem; color: var(--text-muted); }
        .profile-preview {
          padding: .85rem 1rem; border-radius: 12px;
          background: rgba(30,122,50,.08); border: 1px solid rgba(30,122,50,.18);
        }
        .profile-preview .label {
          font-size: .72rem; text-transform: uppercase; letter-spacing: 1.2px;
          color: var(--text-faint); font-weight: 700;
        }
        .profile-preview p { margin: .3rem 0 0; color: var(--text); font-weight: 600; }

        .profile-form-foot {
          display: flex; align-items: center; justify-content: space-between;
          gap: .75rem; flex-wrap: wrap;
          padding-top: 1rem; border-top: 1px solid var(--border);
        }
        .profile-form-foot p { font-size: .78rem; color: var(--text-faint); max-width: 320px; }
      `}</style>

      <section className="card profile-hero">
        <div className="profile-hero-avatar" aria-hidden="true">{initials}</div>
        <div className="profile-hero-info">
          <p className="section-label" style={{ marginBottom: 0 }}>Minha conta</p>
          <h1>{profile.nome}</h1>
          <div className="profile-hero-meta">
            <span className="profile-chip is-role">{roleLabel}</span>
            <span className={`profile-chip ${isAtivo ? "is-ativo" : ""}`}>
              <span className="dot" aria-hidden="true" />
              {isAtivo ? "Conta ativa" : profile.status}
            </span>
          </div>
          <p className="profile-hero-sub">{profile.email} · Membro desde {createdAtLabel}</p>
        </div>
      </section>

      {error ? <div className="profile-alert is-error" role="alert">{error}</div> : null}
      {success ? <div className="profile-alert is-success" role="status">{success}</div> : null}

      <div className="profile-grid">
        <form className="card profile-card" onSubmit={handleSubmit}>
          <div className="profile-card-head">
            <p className="section-label">Dados pessoais</p>
            <h2>Informações editáveis</h2>
            <p>Atualize seu nome, telefone e endereço. Os demais dados são apenas leitura.</p>
          </div>

          <ProfileField label="Nome">
            <input
              type="text"
              name="nome"
              value={formData.nome}
              onChange={handleChange}
              className="input-field"
              maxLength={120}
            />
          </ProfileField>

          <ProfileField label="Telefone">
            <input
              type="text"
              name="telefone"
              value={formData.telefone}
              onChange={handleChange}
              className="input-field"
              placeholder="Informe um telefone"
            />
          </ProfileField>

          <div className="profile-builder">
            <div className="profile-builder-head">
              <span className="label">Endereço</span>
              <span className="profile-builder-hint">Edite os campos ou busque pelo CEP para preencher.</span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: ".75rem", alignItems: "end" }}>
              <ProfileField label="CEP">
                <input
                  type="text"
                  name="cep"
                  value={formatCep(addressDraft.cep)}
                  onChange={handleAddressDraftChange}
                  className="input-field"
                  placeholder="00000-000"
                />
              </ProfileField>
              <button type="button" className="btn btn-secondary" onClick={buscarCep} disabled={cepLoading}>
                {cepLoading ? "Buscando..." : "Buscar CEP"}
              </button>
            </div>

            {cepMessage ? <p style={{ margin: 0, fontSize: ".82rem", color: "var(--text-muted)" }}>{cepMessage}</p> : null}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 120px", gap: ".75rem" }}>
              <ProfileField label="Rua / Avenida">
                <input type="text" name="rua" value={addressDraft.rua} onChange={handleAddressDraftChange} className="input-field" placeholder="Ex: Rua das Flores" />
              </ProfileField>
              <ProfileField label="Número">
                <input type="text" name="numero" value={addressDraft.numero} onChange={handleAddressDraftChange} className="input-field" placeholder="123" />
              </ProfileField>
            </div>

            <ProfileField label="Complemento">
              <input type="text" name="complemento" value={addressDraft.complemento} onChange={handleAddressDraftChange} className="input-field" placeholder="Apto, bloco, referência..." />
            </ProfileField>

            <ProfileField label="Bairro">
              <input type="text" name="bairro" value={addressDraft.bairro} onChange={handleAddressDraftChange} className="input-field" placeholder="Ex: Centro" />
            </ProfileField>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 90px", gap: ".75rem" }}>
              <ProfileField label="Cidade">
                <input type="text" name="cidade" value={addressDraft.cidade} onChange={handleAddressDraftChange} className="input-field" placeholder="Ex: São Paulo" />
              </ProfileField>
              <ProfileField label="UF">
                <input type="text" name="uf" value={addressDraft.uf} onChange={handleAddressDraftChange} className="input-field" placeholder="SP" maxLength={2} />
              </ProfileField>
            </div>

            {addressPreview ? (
              <div className="profile-preview">
                <p className="label">Prévia do endereço</p>
                <p>{addressPreview}</p>
              </div>
            ) : null}
          </div>

          <div className="profile-form-foot">
            <p>Campos sensíveis continuam protegidos e não podem ser alterados nesta tela.</p>
            <button type="submit" className="btn btn-primary" disabled={isPending}>
              {isPending ? "Salvando..." : "Salvar alterações"}
            </button>
          </div>
        </form>

        <div className="profile-aside">
          <div className="card profile-card">
            <div className="profile-card-head">
              <p className="section-label">Informações da conta</p>
              <h2>Dados da sua conta</h2>
            </div>

            <dl className="profile-details">
              <DetailRow label="Email" value={profile.email} />
              <DetailRow label="Telefone" value={profile.telefone || "Não informado"} />
              <DetailRow label="Perfil" value={roleLabel} />
              <DetailRow label="Status" value={isAtivo ? "Ativo" : profile.status} />
              <DetailRow label="Membro desde" value={createdAtLabel} />
            </dl>
          </div>

          {profile.company ? (
            <div className="card profile-card">
              <div className="profile-card-head">
                <p className="section-label">Empresa vinculada</p>
                <h2>Dados da empresa</h2>
              </div>

              <dl className="profile-details">
                <DetailRow label="CNPJ" value={profile.company.cnpj} mono />
                <DetailRow label="Cadastro" value={companyCreatedAtLabel} />
              </dl>

              <div className="profile-desc-block">
                <span className="label">Descrição</span>
                <p>{profile.company.descricao || "Não informada"}</p>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function getRoleLabel(role: string) {
  const r = (role ?? "").toLowerCase();
  if (r === "admin") return "Administrador";
  if (r === "empresa") return "Empresa parceira";
  if (r === "usuario") return "Cidadão";
  return role;
}

function ProfileField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="profile-field">
      <span className="label">{label}</span>
      {children}
    </label>
  );
}

function DetailRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <dt>{label}</dt>
      <dd className={mono ? "mono" : undefined}>{value}</dd>
    </div>
  );
}
