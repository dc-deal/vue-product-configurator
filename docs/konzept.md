# Produkt-Konfigurator — Konzept- & Architektur-Dokument

**Projekt:** Produkt-Konfigurator als einbettbare Web-Komponente
**Kunde:** Mittelständischer Maschinenbauer, Süddeutschland, ~80 MA, B2B
**Erstellt:** 26.05.2026
**Autor:** Frank Krätzig

---

## 1. Ausgangslage & Ziel

Der Kunde betreibt eine bestehende WordPress-Website (technisch konservativ, ordentlich gepflegt). Er möchte einen interaktiven Produkt-Konfigurator einbetten, über den Endkunden ein Produkt mit 5–8 wählbaren Optionen zusammenstellen können. Aus der fertigen Konfiguration heraus soll eine Anfrage an den Kunden ausgelöst werden könne (PDF-Zusammenfassung als Anfrage-Grundlage).

Eine spätere ERP-Anbindung ist explizit genannt und muss im Konzept berücksichtigt werden — auch wenn sie für v1 noch nicht umgesetzt wird.

---

## 2. Annahmen (Grundlage dieser Konzeption)

Da das Erstgespräch bewusst offen gehalten war, basiert dieses Konzept auf folgenden Annahmen. Diese sind beim nächsten Internen Besprächung / Kundengespräch zu validieren:

- Die Website hat **kein bestehendes Shop-System** (kein WooCommerce o.ä.)
- Produkte haben eine **hierarchische Struktur**: Die Auswahl einer Option schränkt nachfolgende Optionen ein (z.B. Material → Länge → Zubehör)
- Jede Produktoption hat eine **Artikel-ID** für spätere Warenwirtschafts-Anbindung
- Preise werden in v1 als **indikative Brutto-Richtwerte in Fixtures** hinterlegt; Live-Update bei jeder Auswahl ist Briefing-Anforderung und v1-Pflicht (s. §5)
- **Brutto/Netto-Umschaltung und MwSt.-Logik** werden in v1 bewusst nicht implementiert — Begründung in §5
- Die Website hat eine **deutsche und englische Sprachversion** (Annahme — zu prüfen)
- **Kein UI-Sprach-Umschalter im Konfigurator selbst** (bewusster Schnitt, Zeitbudget). Die i18n-Infrastruktur (flacher Übersetzungs-Pool, `useI18n`-Composable, Custom-Element-Attribut `language`) ist vollständig vorhanden — die Sprache wird durch das einbettende WordPress-Theme gesetzt, nicht durch den Konfigurator. Ein UI-Switch ist v2-Thema und reines Frontend-Add-on.
- **Mobile-First**: Der Konfigurator muss auf Smartphones vollständig bedienbar sein (B2B-Kunden recherchieren zunehmend mobil)
- Der Konfigurator soll sowohl auf einer **eigenen Seite** als auch **inline in bestehende Produktseiten** einbettbar sein
- **Bezeichnung des Demo-Kunden:** Da der reale Kunde nicht namentlich bekannt ist, wird er hier durchgängig als **"Maschinenbau-Firma"** benannt. Es handelt sich um einen Platzhalter für den im Briefing skizzierten mittelständischen Maschinenbauer.
- **Projekt- und Repo-Bezeichnung:** Das Projekt heißt in der Doku **"Maschinenbau-Konfigurator"**; der Anwendungscode liegt im Repo-Root (siehe Sprachregel für Filenames in `docs/code-guidelines.md`).
- **Repo-Sichtbarkeit & Lizenz:** Das Repository ist öffentlich unter MIT-Lizenz (s. `LICENSE`). Urheberschaft verbleibt bei Frank Krätzig.

### 2.1 Briefing-Erfüllung im Überblick

Folgende Tabelle gleicht die wörtlichen Briefing-Anforderungen mit der v1-Konzeption ab:

| Briefing-Anforderung (wörtlich oder sinngemäß)     | v1-Umsetzung                                                                                                            | Status        |
| -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ------------- |
| "Maschine mit 5-8 wählbaren Optionen"              | 5 Konfigurationsschritte (§3.3)                                                                                         | ✓             |
| "Pro Auswahl aktualisiert sich der Preis live"     | Live-Update der Netto-Gesamtsumme in der Summary (§5)                                                                   | ✓             |
| "PDF-Zusammenfassung als Anfrage-Grundlage"        | Clientseitige PDF-Generierung via pdfmake (§3.7)                                                                        | ✓             |
| "Spätere ERP-Anbindung denkbar, v1 nicht relevant" | Service-Layer + ERP-realistisches Schema (§3.3, §7C)                                                                    | ✓ vorbereitet |
| "Vue 3, Dummy-Daten ok"                            | Vue 3 + TypeScript + Fixtures (§3.2, §3.3)                                                                              | ✓             |
| "Annahmen treffen gehört zur Aufgabe"              | Annahmen-Block §2; bewusste Schnitte in §3.7, §5, §3.8                                                                  | ✓             |
| Bewusste Schnitte statt Feature-Vollständigkeit    | WordPress-Plugin-Wrapper in 2. Iteration (§3.1); MwSt./Brutto bewusst ausgelassen (§5); Dark Mode zurückgestellt (§3.8) | ✓             |

**Eigene Annahmen, die das Briefing offenlässt** (alle in §2 markiert, beim Kundengespräch zu validieren): Mehrsprachigkeit de/en, Mobile-First, Material-Design-orientiertes UI, WordPress-Plugin-Architektur, Netto-Anzeige im B2B-Stil.

---

## 3. Empfohlene Architektur

### 3.1 Einbettungsform

**Empfehlung: Vue 3 Web Component (Custom Element) via WordPress-Plugin**

**Web Component vs. SPA:** Ein **Web Component** ist ein eigenständiges HTML-Element (`<mbk-configurator>`), das **in eine bestehende Seite eingebettet** wird — WordPress-Theme, Menü, Footer und Marketing-Inhalte bleiben drumherum aktiv. Eine **Single Page App** würde dagegen die ganze Seite übernehmen (eigenes Routing, eigenes Layout, eigene URL-Hoheit) — was bedeutet, dass der Endkunde von der Marketing-Site weggeführt wird; verworfen aus Gründen s. "Verworfene Alternativen" weiter unten.

Der Konfigurator wird als Vue 3 Single File Component (SFC) gebaut und per `npm run build` zu einem einzigen JavaScript-Bundle kompiliert. Dieses Bundle wird in einer zweiten Iteration als **WordPress-Plugin** verpackt und per **Shortcode** eingebettet:

```
[mbk_configurator produkt="machine-tool-xr"]
```

**Begründung:**

- Kein Eingriff in das bestehende WordPress-Theme
- Flexibel: funktioniert auf eigener Seite und inline auf Produktseiten gleichermaßen
- Keine Konflikte mit bestehenden jQuery-Abhängigkeiten der Theme-Seite
- Einfaches Update: neues Bundle tauscht Plugin-Asset aus, WordPress-Seite bleibt unberührt
- Skalierbar: mehrere Konfiguratoren mit unterschiedlichen Produktdaten per Parameter

#### Scope der ersten Iteration

Das hier dokumentierte v1-Lieferergebnis umfasst **ausschließlich das Vue-Frontend-Bundle** als Web Component. Der eigentliche WordPress-Plugin-Wrapper (PHP-Stub mit Shortcode-Registrierung, Asset-Loading, Admin-Konfiguration) ist ein nachgelagerter Schritt in einer zweiten Iteration. Das Bundle ist in v1 lokal über `index.html` und durch automatisierte Tests demonstrierbar; das stellt das **Bedienkonzept** scharf, ohne in der ersten Phase WordPress-Infrastruktur aufzusetzen, die dem Fokus (Frontend-Tiefe, Architekturdenken) nicht dient.

#### Verworfene Alternativen

| Alternative                                                        | Verworfen weil                                                                                                                                                                                                                                                            |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Standalone SPA auf eigener Subdomain** (`konfigurator.kunde.de`) | Endkunden werden von der bestehenden Marketing-Site weggeführt — Verlust von Cross-Selling-Bereichen und Werbeflächen. Zusätzlich: eigene Datenschutzerklärung und Impressum nötig (redundant zur Hauptseite, juristischer Mehraufwand).                                  |
| **iframe-Einbettung**                                              | Kein Sicherheitsrisiko im technischen Sinn (Same-Origin-Policy isoliert iframes ja gerade), aber: Mixed-Content-Warnings, restriktive `X-Frame-Options`-Header, Suchmaschinen verlinken iframe-Inhalt nicht zur Host-Seite, geringere wahrgenommene Vertrauenswürdigkeit. |
| **Direkt-Integration ins WordPress-Theme**                         | Eingriff in fremden Theme-Code, Konflikte mit jQuery, Update-Sicherheit gefährdet.                                                                                                                                                                                        |

Das Web-Component-Plugin-Pattern erfüllt alle Anforderungen ohne diese Nachteile.

### 3.2 Frontend-Stack

| Schicht   | Technologie                 | Begründung                                    |
| --------- | --------------------------- | --------------------------------------------- |
| Framework | Vue 3, Composition API      | Produktiv bewährt, reaktives State-Management |
| Sprache   | TypeScript                  | Typsicherheit, Wartbarkeit                    |
| Build     | Vite                        | Schnelle Builds, optimiertes Bundle           |
| State     | Pinia                       | Einfach, Vue-3-nativ, gut testbar             |
| Design    | Material Design (angelehnt) | Bekannt von Mobilgeräten, keine Lernkurve     |
| Tests     | Vitest + Vue Test Utils     | Fixtures als Testdatenbasis                   |
| CI        | GitHub Actions              | Automatische Verifikation bei jedem Push      |

#### Browser-Support-Matrix

Unterstützt werden **moderne Evergreen-Browser, jeweils die aktuelle Major-Version** (Stand Mai 2026: Chrome 148, Firefox 151, Edge 148, Safari 18.5; plus iOS Safari und Chrome Android in entsprechenden Versionen). Ältere Versionen werden in v1 bewusst nicht getestet — der enge Zeitrahmen erlaubt keinen Cross-Version-Test-Aufwand; Evergreen-Browser updaten heute praktisch alle automatisch im Hintergrund, daher ist die Annahme aktueller Versionen vertretbar.

**Bewusst nicht unterstützt:** Internet Explorer 11, Edge Legacy (EdgeHTML-basierte Version des Microsoft Edge-Browser), oder "IE Mode in Edge". Begründung: wir nutzen native Web Components (`defineCustomElement`), Shadow DOM, ES2022-Syntax und Vue 3 — alle Technologien, die in IE11 ohnehin nicht funktionieren. Polyfill-Aufwand für Legacy-Browser stünde in keinem Verhältnis zum B2B-Maschinenbau-Kontext (Endkunden recherchieren typischerweise auf Geschäfts-Laptops mit aktuellem Browser, B2B-Einkauf zunehmend mobil — beides Evergreen).

#### Bundle-Size-Budget (Soft-Target)

Ziel: **das Custom-Element-Bundle bleibt unter 250 kB gzipped**. Aktuelle Schätzung der Verteilung:

| Komponente                                                            | Geschätzt gzipped |
| --------------------------------------------------------------------- | ----------------- |
| Vue 3 + Pinia                                                         | ~55 kB            |
| pdfmake (mit Roboto-Font eingebettet)                                 | ~150 kB           |
| Eigener Code (Components, Store, Composables, Fixtures, Translations) | ~20 kB            |
| **Gesamt**                                                            | **~225 kB**       |

