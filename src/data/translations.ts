import type { TranslationEntry } from './types'

// Flat translation pool (concept §4). Hierarchical keys with dot notation.
// In v1 only the configurator UI plus the Machining Center XR product strings
// are populated; this file is where the customer can extend translations
// without touching components or stores.
export const translations: TranslationEntry[] = [
  // ── Power step ────────────────────────────────────────────────────────
  { id: 'machine.power.title', category: 'product', de: 'Leistungsklasse', en: 'Power class' },
  { id: 'machine.power.kw7_5', category: 'product', de: '7,5 kW', en: '7.5 kW' },
  { id: 'machine.power.kw11', category: 'product', de: '11 kW', en: '11 kW' },
  { id: 'machine.power.kw18_5', category: 'product', de: '18,5 kW', en: '18.5 kW' },
  { id: 'machine.power.kw30', category: 'product', de: '30 kW', en: '30 kW' },

  // ── Control step ──────────────────────────────────────────────────────
  { id: 'machine.control.title', category: 'product', de: 'Steuerung', en: 'Control system' },
  { id: 'machine.control.manual', category: 'product', de: 'Manuell', en: 'Manual' },
  {
    id: 'machine.control.spsStandard',
    category: 'product',
    de: 'SPS Standard',
    en: 'PLC Standard',
  },
  { id: 'machine.control.spsPremium', category: 'product', de: 'SPS Premium', en: 'PLC Premium' },

  // ── Drive step ────────────────────────────────────────────────────────
  { id: 'machine.drive.title', category: 'product', de: 'Antrieb', en: 'Drive' },
  { id: 'machine.drive.belt', category: 'product', de: 'Riemen-Standard', en: 'Belt (standard)' },
  {
    id: 'machine.drive.servo',
    category: 'product',
    de: 'Servo-Direktantrieb',
    en: 'Direct servo drive',
  },
  {
    id: 'machine.drive.highPerfServo',
    category: 'product',
    de: 'Hochleistungs-Servo',
    en: 'High-performance servo',
  },

  // ── Tool holder step ──────────────────────────────────────────────────
  { id: 'machine.tool.title', category: 'product', de: 'Werkzeugaufnahme', en: 'Tool holder' },
  { id: 'machine.tool.hsk40', category: 'product', de: 'HSK40', en: 'HSK40' },
  { id: 'machine.tool.hsk63', category: 'product', de: 'HSK63', en: 'HSK63' },
  { id: 'machine.tool.iso40', category: 'product', de: 'ISO40', en: 'ISO40' },

  // ── Add-on step (optional) ────────────────────────────────────────────
  { id: 'machine.addon.title', category: 'product', de: 'Zusatzausstattung', en: 'Add-on' },
  { id: 'machine.addon.none', category: 'product', de: 'Kein Zubehör', en: 'No add-on' },
  {
    id: 'machine.addon.pneumaticChuck',
    category: 'product',
    de: 'Pneumatik-Spannfutter',
    en: 'Pneumatic chuck',
  },
  {
    id: 'machine.addon.hydraulicChuck',
    category: 'product',
    de: 'Hydraulik-Spannfutter',
    en: 'Hydraulic chuck',
  },
  {
    id: 'machine.addon.toolChanger',
    category: 'product',
    de: 'Automatischer Werkzeugwechsler',
    en: 'Automatic tool changer',
  },

  // ── Generic UI labels ─────────────────────────────────────────────────
  {
    id: 'ui.loading',
    category: 'ui',
    de: 'Konfiguration wird geladen …',
    en: 'Loading configuration …',
  },
  { id: 'ui.summary.title', category: 'ui', de: 'Zusammenfassung', en: 'Summary' },
  { id: 'ui.summary.basePrice', category: 'ui', de: 'Grundpreis', en: 'Base price' },
  { id: 'ui.summary.total', category: 'ui', de: 'Gesamtpreis', en: 'Total' },
  {
    id: 'ui.summary.notSelected',
    category: 'ui',
    de: 'Noch nicht gewählt',
    en: 'Not selected yet',
  },
  { id: 'ui.summary.optional', category: 'ui', de: '(optional)', en: '(optional)' },
  { id: 'ui.step.previous', category: 'ui', de: 'Zurück', en: 'Previous' },
  { id: 'ui.step.next', category: 'ui', de: 'Weiter', en: 'Next' },
  {
    id: 'ui.option.unavailable',
    category: 'ui',
    de: 'Derzeit nicht lieferbar',
    en: 'Currently unavailable',
  },
  { id: 'ui.option.requires', category: 'ui', de: 'Benötigt', en: 'Requires' },
  { id: 'ui.step.toReview', category: 'ui', de: 'Anfrage erstellen', en: 'Create request' },

  // ── Review screen ─────────────────────────────────────────────────────
  {
    id: 'ui.review.title',
    category: 'ui',
    de: 'Konfiguration abschließen',
    en: 'Finish configuration',
  },
  {
    id: 'ui.review.subtitle',
    category: 'ui',
    de: 'Übersicht Ihrer Auswahl als PDF speichern oder als Link teilen.',
    en: 'Save your selection as a PDF or share it as a link.',
  },
  {
    id: 'ui.review.summaryHeading',
    category: 'ui',
    de: 'Ihre Konfiguration',
    en: 'Your configuration',
  },
  { id: 'ui.review.downloadPdf', category: 'ui', de: 'Als PDF speichern', en: 'Save as PDF' },
  {
    id: 'ui.review.pdfGenerating',
    category: 'ui',
    de: 'PDF wird erstellt …',
    en: 'Generating PDF …',
  },
  {
    id: 'ui.review.shareLink',
    category: 'ui',
    de: 'Konfiguration teilen',
    en: 'Share configuration',
  },
  {
    id: 'ui.review.linkCopied',
    category: 'ui',
    de: 'Link in Zwischenablage kopiert.',
    en: 'Link copied to clipboard.',
  },
  {
    id: 'ui.review.backToEdit',
    category: 'ui',
    de: 'Zurück zur Bearbeitung',
    en: 'Back to editing',
  },
  {
    id: 'ui.review.requiredMissing',
    category: 'ui',
    de: 'Bitte wählen Sie zuerst alle Pflicht-Schritte aus.',
    en: 'Please complete all required steps first.',
  },

  // ── PDF labels ────────────────────────────────────────────────────────
  { id: 'pdf.title', category: 'ui', de: 'Maschinen-Konfiguration', en: 'Machine configuration' },
  { id: 'pdf.dateLabel', category: 'ui', de: 'Datum', en: 'Date' },
  { id: 'pdf.step', category: 'ui', de: 'Schritt', en: 'Step' },
  { id: 'pdf.selection', category: 'ui', de: 'Auswahl', en: 'Selection' },
  { id: 'pdf.priceNet', category: 'ui', de: 'Aufschlag (Netto)', en: 'Surcharge (net)' },
  { id: 'pdf.basePrice', category: 'ui', de: 'Grundpreis (Netto)', en: 'Base price (net)' },
  { id: 'pdf.total', category: 'ui', de: 'Gesamtpreis (Netto)', en: 'Total (net)' },
  { id: 'pdf.notSelected', category: 'ui', de: '— nicht gewählt —', en: '— not selected —' },
  {
    id: 'pdf.configurationUrl',
    category: 'ui',
    de: 'Konfigurations-Link',
    en: 'Configuration link',
  },
  {
    id: 'pdf.requestNote',
    category: 'legal',
    de: 'Diese Zusammenfassung dient als Anfrage-Grundlage und ist kein verbindliches Angebot.',
    en: 'This summary is an inquiry basis and not a binding offer.',
  },
  {
    id: 'pdf.filename',
    category: 'ui',
    de: 'maschinen-konfiguration.pdf',
    en: 'machine-configuration.pdf',
  },

  // ── Error messages ────────────────────────────────────────────────────
  {
    id: 'errors.optionUnavailable',
    category: 'error',
    de: 'Diese Option ist derzeit nicht lieferbar.',
    en: 'This option is currently unavailable.',
  },
  {
    id: 'errors.ruleConflict',
    category: 'error',
    de: 'Diese Auswahl ist mit den bereits getroffenen Entscheidungen nicht kombinierbar.',
    en: 'This selection is not compatible with the choices already made.',
  },
  {
    id: 'errors.requiredStepsMissing',
    category: 'error',
    de: 'Bitte wählen Sie zuerst alle Pflicht-Schritte aus.',
    en: 'Please complete all required steps first.',
  },
  {
    id: 'errors.invalidSelection',
    category: 'error',
    de: 'Eine Ihrer Auswahlen passt nicht mehr zu den anderen — bitte den markierten Schritt korrigieren.',
    en: 'One of your selections no longer matches the others — please review the marked step.',
  },
  {
    id: 'errors.urlInvalid',
    category: 'error',
    de: 'Der geteilte Konfigurations-Link konnte nicht vollständig wiederhergestellt werden.',
    en: 'The shared configuration link could not be fully restored.',
  },
  {
    id: 'errors.pdfFailed',
    category: 'error',
    de: 'Das PDF konnte nicht erstellt werden. Bitte erneut versuchen.',
    en: 'The PDF could not be generated. Please try again.',
  },

  // ── Disclaimers (legal) ───────────────────────────────────────────────
  {
    id: 'ui.summary.disclaimer',
    category: 'legal',
    de: 'Indikative Preise — finale Bestätigung im Angebot.',
    en: 'Indicative prices — final confirmation in the quote.',
  },
  {
    id: 'ui.summary.vatNote',
    category: 'legal',
    de: 'zzgl. ges. MwSt.',
    en: 'plus statutory VAT.',
  },
]
