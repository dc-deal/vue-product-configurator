# Changelog

Alle nennenswerten Änderungen am Maschinenbau-Konfigurator. Format basiert auf
[Keep a Changelog](https://keepachangelog.com/de/1.1.0/); Versionierung folgt
[SemVer](https://semver.org/lang/de/) gemäß Konzept Anhang C.4.

## [1.0.0] — 2026-05-26

Erstveröffentlichung.

### Added

- **Konfigurator-Web-Component** `<mbk-configurator>` (Vue 3 `defineCustomElement`)
  mit Shadow-DOM-Isolation und CSS-Token-Schicht `--mbk-*` als öffentliche
  Theming-API.
- **5-Schritt-Konfiguration** (Leistung, Steuerung, Antrieb, Werkzeugaufnahme,
  optionales Zubehör) mit klickbarer Progress-Bar, Step-Pills für aktive/
  gefüllte/optionale Zustände und Vor-/Zurück-Navigation.
- **Live-Preis-Berechnung** (Netto, `basePriceNet + Σ priceNet`) und Summary-
  Spalte mit Hero-Total, „zzgl. ges. MwSt."-Hinweis und Disclaimer.
- **Regel-Engine** (`evaluateRule`) mit `allowedWhen`-Conditions im Pinia-Store;
  zwei Demo-Pattern (Hochleistungs-Servo nur bei 30 kW Leistung; automatischer
  Werkzeugwechsler nur bei SPS-Premium-Steuerung).
- **Availability-Handling**: nicht lieferbare Optionen (HSK63) sind sichtbar
  ausgegraut und blockieren `select()`.
- **Shareable URL** via `?k=stepA:optionA,stepB:optionB` und
  `history.replaceState`; Replay beim Boot filtert ungültige/gesperrte Werte
  und setzt `lastError = errors.urlInvalid` bei Konflikten.
- **PDF-Export** (clientseitig via pdfmake, lazy-loaded) mit
  Konfigurations-Tabelle, Grund- und Gesamtpreis, VAT-Note, Disclaimer,
  Anfrage-Hinweis und URL im Footer.
- **Review-Screen** als (n+1)ter Stop im Step-Flow mit PDF-Download (disabled
  bis alle Pflicht-Schritte gefüllt), Konfigurations-Link-Kopieren mit
  Clipboard-API und Statusmeldung (ARIA-live).
- **Internationalisierung** (DE/EN) via flacher `useI18n`-Pool, Sprache als
  Custom-Element-Attribut. Übersetzungen für Produkt-, UI-, PDF-, Legal- und
  Error-Bereich vollständig zweisprachig.
- **Retroaktive Selection-Validierung**: Store-Getter `invalidSelectionSteps`
  + `errors.invalidSelection`. Wird eine Voraussetzung nachträglich geändert,
  färbt sich der betroffene Step-Tab rot mit `!`-Index, die Summary-Zeile rot
  mit ⚠-Hint, der Review-Tab schaltet auf Alarm und der PDF-Button bleibt
  disabled.
- **Rule-Engine-UI-Feedback**: Optionen mit nicht erfüllter `allowedWhen`-
  Bedingung rendern visuell deaktiviert (gestrichelte Border, grauer
  Hintergrund, kein Hover) und zeigen einen Hint-Text mit der Voraussetzung,
  z. B. „Benötigt: SPS Premium".
- **„Kein Zubehör"-Option** im optionalen Add-on-Schritt als expliziter
  No-op statt Toggle-Abwählen.
- **URL-Replay-Positionierung**: nach Replay landet der User auf dem ersten
  noch ungefüllten Pflicht-Schritt oder direkt im Review-Screen, wenn die
  URL alle Pflicht-Schritte erfüllt.
- **Test-Setup**: 45 Vitest-Tests — Smoke + Fixture-Struktur + Derived State +
  Navigation + Reset, 8 Pflicht-Tests gemäß Konzept Anhang B.6, 4 Szenario-
  Tests gemäß B.7, 4 URL-State-Unit-Tests, 3 URL-Replay-Positionierung,
  3 retroaktive Invalidierung.
- **Coverage**: `@vitest/coverage-v8` als devDependency, `npm run coverage`
  mit harten Thresholds (Lines/Stmts/Funcs ≥ 80 %, Branches ≥ 70 %) und
  präzisen Excludes (Components, pdfmake-Wrapper, Fixtures/Types). Aktueller
  Stand: 95 % Lines / 91 % Stmts / 100 % Funcs / 81 % Branches.
- **Pre-Merge-Check** via GitHub Actions (`type-check` + `test` auf jedem PR).
- **Demo-Asset**: vier handgezeichnete Motor-Symbole als Inline-SVG für den
  Power-Step.
- **Vite-Konfiguration**: `customElement: true` im `@vitejs/plugin-vue`-Setup,
  damit scoped styles der Kind-Komponenten zur Laufzeit in die Shadow Root
  injiziert werden. `base: './'` für portable Asset-Pfade — die
  Lazy-Chunks (pdfmake, vfs_fonts) resolven relativ zum Entry-Script, egal
  ob das Bundle unter `/`, `/wp-content/plugins/.../dist/` oder einem
  CDN-Sub-Pfad ausgeliefert wird.

### Concept & Docs

- **Problemstellung** `docs/problemstellung.md` als neutraler Ausgangspunkt.
- **Konzept-Dokument** `docs/konzept.md` mit Architektur, Trade-offs und
  Anhängen A/B/C (Build-Vorgaben, README-/`docs/`-Struktur, Engineering-Backlog).
- **Code-Guidelines** `docs/code-guidelines.md` mit Sprach-,
  Naming- und Format-Konventionen (Code Englisch, Doku Deutsch, User-Texte
  zweisprachig via i18n).

### Architecture decisions (concept §4)

- Frontend-Regel-Engine in v1 statt Backend; Migration zu Backend ist
  Service-Implementierung, kein UI-Refactoring.
- PDF clientseitig statt mailto/Kontaktformular (DSGVO sauber, mobile-robust).
- Netto-Preise als Richtwerte + explizite MwSt-Disclaimer; verbindliche
  Preise/MwSt-Logik gehören ins ERP.
- WCAG 2.1 AA als Baseline (semantisches HTML + Token-Schicht, deckt
  EN 301 549 / Web-Teil des BFSG technisch ab); formaler Audit + Konformitäts-
  erklärung post-v1.
- Kein Dark Mode, kein UI-Sprach-Umschalter in v1 (Sprache kommt als Custom-
  Element-Attribut vom WordPress-Theme; Token-Schicht hält Dark Mode offen).

## [Unreleased]

Zukünftige Iterationen sind in Konzept §7 (Stufen A/B/C) skizziert:
optionales Kontaktformular, eigenes Backend mit Konfigurations-Speicherung,
ERP-Anbindung mit Live-Preisen und Verfügbarkeit.

[1.0.0]: https://github.com/dc-deal/vue-product-configurator/releases/tag/v1.0.0
[Unreleased]: https://github.com/dc-deal/vue-product-configurator/compare/v1.0.0...HEAD
