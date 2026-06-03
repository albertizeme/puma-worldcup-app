import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const FIFA_URL =
  "https://www.fifa.com/es/tournaments/mens/worldcup/canadamexicousa2026/scores-fixtures";

async function main() {
  const browser = await chromium.launch({
    headless: true,
  });

  const page = await browser.newPage({
    locale: "es-ES",
    timezoneId: "Europe/Madrid",
  });

  await page.goto(FIFA_URL, {
    waitUntil: "networkidle",
    timeout: 90_000,
  });

  await page.waitForTimeout(5000);

  const pageText = await page.locator("body").innerText();

  const outputDir = path.resolve(process.cwd(), "tmp");
  fs.mkdirSync(outputDir, { recursive: true });

  fs.writeFileSync(
    path.join(outputDir, "fifa-page-text.txt"),
    pageText,
    "utf-8"
  );

  console.log("✅ Texto extraído en tmp/fifa-page-text.txt");
  console.log("Primeros 2000 caracteres:");
  console.log(pageText.slice(0, 2000));

  await browser.close();
}

main().catch((error) => {
  console.error("💥 Error scraping FIFA:", error);
  process.exit(1);
});