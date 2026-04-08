import { z } from "zod";
import {
  coletaStatusSchema,
  loginSchema,
  mensagemCreateSchema,
  profileUpdateSchema,
  registerSchema,
  solicitacaoCreateSchema,
  solicitacaoUpdateSchema,
} from "./validations";

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type SolicitacaoCreateInput = z.infer<typeof solicitacaoCreateSchema>;
export type SolicitacaoUpdateInput = z.infer<typeof solicitacaoUpdateSchema>;
export type ColetaStatusInput = z.infer<typeof coletaStatusSchema>;
export type MensagemCreateInput = z.infer<typeof mensagemCreateSchema>;
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;

export interface MaterialOption {
  id: number;
  nome: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: "usuario" | "admin" | "empresa";
}

export interface MobileAuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: "Bearer";
  expiresIn: number;
  user: {
    id: number;
    name: string;
    email: string;
    role: "usuario" | "admin" | "empresa";
  };
}
