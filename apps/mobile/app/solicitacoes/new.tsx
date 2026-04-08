import { useMemo, useState } from "react";
import { router } from "expo-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { solicitacaoCreateSchema } from "@shared";
import {
  AppButton,
  AppCard,
  AppField,
  AppScreen,
  LoadingCard,
  MessageBanner,
  SectionHeader,
} from "@/components/AppUI";
import {
  buildAddressString,
  EMPTY_ADDRESS_FIELDS,
  formatCep,
  getMissingAddressFields,
  normalizeCep,
} from "@/lib/address";
import {
  createSolicitacao,
  getMateriais,
  getMyProfile,
  getReadableErrorMessage,
  lookupCep,
} from "@/lib/api";
import { useProtectedRoute } from "@/lib/navigation";
import { withAutoRefresh } from "@/lib/session";

export default function NewSolicitacaoScreen() {
  const { accessToken, hasAccess, isLoading, refreshSession } =
    useProtectedRoute(["usuario"]);
  const [form, setForm] = useState({
    titulo: "",
    materialId: "",
    quantidade: "",
    descricao: "",
  });
  const [modoEndereco, setModoEndereco] = useState<"perfil" | "novo">("perfil");
  const [endereco, setEndereco] = useState(EMPTY_ADDRESS_FIELDS);
  const [imagens, setImagens] = useState<string[]>([]);
  const [imagemAtual, setImagemAtual] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [mensagemTone, setMensagemTone] = useState<"success" | "error">("error");

  const materialsQuery = useQuery({
    queryKey: ["materiais"],
    enabled: hasAccess && !isLoading,
    queryFn: getMateriais,
  });

  const profileQuery = useQuery({
    queryKey: ["profile", "new-request"],
    enabled: hasAccess && !isLoading,
    queryFn: async () =>
      withAutoRefresh(accessToken, refreshSession, (token) => getMyProfile(token)),
  });

  const enderecoPreview = useMemo(() => buildAddressString(endereco), [endereco]);
  const enderecoFinal =
    modoEndereco === "perfil" ? profileQuery.data?.endereco ?? "" : enderecoPreview;

  const createMutation = useMutation({
    mutationFn: async () => {
      if (modoEndereco === "novo") {
        const missing = getMissingAddressFields(endereco);
        if (missing.length > 0) {
          throw new Error(`Complete o endereco: ${missing.join(", ")}.`);
        }
      }

      const payload = {
        titulo: form.titulo.trim(),
        descricao: form.descricao.trim(),
        quantidade: form.quantidade.trim(),
        endereco: enderecoFinal.trim(),
        materialId: Number(form.materialId),
        imagens,
      };

      const parsed = solicitacaoCreateSchema.safeParse(payload);
      if (!parsed.success) {
        throw new Error(parsed.error.issues[0]?.message ?? "Revise os dados da solicitacao.");
      }

      return withAutoRefresh(accessToken, refreshSession, (token) =>
        createSolicitacao(token, parsed.data)
      );
    },
    onSuccess: (data) => {
      setMensagemTone("success");
      setMensagem("Solicitacao criada com sucesso.");
      setTimeout(() => router.replace(`/solicitacoes/${data.id}` as any), 900);
    },
    onError: (error) => {
      setMensagemTone("error");
      setMensagem(
        getReadableErrorMessage(error, "Nao foi possivel criar a solicitacao.")
      );
    },
  });

  const buscarCep = async () => {
    const cep = normalizeCep(endereco.cep);
    if (cep.length !== 8) {
      setMensagemTone("error");
      setMensagem("Informe um CEP com 8 digitos.");
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
      setMensagemTone("success");
      setMensagem("CEP encontrado. Revise os dados e informe o numero.");
    } catch (error) {
      setMensagemTone("error");
      setMensagem(getReadableErrorMessage(error, "Nao foi possivel consultar o CEP."));
    }
  };

  const addImagem = () => {
    const value = imagemAtual.trim();
    if (!value) return;

    if (imagens.includes(value)) {
      setMensagemTone("error");
      setMensagem("Essa imagem ja foi adicionada.");
      return;
    }

    if (imagens.length >= 5) {
      setMensagemTone("error");
      setMensagem("Voce pode adicionar no maximo 5 imagens.");
      return;
    }

    setImagens((current) => [...current, value]);
    setImagemAtual("");
    setMensagemTone("success");
    setMensagem("Imagem adicionada a solicitacao.");
  };

  return (
    <AppScreen>
      <AppCard>
        <SectionHeader
          eyebrow="NOVA SOLICITACAO"
          title="Criar coleta"
          description="O fluxo segue o web: material, descricao, endereco e envio para analise administrativa."
        />
      </AppCard>

      {(materialsQuery.isLoading || profileQuery.isLoading) && (
        <LoadingCard text="Carregando materiais e endereco..." />
      )}
      {!!mensagem && <MessageBanner message={mensagem} tone={mensagemTone} />}

      <AppCard>
        <AppField
          label="Titulo"
          value={form.titulo}
          onChangeText={(value) => setForm((current) => ({ ...current, titulo: value }))}
          placeholder="Ex: Coleta de plastico do condominio"
        />
        <AppField
          label="Material"
          value={form.materialId}
          onChangeText={(value) => setForm((current) => ({ ...current, materialId: value }))}
          placeholder={
            materialsQuery.data?.map((item) => `${item.id} - ${item.nome}`).join(" | ") ??
            "Informe o ID do material"
          }
          keyboardType="numeric"
        />
        <AppField
          label="Quantidade"
          value={form.quantidade}
          onChangeText={(value) => setForm((current) => ({ ...current, quantidade: value }))}
          placeholder="Ex: 10 sacos ou 50 kg"
        />
        <AppField
          label="Descricao"
          value={form.descricao}
          onChangeText={(value) => setForm((current) => ({ ...current, descricao: value }))}
          placeholder="Explique o estado do material e observacoes relevantes."
          multiline
        />
      </AppCard>

      <AppCard>
        <SectionHeader
          eyebrow="ENDERECO"
          title="Local da coleta"
          description="Voce pode usar o endereco do perfil ou informar outro local."
        />
        <AppButton
          label="Usar endereco do perfil"
          tone={modoEndereco === "perfil" ? "primary" : "secondary"}
          onPress={() => setModoEndereco("perfil")}
        />
        <AppButton
          label="Informar outro endereco"
          tone={modoEndereco === "novo" ? "primary" : "secondary"}
          onPress={() => setModoEndereco("novo")}
        />

        {modoEndereco === "perfil" ? (
          <MessageBanner
            message={profileQuery.data?.endereco ?? "Nenhum endereco cadastrado no perfil."}
            tone="success"
          />
        ) : (
          <>
            <AppField
              label="CEP"
              value={formatCep(endereco.cep)}
              onChangeText={(value) =>
                setEndereco((current) => ({ ...current, cep: normalizeCep(value) }))
              }
              placeholder="00000-000"
              keyboardType="numeric"
            />
            <AppButton label="Buscar CEP" tone="secondary" onPress={buscarCep} />
            <AppField
              label="Rua / Avenida"
              value={endereco.rua}
              onChangeText={(value) => setEndereco((current) => ({ ...current, rua: value }))}
              placeholder="Rua das Flores"
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
              placeholder="Centro"
            />
            <AppField
              label="Cidade"
              value={endereco.cidade}
              onChangeText={(value) =>
                setEndereco((current) => ({ ...current, cidade: value }))
              }
              placeholder="Sao Paulo"
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

      <AppCard>
        <SectionHeader
          eyebrow="IMAGENS"
          title="Anexos opcionais"
          description="O backend aceita ate 5 URLs de imagem. No mobile, os anexos sao informados por URL nesta versao."
        />
        <AppField
          label="URL da imagem"
          value={imagemAtual}
          onChangeText={setImagemAtual}
          placeholder="https://..."
          autoCapitalize="none"
        />
        <AppButton label="Adicionar imagem" tone="secondary" onPress={addImagem} />
        {imagens.map((item, index) => (
          <AppCard key={`${item}-${index}`}>
            <SectionHeader title={`Imagem ${index + 1}`} description={item} />
            <AppButton
              label="Remover imagem"
              tone="danger"
              onPress={() =>
                setImagens((current) => current.filter((_, currentIndex) => currentIndex !== index))
              }
            />
          </AppCard>
        ))}
      </AppCard>

      <AppButton
        label={createMutation.isPending ? "Criando solicitacao..." : "Criar solicitacao"}
        onPress={() => createMutation.mutate()}
        disabled={createMutation.isPending}
      />
    </AppScreen>
  );
}
