import { expect, test } from "@playwright/test";

test.describe("Página inicial (landing)", () => {
  test("exibe a marca e a chamada principal", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByText("♻ ECOnecta").first()).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /Reciclar ficou/i })
    ).toBeVisible();
  });

  test("navega para a tela de login pelo menu", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("link", { name: "Entrar", exact: true }).click();

    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByPlaceholder("seu@email.com")).toBeVisible();
  });

  test("navega para o cadastro pelo botão Criar conta", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("link", { name: "Criar conta", exact: true }).click();

    await expect(page).toHaveURL(/\/register$/);
  });
});