**Schadensbegrenzung falls Budget knapp**, zwei Wege:

1. **Lazy-Load (kurzfristig):** pdfmake nur bei Klick auf "PDF speichern" via dynamischen Import laden (`const { default: pdfMake } = await import('pdfmake/build/pdfmake')`). Initiales Bundle ~75 kB, pdfmake-Chunk on demand. In v1 noch nicht implementiert (Aufwand vs. tatsächliche Bundle-Größe abwägen); Backlog-Eintrag bei Überschreitung des 250-kB-Limits.

2. **Server-Side-PDF-Migration (post v1.0):** PDF-Rendering wandert auf den WordPress-Server (mPDF / TCPDF / Dompdf), Browser sendet nur die Configuration-Daten an einen WP-REST-Endpunkt. Bundle ~150 kB schlanker, Templates mächtiger (Branding, externe Schriften, komplexes Layout). Trade-off: bricht die "kein Backend / kein Datentransfer"-Linie aus §3.7 — DSGVO-Posture wäre neu zu bewerten (Configuration-Daten sind keine PII, aber IP-Logging im PHP). Sinnvoller Migrationspunkt ist `v1.x` (Plugin-Wrapper existiert dann ohnehin) oder `v2.0` (Backend kommt sowieso dazu).

### 3.3 Datenmodell (Fixtures, v1)

Produktdaten werden als TypeScript-Fixtures (JSON-Struktur) ausgeliefert. Jede Option ist ein Knoten im Konfigurationsbaum.

```typescript
// A selectable option within a configuration step
interface ProductOption {
  id: string; // article ID for ERP / warenwirtschaft
  labelKey: string; // i18n key, e.g. 'machine.power.kw11' (s. §4)
  type: "power" | "control" | "drive" | "tool" | "addon" | "service";
  priceNet: number; // net surcharge in € (live price update, s. §5); may be 0
  priceReference?: string; // key for later ERP lookup (v2), not active in v1
  availability: "available" | "unavailable";
  specificationUrl?: string; // link to product data sheet (PDF), currently mock
  helpKey?: string; // i18n key for onboarding-tour coachmark (post v1, s. §3.9)
  imageUrl?: string; // overlay/preview image (single-image v1, layer-stack post v1, s. §3.11)
  imageZIndex?: number; // stacking order in the image-layer engine (post v1, s. §3.11)
  meta?: Record<string, unknown>; // e.g. minPowerKw, strength — extensible
  allowedWhen?: RuleCondition[]; // rule engine: visible/selectable only when …
  excludes?: string[]; // IDs disabled by this selection
}

// A single configuration step with its selectable options
interface ConfigurationStep {
  id: string;
  labelKey: string;
  options: ProductOption[];
  helpKey?: string; // i18n key for step-level coachmark (post v1, s. §3.9)
  optional?: boolean; // default false (= required); s. §3.5 PDF-Generierungs-Voraussetzung
  selectionMode?: "single" | "multiple"; // default 'single'; 'multiple' ist post v1 (s. §3.12)
}

// Configuration level with fiscal master data (ERP-preparing)
interface Configuration {
  steps: ConfigurationStep[];
  basePriceNet: number; // net base price before options
  currency: "EUR"; // ISO 4217 — fixed EUR in v1
  billingCountry: "DE"; // ISO 3166-1 alpha-2 — fixed DE in v1
  vatRate: number; // e.g. 0.19 — stored, not applied in v1 UI (s. §5)
  baseImageUrl?: string; // base/body image rendered as layer 0 (post v1, s. §3.11)
}
```

**Schema-Begründung (ERP-Vorbereitung):** Die fiskalischen Felder (`currency`, `billingCountry`, `vatRate`) und der `priceReference`-Key auf Option-Ebene werden in v1 hinterlegt, aber nicht aktiv genutzt. Damit ist das Schema **ERP-realistisch** (ERPs speichern Netto-Werte mit zugeordneten Steuersätzen und Lieferländern) — die spätere Migration auf echte ERP-Daten (Zukunft C, §7) ist eine Service-Implementierung, keine Schema-Änderung.

#### Beispiel-Produktbaum (Werkzeugmaschine XR, illustrativ)

Briefing nennt als Konfigurations-Achsen wörtlich _"Leistungsklasse, Steuerung, vielleicht Zubehör"_ — eine **Werkzeugmaschine**. Das Demo-Beispiel orientiert sich an dieser Vorgabe und legt **fünf Konfigurationsschritte** an, im unteren Bereich des Briefing-Korridors von 5-8 Optionen:

```
1. Leistungsklasse      Pflicht  | 7,5 kW / 11 kW / 18,5 kW / 30 kW
2. Steuerung            Pflicht  | Manuell / SPS Standard / SPS Premium
3. Antrieb              Pflicht  | Riemen-Standard / Servo-Direktantrieb /
                                   Hochleistungs-Servo (nur ab Leistung ≥ 18,5 kW)
4. Werkzeugaufnahme     Pflicht  | HSK40 / HSK63 (derzeit vergriffen) / ISO40
5. Zusatzausstattung    Optional | (kein Eintrag erforderlich)
     Variante A         | Pneumatik-Spannfutter / Hydraulik-Spannfutter
     Variante B         | Automatischer Werkzeugwechsler
                          (nur bei Steuerung = SPS Premium)
```

Schritt 5 (Zusatzausstattung) ist als `optional: true` markiert — Pneumatik-Spannfutter oder Werkzeugwechsler sind echtes Zubehör, kein Muss für eine valide Konfiguration. Die ersten vier Schritte sind Pflicht und müssen für die PDF-Generierung ausgewählt sein (s. §3.5).

Das Beispiel demonstriert bewusst **zwei Regelwerk-Patterns**:

- Numerische Abhängigkeit (Hochleistungs-Servo ab 18,5 kW)
- Kategoriale Abhängigkeit (Werkzeugwechsler nur bei SPS Premium)

…und einen `vergriffen`-Zustand (HSK63), um die Ausgrau-Logik im UI zu zeigen. Die konkreten Daten sind durch echte Kundendaten austauschbar (§9).

#### Service-Layer: Vorbereitung für ERP-Anbindung

Auch in v1 greifen Komponenten **nicht direkt auf die Fixture-Datei zu**. Stattdessen liegt zwischen Fixture und Store ein dünner Service:

```typescript
// services/productService.ts
export interface ProductService {
  loadConfiguration(product: string): Promise<Configuration>;
}

// v1: returns fixtures wrapped in a Promise
// v2: replaced by fetch('/api/products/…') without touching store or UI
```

**Begründung:** Die ERP-Anbindung (Zukunft C in §7) ist damit eine Service-Implementierung, kein UI- oder Store-Refactoring. Aufwand in v1: ~30 Zeilen zusätzlich. Nutzen in v2: alle Komponenten und Tests bleiben unverändert.

### 3.4 Regelwerk (minimale Rule Engine)

Das Regelwerk läuft in v1 im Frontend (Pinia Store). Es ist bewusst einfach gehalten:

```typescript
interface RuleCondition {
  whenOptionId: string;
  hasValue: string;
}
// An option is selectable when ALL of its allowedWhen conditions are satisfied.
```

**Bekannte Einschränkung:** Das Regelwerk im Frontend ist für v1 akzeptabel, wird aber mit wachsender Produktkomplexität zur Wartungsaufgabe. Ab einer bestimmten Größe muss das Regelwerk ins Backend (s. Abschnitt 7, Zukunft B).

### 3.5 UI-Flow (Step-by-Step, Material Design)

- **Fortschrittsbalken** oben: zeigt Konfigurationsschritte, Schritte können während der Navigation **übersprungen werden** (B2B-Nutzer wollen vor- und zurückspringen); optionale Schritte tragen ein sichtbares Badge **"Optional"**. _v1-Form: umbrechende Pill-Reihe statt Material-Connector-Stepper — der Connector-Stepper würde bei 5+ Schritten auf < 375 px horizontal scrollen oder Labels kürzen müssen. Sauberes Upgrade (Connector auf Desktop, Compact `Step X/Y` mit Bottom-Sheet auf Mobile) ist post-v1 (~½ Tag inkl. ARIA)._
- **Linke Spalte:** Auswahloptionen des aktuellen Schritts
- **Rechte Spalte (Summary):** Aktuelle Zusammenfassung der Konfiguration, laufender Gesamtpreis (Netto)
- **Abschluss-Screen:** Übersicht der fertigen Konfiguration + Aktions-Buttons (PDF herunterladen, Konfiguration teilen)

#### Pflicht-Schritte und PDF-Generierung

Überspringen während der Navigation und PDF-Generierungs-Voraussetzung sind **zwei verschiedene Validierungs-Ebenen**:

- **Navigation:** alle Schritte sind jederzeit erreichbar und überspringbar, auch Pflicht-Schritte. Der Anwender soll vor- und zurückspringen können, ohne die Reihenfolge erzwingen zu müssen.
- **PDF-Generierung:** der "Als PDF speichern"-Button im Abschluss-Screen ist nur aktiv, wenn **alle Pflicht-Schritte** (`optional: false`, default) eine Auswahl haben. Optionale Schritte dürfen leer bleiben.

Wenn Pflicht-Schritte fehlen, zeigt der Abschluss-Screen:

- den Button im **disabled-Zustand** mit Tooltip "Bitte wählen Sie zuerst: …"
- eine inline-Hinweis-Liste der fehlenden Schritte, jeder Eintrag als Direktsprung-Link zum jeweiligen Schritt

Damit bleibt das Überspringen flexibel, der Abschluss aber valide. Der "Konfiguration teilen"-Button (URL-Kopie) bleibt unabhängig davon immer aktiv — eine unvollständige Konfiguration kann sehr wohl geteilt und später vervollständigt werden.

#### Fehler- und Edge-Case-Verhalten

Auch der "Happy Path" hat klar definierte Abzweigungen. Alle Fehlermeldungen werden über das i18n-System (§4) ausgegeben — der Endkunde sieht die Meldung in seiner Sprache:

| Situation                                                                 | Verhalten                                                                                                                                    | i18n-Key                      |
| ------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- |
| URL-Parameter `?k=...` enthält ungültige Konfiguration                    | Konfigurator startet im Default-Zustand + Hinweis-Banner: "Die geteilte Konfiguration konnte nicht geladen werden — bitte erneut auswählen." | `errors.urlInvalid`           |
| Shortcode-Parameter `product="..."` unbekannt                             | Statt Konfigurator: Fehlermeldung "Produktkatalog nicht gefunden." (im Web-Component-Slot, Site selbst bleibt intakt)                        | `errors.productUnknown`       |
| Sprache-Parameter `language="..."` unbekannt                              | Fallback auf Deutsch, keine Fehlermeldung (stilles Fallback)                                                                                 | —                             |
| In URL referenzierte Option ist `unavailable`                             | Option wird im Default ausgewählt aber als nicht-mehr-verfügbar markiert + Hinweis "Eine Ihrer Optionen ist derzeit nicht lieferbar."        | `errors.optionUnavailable`    |
| In URL referenzierte Option verletzt Regelwerk                            | Konflikt-Option wird _nicht_ übernommen, Default greift + Hinweis "Die Konfiguration enthielt nicht-kompatible Optionen."                    | `errors.ruleConflict`         |
| Versuch PDF zu generieren, Pflicht-Schritte fehlen                        | "Als PDF speichern"-Button bleibt disabled; inline-Liste der fehlenden Schritte mit Direktsprung-Links im Abschluss-Screen                   | `errors.requiredStepsMissing` |
| PDF-Generierung fehlgeschlagen (selten — z.B. Browser blockiert Download) | Fallback-Hinweis: "PDF konnte nicht erzeugt werden — bitte erneut versuchen oder Konfiguration teilen."                                      | `errors.pdfFailed`            |

