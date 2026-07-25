import { useMemo, useState } from "react";
import { router } from "expo-router";
import { useMutation } from "@tanstack/react-query";
import { Pressable, StyleSheet, Text, View } from "react-native";
import {
  Building2,
  ChevronLeft,
  ChevronRight,
  User as UserIcon,
} from "lucide-react-native";
import type { RegisterInput } from "@shared";
import {
  AppButton,
  AppCard,
  AppField,
  AppScreen,
  Icon,
  MessageBanner,
  SectionHeader,
} from "@/components/AppUI";
import type { LucideIcon } from "@/components/ui/Icon";
import {
  buildAddressString,
  EMPTY_ADDRESS_FIELDS,
  formatCep,
  getMissingAddressFields,
  hasAddressDetails,
  normalizeCep,
} from "@/lib/address";
import {
  getReadableErrorMessage,
  lookupCep,
  registerMobile,
} from "@/lib/api";
import { STRONG_PASSWORD_HINTS, getStrongPasswordIssues } from "@/lib/password";
import { colors, radius, spacing, typography } from "@/theme/tokens";

type Tipo = "usuario" | "empresa";
type Step = "choose" | "form";

export default function RegisterScreen() {
  const [step, setStep] = useState<Step>("choose");
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
          throw new Error(`Complete o endereço: ${missing.join(", ")}.`);
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
      setMensagem("Conta criada com sucesso. Agora faça login.");
      setTimeout(() => {
        router.replace("/login");
      }, 1200);
    },
    onError: (error: any) => {
      setMensagemTone("error");
      setMensagem(getReadableErrorMessage(error, "Não foi possível criar a conta."));

      if (error?.fieldErrors && typeof error.fieldErrors === "object") {
        const nextErrors: Record<string, string | undefined> = {};
        for (const [key, value] of Object.entries(error.fieldErrors)) {
          nextErrors[key] = Array.isArray(value) ? value[0] : undefined;
        }
        setFieldErrors(nextErrors);
      }
    },
  });

  const handleChoose = (next: Tipo) => {
    setTipo(next);
    setMensagem("");
    setFieldErrors({});
    setStep("form");
  };

  const handleLookupCep = async () => {
    const cep = normalizeCep(endereco.cep);
    if (cep.length !== 8) {
      setCepStatus("Informe um CEP com 8 dígitos.");
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
      setCepStatus("CEP encontrado. Revise os dados e informe o número.");
    } catch (error) {
      setCepStatus(getReadableErrorMessage(error, "Não foi possível consultar o CEP."));
    }
  };

  // ── Passo 1: escolha do tipo de conta ──────────────────────────────
  if (step === "choose") {
    return (
      <AppScreen scroll={false}>
        <View style={styles.choosePage}>
          <SectionHeader
            eyebrow="CRIAR CONTA"
            title="Como você vai usar o ECOnecta?"
            description="Escolha o tipo de conta para começar. Você só verá os campos do seu perfil."
            align="center"
          />

          <ChoiceCard
            icon={UserIcon}
            title="Sou cidadão"
            description="Solicito coletas de recicláveis e acompanho o andamento."
            onPress={() => handleChoose("usuario")}
          />
          <ChoiceCard
            icon={Building2}
            title="Sou empresa"
            description="Realizo coletas, gerencio solicitações e converso com clientes."
            onPress={() => handleChoose("empresa")}
          />

          <AppButton label="Já tenho conta" tone="ghost" onPress={() => router.push("/login")} />
        </View>
      </AppScreen>
    );
  }

  // ── Passo 2: formulário do tipo escolhido ──────────────────────────
  const isEmpresa = tipo === "empresa";

  return (
    <AppScreen>
      <Pressable
        style={styles.backRow}
        onPress={() => {
          setMensagem("");
          setStep("choose");
        }}
        hitSlop={8}
      >
        <Icon icon={ChevronLeft} size={18} color={colors.primary} />
        <Text style={styles.backText}>Trocar tipo de conta</Text>
      </Pressable>

      <View style={styles.typeBadge}>
        <View style={styles.typeBadgeIcon}>
          <Icon
            icon={isEmpresa ? Building2 : UserIcon}
            size={18}
            color={colors.primary}
          />
        </View>
        <Text style={styles.typeBadgeText}>
          {isEmpresa ? "Conta de empresa" : "Conta de cidadão"}
        </Text>
      </View>

      {!!mensagem && <MessageBanner message={mensagem} tone={mensagemTone} />}

      <AppCard>
        <SectionHeader
          eyebrow="DADOS PRINCIPAIS"
          title={isEmpresa ? "Sua empresa" : "Seus dados"}
        />
        <AppField
          label={isEmpresa ? "Nome da empresa" : "Nome completo"}
          value={form.nome}
          onChangeText={(value) => setForm((current) => ({ ...current, nome: value }))}
          placeholder={isEmpresa ? "Nome da sua empresa" : "Seu nome completo"}
          error={fieldErrors.nome}
        />
        <AppField
          label="Email"
          value={form.email}
          onChangeText={(value) =>
            setForm((current) => ({ ...current, email: value }))
          }
          placeholder="seu@email.com"
          autoCapitalize="none"
          keyboardType="email-address"
          error={fieldErrors.email}
        />
        <AppField
          label="Senha"
          value={form.senha}
          onChangeText={(value) => setForm((current) => ({ ...current, senha: value }))}
          placeholder="Crie uma senha forte"
          secureTextEntry
          secureToggle
          error={fieldErrors.senha ?? (form.senha ? passwordIssues[0] : undefined)}
          helper={STRONG_PASSWORD_HINTS.join(" | ")}
        />

        {isEmpresa && (
          <>
            <AppField
              label="CNPJ"
              value={form.cnpj}
              onChangeText={(value) => setForm((current) => ({ ...current, cnpj: value }))}
              placeholder="00.000.000/0001-00"
              keyboardType="numeric"
            />
            <AppField
              label="Descrição"
              value={form.descricao}
              onChangeText={(value) =>
                setForm((current) => ({ ...current, descricao: value }))
              }
              placeholder="Conte um pouco sobre a empresa (opcional)."
              multiline
            />
          </>
        )}
      </AppCard>

      <AppCard>
        <SectionHeader
          eyebrow="ENDEREÇO"
          title="Opcional"
          description="Você pode completar o endereço agora ou depois, no seu perfil."
        />
        <AppButton
          label={incluirEndereco ? "Remover endereço" : "Adicionar endereço agora"}
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
              label="Número"
              value={endereco.numero}
              onChangeText={(value) =>
                setEndereco((current) => ({ ...current, numero: value }))
              }
              placeholder="123"
              keyboardType="numeric"
            />
            <AppField
              label="Complemento"
              value={endereco.complemento}
              onChangeText={(value) =>
                setEndereco((current) => ({ ...current, complemento: value }))
              }
              placeholder="Apto, bloco, referência"
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
              placeholder="Ex: São Paulo"
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
      <AppButton label="Já tenho conta" tone="ghost" onPress={() => router.push("/login")} />
    </AppScreen>
  );
}

