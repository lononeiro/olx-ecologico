import { useMemo, useState } from "react";
import { router } from "expo-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { solicitacaoCreateSchema } from "@shared";
import type { MaterialOption } from "@shared";
import {
  Plus,
  ImagePlus,
  Search,
  Trash2,
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  Newspaper,
  CupSoda,
  Wine,
  Cpu,
  Apple,
  Shirt,
  Droplet,
  TreePine,
  Package,
  Recycle,
} from "lucide-react-native";
import {
  AppButton,
  AppCard,
  AppField,
  AppScreen,
  Icon,
  LoadingCard,
  MessageBanner,
  SectionHeader,
} from "@/components/AppUI";
import type { LucideIcon } from "@/components/ui/Icon";
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
import { colors, radius, spacing, typography } from "@/theme/tokens";

const STEP_TITLES = ["Informações", "Detalhes", "Endereço"];
const TOTAL_STEPS = STEP_TITLES.length;
const MAX_IMAGES = 5;

export default function NewSolicitacaoScreen() {
  const { accessToken, hasAccess, isLoading, refreshSession } =
    useProtectedRoute(["usuario"]);
  const [step, setStep] = useState(1);
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
  const materialSelecionado = materialsQuery.data?.find(
    (item) => String(item.id) === form.materialId
  );

  const createMutation = useMutation({
    mutationFn: async () => {
      if (modoEndereco === "novo") {
        const missing = getMissingAddressFields(endereco);
        if (missing.length > 0) {
          throw new Error(`Complete o endereço: ${missing.join(", ")}.`);
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
        throw new Error(parsed.error.issues[0]?.message ?? "Revise os dados da solicitação.");
      }

      return withAutoRefresh(accessToken, refreshSession, (token) =>
        createSolicitacao(token, parsed.data)
      );
    },
    onSuccess: (data) => {
      setMensagemTone("success");
      setMensagem("Solicitação criada com sucesso.");
      setTimeout(() => router.replace(`/solicitacoes/${data.id}` as any), 900);
    },
    onError: (error) => {
      setMensagemTone("error");
      setMensagem(
        getReadableErrorMessage(error, "Não foi possível criar a solicitação.")
      );
    },
  });

  const validarStep = (target: number): boolean => {
    setMensagem("");

    if (target >= 1) {
      if (form.titulo.trim().length < 3) {
        fail("O título deve ter no mínimo 3 caracteres.");
        return false;
      }
      if (!form.materialId) {
        fail("Selecione o tipo de material.");
        return false;
      }
    }

    if (target >= 2) {
      if (!form.quantidade.trim()) {
        fail("Informe a quantidade.");
        return false;
      }
      if (form.descricao.trim().length < 10) {
        fail("A descrição deve ter no mínimo 10 caracteres.");
        return false;
      }
      if (imagens.length > MAX_IMAGES) {
        fail(`Você pode adicionar no máximo ${MAX_IMAGES} imagens.`);
        return false;
      }
    }

    if (target >= 3) {
      const finalAddress = enderecoFinal.trim();
      if (modoEndereco === "novo") {
        const missing = getMissingAddressFields(endereco);
        if (missing.length > 0) {
          fail(`Complete o endereço: ${missing.join(", ")}.`);
          return false;
        }
      }
      if (finalAddress.length < 5) {
        fail("Informe um endereço completo para a coleta.");
        return false;
      }
    }

    return true;
  };

  const fail = (text: string) => {
    setMensagemTone("error");
    setMensagem(text);
  };

  const goNext = () => {
    if (validarStep(step)) setStep((current) => Math.min(current + 1, TOTAL_STEPS));
  };

  const goBack = () => {
    setMensagem("");
    setStep((current) => Math.max(current - 1, 1));
  };

  const submit = () => {
    if (validarStep(1) && validarStep(2) && validarStep(3)) {
      createMutation.mutate();
    }
  };

  const buscarCep = async () => {
    const cep = normalizeCep(endereco.cep);
    if (cep.length !== 8) {
      fail("Informe um CEP com 8 dígitos.");
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
      setMensagem("CEP encontrado. Revise os dados e informe o número.");
    } catch (error) {
      fail(getReadableErrorMessage(error, "Não foi possível consultar o CEP."));
    }
  };

  const addImagem = () => {
    const value = imagemAtual.trim();
    if (!value) return;

    if (imagens.includes(value)) {
      fail("Essa imagem já foi adicionada.");
      return;
    }

    if (imagens.length >= MAX_IMAGES) {
      fail(`Você pode adicionar no máximo ${MAX_IMAGES} imagens.`);
      return;
    }

    setImagens((current) => [...current, value]);
    setImagemAtual("");
    setMensagemTone("success");
    setMensagem("Imagem adicionada à solicitação.");
  };

  return (
    <AppScreen center>
      <StepIndicator step={step} />

      {(materialsQuery.isLoading || profileQuery.isLoading) && (
        <LoadingCard text="Carregando materiais e endereço..." />
      )}
      {!!mensagem && <MessageBanner message={mensagem} tone={mensagemTone} />}

      {/* ── Etapa 1: Informações ──────────────────────────────── */}
      {step === 1 && (
        <AppCard>
          <SectionHeader
            eyebrow="BASE DA SOLICITAÇÃO"
            title="Informações principais"
            description="Use um título claro e escolha o material correto."
          />
          <AppField
            label="Título"
            value={form.titulo}
            onChangeText={(value) => setForm((current) => ({ ...current, titulo: value }))}
            placeholder="Ex: Coleta de plástico do condomínio"
          />

          <MaterialSelect
            materials={materialsQuery.data ?? []}
            loading={materialsQuery.isLoading}
            value={form.materialId}
            onChange={(value) =>
              setForm((current) => ({ ...current, materialId: value }))
            }
          />
        </AppCard>
      )}

      {/* ── Etapa 2: Detalhes ─────────────────────────────────── */}
      {step === 2 && (
        <AppCard>
          <SectionHeader
            eyebrow="DETALHES E IMAGENS"
            title="Descrição do material"
            description="Adicione detalhes e, se quiser, até 5 imagens por URL."
          />
          <AppField
            label="Quantidade"
            value={form.quantidade}
            onChangeText={(value) => setForm((current) => ({ ...current, quantidade: value }))}
            placeholder="Ex: 10 sacos ou 50 kg"
          />
          <AppField
            label="Descrição"
            value={form.descricao}
            onChangeText={(value) => setForm((current) => ({ ...current, descricao: value }))}
            placeholder="Explique o estado do material e observações relevantes."
            helper="Mínimo de 10 caracteres."
            multiline
          />

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>
              IMAGENS ({imagens.length}/{MAX_IMAGES})
            </Text>
            <AppField
              label="URL da imagem"
              value={imagemAtual}
              onChangeText={setImagemAtual}
              placeholder="https://..."
              autoCapitalize="none"
            />
            <AppButton
              label="Adicionar imagem"
              tone="secondary"
              icon={ImagePlus}
              onPress={addImagem}
            />
            {imagens.map((item, index) => (
              <View key={`${item}-${index}`} style={styles.imageRow}>
                <Text style={styles.imageText} numberOfLines={1}>
                  {index + 1}. {item}
                </Text>
                <AppButton
                  label="Remover"
                  tone="danger"
                  icon={Trash2}
                  onPress={() =>
                    setImagens((current) =>
                      current.filter((_, currentIndex) => currentIndex !== index)
                    )
                  }
                />
              </View>
            ))}
          </View>
        </AppCard>
      )}

      {/* ── Etapa 3: Endereço + resumo ────────────────────────── */}
      {step === 3 && (
        <>
          <AppCard>
            <SectionHeader
              eyebrow="ENDEREÇO DA COLETA"
              title="Confirme o local"
              description="Use o endereço do perfil ou informe outro local."
            />
            <AppButton
              label="Usar endereço do perfil"
              tone={modoEndereco === "perfil" ? "primary" : "secondary"}
              onPress={() => setModoEndereco("perfil")}
            />
            <AppButton
              label="Informar outro endereço"
              tone={modoEndereco === "novo" ? "primary" : "secondary"}
              onPress={() => setModoEndereco("novo")}
            />

            {modoEndereco === "perfil" ? (
              <MessageBanner
                message={profileQuery.data?.endereco ?? "Nenhum endereço cadastrado no perfil."}
                tone={profileQuery.data?.endereco ? "success" : "error"}
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
                <AppButton label="Buscar CEP" tone="secondary" icon={Search} onPress={buscarCep} />
                <AppField
                  label="Rua / Avenida"
                  value={endereco.rua}
                  onChangeText={(value) => setEndereco((current) => ({ ...current, rua: value }))}
                  placeholder="Rua das Flores"
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
                  placeholder="Centro"
                />
                <AppField
                  label="Cidade"
                  value={endereco.cidade}
                  onChangeText={(value) =>
                    setEndereco((current) => ({ ...current, cidade: value }))
                  }
                  placeholder="São Paulo"
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
            <SectionHeader eyebrow="RESUMO FINAL" title="Revise antes de criar" />
            <SummaryRow label="Título" value={form.titulo} />
            <SummaryRow label="Material" value={materialSelecionado?.nome ?? ""} />
            <SummaryRow label="Quantidade" value={form.quantidade} />
            <SummaryRow
              label="Imagens"
              value={imagens.length > 0 ? `${imagens.length} imagem(ns)` : "Nenhuma"}
            />
            <SummaryRow label="Endereço" value={enderecoFinal} />
          </AppCard>
        </>
      )}

      {/* ── Navegação entre etapas ────────────────────────────── */}
      <View style={styles.nav}>
        <View style={styles.navButton}>
          <AppButton
            label={step === 1 ? "Cancelar" : "Voltar"}
            tone="secondary"
            icon={ArrowLeft}
            onPress={step === 1 ? () => router.back() : goBack}
          />
        </View>
        <View style={styles.navButton}>
          {step < TOTAL_STEPS ? (
            <AppButton label="Próximo" icon={ArrowRight} onPress={goNext} />
          ) : (
            <AppButton
              label={createMutation.isPending ? "Criando..." : "Criar solicitação"}
              icon={createMutation.isPending ? Plus : Check}
              onPress={submit}
              disabled={createMutation.isPending}
            />
          )}
        </View>
      </View>
    </AppScreen>
  );
}

function materialIcon(nome: string): LucideIcon {
  const value = nome.toLowerCase();
  if (value.includes("papel") || value.includes("papelão")) return Newspaper;
  if (value.includes("plast") || value.includes("plást")) return CupSoda;
  if (value.includes("vidro")) return Wine;
  if (value.includes("eletr") || value.includes("e-lixo")) return Cpu;
  if (value.includes("organ") || value.includes("orgân")) return Apple;
  if (value.includes("text") || value.includes("têxt") || value.includes("roupa"))
    return Shirt;
  if (value.includes("oleo") || value.includes("óleo")) return Droplet;
  if (value.includes("madeira")) return TreePine;
  if (value.includes("metal") || value.includes("alumin") || value.includes("alumín"))
    return Package;
  return Recycle;
}

function MaterialSelect({
  materials,
  loading,
  value,
  onChange,
}: {
  materials: MaterialOption[];
  loading: boolean;
  value: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = materials.find((item) => String(item.id) === value);
  const SelectedIcon = selected ? materialIcon(selected.nome) : Recycle;

  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>MATERIAL</Text>

      <Pressable
        style={[styles.selectTrigger, open && styles.selectTriggerOpen]}
        onPress={() => setOpen((current) => !current)}
        disabled={loading}
      >
        {selected && (
          <View style={styles.selectTriggerIcon}>
            <Icon icon={SelectedIcon} size={18} color={colors.primary} />
          </View>
        )}
        <Text
          style={[styles.selectValue, !selected && styles.selectPlaceholder]}
          numberOfLines={1}
        >
          {loading
            ? "Carregando materiais..."
            : selected?.nome ?? "Selecione o material"}
        </Text>
        <View style={open ? styles.chevronOpen : undefined}>
          <Icon icon={ChevronDown} size={20} color={colors.textSoft} />
        </View>
      </Pressable>

      {open && !loading && (
        <View style={styles.selectList}>
          {materials.map((item, index) => {
            const active = String(item.id) === value;
            return (
              <Pressable
                key={item.id}
                style={({ pressed }) => [
                  styles.option,
                  index > 0 && styles.optionDivider,
                  (active || pressed) && styles.optionActive,
                ]}
                onPress={() => {
                  onChange(String(item.id));
                  setOpen(false);
                }}
              >
                <View style={styles.optionIcon}>
                  <Icon icon={materialIcon(item.nome)} size={18} color={colors.primary} />
                </View>
                <Text style={styles.optionText}>{item.nome}</Text>
                {active && <Icon icon={Check} size={18} color={colors.primary} />}
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}

function StepIndicator({ step }: { step: number }) {
  return (
    <View style={styles.stepper}>
      <Text style={styles.stepperEyebrow}>
        ETAPA {step} DE {TOTAL_STEPS}
      </Text>
      <Text style={styles.stepperTitle}>{STEP_TITLES[step - 1]}</Text>
      <View style={styles.stepperBars}>
        {STEP_TITLES.map((title, index) => (
          <View
            key={title}
            style={[styles.stepperBar, index < step && styles.stepperBarActive]}
          />
        ))}
      </View>
    </View>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value || "-"}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  stepper: {
    gap: spacing.xs,
  },
  stepperEyebrow: {
    ...typography.eyebrow,
    color: colors.primary,
  },
  stepperTitle: {
    ...typography.title,
    color: colors.text,
    letterSpacing: -0.4,
  },
  stepperBars: {
    flexDirection: "row",
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  stepperBar: {
    flex: 1,
    height: 5,
    borderRadius: radius.pill,
    backgroundColor: colors.stroke,
  },
  stepperBarActive: {
    backgroundColor: colors.primary,
  },
  fieldGroup: {
    gap: spacing.sm,
  },
  fieldLabel: {
    ...typography.eyebrow,
    color: colors.textSoft,
  },
  selectTrigger: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    minHeight: 50,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.stroke,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
  },
  selectTriggerOpen: {
    borderColor: colors.primary,
  },
  selectTriggerIcon: {
    width: 30,
    height: 30,
    borderRadius: radius.sm,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  selectValue: {
    ...typography.bodyStrong,
    color: colors.text,
    flex: 1,
  },
  selectPlaceholder: {
    fontWeight: "400",
    color: colors.textFaint,
  },
  chevronOpen: {
    transform: [{ rotate: "180deg" }],
  },
  selectList: {
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.stroke,
    backgroundColor: colors.surface,
    overflow: "hidden",
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  optionDivider: {
    borderTopWidth: 1,
    borderTopColor: colors.stroke,
  },
  optionActive: {
    backgroundColor: colors.primarySoft,
  },
  optionIcon: {
    width: 34,
    height: 34,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceTint,
    alignItems: "center",
    justifyContent: "center",
  },
  optionText: {
    ...typography.bodyStrong,
    color: colors.text,
    flex: 1,
  },
  imageRow: {
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.stroke,
    backgroundColor: colors.surfaceTint,
  },
  imageText: {
    ...typography.meta,
    color: colors.textSoft,
  },
  nav: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  navButton: {
    flex: 1,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.stroke,
  },
  summaryLabel: {
    ...typography.meta,
    color: colors.textFaint,
  },
  summaryValue: {
    ...typography.meta,
    fontWeight: "600",
    color: colors.text,
    flex: 1,
    textAlign: "right",
  },
});
