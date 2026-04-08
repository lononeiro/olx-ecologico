import { ZodIssueCode, type RefinementCtx } from "zod";

const PASSWORD_MIN_LENGTH = 8;

export const STRONG_PASSWORD_HINTS = [
  `Pelo menos ${PASSWORD_MIN_LENGTH} caracteres`,
  "Uma letra maiúscula",
  "Uma letra minúscula",
  "Um número",
  "Um caractere especial",
] as const;

export function getStrongPasswordIssues(password: string) {
  const issues: string[] = [];

  if (password.length < PASSWORD_MIN_LENGTH) {
    issues.push(`A senha deve ter pelo menos ${PASSWORD_MIN_LENGTH} caracteres.`);
  }
  if (!/[A-Z]/.test(password)) {
    issues.push("A senha deve incluir ao menos uma letra maiúscula.");
  }
  if (!/[a-z]/.test(password)) {
    issues.push("A senha deve incluir ao menos uma letra minúscula.");
  }
  if (!/\d/.test(password)) {
    issues.push("A senha deve incluir ao menos um número.");
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    issues.push("A senha deve incluir ao menos um caractere especial.");
  }

  return issues;
}

export function isStrongPassword(password: string) {
  return getStrongPasswordIssues(password).length === 0;
}

export function applyStrongPasswordRules(
  password: string,
  ctx: RefinementCtx,
  path: (string | number)[] = ["senha"]
) {
  for (const message of getStrongPasswordIssues(password)) {
    ctx.addIssue({
      code: ZodIssueCode.custom,
      message,
      path,
    });
  }
}
