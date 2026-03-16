import { z } from "zod";

// ── Autenticação ──────────────────────────────────────────────────────────────

export const registerSchema = z.object({
  nome: z.string().min(2, "Nome deve ter ao menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  senha: z.string().min(6, "Senha deve ter ao menos 6 caracteres"),
  endereco: z.string().optional(),
  telefone: z.string().optional(),
  tipo: z.enum(["usuario", "empresa"]),
  cnpj: z.string().optional(),
  descricao: z.string().optional(),
});

// ── Solicitação de Coleta ─────────────────────────────────────────────────────

export const solicitacaoCreateSchema = z.object({
  titulo: z.string().min(3, "Título deve ter ao menos 3 caracteres"),
  descricao: z.string().min(10, "Descrição deve ter ao menos 10 caracteres"),
  quantidade: z.string().min(1, "Informe a quantidade"),
  endereco: z.string().min(5, "Endereço deve ter ao menos 5 caracteres"),

  // Aceita number ou string numérica ("3" ou 3) — coerce converte automaticamente
  materialId: z.coerce
    .number({ invalid_type_error: "Selecione um tipo de material" })
    .int()
    .positive("Selecione um tipo de material"),

  // Array de URLs — itens vazios são ignorados antes da validação
  imagens: z
    .array(z.string())
    .optional()
    .transform(arr => (arr ?? []).filter(u => u.trim() !== "")),
});

export const solicitacaoUpdateSchema = z.object({
  status: z.enum(["pendente", "aprovada", "rejeitada"]).optional(),
  aprovado: z.boolean().optional(),
});

// ── Coleta ────────────────────────────────────────────────────────────────────

export const coletaStatusSchema = z.object({
  status: z.enum([
    "aceita",
    "a_caminho",
    "em_coleta",
    "concluida",
    "cancelada",
  ]),
});

// ── Mensagem ──────────────────────────────────────────────────────────────────

export const mensagemCreateSchema = z.object({
  coletaId: z.coerce.number().int().positive(),
  mensagem: z.string().min(1, "Mensagem não pode ser vazia"),
});