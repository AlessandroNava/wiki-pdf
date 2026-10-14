// Genera un PDF per ogni pagina della wiki in <outDir>/<Pagina>.pdf
// e aggiunge (o aggiorna) in cima a ogni pagina il link al PDF.
// Tutto ciò che cambia tra una wiki e l'altra sta in wiki.config.json (vedi README).

import fs from 'node:fs';
import { execSync } from 'node:child_process';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { Marked } from 'marked';
import { gfmHeadingId } from 'marked-gfm-heading-id';
import puppeteer from 'puppeteer-core';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const MERMAID = require.resolve('mermaid/dist/mermaid.min.js');

export const LANDSCAPE_MARKER = '<!-- pdf: landscape -->';
export const COMPACT_MARKER = '<!-- pdf: compact -->';

// Stili del link al PDF: 'markdown' (riga a sinistra) o 'html-right' (allineato a destra)
const LINK_STYLES = {
  markdown: (href) => `[📄 Scarica PDF](${href})`,
  'html-right': (href) => `<p align="right"><a href="${href}">📄 Scarica in PDF</a></p>`,
};
// riconosce entrambi gli stili, così il link si può togliere dal PDF e cambiare stile
const PDF_LINK_RE = /^(\[📄 Scarica PDF\]\([^)]*\.pdf\)|<p align="right"><a href="[^"]*\.pdf">📄 Scarica in PDF<\/a><\/p>)\r?\n(\r?\n)?/gm;

// Blocchi di codice: gli esempi di link e di marcatori nella documentazione non contano
const FENCE_RE = /^(`{3,}|~{3,}).*\r?\n[\s\S]*?^\1[ \t]*$/gm;
const codeRanges = (md) => [...md.matchAll(FENCE_RE)].map((m) => [m.index, m.index + m[0].length]);
const outsideCode = (md, index) => !codeRanges(md).some(([a, b]) => index >= a && index < b);
const findPdfLink = (md) => [...md.matchAll(PDF_LINK_RE)].find((m) => outsideCode(md, m.index));
export const hasMarker = (md, marker) =>
  [...md.matchAll(new RegExp('^' + marker + '[ \t]*$', 'gm'))].some((m) => outsideCode(md, m.index));

const SHORTCODES = { ':top:': '⬆️' };

function findChrome() {
  const candidates = [
    process.env.CHROME_PATH,
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  ];
  const found = candidates.find((p) => p && fs.existsSync(p));
  if (!found) throw new Error('Chrome/Edge non trovato: impostare CHROME_PATH');
  return found;
}

function githubToken() {
  if (process.env.GITHUB_TOKEN) return process.env.GITHUB_TOKEN;
  try {
    return execSync('gh auth token', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return null;
  }
}

// Sostituisce le immagini allegate su GitHub con data URI scaricati in modo autenticato
const attachments = new Map();
async function inlineAttachments(html, token) {
  const urls = [...new Set(html.match(/https:\/\/github\.com\/user-attachments\/assets\/[\w-]+/g) ?? [])];
  if (urls.length && !token) console.warn('  ⚠ nessun token GitHub: le immagini allegate non saranno incluse');
  if (!token) return html;
  for (const url of urls) {
    if (!attachments.has(url)) {
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) {
        console.warn(`  ⚠ download fallito (${res.status}): ${url}`);
        attachments.set(url, url);
        continue;
      }
      const type = res.headers.get('content-type') ?? 'image/png';
      attachments.set(url, `data:${type};base64,${Buffer.from(await res.arrayBuffer()).toString('base64')}`);
    }
    html = html.split(url).join(attachments.get(url));
  }
  return html;
}

// Titolo del PDF: primo "# " (o <h1>) della pagina, altrimenti testo del link nella sidebar, altrimenti il nome del file
function pageTitle(name, md, sidebar) {
  const h1 = md.match(/^# (.+)$/m) ?? md.match(/<h1[^>]*>(.*?)<\/h1>/i);
  if (h1) return h1[1].replace(/<[^>]+>|[*_`]|\p{Extended_Pictographic}️?/gu, '').trim();
  const link = sidebar.match(new RegExp(`\\[([^\\]]+)\\]\\(\\./${name}\\)`));
  return link ? link[1] : name.replace(/-/g, ' ');
}

