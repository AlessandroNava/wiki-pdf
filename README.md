# wiki-pdf

**wiki-pdf** è il generatore di PDF per le **wiki GitHub**. Trasforma ogni pagina di una wiki in un **PDF A4 pronto da stampare o inviare** e aggiunge nella pagina il link **📄 Scarica PDF**.

È un unico pacchetto, gratuito e open source: ogni wiki che lo usa contiene solo un piccolo file di configurazione con le proprie particolarità (indirizzo, intestazione, colori, logo, pagine escluse).

## Funzionalità

- 📄 **Un PDF per ogni pagina** della wiki, con intestazione (logo, nome della wiki, titolo della pagina) e piè di pagina (data e numero di pagina).
- 🔗 **Link "Scarica PDF"** inserito e mantenuto automaticamente in ogni pagina.
- 📊 **Schemi Mermaid** disegnati nel PDF, anche senza connessione a internet, nei colori della wiki o in grigio (anche pagina per pagina).
- 🖼️ **Immagini** della wiki incluse, comprese quelle allegate dall'editor web di GitHub nei repository privati.
- 🔀 **Link tra le pagine** convertiti in link cliccabili alla wiki online, con ancore compatibili con GitHub.
- ↔️ **Pagine in A4 orizzontale** per flussi e schemi, con lo schema a tutta larghezza.
- 📃 **Guide rapide da un foglio**, con avviso se superano una pagina.
- 🎨 **Aspetto personalizzabile** per ogni wiki: colori, logo, testo dell'intestazione, stile del link.
- 🔤 **Carattere incluso** (Inter) e sillabazione nella lingua della pagina: stesso aspetto su Windows, Linux e macOS.
- 🟦 **Riquadri colorati per tipo** (nota, suggerimento, attenzione…), anche con la sintassi GitHub `> [!NOTE]`.
- 🔖 **Segnalibri e PDF accessibile**: indice dei titoli nel pannello laterale del lettore PDF.
- 📅 **Data dell'ultima modifica** della pagina nel piè di pagina, presa da Git.
- ✅ **Controllo dei PDF da aggiornare**: elenca le pagine modificate dopo il loro PDF.
- 🛡️ **Configurazione verificata** all'avvio, con messaggi chiari in caso di errore.
- 🤖 **Uso automatico** con GitHub Actions per rigenerare i PDF a ogni modifica della wiki.

## Documentazione

Installazione, configurazione e uso sono descritti nella **[wiki del repository](https://github.com/AlessandroNava/wiki-pdf/wiki)**. Chi non l'ha mai usato parte da **[Primi passi](https://github.com/AlessandroNava/wiki-pdf/wiki/Getting-Started)**.

Le novità di ogni versione sono in [CHANGELOG.md](CHANGELOG.md).

## Licenza

[MIT](LICENSE) © 2026 Alessandro Nava. Puoi **usare, modificare e ridistribuire** wiki-pdf gratuitamente, anche in progetti commerciali; se ridistribuisci il codice mantieni l'avviso di copyright e il file `LICENSE`. Il software è fornito così com'è, senza garanzie. Cosa è consentito, in parole semplici: pagina [Licenza](https://github.com/AlessandroNava/wiki-pdf/wiki/License) della wiki.
