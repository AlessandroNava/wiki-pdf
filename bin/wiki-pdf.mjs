#!/usr/bin/env node
// Comando wiki-pdf: genera o controlla i PDF di una wiki GitHub.
//
//   wiki-pdf build [--config <file>] [Pagina ...]
//   wiki-pdf check [--config <file>]
//
// Senza --config usa ./wiki.config.json (cartella da cui si lancia il comando).

import { loadConfig } from '../src/config.mjs';
import { build } from '../src/build.mjs';
import { check } from '../src/check.mjs';

const USAGE = `Uso:
  wiki-pdf build [--config <file>] [Pagina ...]   genera i PDF (tutte le pagine o solo quelle indicate)
  wiki-pdf check [--config <file>]                elenca i PDF da rigenerare
  wiki-pdf --help                                 mostra questo aiuto

Senza --config viene letto ./wiki.config.json. Vedi il README per la configurazione.`;

function parseArgs(argv) {
  const args = { command: null, config: 'wiki.config.json', pages: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--help' || a === '-h') args.command = 'help';
    else if (a === '--config' || a === '-c') args.config = argv[++i];
    else if (a.startsWith('--config=')) args.config = a.slice('--config='.length);
    else if (a.startsWith('-')) throw new Error(`opzione sconosciuta: ${a}`);
    else if (!args.command) args.command = a;
    else args.pages.push(a);
  }
  if (!args.config) throw new Error('--config richiede il percorso del file');
  return args;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.command || args.command === 'help') return console.log(USAGE);

  const ctx = loadConfig(args.config);
  if (args.command === 'build') {
    await build(ctx, args.pages);
  } else if (args.command === 'check') {
    if (args.pages.length) throw new Error('check non accetta nomi di pagina');
    const outdated = check(ctx);
    if (outdated.length === 0) {
      console.log('✔ Tutti i PDF sono aggiornati.');
    } else {
      outdated.forEach(({ name, reason }) => console.log(`⚠ ${name}: ${reason}`));
      console.log(`\nPer rigenerarli:  npm run build -- ${outdated.map((o) => o.name).join(' ')}`);
      process.exitCode = 1;
    }
  } else {
    throw new Error(`comando sconosciuto: ${args.command}\n\n${USAGE}`);
  }
}

main().catch((err) => {
  console.error(`✖ ${err.message}`);
  process.exit(1);
});
