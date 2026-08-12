import { chromium,  Page,  BrowserContext } from "playwright";
import * as fs from "fs";
import * as path from "path";
import sanitize from "sanitize-filename";

interface DocEntry {
  index: string;
  name: string;
  url: string;
  folder: string;
}

const parseListMd = (listPath: string): DocEntry[] => {
  const content = fs.readFileSync(listPath, "utf-8");
  const docs: DocEntry[] = [];

  // Track current section header as folder name
  let currentFolder = "";
  const headerRe = /^##\s+(.+)$/;
  // 3-column table: | № | Документ | URL |
  const lineRe = /^\|\s*(\d+)\s*\|\s*(.+?)\s*\|\s*(https?:\/\/\S+?)\s*\|$/;

  for (const raw of content.split("\n")) {
    const line = raw.trim();

    const headerMatch = line.match(headerRe);
    if (headerMatch) {
      currentFolder = headerMatch[1].trim();
      continue;
    }

    const m = line.match(lineRe);
    if (!m) continue;
    const [, index, name, url] = m;
    if (name.startsWith("-") || url.startsWith("-")) continue;
    docs.push({
      index: index.trim(),
      name: name.trim(),
      url: url.trim(),
      folder: currentFolder,
    });
  }
  return docs;
}

const waitForAuth = async (page: Page, timeoutMs = 180_000): Promise<void> => {
  console.log("\n=== Требуется авторизация в Confluence ===");
  console.log("Пожалуйста, войдите в систему в открывшемся окне браузера.");
  console.log("После прохождения 2FA скрипт продолжит работу автоматически.");
  console.log(`Таймаут: ${timeoutMs / 1000} секунд\n`);

  await page.waitForFunction(
    () => {
      const url = window.location.href;
      return (
        (url.includes("/wiki/") || url.includes("/pages/")) &&
        !url.includes("login")
      );
    },
    null,
    { timeout: timeoutMs }
  );

  console.log("Авторизация прошла успешно!\n");
}

const exportPageToDocx = async (
  page: Page,
  doc: DocEntry,
  downloadsDir: string
): Promise<string | null> => {
  console.log(`\n  Экспорт: ${doc.name}`);
  console.log(`  URL: ${doc.url}`);

  const dest = path.join(downloadsDir, `${sanitize(`${doc.index} - ${doc.name}`)}.docx`);

  try {
    // Navigate to the page
    await page.goto(doc.url, {
      waitUntil: "domcontentloaded",
      timeout: 30_000,
    });
    await page.waitForTimeout(2000);

    // Step 1: Open "More options" menu
    await page.click("#action-menu-link", { timeout: 10_000 });
    await page.waitForTimeout(1000);

    // Step 2: Click "Export to Word" (K15t Scroll Word Exporter)
    await page.click("#k15t-exp-word-export-dialog-web-item", {
      timeout: 5_000,
    });
    await page.waitForTimeout(2000);

    // Step 3: Click "Export" button inside the iframe dialog
    // Use scroll-office specific selector to avoid matching other iframes (e.g. Figma embeds)
    const iframe = page.frameLocator('iframe[src*="scroll-office"]');
    await iframe
      .locator('[data-testid="export-dialog-export"], button:has-text("Export")')
      .last()
      .click({ timeout: 30_000 });

    // Step 4: Wait for the export to complete — poll for download link
    let downloadUrl: string | null = null;
    for (let i = 0; i < 60; i++) {
      await page.waitForTimeout(2000);
      try {
        const url = await iframe
          .locator('a:has-text("click here to download")')
          .getAttribute("href", { timeout: 2_000 });
        if (url) {
          downloadUrl = url;
          break;
        }
      } catch {
        // not ready yet
      }
    }

    if (!downloadUrl) {
      console.error(`  ОШИБКА: Ссылка на скачивание не появилась для ${doc.name}`);
      return null;
    }

    // Step 5: Download the file via direct URL
    const [download] = await Promise.all([
      page.waitForEvent("download", { timeout: 60_000 }),
      iframe.locator('a:has-text("click here to download")').click(),
    ]);
    await download.saveAs(dest);
    console.log(`  Сохранено: ${dest}`);
    return dest;
  } catch (e) {
    console.error(`  ОШИБКА при экспорте ${doc.name}:`, e);

    // Fallback: try fetching the download URL directly if we found one
    try {
      const fallbackIframe = page.frameLocator('iframe[src*="scroll-office"]');
      const fallbackUrl = await fallbackIframe
        .locator('a:has-text("click here to download")')
        .getAttribute("href", { timeout: 3_000 })
        .catch(() => null);

      if (fallbackUrl) {
        console.log("  Пробуем скачать напрямую через fetch...");
        const response = await page.request.get(fallbackUrl);
        const buffer = await response.body();
        fs.writeFileSync(dest, buffer);
        console.log(`  Сохранено (fallback): ${dest} (${buffer.length} байт)`);
        return dest;
      }
    } catch {
      // fallback also failed
    }

    return null;
  }
}

