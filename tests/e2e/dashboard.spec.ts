import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
const fixture = readFileSync(".local/demo.json", "utf8");
test.beforeEach(async ({ page }) => {
  await page.clock.install({ time: new Date("2026-09-09T12:00:00Z") });
  await page.route("**/data/snapshot.json", (route) =>
    route.fulfill({ contentType: "application/json", body: fixture }),
  );
});
test("renders all charts without runtime errors or horizontal overflow", async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("macro.html");
  await expect(page.locator("[data-chart]")).toHaveCount(44);
  await expect(
    page.getByText("Todos los valores son sintéticos.", { exact: false }),
  ).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
  await page.screenshot({
    path: testInfo.outputPath("dashboard.png"),
    fullPage: true,
  });
});
test("periods, education and valuation preferences persist", async ({
  page,
}) => {
  await page.goto("macro.html");
  await page.getByRole("button", { name: "Modo educativo" }).click();
  await expect(page.locator('[data-chart="policy"] .learn-note')).toBeVisible();
  await page.getByRole("button", { name: "10A", exact: true }).click();
  await page.getByRole("button", { name: "Desde 1990" }).click();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Modo educativo" }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(
    page.getByRole("button", { name: "10A", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(
    page.getByRole("button", { name: "Desde 1990" }),
  ).toHaveAttribute("aria-pressed", "true");
});
test("modal supports Escape, keyboard exploration and focus restoration", async ({
  page,
}) => {
  await page.goto("macro.html");
  const open = page.getByRole("button", {
    name: "Ampliar Fed, Treasury y tipo real",
    exact: true,
  });
  await open.click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(
    page
      .getByRole("heading", { name: "Fed, Treasury y tipo real", exact: true })
      .last(),
  ).toBeVisible();
  await page.getByRole("slider").focus();
  await page.keyboard.press("ArrowLeft");
  await expect(page.locator("dialog .chart-tooltip")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(open).toBeFocused();
});
test("sectors and source coverage controls work", async ({ page }) => {
  await page.goto("macro.html");
  await page.getByRole("button", { name: "12m %", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "12m %", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page
    .getByText("Ver disponibilidad, procedencia y fechas de cada serie")
    .click();
  await expect(page.locator("table tbody tr")).toHaveCount(81);
});
test("invalid payload shows an actionable error and retry works", async ({
  page,
}) => {
  await page.unroute("**/data/snapshot.json");
  let fail = true;
  await page.route("**/data/snapshot.json", (route) =>
    route.fulfill({
      contentType: "application/json",
      body: fail ? "{}" : fixture,
    }),
  );
  await page.goto("macro.html");
  await expect(page.getByRole("alert")).toBeVisible();
  fail = false;
  await page.getByRole("button", { name: "Reintentar" }).click();
  await expect(page.locator("[data-chart]")).toHaveCount(44);
});

test("source table distinguishes publication permissions from download failures", async ({
  page,
}) => {
  const data = JSON.parse(fixture);
  for (const [id, reasonCode] of [
    ["ISM_PMI", "permission_required"],
    ["SH_P", "license_review"],
    ["DGS2", "download_failed"],
  ]) {
    Object.assign(data.series[id], {
      status: "unavailable",
      reasonCode,
      observations: [],
      fetchedAt: null,
    });
  }
  await page.unroute("**/data/snapshot.json");
  await page.route("**/data/snapshot.json", (route) =>
    route.fulfill({
      contentType: "application/json",
      body: JSON.stringify(data),
    }),
  );
  await page.goto("macro.html");
  await page
    .getByText("Ver disponibilidad, procedencia y fechas de cada serie")
    .click();
  const rows = page.locator("table tbody tr");
  await expect(
    rows.filter({ has: page.locator("code", { hasText: /^ISM_PMI$/ }) }),
  ).toContainText("Requiere autorización");
  await expect(
    rows.filter({ has: page.locator("code", { hasText: /^SH_P$/ }) }),
  ).toContainText("Permiso por confirmar");
  await expect(
    rows.filter({ has: page.locator("code", { hasText: /^DGS2$/ }) }),
  ).toContainText("Error de descarga");
  await expect(
    rows.filter({ has: page.locator("code", { hasText: /^VIXCLS$/ }) }),
  ).toContainText("Chicago Board Options Exchange");
  await expect(
    rows.filter({ has: page.locator("code", { hasText: /^GDP$/ }) }),
  ).toContainText("T3 2026");
});
