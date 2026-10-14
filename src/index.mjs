// API del pacchetto, per chi vuole usarlo da uno script invece che dal comando wiki-pdf.
export { loadConfig, DEFAULTS } from './config.mjs';
export {
  build, listPages, LANDSCAPE_MARKER, COMPACT_MARKER, DIAGRAMS_ACCENT_MARKER, DIAGRAMS_NEUTRAL_MARKER,
} from './build.mjs';
export { check } from './check.mjs';