const main = async () => {
  const args = process.argv.slice(2);
  const flags: Record<string, string> = {};
  for (let i = 0; i < args.length; i += 2) {
    flags[args[i].replace(/^--/, "")] = args[i + 1];
  }

  const listPath = flags["list"];
  const downloadsDir = flags["downloads"] ?? "docx/";
  const filterFolder = flags["folder"];
  const authState = flags["auth-state"] ?? path.join(__dirname, ".confluence_auth.json");

  if (!listPath) {
    console.error(
      "Использование: npx tsx export_confluence.ts --list spec/list.md [--downloads docx/] [--folder LKvuzov] [--auth-state .confluence_auth.json]"
    );
    process.exit(1);
  }

  let docs = parseListMd(listPath);
  if (docs.length === 0) {
    console.error("Нет документов в list.md");
    process.exit(1);
  }

  if (filterFolder) {
    docs = docs.filter((d) => d.folder === filterFolder);
    if (docs.length === 0) {
      console.error(`Нет документов для папки '${filterFolder}'`);
      process.exit(1);
    }
  }

  fs.mkdirSync(downloadsDir, { recursive: true });
  console.log(`Найдено документов: ${docs.length}`);

  const hasAuth = fs.existsSync(authState);
  const browser = await chromium.launch({ headless: false });
  const context: BrowserContext = await browser.newContext({
    ...(hasAuth ? { storageState: authState } : {}),
    acceptDownloads: true,
  });
  const page = await context.newPage();

  // Check if auth is needed
  await page.goto(docs[0].url, {
    waitUntil: "domcontentloaded",
    timeout: 30_000,
  });
  await page.waitForTimeout(2000);

  const currentUrl = page.url();
  if (
    currentUrl.toLowerCase().includes("login") ||
    currentUrl.toLowerCase().includes("authenticate")
  ) {
    await waitForAuth(page);
  }

  // Save auth state
  await context.storageState({ path: authState });
  console.log(`Состояние авторизации сохранено в ${authState}\n`);

  // Export each document
  const success: string[] = [];
  const failed: DocEntry[] = [];

  for (const doc of docs) {
    const result = await exportPageToDocx(page, doc, downloadsDir);
    if (result) {
      success.push(result);
    } else {
      failed.push(doc);
    }
  }

  // Save auth state again
  await context.storageState({ path: authState });
  await browser.close();

  // Summary
  console.log(`\n=== Результат ===`);
  console.log(`Успешно: ${success.length}`);
  console.log(`Ошибки:  ${failed.length}`);

  if (failed.length > 0) {
    console.log("\nНе удалось экспортировать:");
    for (const doc of failed) {
      console.log(`  - ${doc.name}`);
    }
    process.exit(1);
  }
}

main().catch((e) => {
  console.error("Фатальная ошибка:", e);
  process.exit(1);
});