function ChoiceCard({
  icon,
  title,
  description,
  onPress,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.choice, pressed && styles.choicePressed]}
    >
      <View style={styles.choiceIcon}>
        <Icon icon={icon} size={26} color={colors.primary} strokeWidth={2} />
      </View>
      <View style={styles.choiceText}>
        <Text style={styles.choiceTitle}>{title}</Text>
        <Text style={styles.choiceDescription}>{description}</Text>
      </View>
      <Icon icon={ChevronRight} size={20} color={colors.textFaint} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  choosePage: {
    flex: 1,
    justifyContent: "center",
    gap: spacing.md,
    maxWidth: 460,
    width: "100%",
    alignSelf: "center",
  },
  choice: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.surfaceStrong,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.stroke,
    padding: spacing.lg,
  },
  choicePressed: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  choiceIcon: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  choiceText: {
    flex: 1,
    gap: 3,
  },
  choiceTitle: {
    ...typography.sectionTitle,
    color: colors.text,
  },
  choiceDescription: {
    ...typography.meta,
    fontWeight: "500",
    color: colors.textSoft,
  },
  backRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
  },
  backText: {
    ...typography.bodyStrong,
    color: colors.primary,
  },
  typeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    alignSelf: "flex-start",
    backgroundColor: colors.primarySoft,
    borderRadius: radius.pill,
    paddingLeft: 6,
    paddingRight: spacing.md,
    paddingVertical: 6,
  },
  typeBadgeIcon: {
    width: 30,
    height: 30,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  typeBadgeText: {
    ...typography.meta,
    fontWeight: "700",
    color: colors.primaryStrong,
  },
});
