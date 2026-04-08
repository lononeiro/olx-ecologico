import { useMemo, useState } from "react";
import { router } from "expo-router";
import { useMutation } from "@tanstack/react-query";
import type { RegisterInput } from "@shared";
import {
  AppButton,
  AppCard,
  AppField,
  AppScreen,
  MessageBanner,
  SectionHeader,
} from "@/components/AppUI";
import {
  buildAddressString,
  EMPTY_ADDRESS_FIELDS,
  formatCep,
  getMissingAddressFields,
  hasAddressDetails,
  normalizeCep,
} from "@/lib/address";
import {
  checkEmailAvailability,
  getReadableErrorMessage,
  lookupCep,
  registerMobile,
} from "@/lib/api";
import { STRONG_PASSWORD_HINTS, getStrongPasswordIssues } from "@/lib/password";

type Tipo = "usuario" | "empresa";

export default function RegisterScreen() {
  const [tipo, setTipo] = useState<Tipo>("usuario");
  const [form, setForm] = useState({
    nome: "",
    email: "",
    senha: "",
    cnpj: "",
    descricao: "",
  });
  const [endereco, setEndereco] = useState(EMPTY_ADDRESS_FIELDS);
  const [incluirEndereco, setIncluirEndereco] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [mensagemTone, setMensagemTone] = useState<"success" | "error">("error");
  const [emailStatus, setEmailStatus] = useState("");
  const [cepStatus, setCepStatus] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string | undefined>>({});

  const enderecoPreview = useMemo(() => buildAddressString(endereco), [endereco]);
  const passwordIssues = useMemo(() => getStrongPasswordIssues(form.senha), [form.senha]);

  const registerMutation = useMutation({
    mutationFn: async () => {
      setMensagem("");
      setFieldErrors({});

      if (incluirEndereco && hasAddressDetails(endereco)) {
        const missing = getMissingAddressFields(endereco);
        if (missing.length > 0) {
          throw new Error(`Complete o endereco: ${missing.join(", ")}.`);
        }
      }

      const payload: RegisterInput = {
        nome: form.nome.trim(),
        email: form.email.trim(),
        senha: form.senha,
        telefone: "",
        endereco:
          incluirEndereco && hasAddressDetails(endereco)
            ? buildAddressString(endereco)
            : "",
        tipo,
        cnpj: tipo === "empresa" ? form.cnpj.trim() : undefined,
        descricao: tipo === "empresa" ? form.descricao.trim() : undefined,
      };

      return registerMobile(payload);
    },
    onSuccess: () => {
      setMensagemTone("success");
      setMensagem("Conta criada com sucesso. Agora faca login.");
      setTimeout(() => {
        router.replace("/login");
      }, 1200);
    },
    onError: (error: any) => {
      setMensagemTone("error");
      setMensagem(getReadableErrorMessage(error, "Nao foi possivel criar a conta."));

      if (error?.fieldErrors && typeof error.fieldErrors === "object") {
        const nextErrors: Record<string, string | undefined> = {};
        for (const [key, value] of Object.entries(error.fieldErrors)) {
          nextErrors[key] = Array.isArray(value) ? value[0] : undefined;
        }
        setFieldErrors(nextErrors);
      }
    },
  });

  const handleCheckEmail = async () => {
    if (!form.email.trim()) return;

    try {
      const result = await checkEmailAvailability(form.email.trim());
      setEmailStatus(result.mensagem);
    } catch (error) {
      setEmailStatus(getReadableErrorMessage(error, "Nao foi possivel validar o email."));
    }
  };

  const handleLookupCep = async () => {
    const cep = normalizeCep(endereco.cep);
    if (cep.length !== 8) {
      setCepStatus("Informe um CEP com 8 digitos.");
      return;
    }

    try {
      const result = await lookupCep(cep);
      setEndereco((current) => ({
        ...current,
        cep: normalizeCep(result.cep),
        rua: result.rua || current.rua,
        bairro: result.bairro || current.bairro,
        cidade: result.cidade || current.cidade,
        uf: (result.uf || current.uf).toUpperCase(),
        complemento: current.complemento || result.complemento || "",
      }));
      setCepStatus("CEP encontrado. Revise os dados e informe o numero.");
    } catch (error) {
      setCepStatus(getReadableErrorMessage(error, "Nao foi possivel consultar o CEP."));
    }
  };

  return (
    <AppScreen>
      <AppCard>
        <SectionHeader
          eyebrow="CADASTRO"
          title="Criar conta"
          description="O cadastro inicial segue o fluxo do web: dados principais agora, complementos depois no perfil."
        />
      </AppCard>

      {!!mensagem && <MessageBanner message={mensagem} tone={mensagemTone} />}

      <AppCard>
        <AppField
          label={tipo === "empresa" ? "Nome da empresa" : "Nome completo"}
          value={form.nome}
          onChangeText={(value) => setForm((current) => ({ ...current, nome: value }))}
          placeholder={tipo === "empresa" ? "Nome da sua empresa" : "Seu nome completo"}
          error={fieldErrors.nome}
        />
        <AppField
          label="Email"
          value={form.email}
          onChangeText={(value) => {
            setEmailStatus("");
            setForm((current) => ({ ...current, email: value }));
          }}
          placeholder="seu@email.com"
          autoCapitalize="none"
          keyboardType="email-address"
          error={fieldErrors.email}
        />
        {!!emailStatus && <MessageBanner message={emailStatus} tone="success" />}
        <AppButton label="Verificar email" tone="secondary" onPress={handleCheckEmail} />
        <AppField
          label="Senha"
          value={form.senha}
          onChangeText={(value) => setForm((current) => ({ ...current, senha: value }))}
          placeholder="Crie uma senha forte"
          secureTextEntry
          error={fieldErrors.senha ?? (form.senha ? passwordIssues[0] : undefined)}
          helper={STRONG_PASSWORD_HINTS.join(" | ")}
        />
      </AppCard>

      <AppCard>
        <SectionHeader
          eyebrow="TIPO DE CONTA"
          title={tipo === "usuario" ? "Cidadao" : "Empresa"}
          description="As permissoes e os fluxos seguintes dependem do perfil escolhido."
        />
        <AppButton
          label="Conta de cidadao"
          tone={tipo === "usuario" ? "primary" : "secondary"}
          onPress={() => setTipo("usuario")}
        />
        <AppButton
          label="Conta de empresa"
          tone={tipo === "empresa" ? "primary" : "secondary"}
          onPress={() => setTipo("empresa")}
        />

        {tipo === "empresa" && (
          <>
            <AppField
              label="CNPJ"
              value={form.cnpj}
              onChangeText={(value) => setForm((current) => ({ ...current, cnpj: value }))}
              placeholder="00.000.000/0001-00"
            />
            <AppField
              label="Descricao"
              value={form.descricao}
              onChangeText={(value) =>
                setForm((current) => ({ ...current, descricao: value }))
              }
              placeholder="Voce pode detalhar a empresa agora ou depois."
              multiline
            />
          </>
        )}
      </AppCard>

      <AppCard>
        <SectionHeader
          eyebrow="ENDERECO"
          title="Adicionar agora e opcional"
          description="Se preferir, o endereco pode ser completado depois no perfil."
        />
        <AppButton
          label={incluirEndereco ? "Remover endereco do cadastro" : "Adicionar endereco agora"}
          tone="secondary"
          onPress={() => setIncluirEndereco((current) => !current)}
        />

        {incluirEndereco && (
          <>
            <AppField
              label="CEP"
              value={formatCep(endereco.cep)}
              onChangeText={(value) =>
                setEndereco((current) => ({
                  ...current,
                  cep: normalizeCep(value),
                }))
              }
              placeholder="00000-000"
              keyboardType="numeric"
            />
            <AppButton label="Buscar CEP" tone="secondary" onPress={handleLookupCep} />
            {!!cepStatus && <MessageBanner message={cepStatus} tone="success" />}
            <AppField
              label="Rua / Avenida"
              value={endereco.rua}
              onChangeText={(value) => setEndereco((current) => ({ ...current, rua: value }))}
              placeholder="Ex: Rua das Flores"
            />
            <AppField
              label="Numero"
              value={endereco.numero}
              onChangeText={(value) =>
                setEndereco((current) => ({ ...current, numero: value }))
              }
              placeholder="123"
            />
            <AppField
              label="Complemento"
              value={endereco.complemento}
              onChangeText={(value) =>
                setEndereco((current) => ({ ...current, complemento: value }))
              }
              placeholder="Apto, bloco, referencia"
            />
            <AppField
              label="Bairro"
              value={endereco.bairro}
              onChangeText={(value) =>
                setEndereco((current) => ({ ...current, bairro: value }))
              }
              placeholder="Ex: Centro"
            />
            <AppField
              label="Cidade"
              value={endereco.cidade}
              onChangeText={(value) =>
                setEndereco((current) => ({ ...current, cidade: value }))
              }
              placeholder="Ex: Sao Paulo"
            />
            <AppField
              label="UF"
              value={endereco.uf}
              onChangeText={(value) =>
                setEndereco((current) => ({ ...current, uf: value.toUpperCase().slice(0, 2) }))
              }
              placeholder="SP"
            />
            {!!enderecoPreview && <MessageBanner message={enderecoPreview} tone="success" />}
          </>
        )}
      </AppCard>

      <AppButton
        label={registerMutation.isPending ? "Criando conta..." : "Criar conta"}
        onPress={() => registerMutation.mutate()}
        disabled={registerMutation.isPending}
      />
      <AppButton label="Ja tenho conta" tone="secondary" onPress={() => router.push("/login")} />
    </AppScreen>
  );
}