**Designprinzip:** Der Konfigurator bricht nie hart ab. **Jeder Fehler führt in einen brauchbaren Zustand zurück**, der die Konfiguration fortsetzbar lässt.

### 3.6 Shareable URL

Die vollständige Konfiguration wird als URL-Parameter kodiert:

```
https://kunde.de/konfigurator?k=power:18-5kw,control:sps-premium,tool:hsk40
```

Damit ist jede Konfiguration direkt teilbar und überlebt Page Reload — kein Backend erforderlich.

### 3.7 Anfrage-Artefakt: PDF-Zusammenfassung

Das Briefing nennt eine "PDF-Zusammenfassung als Anfrage-Grundlage" als Output des Konfigurators. Diese wird **clientseitig im Browser generiert** und als Datei zum Download angeboten. Der Endkunde leitet das PDF anschließend über seinen eigenen Kanal (E-Mail, ERP-Anbindung, Einkaufs-Workflow) an den Maschinenbauer weiter — der Konfigurator selbst übermittelt nichts.

**Bewusst nicht vorgesehen in v1:**

- Keine `mailto:`-Verlinkung (mobile UX inkonsistent, abhängig vom installierten Mail-Client)
- Kein Kontaktformular (DSGVO-Aufwand: Einwilligung, AV-Vertrag, Datenschutzerklärung, sichere Übertragung — passt nicht in den Scope und braucht ein Backend)

#### Engine

