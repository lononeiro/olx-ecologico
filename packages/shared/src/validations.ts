import { z } from "zod";
import { STATUS_COLETA, STATUS_SOLICITACAO } from "./status";

const MAX_SOLICITACAO_IMAGENS = 5;

const optionalTrimmedString = z.preprocess((value) => {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}, z.string().nullable().optional());

const normalizarImagensSolicitacao = (value: unknown) => {
  if (value == null) return [];
  if (!Array.isArray(value)) return value;

  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
};

export const registerSchema = z.object({
  nome: z.string().min(2, "Nome deve ter ao menos 2 caracteres"),
  email: z.string().email("Email invalido"),
  senha: z.string().min(6, "Senha deve ter ao menos 6 caracteres"),
  endereco: z.string().optional(),
  telefone: z.string().optional(),
  tipo: z.enum(["usuario", "empresa"]),
  cnpj: z.string().optional(),
  descricao: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email("Email invalido"),
  senha: z.string().min(6, "Senha deve ter ao menos 6 caracteres"),
});

export const mobileRefreshSchema = z.object({
  refreshToken: z.string().min(1, "refreshToken obrigatorio"),
});

export const solicitacaoCreateSchema = z.object({
  titulo: z.string().min(3, "Titulo deve ter ao menos 3 caracteres"),
  descricao: z.string().min(10, "Descricao deve ter ao menos 10 caracteres"),
  quantidade: z.string().min(1, "Informe a quantidade"),
  endereco: z.string().min(5, "Endereco deve ter ao menos 5 caracteres"),
  materialId: z.coerce
    .number({ invalid_type_error: "Selecione um tipo de material" })
    .int()
    .positive("Selecione um tipo de material"),
  imagens: z.preprocess(
    normalizarImagensSolicitacao,
    z
      .array(z.string().url("Cada imagem precisa ter uma URL valida"))
      .max(
        MAX_SOLICITACAO_IMAGENS,
        `Voce pode adicionar no maximo ${MAX_SOLICITACAO_IMAGENS} imagens por solicitacao`
      )
  ),
});

export const solicitacaoUpdateSchema = z.object({
  status: z.enum(STATUS_SOLICITACAO).optional(),
  aprovado: z.boolean().optional(),
});

export const coletaStatusSchema = z.object({
  status: z.enum(STATUS_COLETA),
  codigoConfirmacao: z.string().optional(),
});

export const mensagemCreateSchema = z.object({
  coletaId: z.coerce.number().int().positive(),
  mensagem: z.string().min(1, "Mensagem nao pode ser vazia"),
});

export const profileUpdateSchema = z.object({
  nome: z
    .string()
    .trim()
    .min(2, "Nome deve ter ao menos 2 caracteres")
    .max(120, "Nome muito longo"),
  telefone: optionalTrimmedString,
  endereco: optionalTrimmedString,
});
