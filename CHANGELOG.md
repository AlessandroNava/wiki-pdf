# Changelog

## 1.2.0

- Marcatori `<!-- pdf: diagrams-accent -->` e `<!-- pdf: diagrams-neutral -->`: il colore degli schemi Mermaid si sceglie anche pagina per pagina, al posto di `diagramTheme` della configurazione. Con entrambi i marcatori vale la configurazione e compare un avviso.
- API: esportati `DIAGRAMS_ACCENT_MARKER` e `DIAGRAMS_NEUTRAL_MARKER`.
- Correzione: il link al PDF viene inserito dopo il titolo anche quando il titolo è preceduto da più marcatori (prima solo da uno).

## 1.1.0

Grafica dei PDF. Tutte le novità sono attive per default e si possono disattivare dalla configurazione; il numero di pagine delle wiki di prova è invariato rispetto alla 1.0.0.

- `font`: carattere **Inter** (OFL, da `@fontsource-variable/inter`) incorporato nel PDF, stesso aspetto su ogni sistema. `"system"` per i caratteri installati.
- `callouts`: riquadri colorati per tipo (nota, suggerimento, importante, attenzione, cautela) dall'emoji iniziale o dalla sintassi GitHub `> [!NOTE]`, con etichetta nella lingua di `locale`.
- `diagramTheme`: schemi Mermaid nei colori `accent` / `accentSoft` e nel carattere del testo. `"neutral"` per il tema grigio.
- `dateSource`: nel piè di pagina la data dell'ultimo commit della pagina. `"build"` per la data di generazione.
- `outline`: segnalibri dei titoli e PDF accessibile (tagged).
- Sillabazione nella lingua della pagina, niente righe isolate a inizio o fine pagina, intestazione delle tabelle ripetuta nelle pagine successive.
- Stile delle pagine `compact` riordinato (stesso risultato).

## 1.0.0

Prima versione pubblica.

- Comando `wiki-pdf build|check` con `--config`; cartella della wiki da `wikiRoot` nella configurazione.
- Validazione di `wiki.config.json` e schema JSON `wiki.config.schema.json`.
- Nuove chiavi facoltative: `wikiRoot`, `outDir`, `locale`.
- Logo anche in jpg e svg.
- API: `loadConfig`, `build`, `check`, `listPages`.
