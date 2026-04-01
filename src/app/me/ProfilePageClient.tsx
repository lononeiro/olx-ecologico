"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

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
    endereco: initialProfile.endereco ?? "",
  });
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const createdAtLabel = useMemo(
    () => new Date(profile.createdAt).toLocaleString("pt-BR"),
    [profile.createdAt]
  );
  const companyCreatedAtLabel = useMemo(
    () =>
      profile.company
        ? new Date(profile.company.createdAt).toLocaleString("pt-BR")
        : "",
    [profile.company]
  );

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleCopyId = async () => {
    await navigator.clipboard.writeText(String(profile.id));
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    const response = await fetch("/api/users/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
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

      setError("Nao foi possivel salvar o perfil agora.");
      return;
    }

    setProfile(data);
    setFormData({
      nome: data.nome,
      telefone: data.telefone ?? "",
      endereco: data.endereco ?? "",
    });
    setSuccess("Perfil atualizado com sucesso.");
    startTransition(() => router.refresh());
  };

  return (
    <div className="page-enter" style={{ display: "grid", gap: "1.5rem" }}>
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "1rem",
          flexWrap: "wrap",
        }}
      >
        <div>
          <p className="section-label" style={{ marginBottom: ".4rem" }}>
            Minha Conta
          </p>
          <h1
            style={{
              fontSize: "clamp(1.6rem, 3vw, 2.1rem)",
              fontWeight: 800,
              color: "var(--text)",
              lineHeight: 1.15,
              letterSpacing: "-.04em",
            }}
          >
            Meu Perfil
          </h1>
          <p style={{ marginTop: ".45rem", color: "var(--text-muted)", fontSize: ".92rem" }}>
            Visualize os dados reais da sua conta e edite apenas as informacoes permitidas.
          </p>
        </div>

        <div
          className="card"
          style={{
            minWidth: 220,
            padding: "1rem 1.1rem",
            display: "grid",
            gap: ".55rem",
            background: "linear-gradient(135deg, var(--surface), var(--surface-3))",
          }}
        >
          <span className="section-label" style={{ marginBottom: 0 }}>
            Codigo do usuario
          </span>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: ".8rem",
            }}
          >
            <span
              style={{
                fontSize: "1.15rem",
                fontWeight: 800,
                color: "var(--text)",
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
              }}
            >
              #{profile.id}
            </span>
            <button
              type="button"
              onClick={handleCopyId}
              className="btn btn-secondary"
              style={{ padding: ".45rem .75rem", fontSize: ".78rem" }}
            >
              {copied ? "Copiado" : "Copiar"}
            </button>
          </div>
          <p style={{ fontSize: ".76rem", color: "var(--text-faint)" }}>
            Identificador interno da sua conta.
          </p>
        </div>
      </div>

      {error && (
        <div
          className="card"
          style={{
            padding: "1rem 1.1rem",
            background: "var(--red-light)",
            borderColor: "rgba(184,50,40,.18)",
            color: "var(--red)",
          }}
        >
          {error}
        </div>
      )}

      {success && (
        <div
          className="card"
          style={{
            padding: "1rem 1.1rem",
            background: "rgba(30,122,50,.08)",
            borderColor: "rgba(30,122,50,.18)",
            color: "var(--green-dark)",
          }}
        >
          {success}
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "1.5rem",
        }}
      >
        <form className="card" onSubmit={handleSubmit} style={{ display: "grid", gap: "1.1rem" }}>
          <div>
            <p className="section-label">Dados Pessoais</p>
            <h2 style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--text)" }}>
              Informacoes editaveis
            </h2>
            <p style={{ marginTop: ".25rem", fontSize: ".86rem", color: "var(--text-muted)" }}>
              Nome, telefone e endereco podem ser atualizados aqui.
            </p>
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

          <ProfileField label="Endereco">
            <textarea
              name="endereco"
              value={formData.endereco}
              onChange={handleChange}
              className="input-field"
              rows={4}
              placeholder="Informe seu endereco"
              style={{ resize: "vertical" }}
            />
          </ProfileField>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: ".75rem",
              flexWrap: "wrap",
              paddingTop: ".35rem",
            }}
          >
            <p style={{ fontSize: ".78rem", color: "var(--text-faint)" }}>
              Campos sensiveis continuam protegidos e nao podem ser alterados nesta tela.
            </p>
            <button type="submit" className="btn btn-primary" disabled={isPending}>
              {isPending ? "Salvando..." : "Salvar alteracoes"}
            </button>
          </div>
        </form>

        <div style={{ display: "grid", gap: "1rem" }}>
          <div className="card" style={{ display: "grid", gap: ".8rem" }}>
            <div>
              <p className="section-label">Informacoes da Conta</p>
              <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text)" }}>
                Dados somente leitura
              </h2>
            </div>

            <ReadOnlyRow label="Email" value={profile.email} />
            <ReadOnlyRow label="Status" value={profile.status} />
            <ReadOnlyRow label="Perfil" value={profile.role.nome} />
            <ReadOnlyRow label="Role ID" value={String(profile.role.id)} mono />
            <ReadOnlyRow label="Criado em" value={createdAtLabel} />
          </div>

          <div className="card" style={{ display: "grid", gap: ".8rem" }}>
            <div>
              <p className="section-label">Empresa Vinculada</p>
              <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text)" }}>
                Relacao atual da conta
              </h2>
            </div>

            {profile.company ? (
              <>
                <ReadOnlyRow label="Empresa ID" value={String(profile.company.id)} mono />
                <ReadOnlyRow label="CNPJ" value={profile.company.cnpj} mono />
                <ReadOnlyRow
                  label="Descricao"
                  value={profile.company.descricao || "Nao informada"}
                  multiline
                />
                <ReadOnlyRow label="Cadastro da empresa" value={companyCreatedAtLabel} />
              </>
            ) : (
              <p style={{ fontSize: ".88rem", color: "var(--text-muted)", lineHeight: 1.6 }}>
                Nenhuma empresa vinculada a este usuario no momento.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ProfileField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label style={{ display: "grid", gap: ".45rem" }}>
      <span
        style={{
          fontSize: ".74rem",
          textTransform: "uppercase",
          letterSpacing: "1.5px",
          fontWeight: 700,
          color: "var(--text-faint)",
        }}
      >
        {label}
      </span>
      {children}
    </label>
  );
}

function ReadOnlyRow({
  label,
  value,
  mono,
  multiline,
}: {
  label: string;
  value: string;
  mono?: boolean;
  multiline?: boolean;
}) {
  return (
    <div
      style={{
        padding: ".9rem 1rem",
        borderRadius: 14,
        background: "var(--surface-3)",
        border: "1px solid var(--border)",
      }}
    >
      <p
        style={{
          fontSize: ".7rem",
          textTransform: "uppercase",
          letterSpacing: "1.4px",
          fontWeight: 700,
          color: "var(--text-faint)",
          marginBottom: ".32rem",
        }}
      >
        {label}
      </p>
      <p
        style={{
          fontSize: ".92rem",
          color: "var(--text)",
          fontWeight: 600,
          lineHeight: multiline ? 1.6 : 1.4,
          whiteSpace: multiline ? "pre-line" : "normal",
          fontFamily: mono ? "ui-monospace, SFMono-Regular, Menlo, monospace" : undefined,
        }}
      >
        {value}
      </p>
    </div>
  );
}