export function listPages(wiki, config, only = []) {
  const exclude = new Set(config.exclude);
  return fs.readdirSync(wiki)
    .filter((f) => f.endsWith('.md') && !f.startsWith('_'))
    .map((f) => f.slice(0, -3))
    .filter((name) => !exclude.has(name))
    .filter((name) => only.length === 0 || only.includes(name));
}

const pdfHref = (config, name) => `${config.outDir.replace(/\\/g, '/')}/${encodeURI(name)}.pdf`;

// Inserisce o aggiorna il link al PDF. Se la pagina lo contiene già lo aggiorna dove si trova,
// altrimenti lo mette dopo il titolo H1 iniziale (anche se preceduto da un commento HTML
// come il marcatore landscape) o in cima. Restituisce la pagina senza il link.
function ensurePdfLink(wiki, config, name, md) {
  const pdfLink = LINK_STYLES[config.linkStyle];
  const eol = md.includes('\r\n') ? '\r\n' : '\n';
  const existing = findPdfLink(md);
  let updated;
  if (existing) {
    const line = pdfLink(pdfHref(config, name)) + eol + (existing[2] ? eol : '');
    updated = md.slice(0, existing.index) + line + md.slice(existing.index + existing[0].length);
  } else {
    const link = pdfLink(pdfHref(config, name)) + eol + eol;
    const h1 = md.match(/^(<!--.*-->\r?\n)?# .*\r?\n(\r?\n)?/);
    updated = h1 ? h1[0].trimEnd() + eol + eol + link + md.slice(h1[0].length) : link + md;
  }
  if (updated !== md) fs.writeFileSync(path.join(wiki, `${name}.md`), updated);
  const own = findPdfLink(updated);
  // al posto del link resta una riga vuota, così un `---` o un titolo successivo non si attaccano al paragrafo precedente
  return updated.slice(0, own.index) + eol + updated.slice(own.index + own[0].length);
}

// Sostituisce i blocchi ```mermaid con i diagrammi e segnala la fine del rendering
const MERMAID_SCRIPT = `<script src="${pathToFileURL(MERMAID).href}"></script>
<script>
  document.querySelectorAll('code.language-mermaid').forEach((code) => {
    const div = document.createElement('div');
    div.className = 'mermaid';
    div.textContent = code.textContent;
    code.parentElement.replaceWith(div);
  });
  mermaid.initialize({ startOnLoad: false, theme: 'neutral' });
  mermaid.run().finally(() => { window.mermaidDone = true; });
</script>`;

function toHtml({ wiki, config }, title, md, marked, css, logo, landscape) {
  let src = md;
  for (const [code, emoji] of Object.entries(SHORTCODES)) src = src.split(code).join(emoji);

  let body = marked.parse(src);
  // link interni della wiki → URL assoluti
  body = body.replace(/href="\.\/([^"#]*)(#[^"]*)?"/g, (_, page, hash = '') =>
    `href="${config.wikiUrl}${page ? '/' + page : ''}${hash}"`);

  const vars = `:root { --accent: ${config.accent}; --accent-soft: ${config.accentSoft};`
    + ` --landscape-diagram: ${config.landscapeDiagramMaxHeight}; }`;
  return `<!doctype html>
<html lang="${config.locale.split('-')[0]}"><head><meta charset="utf-8">
<base href="${pathToFileURL(wiki + path.sep).href}">
<title>${title}</title><style>${css}</style><style>${vars}</style>
${landscape ? '<style>@page { size: A4 landscape; }</style>' : ''}</head>
<body class="${landscape ? 'landscape' : ''} ${hasMarker(md, COMPACT_MARKER) ? 'compact' : ''}">
  <header class="cover">
    ${logo ? `<img src="${logo}" alt="">` : ''}
    <div><div class="label">${config.label}</div><div class="title">${title}</div></div>
  </header>
  <main class="content">${body}</main>
  ${body.includes('class="language-mermaid"') ? MERMAID_SCRIPT : ''}
</body></html>`;
}

/**
 * Genera i PDF.
 * @param {{config: object, wiki: string, out: string}} ctx  risultato di loadConfig()
 * @param {string[]} only  nomi di pagina da generare (vuoto = tutte)
 * @returns {Promise<{name: string, pages: number, warnings: string[]}[]>}
 */
export async function build(ctx, only = []) {
  const { config, wiki, out } = ctx;
  const pages = listPages(wiki, config, only);
  const unknown = only.filter((n) => !pages.includes(n));
  unknown.forEach((n) => console.warn(`⚠ pagina "${n}" non trovata o esclusa dalla configurazione`));
  if (pages.length === 0) {
    console.log('Nessuna pagina da generare.');
    return [];
  }

  const marked = new Marked({ gfm: true }).use(gfmHeadingId());
  const css = fs.readFileSync(path.join(HERE, 'style.css'), 'utf8');
  const sidebarFile = path.join(wiki, '_Sidebar.md');
  const sidebar = fs.existsSync(sidebarFile) ? fs.readFileSync(sidebarFile, 'utf8') : '';
  const logo = config.logo
    ? `data:image/${path.extname(config.logo).slice(1).replace('jpg', 'jpeg').replace('svg', 'svg+xml')};base64,`
      + fs.readFileSync(path.join(wiki, config.logo)).toString('base64')
    : '';
  const date = new Date().toLocaleDateString(config.locale);
  const token = githubToken();
  fs.mkdirSync(out, { recursive: true });

  const results = [];
  const browser = await puppeteer.launch({
    executablePath: findChrome(),
    args: ['--allow-file-access-from-files', '--no-sandbox'],
  });
  try {
    const page = await browser.newPage();
    for (const name of pages) {
      const warnings = [];
      const md = ensurePdfLink(wiki, config, name, fs.readFileSync(path.join(wiki, `${name}.md`), 'utf8'));
      const title = pageTitle(name, md, sidebar);
      const landscape = hasMarker(md, LANDSCAPE_MARKER);
      const tmp = path.join(out, `.${name}.html`);
      const html = toHtml(ctx, title, md, marked, css, logo, landscape);
      fs.writeFileSync(tmp, await inlineAttachments(html, token));
      try {
        await page.goto(pathToFileURL(tmp).href, { waitUntil: 'networkidle0', timeout: 60000 });
        if (html.includes(MERMAID_SCRIPT)) {
          await page.waitForFunction('window.mermaidDone === true', { timeout: 30000 });
          const failed = await page.$$eval('.mermaid', (els) => els.filter((e) => !e.querySelector('svg')).length);
          if (failed) warnings.push(`${failed} schema/i mermaid non disegnato/i`);
        }
        const broken = await page.$$eval('img', (imgs) =>
          imgs.filter((i) => !i.complete || i.naturalWidth === 0).map((i) => i.src));
        broken.forEach((src) => warnings.push(`immagine non caricata: ${src}`));
        const file = path.join(out, `${name}.pdf`);
        await page.pdf({
          path: file,
          format: 'A4',
          landscape,
          printBackground: true,
          preferCSSPageSize: true,
          displayHeaderFooter: true,
          headerTemplate: '<span></span>',
          footerTemplate: `<div style="width:100%;font-size:8px;color:#59636e;padding:0 16mm;display:flex;justify-content:space-between;font-family:Segoe UI,Arial,sans-serif">
            <span>${config.label} · ${title} · ${date}</span>
            <span>Pagina <span class="pageNumber"></span> di <span class="totalPages"></span></span></div>`,
        });
        const count = Number(fs.readFileSync(file, 'latin1').match(/\/Count (\d+)/)?.[1] ?? 0);
        if (hasMarker(md, COMPACT_MARKER) && count > 1) warnings.push('guida rapida su più di un foglio');
        const rel = path.relative(wiki, file).replace(/\\/g, '/');
        console.log(`✔ ${rel} (${count} pag.)${warnings.map((w) => `\n  ⚠ ${w}`).join('')}`);
        results.push({ name, pages: count, warnings });
      } finally {
        fs.rmSync(tmp, { force: true });
      }
    }
  } finally {
    await browser.close();
  }
  return results;
}