**Empfehlung: [`pdfmake`](https://pdfmake.github.io/)** (MIT, ~150 KB gzipped, aktiv gepflegt).

Begründung gegenüber Alternativen:

- **Deklarative JSON-Struktur** für Layout — passt natürlich zu unserem reaktiven Konfigurations-State
- **Eingebettete Roboto-Font** (Apache License 2.0, s. §3.8): PDF sieht auf allen Endgeräten identisch aus, unabhängig von installierten System-Schriften
- **Native Tabellen-Unterstützung**: Konfigurationsübersicht ist tabellarisch, andere Libraries (jsPDF) brauchen dafür ein zusätzliches Plugin
- **Volltext-Suche und Copy-Paste**: anders als bei HTML-zu-Bild-Konvertern (`html2pdf.js`) bleibt der PDF-Text echter Text, nicht ein Bild

Verworfen: `jsPDF` (kleineres Bundle, aber API umständlicher und Fonts müssen manuell eingebettet werden), `html2pdf.js` (rendert als Bild — schlechtere Druckqualität, nicht durchsuchbar), Browser-Print-as-PDF (null Library, aber User muss durch Druck-Dialog navigieren — schlechte UX und kein Branding).

#### Inhalt des PDF

- Kopf: Logo-Platzhalter, Datum, Produktbezeichnung
- Tabellarische Übersicht der gewählten Optionen (Schritt → Auswahl → Artikel-ID → Netto-Aufschlag)
- Richtpreis-Block: Netto-Gesamtsumme + Hinweis "zzgl. ges. MwSt." + Disclaimer "Indikative Preise — finale Bestätigung im Angebot" (s. §5)
- Footer: Konfigurations-URL als Volltext + QR-Code (so kann der Empfänger die Konfiguration reproduzieren)
- Rechtlicher Hinweis: "Diese Zusammenfassung ist eine Anfrage-Grundlage, kein verbindliches Angebot."
- **Alle Texte über das Übersetzungsmodul gestützt** — Überschriften, Spaltenheader, Disclaimer, rechtlicher Hinweis kommen aus dem flachen Übersetzungs-Pool (s. §4). Damit ist das PDF automatisch zweisprachig (de/en) je nach aktiver Sprache, ohne Sonderlogik.

#### Datenschutz

Da das PDF rein clientseitig generiert wird, **verlässt kein einziges Datenelement das Gerät des Nutzers**. Es gibt keine Server-Übermittlung, kein Cookie-Setzen, keine Drittanbieter-Calls. Für die DSGVO-Bewertung der einbettenden Site ist der Konfigurator damit unkritisch (er verarbeitet keine personenbezogenen Daten im Sinne der Verordnung).

### 3.8 Theming, Isolation & Design-Tokens

Der Konfigurator wird in eine bestehende WordPress-Site eingebettet, deren visuelles Grunddesign wir weder kennen noch beeinflussen wollen. Zwei Anforderungen stehen damit gleichrangig nebeneinander: **(a)** der Konfigurator muss eigenständig konsistent aussehen, **(b)** er darf das umliegende Theme weder visuell noch strukturell stören — und umgekehrt nicht selbst von Site-Styles überschrieben werden.

#### Design-Sprache: Material Design (angelehnt)

Material Design wird als **visuelle Sprache übernommen, nicht als Implementierung**. Konkret heißt das:

- Spacing-Raster auf 4 px / 8 px-Vielfachen
- Elevation über vier Schatten-Stufen (`--elev-0` bis `--elev-3`)
- Buttons, Cards und Inputs mit Material-typischen Radien (4 px / 8 px / 12 px)
- Typografie mit Roboto oder Fallback-Stack (`system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`)
- Bewegungsmuster: kurze (150–250 ms) `ease-out`-Transitions für State-Änderungen

**Bewusst nicht verwendet:** Vuetify, PrimeVue, Quasar, `@material/web` Components. Begründung: jede dieser Bibliotheken bringt eine eigene Style-Welt mit, die mit dem WordPress-Theme um Spezifität konkurriert und das Bundle aufbläht. Eine handgeschriebene, auf den konkreten Anwendungsfall zugeschnittene Komponentenschicht ist in v1 sowohl kleiner als auch leichter zu isolieren.

#### Erlaubte Hilfsmittel

| Hilfsmittel                                                        | Zweck                                    | Begründung                                                                                                                                                                        |
| ------------------------------------------------------------------ | ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Material Symbols** (Icon-Font oder SVG-Set)                      | Icons (Checkmark, Info, Share, …)        | Nur Assets, keine JS-Komponenten. Tree-shakable als SVG-Set bevorzugt, um den Font-Load im Shadow Root zu vermeiden.                                                              |
| **Eigene CSS Custom Properties**                                   | Design-Tokens                            | Vollständige Kontrolle, kein Library-Overhead, von außen per `:host`/Attribut überschreibbar.                                                                                     |
| **`@material/material-color-utilities`** _(in v1 nicht eingebaut)_ | M3-Palette aus einer Seed-Farbe ableiten | Erzeugt tonale Paletten primär für Light-/Dark-Mode-Pairings — ohne Dark-Mode-Anforderung in v1 ist der Mehrwert gegenüber 5 handgewählten Farb-Tokens gering. Aufgehoben für v2. |

#### Lizenz-Bewertung der eingesetzten Drittquellen

Alle in v1 verwendeten und für v2 vorgesehenen Material-/Schrift-Quellen sind **Apache License 2.0** — verifiziert über die jeweiligen Repository-LICENSE-Dateien:

| Quelle                                        | Lizenz                    | Status v1                   |
| --------------------------------------------- | ------------------------- | --------------------------- |
| Material Symbols (Icon-Set)                   | Apache 2.0 (© Google LLC) | eingesetzt                  |
| Roboto-Font (eingebettet in pdfmake, s. §3.7) | Apache 2.0 (© Google LLC) | eingesetzt (nur PDF-Output) |
| `@material/material-color-utilities`          | Apache 2.0 (© Google LLC) | aufgehoben für v2           |

Apache 2.0 erlaubt kommerzielle Nutzung, Modifikation und Sublizenzierung ohne Copyleft-Pflicht; der enthaltene Patent-Grant schützt den Kunden zusätzlich vor Patent-Ansprüchen Beteiligter. Auflage ist das Mitführen von Lizenz- und Copyright-Hinweis im Build-Artefakt (NOTICE-Datei). Für einen mittelständischen B2B-Kunden ist diese Lizenz unkritisch und juristisch nicht diskussionsbedürftig.

#### Font-Strategie (Browser-UI vs. PDF-Output)

| Wo                       | Welcher Font                                                                   | Quelle                          | Lizenz-Status                                   |
| ------------------------ | ------------------------------------------------------------------------------ | ------------------------------- | ----------------------------------------------- |
| **UI (Browser)**         | System-Font-Stack — `system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif` | Vom Betriebssystem mitgeliefert | Keine eigene Lizenz nötig — OS-eigene Schriften |
| **PDF-Output (pdfmake)** | Roboto (eingebettet)                                                           | Mit pdfmake mitgeliefert        | Apache 2.0 — s. Lizenz-Tabelle oben             |
| **Eigene Webfonts**      | —                                                                              | —                               | bewusst nicht verwendet                         |

**Strategie:** v1 liefert **keine eigenen Webfonts** im JS-Bundle aus — UI nutzt den System-Stack (keine Lade-Latenz, keine Lizenz-Frage, plattform-natürliches Aussehen), PDF nutzt pdfmake's eingebettetes Roboto. Falls der Kunde später ein Branding-Font einbinden will, sind zwei Wege offen:

1. **Über `--mbk-font-family`-Token** auf eine System-Schriftart umschalten — keine Lizenz, kein zusätzlicher Asset
2. **Webfont-Einbindung** (Google Fonts, Adobe Fonts, eigener selbst-gehosteter Font) — Lizenz dann zu klären, additiver Build-Schritt

#### Isolation gegen die WordPress-Site

Die Web-Component-Entscheidung aus §3.1 wird hier konkret eingelöst: Die Komponente wird via `defineCustomElement()` mit **Shadow DOM** registriert. Daraus folgen drei Eigenschaften:

1. **CSS-Bleed-Schutz in beide Richtungen** — Site-Styles erreichen die Komponente nicht; Komponentenstyles laufen nicht in die Site.
2. **Stabile Klassennamen** — Inside-Shadow können Klassen kurz und sprechend bleiben (`.option-card`, `.summary`), ohne ein BEM-Prefix (z.B.: `.card__title--large`) oder ähnliches.
3. **Bewusster Verlust von Inheritance** — `font-family` und Farbe der Body-Seite werden nicht geerbt. Das ist gewollt, erzeugt aber den Bedarf nach einem definierten Fallback-Stack.

#### Theming-Overrides für den Kunden

Damit der Konfigurator sich später _optional_ an das Kunden-Theme anlehnen kann, ohne Shadow-DOM-Isolation aufzugeben, werden ausgewählte Tokens als CSS Custom Properties auf dem Host-Element exponiert:

```html
<mbk-configurator
  produkt="machine-tool-xr"
  style="--mbk-color-primary: #c8102e; --mbk-font-family: 'Source Sans Pro', sans-serif;"
>
</mbk-configurator>
```

**Konvention: `mbk-`-Präfix konsistent über alle Form-Faktoren** — das Custom-Element-Tag (`<mbk-configurator>`), den WordPress-Shortcode (`[mbk_configurator …]`) und die öffentlichen CSS-Variablen (`--mbk-color-primary`, `--mbk-radius-base`, …). Interne CSS-Tokens (nur in der Komponente verwendet, nicht von außen überschreibbar) bleiben präfixlos. Vier Gründe für diese Linie:

1. **Eindeutige Keywords auf Code-Ebene** — der Präfix ist im Repo per Grep eindeutig auffindbar; Verwechslungen mit allgemeinen Begriffen (`.primary`, `.text`, `configurator`) sind ausgeschlossen.
2. **Wiederverwertbarkeit** — ein zweiter Konfigurator (z. B. anderer Kunde, andere Branche) bekommt einen eigenen Präfix und beide Komponenten können konfliktfrei auf derselben Host-Page koexistieren.
3. **CSS-Konflikt-Schutz** — zusätzlich zur Shadow-DOM-Isolation: sollte v2 oder ein zukünftiger Build-Modus ohne Shadow DOM laufen (z. B. für SEO-Crawling-Fallbacks), verhindert der Präfix Kollisionen mit den Klassen des WordPress-Themes.
4. **Stabile öffentliche API** — interne Refactorings ändern präfixlose Tokens, die öffentliche `--mbk-`-Schicht bleibt unangetastet. Damit ist die Override-Anwendung der Host-Page versionsstabil.

**Minimal-Set öffentlicher Tokens (v1):**

| Token                 | Default        | Zweck                                        |
| --------------------- | -------------- | -------------------------------------------- |
| `--mbk-color-primary` | `#1976d2`      | Akzentfarbe (aktiver Schritt, Primär-Button) |
| `--mbk-color-surface` | `#ffffff`      | Hintergrund Cards/Panels                     |
| `--mbk-color-text`    | `#202124`      | Haupttext                                    |
| `--mbk-font-family`   | `system-ui, …` | Schriftart-Stack                             |
| `--mbk-radius-base`   | `8px`          | Basis-Radius (Cards, Buttons)                |

#### Bekannte Einschränkungen und bewusste Designentscheidungen

- **Material Symbols im Shadow Root:** Icon-Fonts wie Material Symbols arbeiten über **zwei zusammenwirkende Schichten** — (a) eine CSS-Klasse, die `font-family` und Layout-Settings setzt (`.material-symbols-outlined { font-family: 'Material Symbols Outlined'; … }`), und (b) eine `@font-face`-Deklaration, die die eigentliche `.woff2`-Font-Datei einbindet. In der Font sind Strings wie `home` oder `search` auf Glyphen gemappt — der Browser rendert dann den Text als Symbol. **Das Problem mit Shadow DOM:** beide CSS-Schichten müssen im Shadow Root verfügbar sein, sonst greift die Klasse zwar (Font wird referenziert), aber die Font-Deklaration fehlt im Scope und der Browser fällt auf System-Fonts zurück — das Wort `home` erscheint als Text. Die Font-Datei selbst lädt der Browser nur einmal aus dem Cache, das ist kein Problem; die Deklarations-Brücke muss aber im Shadow Root neu hergestellt werden, entweder per `<link>`-Tag im Custom Element oder per `adoptedStyleSheets`-API. **SVG-Set umgeht das komplett**, weil SVG keine CSS-Klassen-und-Font-Doppelschicht braucht — das Markup beschreibt das Bild selbst.
- **Bewusste Wahl: eigene Button-Komponenten statt nativer Form-Controls.** Native HTML-Form-Elemente (`<input type="radio">`, `<select>`, `<input type="date">`) werden vom Browser mit User-Agent-Stylesheets gerendert, die sich nur teilweise mit CSS überschreiben lassen — und Shadow DOM ändert daran nichts, weil User-Agent-Styles trotzdem durchgreifen. Cross-Browser-Inkonsistenzen (Chrome vs. Firefox vs. Safari) verstärken das. Daher rendert der Konfigurator Auswahl-Optionen als `<button class="option-card">` mit `aria-pressed`-State (s. `ConfiguratorStep.vue`) — voll kontrollierbar, konsistent über Browser, accessibility-tauglich.
- **Print-Styles** (`@media print { … }`-CSS-Regeln, die nur beim Browser-Druck greifen) **werden in v1 bewusst nicht adressiert.** Der Anfrage-Output ist ein clientseitig generiertes PDF via pdfmake (§3.7) — der Browser-Print-Pfad wird also umgangen. Eine Print-Styles-Schicht (Buttons verstecken, Schwarz-auf-Weiß-Layout, Seitenumbrüche) wäre nur relevant, falls jemand den Konfigurator-Bildschirm via Browser-Druck drucken will, was kein vorgesehener Workflow ist.

#### Content Security Policy (CSP)

Das einbettende WordPress-Theme darf die Komponente nicht durch eine zu strikte CSP brechen. Vue scoped styles und `defineCustomElement` injizieren inline-Styles ins Shadow Root — das setzt entweder `style-src 'unsafe-inline'` oder eine Hash-basierte Whitelist voraus. Scripte selbst kommen aus dem eigenen Bundle, keine externen Inline-Scripts. Bei der WordPress-Integration sollte die CSP des Themes daraufhin geprüft und ggf. angepasst werden — andernfalls erscheint die Komponente ohne Styling oder rendert gar nicht. Konkrete Anleitung folgt in `docs/DEPLOYMENT.md` (s. Anhang A.2).

**Was wir für die v1 konkret beachten müssen:**

| Direktive     | Bedarf in unserem Konfigurator    | Warum                                                 |
| ------------- | --------------------------------- | ----------------------------------------------------- |
| `style-src`   | `'unsafe-inline'` oder Hash-Liste | Vue scoped styles + Custom Element injizieren inline  |
| `script-src`  | `'self'` reicht                   | Eigenes Bundle, keine externen Scripts, kein `eval`   |
| `font-src`    | `'self'` reicht                   | Keine externen Fonts                                  |
| `img-src`     | `'self' data:`                    | SVG-Assets aus Bundle, Vite-Inline für kleine Dateien |
| `connect-src` | `'self'` reicht                   | Keine API-Calls in v1                                 |
| `object-src`  | `'self' blob:`                    | pdfmake-PDF-Download via Blob-URL                     |

#### Barrierefreiheit (a11y) — im Hinterkopf, in v1 noch nicht umgesetzt

Barrierefreiheit nach WCAG 2.1 Level AA ist als Ziel anerkannt. **In v1 werden bewusst keine spezifischen a11y-Maßnahmen aktiv ergriffen** — der knappe v1-Zeitrahmen priorisiert Architektur und Bedienkonzept. **Vor v1.0-Release erfolgt ein leichter Audit-Durchgang** (Sichtprüfung der `--mbk-*`-Kontraste, Tastatur-Walkthrough, Lighthouse-/Chrome-a11y-Panel). Der vollständige Audit (Screen-Reader-Tests, axe-core in CI, Konformitätsbescheinigung nach DIN EN 301 549) bleibt post-v1-Thema.

#### Performance (Core Web Vitals) — Pre-Release-Check

Performance wird vor v1.0-Release über **Lighthouse** (Chrome DevTools, Tab "Lighthouse") als manueller Audit-Durchgang geprüft — derselbe Lauf, der auch a11y abdeckt. Maßstab sind die drei **Core Web Vitals**:

| Metrik                              | Was sie misst                                               | Schwellwert "gut" |
| ----------------------------------- | ----------------------------------------------------------- | ----------------- |
| **LCP** (Largest Contentful Paint)  | Wann ist der größte sichtbare Inhaltsblock fertig gerendert | ≤ 2,5 s           |
| **CLS** (Cumulative Layout Shift)   | Wie stark "wackelt" das Layout während des Ladens           | ≤ 0,1             |
| **INP** (Interaction to Next Paint) | Wie schnell reagiert die UI auf einen Klick/Tap             | ≤ 200 ms          |

**Konfigurator-spezifischer Fokus:**

- **INP** ist die wichtigste Metrik — jeder Klick auf eine Option-Card sollte unter 200 ms reagieren, sonst fühlt sich die UX träge an
- **CLS** wird bei Live-Preis-Updates kritisch — die Summary-Spalte darf nicht springen, wenn der Preis sich ändert
- **LCP** primär beim Initial-Render relevant; wird wichtiger, sobald Image-Layering (§3.11) aktiv ist

**Post v1.0:** Lighthouse CI als automatisierter GitHub-Actions-Schritt (s. Anhang C.2) mit definiertem Performance-Budget als Pass/Fail-Kriterium.

#### BFSG-Hinweis (Barrierefreiheitsstärkungsgesetz)

Seit dem **28. Juni 2025** gilt in Deutschland das BFSG (Umsetzung der EU-Richtlinie 2019/882 — European Accessibility Act). Es verpflichtet Anbieter bestimmter digitaler Produkte und Dienstleistungen zur Barrierefreiheit nach WCAG 2.1 AA. Für klassischen B2B-Maschinenbau mit reinem Anfrage-Pfad (kein Vertragsabschluss im Konfigurator) ist BFSG **praktisch nicht anwendbar** — der Hinweis dient als Bewusstseins-Anker und Vorsorge für künftige Anwendungsbereich-Erweiterungen.

#### Dark Mode — bewusst zurückgestellt

Der Kunde ist ein konservatives B2B-Unternehmen, dessen bestehende WordPress-Site ausschließlich im Light Mode gestaltet ist. Dark Mode ist primär in SaaS-Tools, Streaming-Diensten und modernen Tech-Sites verbreitet — im **B2B-Maschinenbau-Sektor bisher praktisch nicht etabliert** (Trumpf, DMG Mori, Hörmann, Siemens Industrial setzen alle ausschließlich auf Light Mode). Plus: ein "minimal funktionierender" Dark Mode kostet leicht eine Stunde aus dem v1-Budget für ein Feature, das mit hoher Wahrscheinlichkeit nie aktiviert wird. Ein Dark Mode ist daher **kein v1-Ziel** und beeinflusst die v1-Tokenwahl nicht.

Was wir trotzdem tun (Null-Mehraufwand, hält die Tür offen):

- **Keine hartkodierten Farb-Hex-Werte in Komponenten** — sämtliche Farben laufen über `--mbk-color-*`-Tokens. Ein späterer Dark Mode würde durch reines Token-Overriding entstehen.
- **`@media (prefers-color-scheme: dark)`-Block bleibt absichtlich leer/ungenutzt** — kein vorzeitiges Doppel-Tokenset, das gepflegt werden müsste.

Was wir bewusst **nicht** tun:

- Kein zweites Farbset für Dark Mode definieren
- Kein `[data-theme="dark"]`-Selector im CSS
- Keine MCU-Integration zur Dark-Palette-Generierung

Falls in v2 ein Light/Dark-Mode-Switch oder ein vollständiges Theming-Panel verlangt wird, ist der Eingriff dann auf das Hinzufügen eines zweiten Token-Sets begrenzt — kein Komponentencode muss angefasst werden.

### 3.9 User-Guidance / Onboarding-Tour (post v1)

Mit wachsender Konfigurations-Komplexität steigt der Bedarf an aktiver Anwender-Führung. Im Maschinenbau-B2B-Kontext sind Erst-Nutzer oft Einkäufer:innen oder Konstruktions-Verantwortliche, die mit der spezifischen Komponentenlogik (Regelwerk, Vergriffene-Optionen, Querverweise zwischen Schritten) **noch nicht vertraut sind**. Eine geführte Tour beim Erst-Eintritt senkt die Hürde erheblich.

**Bewusst nicht implementiert in v1** (Zeitbudget). Die folgenden Vorbereitungen sind aber bereits getroffen, damit der Einbau post v1.0 ein **additiver Schritt ohne Schema-Bruch** ist:

#### Erstes, frühes Konzept: Onboarding-Tour mit Coachmarks

- **Coachmarks** (Apple-Begriff) sind die einzelnen Bubble-Popups, die auf konkrete UI-Elemente zeigen und in Sequenz durch den Konfigurator führen.
- Erst-Aufruf zeigt die Tour automatisch, danach kann sie per "Tour erneut starten"-Eintrag im Help-Menü manuell aufgerufen werden.
- Überspringbar an jeder Stelle ("Nicht jetzt"), nicht erzwingend.

#### Datenmodell-Vorbereitung (in v1 bereits enthalten, s. §3.3)

```typescript
ProductOption.helpKey?: string         // Coachmark-Text auf Option-Ebene
ConfigurationStep.helpKey?: string     // Coachmark-Text auf Schritt-Ebene
```

Beide Felder referenzieren wieder einen Eintrag im flachen Übersetzungs-Pool (s. §4). Damit ist die Tour automatisch zweisprachig via dieselbe i18n-Mechanik wie alles andere — z. B. `ui.tour.step.power.body`, `ui.tour.option.tool_changer.body`.

#### Persistenz: localStorage, nicht Cookies (DSGVO)

Der "Tour bereits gesehen"-Status wird in `localStorage` gespeichert (Key `mbk-configurator.tour.dismissed`, Boolean oder Timestamp). Begründung:

- **Cookies** brauchen typischerweise Einwilligung (Cookie-Banner nach TTDSG § 25 Abs. 2), außer "technisch unbedingt notwendig" — eine Tour-Präferenz ist juristisch nicht trivial als notwendig argumentierbar
- **localStorage** für rein client-seitige UX-Präferenzen ohne Personenbezug, ohne Tracking, ohne Drittanbieter-Zugriff ist in der gängigen Bewertung unkritisch und benötigt keinen Cookie-Banner

Reset-Mechanismus: ein Eintrag im Help-Menü "Tour erneut zeigen" löscht das Flag.

#### Library-Hinweis

In Frage kommen für die spätere Implementierung leichtgewichtige, framework-agnostische Libraries:

- **Shepherd.js** (MIT, ~30 KB, sehr verbreitet) — Empfehlung
- **Driver.js** (MIT, ~10 KB, minimal)
- **Intro.js** (dual-licensed: kommerzielle Nutzung kostenpflichtig — daher eher vermeiden für unseren Kontext)

Die Tour-Logik selbst (Schritte, Trigger, Reihenfolge) wird in einem eigenen Composable `useOnboardingTour()` gekapselt — analog zu `useI18n` und `usePdfExport`.

### 3.10 Numerische Eingabe-Felder (Slider, Range-Inputs) — post v1

Konfigurations-Optionen sind in v1 ausschließlich **kategorial** (diskrete Auswahl aus einer Options-Liste). **Numerische Eingabe-Felder** (Schieberegler für Längen, Stückzahlen, Toleranzen mit min/max/step) sind bewusst nicht implementiert.

**Briefing-Treue:** Beispiele im Briefing — _"Leistungsklasse, Steuerung, vielleicht Zubehör"_ — sind durchgängig kategoriale Achsen. Der diskrete Ansatz ist damit briefing-konform.

**Warum bewusst zurückgestellt:**

- UI-Aufwand (Slider + Begleiter-Number-Input + Mobile-Touch-Verhalten + Live-Validierung) ist nicht trivial
- **Regelwerk müsste numerisch werden** — `RuleCondition` bräuchte Vergleichsoperatoren (`>`, `<`, `>=`), was die heutige `hasValue: string`-Logik bricht
- URL-State braucht Locale-Handling (Komma vs. Punkt, Float-Encoding)
- Realistisch 6-8 h Aufwand für eine saubere Umsetzung — ein spürbarer Anteil eines knappen v1-Budgets

**Schema bewusst nicht vorbereitet** (anders als bei `helpKey`/`priceReference`): Eine halb-vorbereitete numerische Rule-Engine wäre ein Riskanteil im Schema, das wir bei tatsächlichem Bedarf post v1 sauber mit Vergleichsoperatoren auf `RuleCondition` einführen. Bis dahin: keine Schein-Vorbereitung, die später falsch wird.

### 3.11 Produkt-Visualisierung mit Image-Layering — post v1

Im B2B-Maschinenbau gewinnt eine **visuelle Live-Vorschau** der konfigurierten Maschine die Aufmerksamkeit deutlich stärker als reine Text-Auswahlen. Etablierte Konfiguratoren (Auto-Industrie: BMW, Tesla; Möbel: Wayfair) lösen das über einen **Layer-Stack transparenter Bilder**, der pro Konfigurationsschritt ein passendes Overlay einblendet:

```
Layer 0: Maschinen-Grundkörper          (base)
Layer 1: Antrieb (Servo/Riemen)          (auswahl-abhängig)
Layer 2: Steuerung (SPS-Box visuell)     (auswahl-abhängig)
Layer 3: Werkzeugaufnahme                (auswahl-abhängig)
Layer 4: Zubehör (Werkzeugwechsler)      (nur wenn gewählt)
```

#### Drei Phasen der Bilder-Anbindung

| Phase                     | Bilder-Quelle                                                                               | Backend-Anbindung    |
| ------------------------- | ------------------------------------------------------------------------------------------- | -------------------- |
| **v1.0**                  | URLs hardcoded in `fixtures.ts`, Assets unter `src/assets/` oder öffentliche WP-Medien-URLs | kein                 |
| **v1.x** (Plugin-Wrapper) | WordPress-Plugin-Konfig liest WP-Medienbibliothek, generiert Fixtures **build-time**        | kein Runtime-Backend |
| **v2.0**                  | REST-Call an `/wp-json/wp/v2/media` zur Laufzeit                                            | ja                   |

#### Demo-Stand in v1

In v1 ist die **Layering-Engine selbst nicht implementiert**, aber:

- Das Schema (`imageUrl`, `imageZIndex` auf Option-Ebene; `baseImageUrl` auf Configuration-Ebene) ist additiv vorbereitet (s. §3.3) und bricht beim späteren Einbau nichts
- Für den Leistungsklasse-Schritt sind **vier stilisierte SVG-Motor-Symbole** unter `src/assets/motor-*.svg` mitgeliefert und werden in der UI als "single image per selected option" angezeigt (kein Stacking) — als visuelle Demonstration, dass die Bilder-Schicht im Schema vorgesehen ist
- SVG statt PNG bewusst gewählt: kein Asset-Beschaffungs-Problem, beliebig skalierbar, klein (~1 KB/Datei), versionierbar im Git

#### Aufwand-Schätzung für die volle Layering-Engine (post v1.0)

| Bereich                                                  | Aufwand   |
| -------------------------------------------------------- | --------- |
| Image-Stack-Komponente + reactive Layering               | 1,5-2 h   |
| Preloading (vermeidet Flackern beim Selection-Switch)    | 1 h       |
| Responsive Verhalten (Mobile, Hochformat vs. Querformat) | 1 h       |
| Empty-State (keine Bilder gepflegt → Fallback)           | 30 min    |
| Tests                                                    | 30-45 min |
| **Implementierung gesamt**                               | **~5 h**  |

Plus: **Asset-Beschaffung** ist der eigentliche Engpass — Stockfotos sind nicht stack-tauglich, ein 3D-Render-Set existiert nicht, und Strich-Skizzen sind für Marketing nicht ausreichend. Sobald ein produktives CAD-/Render-Set vorliegt, ist die Engine in einem v1.x-Schritt einbaubar.

#### SVG-Alternative für vektor-basierte Quellen

Falls der Kunde keine PNG-Renderings, aber SVG-Exporte aus CAD-Software hat: das Stacking-Pattern funktioniert mit SVG identisch (sogar mit `<g>`-Layern in einem einzelnen SVG denkbar). Vorteil: skaliert beliebig, schärfer auf High-DPI-Displays.

#### 3D-Einbindung — nicht vorgesehen

Eine interaktive 3D-Ansicht (z. B. via Three.js oder `<model-viewer>` mit glTF-Export aus CAD-Software) wäre im Maschinenbau-Kontext durchaus relevant — sprengt aber jeden v1-Rahmen und bleibt explizit außerhalb des Konzept-Scopes.

### 3.12 Mehrfachauswahl pro Schritt — post v1

In v1 ist jeder Konfigurationsschritt **single-choice** (Radio-Pattern): genau eine Option pro Schritt. Eine **Mehrfachauswahl** (Checkbox-Pattern) — sinnvoll z. B. für Zubehör-Schritte, in denen mehrere Items gleichzeitig gewählt werden können — ist als post-v1.0-Erweiterung vorgesehen.

#### Schema-Vorbereitung in v1

```typescript
ConfigurationStep.selectionMode?: 'single' | 'multiple'   // default: 'single'
```

Schritte ohne explizites `selectionMode` werden als Single-Choice behandelt — bestehende Fixtures bleiben unverändert gültig. Erst beim Setzen von `selectionMode: 'multiple'` wird das alternative Verhalten aktiviert.

#### Was sich post v1 ändert

- **Store**: `currentSelection` wird von `Record<string, string>` zu `Record<string, string | string[]>` — Multi-Choice-Schritte halten Arrays von Option-IDs
- **UI**: Multi-Choice-Schritte rendern Checkboxes statt Radio-Cards
- **Regelwerk**: `allowedWhen` muss mehrere selected-values handhaben (z. B. "ist eine der Optionen X, Y gewählt?")
- **PDF**: jede gewählte Option wird einzeln in der Zusammenfassung gelistet
- **URL-Format**: kompakte Encoding-Variante (`?k=addons:item1+item2`) statt einer einzelnen Wert-Zuordnung

#### Aufwand-Schätzung

Realistisch 2-3 h für saubere Implementation. Geringer als Image-Layering, weil keine Asset-Frage existiert.

---

## 4. Mehrsprachigkeit (i18n)

**i18n** (kurz für "internationalization" — i + 18 Buchstaben + n) trennt die UI-Texte vom Code: der Code referenziert nur **Keys**, eine Lookup-Funktion löst sie zur Laufzeit in die aktive Sprache auf.

### Datenstruktur

In v1 werden Übersetzungen als **flaches Array** in einer Fixture-Datei abgelegt — keine externe i18n-Bibliothek, kein verschachteltes JSON. Bewusst einfach, weil v1 unter 150 Texte erwartet:

```typescript
interface TranslationEntry {
  id: string; // hierarchical key, e.g. 'errors.urlInvalid'
  category: "ui" | "error" | "product" | "legal";
  de: string;
  en: string;
  description?: string; // context comment for translators
}

const translations: TranslationEntry[] = [
  {
    id: "errors.urlInvalid",
    category: "error",
    de: "Die geteilte Konfiguration konnte nicht aus der URL geladen werden.",
    en: "The shared configuration could not be loaded from the URL.",
  },
  { id: "machine.power.kw11", category: "product", de: "11 kW", en: "11 kW" },
  // ...
];
```

### Composable `useI18n()`

```typescript
function useI18n(language: "de" | "en" = "de") {
  const t = (id: string): string => {
    const entry = translations.find((e) => e.id === id);
    return entry ? entry[language] : `[missing: ${id}]`;
  };
  return { t };
}
```

Der `[missing: ...]`-Fallback macht fehlende Übersetzungen im UI sofort sichtbar — besser als stilles Verschlucken. Performance-Hinweis: `.find()` auf einem flachen Array ist O(n), bei <150 Einträgen unkritisch; bei wachsendem Katalog wird die Datenstruktur auf eine Map umgestellt.

### Sprache-Übergabe an die Web Component

Die Sprache wird als HTML-Attribut am Custom Element gesetzt, per Vue-Prop in die App reingegeben und im Composable referenziert:

```html
<mbk-configurator product="machine-tool-xr" language="de"></mbk-configurator>
```

Bei WordPress-Einbettung (s. §3.1) wird das Attribut aus dem Shortcode-Parameter abgeleitet:

```
[mbk_configurator product="machine-tool-xr" language="de"]
```

Unbekannte Sprache-Werte fallen still auf Deutsch zurück (s. §3.5).

---

## 5. Preise: Live-Update als Richtwert, mit klarem Disclaimer

**Briefing-Anforderung (wörtlich):** _"Pro Auswahl aktualisiert sich der Preis live."_ Diese UX-Mechanik wird in v1 vollständig umgesetzt — die Summary aktualisiert bei jeder Option-Auswahl die Gesamtsumme in Echtzeit.

### Was angezeigt wird

- **Pro Option:** Aufschlag als **Netto-Wert in €** (z.B. "+ 2.450 €"); kann 0 sein
- **In Summary (rechts):** Netto-Gesamtsumme = Basispreis + Σ Aufschläge, live aktualisiert; darunter Hinweis _"zzgl. ges. MwSt."_
- **Im PDF (§3.7):** identisches Format, plus expliziter Disclaimer
- **Disclaimer-Pattern überall:** _"Indikative Preise — finale Bestätigung im Angebot."_

Netto-Anzeige ist im B2B-Maschinenbau die etablierte Konvention — Einkäufer denken in Netto-Werten und führen die Vorsteuer ohnehin gesondert. Damit fügt sich der Konfigurator in den gewohnten Workflow des Endkunden ein.

### Was bewusst NICHT umgesetzt wird

| Nicht implementiert                          | Begründung                                                                                                                                                               |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Brutto-Berechnung / Netto-Brutto-Umschaltung | Erfordert Kenntnis des Käufer-Status (Privatperson, B2B-Vorsteuer, EU-Reverse-Charge, Drittland) — ohne Login und ohne Backend nicht zuverlässig ableitbar.              |
| MwSt.-Berechnung                             | Versandland-abhängige Steuersätze und Sonderfälle (z.B. § 13b UStG bei Bauleistungen, Ausland-Reverse-Charge) gehen über v1-Umfang hinaus.                               |
| Echte Listenpreise                           | Die Fixture-Werte sind plausibel gewählte Demo-Zahlen. Verbindliche Preise (inkl. Kundenkonditionen, Mengenrabatten) fließen erst mit ERP-Anbindung ein — Zukunft C, §7. |
| Mengenrabatte, Aktionspreise                 | Ebenso — Backend-/ERP-Logik.                                                                                                                                             |

### Schema-Vorbereitung (s. §3.3)

Das Datenmodell enthält bereits die für die spätere ERP-Migration nötigen Felder: `priceNet` (Wert pro Option), `priceReference` (Lookup-Key), und auf Konfigurations-Ebene `currency`, `billingCountry`, `vatRate`. In v1 werden nur `priceNet` und `basePriceNet` aktiv verwendet; die fiskalischen Metadaten sind hinterlegt, aber nicht angewendet. So ist der Wechsel auf ERP-Daten eine Service-Implementierung (s. §3.3 Service-Layer), keine Datenmodell-Änderung.

### Risiko-Bewertung

Der bewährte Maschinenbau-B2B-Mechanismus ist _"Konfigurator-Preis als Orientierung, verbindlicher Preis im Angebot"_. Mit konsistent durchgezogenem Disclaimer ist diese v1-Linie betrieblich risikoarm — der Endkunde versteht aus seinem Workflow heraus, dass der Online-Konfigurator-Preis nicht das Angebot ersetzt.

### Bewusst kein MwSt-Modul

Auch eine optionale MwSt-Tabelle (Land / Satz / Reverse-Charge) wird in v1 **nicht** eingeführt. Begründung: Der Konfigurator ist **kein Online-Shop**, sondern erzeugt laut Briefing eine _"Anfrage-Grundlage"_. Im B2B-Maschinenbau folgen auf die Anfrage Listenpreise, Rahmenverträge, Sonderkonditionen, Mengenrabatte und ggf. EU-Reverse-Charge (USt-ID-pflichtige innergemeinschaftliche Lieferung mit 0 % Konfigurator-Umsatzsteuer) — diese Vertraglichkeiten greifen erst im Angebotsprozess und können clientseitig nicht zuverlässig abgebildet werden. Eine MwSt-Tabelle ohne diesen Kontext wäre für viele Endkunden schlicht falsch. Die Schema-Felder `vatRate`, `billingCountry`, `currency` bleiben jedoch im Datenmodell vorgesehen (s. §3.3), damit ein späteres ERP-Modul (Zukunft C) sie aktivieren kann, ohne das Schema zu brechen.

---

## 6. Offene Fragen für das nächste Kundengespräch

- Welche konkreten Produkte sollen konfigurierbar sein? (Produktkatalog, Artikel-IDs)
- Gibt es eine bestehende Preisstrategie für die Website (Listenpreise, Anfrage-only)?
- Soll die Website mehrsprachig bleiben oder nur Deutsch?
- **ERP-/Warenwirtschaftssystem**: Welches System ist im Einsatz, und stehen Schnittstellen (REST, OData, Datei-Export) für eine spätere Anbindung von Preisen, Verfügbarkeiten und Artikel-Stammdaten zur Verfügung? (Voraussetzung für Zukunft B/C in §7)
- Wer pflegt die Fixtures nach Go-Live?

---

## 7. Zukunft: Ausbaustufen

### Zukunft A — schnell nachrüstbar (< 1 Sprint)

- Kontaktformular statt mailto (mit DSGVO-konformem Backend-Endpunkt)
- Produktbilder pro Konfigurationsoption
- Admin-UI in WordPress (z.B. via ACF) für Fixture-Pflege ohne Deployment
- Analytics: Welche Konfigurationen werden am häufigsten abgebrochen?

### Zukunft B — mittelfristig (eigenes Backend erforderlich)

- Regelwerk ins Backend auslagern (Komplexität wächst mit Produktkatalog)
- Alle Produktdaten ins Backend (Fixtures werden zur Wartungsaufgabe)
- Preisberechnung serverseitig (Netto/Brutto, MwSt., Versandland)
- Konfigurationen speichern und wiederladen (User-Accounts oder Session)

### Zukunft C — ERP-Anbindung (koordinierter Aufwand)

- Live-Preise aus ERP (Listenpreise, Kundenkonditionen, Mengenrabatte)
- Echtzeit-Verfügbarkeit aus Warenwirtschaft
- Direktbestellung statt Anfrage-Mail
- Bestellhistorie, Angebotswesen
- Dafür ist Zugriff auf das PPS/ERP-System und dessen Schnittstellen zwingend erforderlich — Aufwand schwer schätzbar ohne technische Dokumentation

---

## Anhang A — README und docs/ (Planung für die Build-Phase)

Während der Build-Phase wird im Konfigurator-Repo eine Mini-Dokumentation aufgebaut. Dieses Konzept-Dokument bleibt die **Architektur-Quelle** und wird aus dem Repo verlinkt; README und `docs/` decken das **operative Onboarding** ab, ohne Architektur-Material zu duplizieren.

### A.1 README.md — bereits umgesetzt

`README.md` existiert seit dem Boilerplate-Schritt. Audience: Entwickler:in (oder Reviewer:in), die zum ersten Mal das Repo öffnet. Aktueller Stand:

- ✅ **Projektüberschrift + 2-Satz-Beschreibung** ("Maschinenbau-Konfigurator als Vue 3 Web Component, …")
- ✅ **Quick Start** mit `npm install` → `npm run dev` → `npm run test` → `npm run build`
- ✅ **Verfügbare Skripte** als Tabelle
- ✅ **Verzeichnisstruktur** (Top-Level)
- ✅ **Verweise**: Architektur → dieses Konzept-Dokument, mit konkreten §-Querverweisen
- ⚠ **Screenshot/Demo-GIF** — folgt beim Pre-Release-Polish, sobald der Konfigurator polished aussieht
- ✅ **Lizenz-Hinweis** — MIT-Lizenz im Repo-Root (`LICENSE`)

### A.2 docs/ — Detail-Dokumente

Priorisiert nach Wert für den Kunden / das Release. Beim Build je nach verbleibender Zeit umsetzen:

| Dokument                      | Status       | Inhalt                                                                                                                                                                                                                                                                                 |
| ----------------------------- | ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`docs/code-guidelines.md`** | ✅ umgesetzt | Verbindliche Code-Konventionen: Sprach-Trennung (Code Englisch, Doku Deutsch), Naming, Format & Style (Prettier-Settings, Vue-SFC-Struktur, CSS-Konventionen, Kommentare, Composition-API-Patterns), Imports, Commits, TypeScript, Tests. Erstes Lese-Item für jede Code-Änderung.     |
| **`docs/FIXTURES.md`**        | **hoch**     | Wie Produktdaten gepflegt werden: Schema-Erklärung mit Beispielen, wie ein neuer Konfigurationsschritt hinzugefügt wird, wie Regelwerk-Bedingungen formuliert werden, wie i18n-Keys für neue Optionen ergänzt werden. Operativ wichtig für alle Folge-Erweiterungen am Produktkatalog. |
| **`docs/THEMING.md`**         | **hoch**     | Wie Kunden-Branding angewandt wird: alle `--mbk-*`-Tokens mit Default-Werten, Beispiel-Snippet für Override per `style`-Attribut, Hinweis zu Shadow DOM und Grenzen der CSS-Vererbung. Bezugnahme auf §3.8.                                                                            |
| **`docs/DEPLOYMENT.md`**      | mittel       | Vom Bundle zum WordPress-Plugin: wie aus `dist/` ein Plugin-ZIP wird, welche PHP-Stub-Datei den Shortcode registriert, Asset-Pfade. Ist die Anleitung für die v1.5-Iteration (s. §3.1).                                                                                                |
| **`docs/ACCESSIBILITY.md`**   | nice-to-have | Welche WCAG-AA-Checks v1 erfüllt, mit Test-Anleitung (Tastatur-Durchgang, Screen-Reader-Test, Kontrast-Audit). BFSG-Status. Bezugnahme auf §3.8.                                                                                                                                       |
| **`docs/I18N.md`**            | nice-to-have | Wie neue Übersetzungen ergänzt werden, Konventionen für Key-Namen (Hierarchie mit Punkten), Hinweis auf den `[missing: …]`-Fallback. Bezugnahme auf §4.                                                                                                                                |

Bewusst **nicht** als eigenes Dokument geplant: Architektur-Übersicht (im Konzept), Test-Strategie (im Konzept § Tests bzw. README-Quick-Start), API-Referenz (es gibt keine API).

### A.3 Reihenfolge bei knapper Zeit

Faustregel für die Priorisierung, wenn das Zeitbudget eng wird: **README → code-guidelines → FIXTURES → THEMING → DEPLOYMENT → Rest**. README und code-guidelines sind bereits umgesetzt. FIXTURES und THEMING decken die zwei häufigsten "Was muss ich tun um …"-Fragen nach Go-Live ab. DEPLOYMENT ist der Übergang zur v1.5-Iteration. Die Restlichen können in einer späteren Pflege-Runde nachgereicht werden.

---

## Anhang B — Build-Vorgaben (für die Implementierungsphase)

Konkrete Bau-Vorgaben für den Konfigurator-Repo. Architektur-Begründungen stehen in §3 — dieser Anhang ist die operative Checkliste.

### B.1 Projektstruktur

```
.
├── src/
│   ├── components/
│   │   ├── ConfiguratorShell.vue       # Wrapper: Fortschrittsbalken + Layout
│   │   ├── ConfiguratorStep.vue        # Einzelner Konfigurationsschritt (Optionen)
│   │   ├── ConfiguratorSummary.vue     # Rechte Spalte: laufende Zusammenfassung
│   │   └── ConfiguratorReview.vue      # Abschluss-/Review-Screen + PDF/Teilen
│   ├── stores/
│   │   └── configurator.ts             # Pinia: Auswahl, Regelwerk, Preis-Logik
│   ├── composables/
│   │   ├── useUrlState.ts              # Shareable URL: read + write
│   │   ├── useI18n.ts                  # Mehrsprachigkeit (s. §4)
│   │   └── usePdfExport.ts             # pdfmake-Wrapper für Konfigurations-PDF
│   ├── services/
│   │   └── productService.ts           # Fixture-Loader (v1) → ERP-API (v2)
│   ├── data/
│   │   ├── fixtures.ts                 # Machining-Center-XR-Beispieldaten
│   │   ├── translations.ts             # i18n-Pool (flat array, s. §4)
│   │   └── types.ts                    # TypeScript-Interfaces (s. §3.3)
│   └── main.ts                         # Custom-Element-Registrierung
├── tests/
│   └── configurator.test.ts            # Pflicht-Tests (s. B.6)
└── vite.config.ts
```

### B.2 Pinia Store — erwartete API

```typescript
// state
currentSelection: Record<string, string>  // stepId → optionId
currentStep: number

// computed
totalPriceNet: number                     // basePriceNet + Σ priceNet

// actions
select(stepId: string, optionId: string): void
reset(): void

// rule evaluation
evaluateRule(option: ProductOption): boolean
```

Synchronisation mit URL-State läuft über `useUrlState`-Composable, nicht über eine Store-Action.

### B.3 Shareable-URL-Format

```
?k=power:18-5kw,control:sps-premium,drive:servo-direct,tool:hsk40,addon:tool-changer
```

- Beim Laden: URL-Parameter `k` parsen, Konfiguration via `productService` initialisieren
- Bei jeder Auswahl: URL aktualisieren via `history.replaceState` (kein Page-Reload, kein Vue-Router)
- Ungültige Konfigurations-Strings: Default-Zustand + Fehler-Banner (s. §3.5)

### B.4 UI-Layout

**Desktop (≥ 768px):**

```
[Fortschrittsbalken — oben, volle Breite]
[Optionen — links 60%] [Summary — rechts 40%]
```

**Mobile (< 768px):**

```
[Fortschrittsbalken]
[Optionen]
[Summary — ausgeklappt unten, sticky]
```

### B.5 UI-Komponenten — Verhalten

**Fortschrittsbalken:** alle Schritte als klickbare Tabs/Punkte, aktiver Schritt hervorgehoben, Schritte direkt anspringbar (überspringen erlaubt). `role="tablist"`, `aria-current="step"` auf aktivem Tab.

**Optionen-Ansicht (pro Schritt):** jede Option als Card oder Button. Zustände:

- regulär: wählbar
- `vergriffen`: ausgegraut, Label "Derzeit nicht lieferbar", nicht klickbar
- Regelwerk-blockiert: ausgegraut mit Tooltip, der die unerfüllte Bedingung erklärt
- Spezifikations-Link: Icon-Button → öffnet Mock-PDF in neuem Tab

**Summary (rechte Spalte):**

- pro Schritt: gewählte Option oder Platzhalter "Noch nicht gewählt"
- Netto-Gesamtsumme live + Hinweis "zzgl. ges. MwSt."
- Disclaimer: "Indikative Preise — finale Bestätigung im Angebot."
- `aria-live="polite"` auf der Gesamtsumme

**Abschluss-Screen:**

- Vollständige Konfigurationsübersicht (tabellarisch)
- **"Als PDF speichern"-Button** → ruft `usePdfExport()` auf, lädt PDF herunter (s. §3.7)
- **"Konfiguration teilen"-Button** → kopiert URL in Clipboard, Toast "Link kopiert"

### B.6 Pflicht-Tests (8 Stück)

Mindesttest-Set in `tests/konfigurator.test.ts`. Fixtures sind gleichzeitig Testdatenbasis.

1. **Fixture laden** — `productService.loadConfiguration('machine-tool-xr')` liefert alle 5 Schritte
2. **Auswahl treffen** — `select()` aktualisiert `currentSelection` korrekt
3. **Regelwerk positiv** — "Automatischer Werkzeugwechsler" ist nur wählbar, wenn Steuerung = "SPS Premium"
4. **Regelwerk negativ** — "Automatischer Werkzeugwechsler" ist nicht wählbar bei Steuerung = "Manuell"
5. **Gesamtpreis Netto** — korrekte Berechnung aus `basePriceNet` + Σ `priceNet`
6. **URL-Kodierung** — aktuelle Konfiguration wird korrekt als URL-Parameter `k=…` kodiert
7. **URL-Dekodierung** — Konfiguration wird korrekt aus URL-Parameter wiederhergestellt
8. **Unavailable** — HSK63-Werkzeugaufnahme kann nicht gewählt werden (Action gibt `false` zurück bzw. wirft definierten Fehler)

Bonus-Tests (falls Zeit): PDF-Generierung Smoke-Test, i18n-Fallback-Verhalten bei fehlendem Key.

### B.7 Integrations-Tests / Szenario-Tests

Die Pflicht-Tests in B.6 sind Unit-granular — jeder testet einen einzelnen Aspekt isoliert. Die folgenden **Szenario-Tests auf Store-Ebene** simulieren dagegen reale User-Flows mit gültigen und ungültigen Eingaben. Die Erwartung jeder Szenario-Iteration ist immer **eines von zwei Ergebnissen**: entweder ein **valider Gesamtpreis** kommt heraus, oder eine **passende UX-Meldung** wird über einen i18n-Error-Key gesetzt.

| #   | Szenario                  | Eingabe (Store-Aktionen)                                                                                                                                                                                                 | Erwartung                                                                                                                                                                |
| --- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | **Happy Path**            | Vollständige gültige Auswahl: `select('power', 'power-11kw')` → `select('control', 'control-sps-premium')` → `select('drive', 'drive-servo')` → `select('tool', 'tool-hsk40')` → `select('addon', 'addon-tool-changer')` | `totalPriceNet` = `basePriceNet` + Σ aller `priceNet`; kein Error-Key gesetzt; `canGeneratePdf` returnt `true`                                                           |
| 2   | **Regel-Verletzung**      | Werkzeugwechsler bei Control = Manuell: `select('control', 'control-manual')` → `select('addon', 'addon-tool-changer')`                                                                                                  | `evaluateRule(toolChanger)` returnt `false`; Selection wird nicht übernommen (`currentSelection['addon']` bleibt leer); UX-Meldung-Key `errors.ruleConflict` ist gesetzt |
| 3   | **Vergriffen**            | HSK63-Werkzeugaufnahme: `select('tool', 'tool-hsk63')`                                                                                                                                                                   | `select()` blockiert; Meldung-Key `errors.optionUnavailable` ist gesetzt; `currentSelection['tool']` bleibt unverändert                                                  |
| 4   | **Pflicht-Schritt fehlt** | Alle Pflicht-Schritte außer Power gewählt, `canGeneratePdf` abfragen                                                                                                                                                     | `canGeneratePdf` returnt `false`; Liste der fehlenden Pflicht-Schritte enthält genau `'power'`; Meldung-Key `errors.requiredStepsMissing` ist gesetzt                    |

**Eigenschaften dieser Tests:**

- Laufen wie die Pflicht-Tests in `tests/configurator.test.ts`, kein eigenes Test-Setup nötig
- Setzen den Pinia-Store komplett neu auf (`setActivePinia(createPinia())` in `beforeEach`)
- Testen direkt die Store-Action-API — keine UI-Mounts, daher schnell und deterministisch
- Decken den **Schnittpunkt von Datenmodell + Regelwerk + UX-Meldungs-Logik** ab, der in den B.6-Unit-Tests jeweils nur einzeln berührt wird

---

## Anhang C — Engineering-Infrastruktur (Backlog für Folgezyklen)

Für die v1 bewusst zurückgestellt, aber in größeren Projektzyklen oder bei Übergang in eine Produktiv-Pflege-Phase einzuführen. Reihenfolge nach Aufwand-zu-Nutzen-Verhältnis:

### C.1 Code-Guidelines

Teilweise schon implizit etabliert durch:

- Tech-Stack-Festlegung (§3.2, Anhang B.1)
- TypeScript strict + 8 Pflicht-Tests (Anhang B.6)
- Datenmodell-Konventionen (deutsche Bezeichner, i18n-Keys hierarchisch mit Punkten, s. §4)

**Geplante Vertiefung:** interner Style-Guide mit Naming-Konventionen (Komponenten in PascalCase mit `Konfigurator`-Präfix, Composables mit `use`-Präfix, Stores nach Domäne), Import-Reihenfolge, Commit-Message-Format. Konventionen leben an zwei Orten: `docs/code-guidelines.md` im Repo, und in `CLAUDE.md` — letzteres ist bei AI-gestützter Entwicklung effizient, weil Claude Code die Konventionen bei jeder Session automatisch lädt und anwendet. Ein `CONTRIBUTING.md` lässt sich für externe Beitragende additiv ergänzen.

### C.2 CI/CD auf GitHub

**Nahe Zukunft (minimaler Schritt):** ein einfacher GitHub-Actions-Workflow (`.github/workflows/test.yml`), der bei jedem Push und vor jedem Merge `npm run type-check` und `npm test` ausführt. Effektiv ein Pre-Merge-Gate, ~20 Zeilen YAML, kein zusätzliches Tooling nötig.

**Spätere Ausbaustufen:**

- Build-Artefakt als CI-Output (das Custom-Element-Bundle für Plugin-Wrapper-Tests)
- Branch-Schutz auf `main` (Merge nur über PR mit grünem Check)
- Deploy-Pipeline für Demo-Hosting (z.B. GitHub Pages oder Netlify Preview)
- **Lighthouse CI** als Performance-/a11y-Gate mit definiertem Budget pro Release (`@lhci/cli` als GitHub-Actions-Schritt; Core Web Vitals als Pass/Fail-Kriterium, s. §3.8 Performance)
- **Code-Coverage-Report** via `@vitest/coverage-v8` (npm-Script `npm run coverage`, in `package.json` hinterlegt) als CI-Schritt; Schwellwert z. B. 80 % Zeilen-Coverage als Pass/Fail. Validierung, dass die 8 Pflicht-Tests (Anhang B.6) den Code tatsächlich durchqueren — und nicht nur isolierte Pfade abdecken.
- Semantic-Release oder Changesets für Versionierung

### C.3 Code-Formatierung & Dev-Umgebung

Vier Ebenen, von leicht zu schwer; v1 setzt die ersten beiden um, die letzten zwei bleiben bewusst zurückgestellt (s. unten).

| Ebene                            | Werkzeug                                                               | v1-Status   | Nutzen                                                                                                                              |
| -------------------------------- | ---------------------------------------------------------------------- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| **Format-Vereinheitlichung**     | Prettier (`.prettierrc`) + npm-Script `format`                        | ✓ umgesetzt | Verhindert Stil-Diffs in PRs, einheitlicher Code-Stil unabhängig vom Editor                                                         |
| **Editor-Konfiguration**         | VS Code Recommended-Extensions + Format-on-Save                       | ✓ umgesetzt | Onboarding in unter einer Minute, einheitliches Save-Verhalten, Test-Explorer mit Inline-Run-Buttons                                |
| **Pre-Commit-Hook**              | Husky + lint-staged (Format + Lint vor jedem Commit)                   | nicht in v1 | Erzwingt Format-/Lint-Regeln automatisch — sinnvoll sobald regelmäßige Beitragende oder Commits aus heterogenen Editoren dazukommen |
| **Reproduzierbare Dev-Umgebung** | Devcontainer oder Docker-Compose-Stack                                 | nicht in v1 | Eliminiert "läuft bei mir aber nicht bei dir"-Effekte, besonders relevant bei mehreren Entwickler:innen oder externen Beitragenden  |

#### VS Code-Setup konkret

Zwei Dateien orchestrieren das Onboarding für VS Code-Nutzer:innen (Single-Folder-Setup — einfach den Repo-Root öffnen):

- **`.vscode/extensions.json`** — Recommended-Extensions: `Vue.volar` (Vue 3 Language Server, Type-Check + Autocomplete für `.vue`-Dateien), `vitest.explorer` (Test-Explorer-Sidebar, Inline-Run-Buttons im Editor, Debug-Modus), `esbenp.prettier-vscode` (Format-on-Save-Provider). VS Code bietet die Installation beim ersten Öffnen automatisch an.
- **`.vscode/settings.json`** — `formatOnSave: true` mit Prettier als Default-Formatter für `.ts`, `.vue`, `.json` und `.md`.

#### Bewusste v1-Entscheidung: kein Husky / Pre-Commit-Hook

Für ein Single-Developer-Projekt ist das automatische Erzwingen von Format-/Lint-Regeln via Pre-Commit-Hook overkill — `npm run format` plus Format-on-Save in VS Code reichen, und der GitHub-Actions-Pre-Merge-Check (C.2) liefert das zweite Sicherheitsnetz. Sobald regelmäßige Beitragende dazukommen oder Commits aus heterogenen Editoren (CLI-Editor, andere IDE) entstehen, ist Husky + lint-staged additiv einbaubar — bricht nichts Bestehendes.

#### Bewusste v1-Entscheidung: kein Devcontainer / Docker-Umgebung

Im aktuellen Entwicklungs-Zyklus (0.x, s. C.4) wurde geprüft, ob direkt eine reproduzierbare Docker-Container-Umgebung mit Devcontainers eingeführt wird. **Verworfen** mit folgender Begründung:

- **Zeitbudget reicht nicht** für eine _gute_ replizierbare Docker-/Devcontainer-Lösung — und eine halbgare wäre schlechter als keine
- Single-Developer-Projekt: der Devcontainer-Nutzen ("läuft bei mir, nicht bei dir") greift erst bei mehreren Beitragenden
- Implementierungs-Fokus liegt auf Frontend-Tiefe und Architektur-Disziplin; ein DevOps-Setup im knappen Zeitrahmen aufzubauen würde davon abziehen, ohne den Liefer-Wert zu erhöhen
- Der Pre-Merge-Check via GitHub Actions (C.2) liefert die "CI-Geste" mit ~15 Minuten statt 1-3 Stunden Aufwand

Sinnvoll umzusetzen, sobald das Projekt einen zweiten regelmäßigen Beitragenden oder eine produktive Pflege-Phase erreicht.

### C.4 Versionierung (SemVer)

Strikte [Semantic Versioning](https://semver.org/lang/de/)-Konvention, mit klarer Bedeutung der Phasen:

| Version     | Bedeutung                                                                                                                                                                        |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`0.x.y`** | Entwicklungs-Phase. Was _während_ der Entwicklung gebaut wird, läuft unter `0.x`. APIs, Datenstruktur und UI können sich ohne Vorwarnung ändern.                                         |
| **`1.0.0`** | Erste stabile Release: polished Prototyp, ready für das erste öffentliche Release. Konzept §-Verweise auf "v1" beziehen sich auf diesen Zielzustand, nicht auf den Entwicklungs-Tagesstand. |
| **`1.x.y`** | Additive Erweiterungen: WordPress-Plugin-Wrapper (§3.1, "zweite Iteration") als `1.1.0`, kleinere UX-Polish-Runden, Bugfixes. Keine Breaking Changes.                            |
| **`2.0.0`** | Erste Backend-Anbindung — Service-Layer wechselt von Fixtures auf echte API. Breaking Change im Datenfluss, daher Major-Bump. Entspricht Zukunft A/B (§7).                       |
| **`3.0.0`** | ERP-Anbindung — Live-Preise, Konditionen, Verfügbarkeit aus dem Warenwirtschaftssystem (Zukunft C, §7).                                                                          |

**Werkzeuge:** Git-Tags entsprechen dem Release-Punkt (`git tag v1.0.0`). `package.json#version` wird parallel gepflegt. Eine spätere Automatisierung über Semantic-Release oder Changesets ist Backlog-Thema (C.2).

**Changelog:** in v1 nicht als separate `CHANGELOG.md` gepflegt — Git-Log und die Versionierungs-Tabelle hier reichen für den Single-Developer-Zyklus. Ab `v1.x` mit regelmäßigen Releases ist eine `CHANGELOG.md` im Repo-Root sinnvoll (entweder manuell oder automatisiert per Semantic-Release / Changesets). Konvention: [Keep a Changelog](https://keepachangelog.com/de/1.1.0/) als Format.

**Hinweis zum vorliegenden Konzept-Dokument:** Wenn an einzelnen Stellen "v1" geschrieben steht, ist damit immer **`v1.0`** im obigen Sinne gemeint — der release-bereite Zielzustand —, nicht der aktuelle Entwicklungs-Stand. Der aktuelle Stand während der Implementierungs-Phase ist `0.x`.

### C.5 CSS-Preprocessor (SCSS) — post v1.0

`v1.0` schreibt reines CSS in den `:host`- und scoped `<style>`-Blöcken der Vue-Komponenten. Ein Preprocessor (Sass/SCSS via Vites nativen Sass-Support, alternativ PostCSS-Plugins) ist als Backlog-Eintrag **ab `v1.x` oder spätestens `v2.0`** vorgesehen — sinnvoll, sobald mindestens eines der folgenden Symptome auftritt:

- Wiederverwendung über Custom Properties hinaus wird nötig (z. B. Mixins für Breakpoints, Type-Scales, Spacing-Helpers)
- Theme-Varianten (Dark Mode, kundenspezifisches Branding-Set) brauchen rechnerische Logik, die sich in pure CSS schlecht abbilden lässt
- Eine etablierte SCSS-Mixin-Bibliothek soll eingebunden werden

Vite unterstützt Sass über `npm install -D sass` — die Einführung ist **additiv und nicht-brechend**, kann mitten in einem `1.x`-Zyklus passieren, und die bestehenden Token-Konventionen (`--mbk-*`-Schicht, s. §3.8) bleiben unverändert. Erst mit größerer Component-Library-Phase (im Bereich `2.0+`) wird der Preprocessor strukturell wichtig.

### C.6 Issue-Tracking — in der Prototyping-Phase nicht genutzt

Das **GitHub Issue-System wird in der Prototyping-Phase bewusst nicht eingesetzt** — die Aufgabe ist klein genug für direkte Kommunikation, und das Konzept-Dokument fungiert als zentrale Single Source of Truth für offene Punkte, bewusste Schnitte und Backlog. Issue-Verwaltungs-Overhead übersteigt in dieser Phase den Nutzen.

**Für Folgezyklen vorbehalten:** GitHub Issues mit Labels (`bug`, `feature`, `chore`, `docs`, `a11y`), Milestones je `v1.x`-Release, optional GitHub Projects als Kanban-Board. Sobald regelmäßige Beitragende dazukommen oder die Backlog-Komplexität wächst, ist die Einführung ein additiver Schritt — bestehende Doku in `docs/` bleibt unverändert.

### C.7 Sicherheits-Profil (Mini-Audit)

Die v1-Komponente ist sicherheitstechnisch bewusst minimalistisch: **kein Backend, keine API-Calls, keine User-Sessions, keine Authentifizierung, keine personenbezogenen Daten** (s. §3.7). Damit entfallen die klassischen Webapp-Risiken.

| Klassisches Web-Risiko     | Status                                                                                         |
| -------------------------- | ---------------------------------------------------------------------------------------------- |
| XSS                        | Vue-Default-Escaping; kein `v-html`/`eval`/`innerHTML` mit User-Input                          |
| CSRF                       | Nicht anwendbar — keine state-ändernden Server-Requests                                        |
| Session-Hijacking          | Nicht anwendbar — keine Sessions, keine Cookies                                                |
| SQL-Injection              | Nicht anwendbar — keine Datenbank                                                              |
| URL-Parameter-Manipulation | Validierung beim Boot (s. §3.5); ungültige Werte → definierter Fehlerzustand                   |
| Drittabhängigkeit-CVEs     | `npm audit` als Pre-Release-Check; Dependabot-Updates als post-v1-Automatisierung (Anhang C.2) |

**Authentication / Authorization** sind in v1 explizit nicht im Scope. Sobald Backend-Anbindung (Zukunft B) oder ERP-Integration (Zukunft C) hinzukommt, werden Auth-Tokens und Session-Claims als Custom-Element-Attribute vom einbettenden WordPress durchgereicht — WordPress hat ein eigenes Auth-System (Nonces, Capabilities, REST-Auth), das nicht im Konfigurator dupliziert wird.

### C.8 Error-Tracking / Frontend-Observability — post v1

Frontend-Errors (JS-Exceptions, Promise-Rejections, Asset-Load-Failures) werden in v1 **nicht zentral erfasst** — der Konfigurator hat keinen Backend-Endpunkt für Telemetrie, und ein Drittanbieter-Service (Sentry, Rollbar) wäre ein **DSGVO-/Cookie-Banner-Bruch** mit der "clean Footprint"-Linie aus §3.7. In Konsequenz: wenn ein User-Browser einen Fehler wirft, sieht der Anwender (idealerweise) den Fehler-Hinweis aus §3.5, der Betreiber bekommt davon nichts mit.

**Post v1.0 — wenn Backend dazukommt:**

- Sentry oder Rollbar als JS-SDK; sammelt Stack-Traces, Browser-Version, Konfigurations-Schritt-Kontext, anonymisiert
- DSGVO-Posture dann neu zu bewerten (IP-Sammlung, Cookie-Banner-Pflicht)
- Alternativ: eigener serverseitiger Error-Logging-Endpunkt im WordPress-Plugin-Wrapper (volle Kontrolle, kein Drittanbieter)
- Erst sinnvoll, sobald der Konfigurator produktiv läuft und tatsächlich Nutzungs-Volumen entsteht — vorher ist der Erkenntnis-Wert minimal
