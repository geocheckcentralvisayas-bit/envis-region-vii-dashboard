import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { ECC_TABS, HW_TABS, PERMIT_TABS, SUPPORT_TABS, WORKBOOKS, RAW_DIR } from './config.mjs';
import { csvToObjects } from './lib/csv.mjs';

const RETRIES = 4;

async function fetchWithRetry(url) {
  let lastError;
  for (let attempt = 1; attempt <= RETRIES; attempt += 1) {
    try {
      const res = await fetch(url, {
        headers: { 'user-agent': 'Mozilla/5.0 ENVIS-Dashboard/1.0' },
        redirect: 'follow',
      });
      if (res.status === 401 || res.status === 403) {
        throw new Error(`access denied (${res.status}) — share the sheet as "Anyone with the link (Viewer)" or export it manually`);
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      if (/<html/i.test(text.slice(0, 200)) && !text.includes(',')) {
        throw new Error('received an HTML sign-in page instead of CSV');
      }
      return text;
    } catch (error) {
      lastError = error;
      if (attempt < RETRIES) await new Promise((r) => setTimeout(r, attempt * 750));
    }
  }
  throw lastError;
}

function csvUrl(workbookId, tab) {
  if (tab.sheet && !tab.gid) {
    return `https://docs.google.com/spreadsheets/d/${workbookId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(tab.sheet)}`;
  }
  return `https://docs.google.com/spreadsheets/d/${workbookId}/gviz/tq?tqx=out:csv&gid=${tab.gid}`;
}

async function main() {
  await mkdir(RAW_DIR, { recursive: true });
  const tabs = [...PERMIT_TABS, ...SUPPORT_TABS, ...HW_TABS, ...ECC_TABS];
  const manifest = { fetchedAt: new Date().toISOString(), workbooks: {}, tabs: [] };
  for (const wb of Object.values(WORKBOOKS)) {
    manifest.workbooks[wb.key] = { id: wb.id, label: wb.label, url: wb.url };
  }

  console.log(`Fetching ${tabs.length} tabs from Google Sheets…`);
  const queue = [...tabs];
  const concurrency = 3;
  const results = [];

  async function worker() {
    while (queue.length) {
      const tab = queue.shift();
      const workbook = WORKBOOKS[tab.workbook];
      const url = csvUrl(workbook.id, tab);
      try {
        const text = await fetchWithRetry(url);
        const file = path.join(RAW_DIR, `${tab.key}.csv`);
        await writeFile(file, text, 'utf8');
        const parsed = csvToObjects(text);
        results.push({
          key: tab.key,
          workbook: tab.workbook,
          sheet: tab.sheet,
          gid: tab.gid,
          type: tab.type ?? null,
          rows: parsed.rows.length,
          columns: parsed.headers.length,
          file: file.replace(/\\/g, '/'),
        });
        console.log(`  ✓ ${tab.key.padEnd(16)} ${String(parsed.rows.length).padStart(5)} rows`);
      } catch (error) {
        console.error(`  ✗ ${tab.key}: ${error.message}`);
        results.push({
          key: tab.key,
          workbook: tab.workbook,
          sheet: tab.sheet,
          gid: tab.gid,
          type: tab.type ?? null,
          rows: 0,
          error: error.message,
        });
      }
    }
  }

  await Promise.all(Array.from({ length: concurrency }, worker));
  results.sort((a, b) => tabs.findIndex((t) => t.key === a.key) - tabs.findIndex((t) => t.key === b.key));
  manifest.tabs = results;
  await writeFile(path.join(RAW_DIR, '_manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');

  const failed = results.filter((r) => r.error);
  console.log(`\nSaved ${results.length - failed.length}/${results.length} tabs to ${RAW_DIR}.`);
  if (failed.length) {
    console.log('Failed tabs:');
    for (const f of failed) console.log(`  - ${f.key}: ${f.error}`);
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
