// Lettura e validazione di wiki.config.json.
// Restituisce la configurazione completa di valori di default e la cartella della wiki.

import fs from 'node:fs';
import path from 'node:path';

export const DEFAULTS = {
  wikiRoot: '.',
  label: 'Wiki',
  accent: '#e8471c',
  accentSoft: '#fff4ef',
  logo: null,
  linkStyle: 'markdown',
  landscapeDiagramMaxHeight: '95mm',
  exclude: [],
  outDir: 'pdf',
  locale: 'it-IT',
  font: 'bundled',
  callouts: true,
  diagramTheme: 'accent',
  dateSource: 'git',
  outline: true,
};

const LINK_STYLES = ['markdown', 'html-right'];
// chiavi con un elenco chiuso di valori
const CHOICES = {
  font: ['bundled', 'system'],
  diagramTheme: ['accent', 'neutral'],
  dateSource: ['git', 'build'],
};
const COLOR_RE = /^#[0-9a-fA-F]{3}([0-9a-fA-F]{3})?$/;
const LENGTH_RE = /^\d+(\.\d+)?(mm|cm|in|px|pt)$/;

export function loadConfig(configPath) {
  const file = path.resolve(configPath);
  if (!fs.existsSync(file)) throw new Error(`Configurazione non trovata: ${file}`);

  let raw;
  try {
    raw = JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (err) {
    throw new Error(`${file}: JSON non valido (${err.message})`);
  }

  const errors = [];
  const known = new Set([...Object.keys(DEFAULTS), 'wikiUrl', '$schema']);
  for (const key of Object.keys(raw)) if (!known.has(key)) errors.push(`chiave sconosciuta "${key}"`);

  if (typeof raw.wikiUrl !== 'string' || !/^https?:\/\//.test(raw.wikiUrl)) {
    errors.push('"wikiUrl" è obbligatorio e deve essere un URL (es. https://github.com/org/repo/wiki)');
  }
  if (raw.linkStyle !== undefined && !LINK_STYLES.includes(raw.linkStyle)) {
    errors.push(`"linkStyle" deve essere uno tra: ${LINK_STYLES.join(', ')}`);
  }
  for (const key of ['accent', 'accentSoft']) {
    if (raw[key] !== undefined && !COLOR_RE.test(raw[key])) errors.push(`"${key}" deve essere un colore esadecimale (es. #0969da)`);
  }
  if (raw.landscapeDiagramMaxHeight !== undefined && !LENGTH_RE.test(raw.landscapeDiagramMaxHeight)) {
    errors.push('"landscapeDiagramMaxHeight" deve essere una misura CSS (es. 75mm)');
  }
  if (raw.exclude !== undefined && !(Array.isArray(raw.exclude) && raw.exclude.every((e) => typeof e === 'string'))) {
    errors.push('"exclude" deve essere un elenco di nomi di pagina');
  }
  for (const [key, values] of Object.entries(CHOICES)) {
    if (raw[key] !== undefined && !values.includes(raw[key])) errors.push(`"${key}" deve essere uno tra: ${values.join(', ')}`);
  }
  for (const key of ['callouts', 'outline']) {
    if (raw[key] !== undefined && typeof raw[key] !== 'boolean') errors.push(`"${key}" deve essere true o false`);
  }
  for (const key of ['wikiRoot', 'label', 'logo', 'outDir', 'locale']) {
    if (raw[key] !== undefined && raw[key] !== null && typeof raw[key] !== 'string') errors.push(`"${key}" deve essere un testo`);
  }
  if (errors.length) throw new Error(`${file}:\n  - ${errors.join('\n  - ')}`);

  const config = { ...DEFAULTS, ...raw, wikiUrl: raw.wikiUrl.replace(/\/+$/, '') };
  const wiki = path.resolve(path.dirname(file), config.wikiRoot);
  if (!fs.existsSync(wiki)) throw new Error(`Cartella della wiki non trovata: ${wiki} (wikiRoot = "${config.wikiRoot}")`);
  if (config.logo && !fs.existsSync(path.join(wiki, config.logo))) throw new Error(`Logo non trovato: ${path.join(wiki, config.logo)}`);

  return { config, wiki, out: path.join(wiki, config.outDir), file };
}
