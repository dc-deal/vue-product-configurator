# Code-Guidelines

Kompakter Style-Guide für den Konfigurator. Verbindlich vor jeder Code-Änderung lesen. Architektur-Begründungen stehen im Konzept (`konzept.md`); hier geht es nur um Konventionen.

---

## Sprache: Englisch im Code, Deutsch in der Doku

**Im Code** (alles im Repo-Root, v. a. `src/` und `tests/`):

- Bezeichner für Typen, Interfaces, Variablen, Funktionen, Methoden und Klassen: **Englisch**
- Vue-Komponenten-Dateinamen und Komponenten-Namen: Englisch (`ConfiguratorShell`, nicht `KonfiguratorShell`)
- Property-Namen in Interfaces: Englisch, `camelCase` (`priceNet`, nicht `preis_netto`)
- Code-Kommentare und JSDoc: Englisch
- Commit-Messages: Englisch
- Web-Component-Tag-Name: Englisch (`<mbk-configurator>`)
- i18n-Keys: Englisch, hierarchisch mit Punkt-Notation (`errors.urlInvalid`, `machine.power.kw11`)
- Konstanten und String-Identifier (URL-Slugs, Produkt-IDs): Englisch (`machine-tool-xr`)

**In den Dokumenten** (alles unter `docs/`):

- Markdown-Prosa: Deutsch
- Kommentare in Markdown-Code-Snippets: Englisch (weil sie illustrieren wie der Code aussieht)
- i18n-Key-Beispiele in der Doku: Englisch (Codebezug)
- **Denglisch-Exoten vermeiden** — englische Adjektive und Substantive, die in deutschen Sätzen gestelzt klingen, durch deutsche Pendants ersetzen. Beispiele:
  - "der Test ist _brittle_" → "der Test ist **fragil** / **instabil**"
  - "_Violation_ von X" → "**Verletzung** von X"
  - "kein eigenes _Harness_" → "kein eigenes **Test-Setup**"
  - "_Leveraging_ der Funktion" → "**Nutzung** der Funktion"
  - **Etablierte Engineering-Begriffe** bleiben drin und sind kein Denglisch: Fallback, Reload, Override, Trigger, Hook, Stub, Wrapper, Bundle, Backlog, Polish, Mock, Preload, Happy Path, Breaking Changes, Shadow DOM, Custom Element, Web Component, ARIA. Diese sind in der deutschen Engineer-Sprache eingebürgert; sie zu übersetzen wirkt umgekehrt umständlich.

**In den i18n-Übersetzungen** (`src/data/translations.ts`):

- `de`-Werte: Deutsch (User-facing-Texte)
- `en`-Werte: Englisch (User-facing-Texte)
- `id` und `category`: Englisch (Code-Bezug)

**Begründung der Trennung:** Code wird vom Vue/TS/Pinia-Ecosystem aus gedacht — alles dort ist Englisch, gemischte Bezeichner brechen den Lese-Fluss. Doku wird vom Kunden-Kontext aus gedacht — beide sind deutsche Organisationen, deutsche Doku ist die natürliche Wahl. User-facing-Texte sind explizit zweisprachig durch i18n.

### Dateinamen

| Verzeichnis / Datei-Klasse                                                 | Sprache                | Beispiele                                                          |
| -------------------------------------------------------------------------- | ---------------------- | ------------------------------------------------------------------ |
| `src/`, `tests/`, `.github/` (Code, Repo-Root)                           | **Englisch (Pflicht)** | `ConfiguratorShell.vue`, `productService.ts`, `test.yml`           |
| `docs/` (Repo-Doku)                                                        | **Deutsch**            | `code-guidelines.md`, `konzept.md`, `problemstellung.md`           |
| Standardisierte Files (Konvention)                                         | **Englisch**           | `README.md`, `LICENSE`, `package.json`, `.prettierrc`              |

Faustregel: Dateinamen innerhalb der Code-Struktur folgen den Code-Konventionen (Englisch), unabhängig vom Inhalt der Datei. `docs/` ist ein eigenständiger Doku-Bereich und darf deutsche Dateinamen führen.

---

## Naming-Konventionen

| Element                   | Konvention                         | Beispiel                                  |
| ------------------------- | ---------------------------------- | ----------------------------------------- |
| Typen / Interfaces        | `PascalCase`                       | `ProductOption`, `ConfigurationStep`      |
| Variablen / Properties    | `camelCase`                        | `priceNet`, `currentStep`                 |
| Funktionen / Methoden     | `camelCase`, Verb-Anfang           | `loadConfiguration`, `evaluateRule`       |
| Konstanten (compile-time) | `UPPER_SNAKE_CASE`                 | `MAX_STEPS`                               |
| Vue-Komponenten           | `PascalCase`, semantischer Präfix  | `ConfiguratorShell`, `ConfiguratorReview` |
| Composables               | `use`-Präfix                       | `useUrlState`, `useI18n`                  |
| Pinia Stores              | `use…Store`-Pattern                | `useConfiguratorStore`                    |
| Vue-Dateinamen            | `PascalCase.vue`                   | `ConfiguratorShell.vue`                   |
| TS-Dateinamen             | `camelCase.ts` oder `lowercase.ts` | `productService.ts`, `types.ts`           |
| URL-Slugs / Produkt-IDs   | `kebab-case`                       | `machine-tool-xr`                         |
| i18n-Keys                 | `dot.camelCase`                    | `errors.urlInvalid`                       |

---

## Format & Style

### Prettier-Konfiguration

`.prettierrc` ist die Single Source of Truth für die Formatierung — Format-on-Save in VS Code (s. `.vscode/settings.json`) wendet sie automatisch an, manuell läuft `npm run format`. Die Wahl der Settings:

