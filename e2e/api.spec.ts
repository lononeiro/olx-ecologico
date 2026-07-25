import { expect, test } from "@playwright/test";

test.describe("Documentação da API (/api)", () => {
  test("retorna a lista de endpoints em JSON", async ({ request }) => {
    const res = await request.get("/api?format=json");

    expect(res.ok()).toBeTruthy();

    const body = await res.json();
    expect(body.versao).toBe("1.0.0");
    expect(Array.isArray(body.endpoints)).toBe(true);
    expect(body.endpoints.length).toBeGreaterThan(0);
    expect(body.endpoints[0]).toHaveProperty("path");
    expect(body.endpoints[0]).toHaveProperty("metodo");
  });

  test("serve a página HTML de documentação por padrão", async ({ page }) => {
    await page.goto("/api");

    await expect(page.getByText("Documentação da API")).toBeVisible();
  });
});
