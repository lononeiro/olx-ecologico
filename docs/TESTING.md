# Guia de Testes — ECOnecta

Este projeto tem dois tipos de teste automatizado:

| Tipo | Ferramenta | Onde fica | O que valida |
| --- | --- | --- | --- |
| **Unidade / integração** | [Vitest](https://vitest.dev) | `src/**/*.test.ts` | Regras de negócio, validações (Zod) e serviços — em memória, com o Prisma "mockado". Não precisa de banco. |
| **End-to-end (E2E)** | [Playwright](https://playwright.dev) | `e2e/**/*.spec.ts` | Fluxos reais no navegador (páginas, navegação, API) subindo o app Next.js de verdade. |

> Regra de nomes: testes de **unidade** usam `.test.ts`; testes **E2E** usam `.spec.ts` dentro de `e2e/`. O Vitest ignora a pasta `e2e/` e o Playwright só olha para ela — assim eles nunca se atrapalham.

---

## 1. Testes de unidade (Vitest)

### Como rodar

```bash
npm test              # roda todos os testes uma vez
npm run test:watch    # modo interativo: re-roda ao salvar arquivos
npm run test:coverage # gera relatório de cobertura em coverage/
```

A cobertura em HTML fica em `coverage/index.html` (abra no navegador).

### O que já é testado

- `src/lib/validations.test.ts` — schemas de cadastro, solicitação, perfil, etc.
- `src/lib/password.test.ts` — regras de senha forte.
- `src/services/coleta.service.test.ts` — aceitar solicitação, atualizar status.
- `src/services/solicitacao.service.test.ts` e `mensagem.service.test.ts`.

### Como escrever um novo teste de unidade

Crie um arquivo `algumaCoisa.test.ts` ao lado do código que quer testar.

Exemplo simples (função pura):

```ts
import { describe, expect, it } from "vitest";
import { isStrongPassword } from "@/lib/password";

describe("isStrongPassword", () => {
  it("aceita senha que cumpre todas as regras", () => {
    expect(isStrongPassword("Senha@123")).toBe(true);
  });

  it("rejeita senha sem caractere especial", () => {
    expect(isStrongPassword("Senha1234")).toBe(false);
  });
});
```

Exemplo com Prisma mockado (serviço que acessa o banco). Use `vi.hoisted` + `vi.mock`
para substituir o Prisma real — assim o teste não toca no banco:

```ts
import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    coleta: { create: vi.fn(), findFirst: vi.fn() },
  },
}));

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));

import { aceitarSolicitacao } from "@/services/coleta.service";

describe("aceitarSolicitacao", () => {
  beforeEach(() => vi.clearAllMocks());

  it("impede aceitar solicitação indisponível", async () => {
    prismaMock.coleta.findFirst.mockResolvedValueOnce(null);
    await expect(aceitarSolicitacao(1, 2)).rejects.toThrow();
  });
});
```

> O alias `@/` aponta para `src/` (configurado em `vitest.config.ts`).

Rode só um arquivo:

```bash
npx vitest run src/lib/password.test.ts
```

---

## 2. Testes E2E (Playwright)

Os testes E2E abrem um navegador de verdade (Chromium), sobem o app com `npm run dev:web`
automaticamente e interagem com as páginas como um usuário faria.

### Primeira vez: instalar o navegador

Só é preciso rodar **uma vez** por máquina:

```bash
npx playwright install chromium
```

### Como rodar

```bash
npm run test:e2e         # roda todos os testes E2E (sobe o app sozinho)
npm run test:e2e:ui      # modo visual interativo (recomendado para depurar)
npm run test:e2e:report  # abre o último relatório HTML de resultados
```

O Playwright inicia o servidor sozinho (config `webServer` em `playwright.config.ts`).
Se você **já** tem o `npm run dev:web` rodando em `http://localhost:3000`, ele reaproveita esse servidor.

### O que já é testado

- `e2e/landing.spec.ts` — página inicial renderiza e navega para login/cadastro.
- `e2e/login.spec.ts` — formulário de login renderiza, aceita entrada e leva ao cadastro.
- `e2e/api.spec.ts` — endpoint `/api?format=json` responde a documentação.

Esses fluxos **não dependem de banco de dados** — validam UI e navegação.

### Como escrever um novo teste E2E

Crie um arquivo `nome.spec.ts` dentro de `e2e/`:

```ts
import { expect, test } from "@playwright/test";

test("navega para o cadastro", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Criar conta", exact: true }).click();
  await expect(page).toHaveURL(/\/register$/);
});
```

Boas práticas de seletores (nesta ordem de preferência):

1. `getByRole("button", { name: /Entrar/i })` — acessível e resistente a mudanças de estilo.
2. `getByPlaceholder("seu@email.com")` / `getByLabel(...)` — para campos de formulário.
3. `getByText("...")` — para textos visíveis (use `{ exact: true }` quando houver ambiguidade).

Evite depender de classes CSS ou da estrutura de `div`s, que mudam com frequência.

### Testar fluxos que exigem login/banco

Os testes atuais evitam de propósito o banco. Para testar fluxos autenticados
(criar solicitação, aceitar coleta, chat), você precisa de um banco de teste populado:

```bash
# .env.test / .env.local apontando para um banco de teste
npm run db:push     # cria o schema
npm run db:seed     # popula dados de exemplo
npm run dev:web     # deixe rodando em outro terminal
npm run test:e2e
```

Depois, no teste, faça login pela própria UI (preenchendo `/login`) ou reutilize uma
sessão autenticada com `storageState` do Playwright.

---

## 3. Rodando tudo

```bash
npm test          # unidade (rápido, sem navegador)
npm run test:e2e  # E2E (sobe o app + navegador)
```

## 4. Solução de problemas

| Sintoma | Causa provável / solução |
| --- | --- |
| `Executable doesn't exist ... chromium` | Rode `npx playwright install chromium`. |
| E2E trava em "waiting for webServer" | A porta 3000 pode estar ocupada. Pare outros servidores ou ajuste `PLAYWRIGHT_PORT`. |
| Teste E2E falha só na primeira vez | O Next.js compila a página sob demanda no `dev`; o Playwright espera automaticamente, mas a primeira execução é mais lenta. |
| Vitest tentou rodar arquivo `.spec.ts` | Confirme que ele está em `e2e/` — essa pasta é excluída do Vitest em `vitest.config.ts`. |
| Screenshots/traces de falhas | Ficam em `test-results/` e `playwright-report/` (ignorados pelo git). |

---

## Variáveis de ambiente úteis (E2E)

| Variável | Padrão | Função |
| --- | --- | --- |
| `PLAYWRIGHT_PORT` | `3000` | Porta em que o app sobe. |
| `PLAYWRIGHT_BASE_URL` | `http://localhost:3000` | URL base usada nos `page.goto("/...")`. |
| `CI` | — | Quando definida, ativa retries e proíbe `test.only`. |
