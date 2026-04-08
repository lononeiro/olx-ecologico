import {
  coletaStatusSchema,
  mensagemCreateSchema,
  profileUpdateSchema,
  registerSchema as sharedRegisterSchema,
  solicitacaoCreateSchema,
  solicitacaoUpdateSchema,
} from "../../packages/shared/src/validations";
import { applyStrongPasswordRules } from "@/lib/password";

const registerSchema = sharedRegisterSchema.superRefine(({ senha }, ctx) => {
  applyStrongPasswordRules(senha, ctx, ["senha"]);
});

export {
  coletaStatusSchema,
  mensagemCreateSchema,
  profileUpdateSchema,
  registerSchema,
  solicitacaoCreateSchema,
  solicitacaoUpdateSchema,
};
