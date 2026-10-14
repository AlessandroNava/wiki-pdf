# Changelog

## 1.0.0

Prima versione pubblica.

- Comando `wiki-pdf build|check` con `--config`; cartella della wiki da `wikiRoot` nella configurazione.
- Validazione di `wiki.config.json` e schema JSON `wiki.config.schema.json`.
- Nuove chiavi facoltative: `wikiRoot`, `outDir`, `locale`.
- Logo anche in jpg e svg.
- API: `loadConfig`, `build`, `check`, `listPages`.
