const PASSWORD_MIN_LENGTH = 8;

export const STRONG_PASSWORD_HINTS = [
  `Pelo menos ${PASSWORD_MIN_LENGTH} caracteres`,
  "Uma letra maiuscula",
  "Uma letra minuscula",
  "Um numero",
  "Um caractere especial",
] as const;

export function getStrongPasswordIssues(password: string) {
  const issues: string[] = [];

  if (password.length < PASSWORD_MIN_LENGTH) {
    issues.push(`A senha deve ter pelo menos ${PASSWORD_MIN_LENGTH} caracteres.`);
  }
  if (!/[A-Z]/.test(password)) {
    issues.push("A senha deve incluir ao menos uma letra maiuscula.");
  }
  if (!/[a-z]/.test(password)) {
    issues.push("A senha deve incluir ao menos uma letra minuscula.");
  }
  if (!/\d/.test(password)) {
    issues.push("A senha deve incluir ao menos um numero.");
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    issues.push("A senha deve incluir ao menos um caractere especial.");
  }

  return issues;
}