| Setting         | Wert       | Begründung                                                                           |
| --------------- | ---------- | ------------------------------------------------------------------------------------ |
| `semi`          | `false`    | Modernes TS hat keine ASI-Falle mehr; keine Semikolons reduzieren visuelles Rauschen |
| `singleQuote`   | `true`     | TS/JS-Konvention; Vue-Templates dürfen weiter double quotes für Attribute nutzen     |
| `trailingComma` | `'all'`    | Diff-freundlich — neue Zeilen ändern nicht die vorherige Zeile                       |
| `printWidth`    | `100`      | Modern aber nicht endlos; Side-by-Side-Diffs bleiben lesbar                          |
| `arrowParens`   | `'always'` | Konsistent: `(x) => x` statt mal mit, mal ohne Klammern                              |

### Vue Single-File-Component-Struktur

Block-Reihenfolge in `.vue`-Dateien:

```vue
<script setup lang="ts">
// Logik zuerst: Imports, defineProps, State, Computed, Methods
</script>

<template>
  <!-- View danach -->
</template>

<style scoped>
/* Presentation zuletzt */
</style>
```

- **`<script setup>` ist Pflicht** — keine Options-API, keine `export default { ... }`-Komponenten
- **`scoped` Styles per Default** — globale Styles nur in `App.vue`-`:host`-Block oder `src/style.css` (Host-Page)
- **Reihenfolge-Begründung**: liest sich von "was tut die Komponente" zu "wie sieht sie aus"; Logik ist häufiger gelesen/geändert als Styles

### CSS-Konventionen

- **Werte aus Tokens beziehen**: `var(--mbk-color-primary)` statt hartkodiertem `#1976d2`
- **Klassen-Namen**: `kebab-case`, beschreibend (`.option-card`, nicht `.btnBlue` oder `.card1`)
- **Token-Präfix-Konvention**: `--mbk-*` für die öffentliche API (überschreibbar durch die Host-Page), präfixlose Tokens (`--space-1`, `--color-border`) für interne Verwendung. Begründung in Konzept §3.8.
- **Keine Inline-Styles** in Templates, außer für dynamische Werte aus dem Datenmodell (z. B. `:style="{ zIndex: layer.zIndex }"`)

### Kommentare

- **Englisch** (s. Sprach-Regel oben)
- **Sparsam** — der Code soll sich selbst erklären; Kommentare beantworten das **Warum**, nicht das **Was**
- **JSDoc** nur für exportierte/öffentliche APIs (Funktionen, Interfaces), nicht für Implementations-Details
- **TODO/FIXME** mit konkretem Kontext: `// TODO: handle invalid URL — see concept §3.5`

### Vue Composition API-Patterns

- **Props deklarieren** mit Generic-Syntax: `defineProps<{ product: string }>()` (type-only), nicht mit Runtime-Object
- **Reactive State**: `ref()` für Primitiven, `reactive()` nur bei Bedarf; `computed()` für abgeleitete Werte
- **Logik wiederverwenden**: in `src/composables/` als `useXyz()`-Funktion auslagern, nicht in Komponenten duplizieren
- **Store-Zugriff**: über `useXyzStore()`-Composable; in Templates per `store.field` direkt, nicht zwingend mit `storeToRefs` (außer bei Destructuring-Anforderung)

### Async/Await

- **`async/await` statt Promise-Chains** — `await foo()` ist im gesamten Code-Base konsistent
- Fehlerbehandlung mit `try/catch`, nicht `.catch()`
- Top-level-Aufrufe in `onMounted` mit `void`-Operator, wenn der Return-Wert nicht gebraucht wird: `void store.loadProduct(slug)`

---

## Imports

- Type-only Imports immer mit `import type { … }` markieren (TS-Build entfernt sie sonst nicht immer sauber).
- Eine Empfehlung — keine harte Regel — ist es, externe Pakete zuerst, lokale danach zu listen; Prettier formatiert das nicht um und es gibt keinen Linter, der es erzwingt. Sauberkeit > strikte Block-Reihenfolge.

```typescript
import { defineStore } from 'pinia'
import type { Configuration, ProductOption } from '../data/types'
import { productService } from '../services/productService'
```

---

## Commits

Englisch, kurz, im Imperativ. Optional ein Präfix:

- `feat:` neue User-facing-Funktionalität
- `refactor:` Code-Umbau ohne Verhaltensänderung
- `fix:` Bugfix
- `docs:` Dokumentations-Änderung
- `test:` Tests hinzugefügt / verändert
- `chore:` Build/Config/Dependencies

Beispiele:

```
feat: add live price update to summary
refactor: rename German identifiers to English
docs: clarify VAT decision in concept §5
```

---

## TypeScript

- **`strict` mode ist Pflicht.** Keine `any`. Wenn ein Typ wirklich unbekannt ist: `unknown` + Narrowing.
- Type-only Imports markieren (`import type { … }`)
- Interfaces für Daten-Strukturen, `type` für Unions und Tuples
- Funktions-Signaturen explizit typisieren (Parameter und Return)

---

## Tests

- Pflicht-Test-Set steht in Konzept Anhang B.6
- Test-Dateinamen: `<modul>.test.ts`
- Test-Beschreibungen: Englisch, im "should …" oder "<X> does Y"-Stil
- Fixtures sind gleichzeitig Test-Datenbasis (keine separaten Mocks)

---

## Verweise

- Konzept-Architektur: [`konzept.md`](konzept.md)
- Pflicht-Test-Liste: Konzept Anhang B.6
- Versionierungs-Schema: Konzept Anhang C.4 (SemVer mit `0.x`/`1.0.0`/`2.0.0`-Stufen)
