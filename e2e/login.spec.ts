import { expect, test } from "@playwright/test";

test.describe("Tela de login", () => {
  test("renderiza os campos do formulário", async ({ page }) => {
    await page.goto("/login");

    await expect(page.getByRole("heading", { name: "Entrar" })).toBeVisible();
    await expect(page.getByPlaceholder("seu@email.com")).toBeVisible();
    await expect(page.getByPlaceholder("Digite sua senha")).toBeVisible();
    await expect(page.getByRole("button", { name: /Entrar/i })).toBeVisible();
  });

  test("permite preencher e-mail e senha", async ({ page }) => {
    await page.goto("/login");

    const email = page.getByPlaceholder("seu@email.com");
    const senha = page.getByPlaceholder("Digite sua senha");

    await email.fill("usuario@example.com");
    await senha.fill("Senha@123");

    await expect(email).toHaveValue("usuario@example.com");
    await expect(senha).toHaveValue("Senha@123");
  });

  test("tem link para criar uma conta", async ({ page }) => {
    await page.goto("/login");

    await page.getByRole("link", { name: "Criar agora" }).click();

    await expect(page).toHaveURL(/\/register$/);
  });
});
