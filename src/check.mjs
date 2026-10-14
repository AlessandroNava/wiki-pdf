// Elenca i PDF da rigenerare: pagine modificate (anche non ancora committate)
// dopo l'ultimo commit del relativo PDF, e pagine senza PDF.

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { listPages } from './build.mjs';

/**
 * @param {{config: object, wiki: string, out: string}} ctx  risultato di loadConfig()
 * @returns {{name: string, reason: string}[]} pagine con PDF da rigenerare
 */
export function check(ctx) {
  const { config, wiki, out } = ctx;
  const git = (args) => execSync(`git ${args}`, { cwd: wiki, encoding: 'utf8' }).trimEnd();
  const lastCommit = (file) => Number(git(`log -1 --format=%ct -- "${file}"`) || 0);
  const dirty = new Set(git('status --porcelain').split('\n').filter(Boolean).map((l) => l.slice(3)));
  const outRel = path.relative(wiki, out).replace(/\\/g, '/');

  const outdated = [];
  for (const name of listPages(wiki, config)) {
    const page = `${name}.md`;
    const pdf = `${outRel}/${name}.pdf`;
    if (!fs.existsSync(path.join(wiki, pdf))) {
      outdated.push({ name, reason: 'PDF mancante' });
    } else if (dirty.has(page) && !dirty.has(pdf)) {
      outdated.push({ name, reason: 'pagina modificata e non committata' });
    } else if (lastCommit(page) > lastCommit(pdf)) {
      outdated.push({ name, reason: 'pagina modificata dopo il PDF' });
    }
  }
  return outdated;
}
