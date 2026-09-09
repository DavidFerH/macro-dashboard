import { expect, test } from "@playwright/test";
import { existsSync, readFileSync } from "node:fs";
const hasLive =
  existsSync("public/data/snapshot.json") &&
  JSON.parse(readFileSync("public/data/snapshot.json", "utf8")).mode === "live";
test("real snapshot renders full history safely", async ({
  page,
}, testInfo) => {
  test.skip(
    !hasLive,
    "Live data requires local FRED configuration; deterministic tests run separately.",
  );
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("macro.html");
  await expect(page.locator("[data-chart]")).toHaveCount(44);
  await expect(page.getByText("DATOS REALES", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Todo", exact: true }).click();
  await page.locator('[data-chart="policy"] svg').waitFor();
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: testInfo.outputPath("live-viewport.png") });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
});
