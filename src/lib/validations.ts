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

// ── Solicitação de Coleta ──────────────────────────────────────────────────────

export const solicitacaoCreateSchema = z.object({
  titulo: z.string().min(3, "Título deve ter ao menos 3 caracteres"),
  descricao: z.string().min(10, "Descrição deve ter ao menos 10 caracteres"),
  quantidade: z.string().min(1, "Informe a quantidade"),
  endereco: z.string().min(5, "Endereço deve ter ao menos 5 caracteres"),
  materialId: z.number().int().positive("Selecione um tipo de material"),
  imagens: z.array(z.string().url()).optional(),
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
  coletaId: z.number().int().positive(),
  mensagem: z.string().min(1, "Mensagem não pode ser vazia"),
});
