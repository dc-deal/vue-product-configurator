# Problemstellung — Produkt-Konfigurator

Ausgangspunkt des Projekts. Die architektonische Antwort darauf steht in
[`konzept.md`](konzept.md).

---

## Kontext

Ein mittelständischer Maschinenbauer (Süddeutschland, ~80 Mitarbeitende, B2B)
betreibt eine bestehende, ordentlich gepflegte, technisch aber konservative
WordPress-Website. Er möchte einen **interaktiven Produkt-Konfigurator** als
Komponente in diese Seite einbinden.

## Aufgabe

Endkunden konfigurieren ein Produkt — eine Maschine mit **fünf bis acht wählbaren
Optionen** (z. B. Leistungsklasse, Steuerung, Antrieb, Zubehör). **Pro Auswahl
aktualisiert sich der Preis live.** Am Ende erhält der Kunde eine
**PDF-Zusammenfassung als Anfrage-Grundlage**.

Eine spätere **ERP-Anbindung** ist denkbar und soll architektonisch berücksichtigt
werden — für den ersten Wurf ist sie aber nicht relevant.

## Rahmen

- **Frontend:** Vue 3. Dummy-Daten (Fixtures) sind ausdrücklich in Ordnung — es muss
  kein vollständiger Produktkatalog sein.
- **Kein Backend, keine API** in v1 — alles läuft clientseitig auf Fixtures.
- **Einbettbar** in eine bestehende WordPress-Site, ohne deren Theme zu verändern.
- Bewusste, begründete Schnitte sind erwünscht — Vollständigkeit ist nicht das Ziel,
  Architekturdenken und saubere Trade-offs schon.

## Offene Punkte (bewusst als Annahmen behandelt)

Das Briefing lässt mehrere Punkte offen — Mehrsprachigkeit, konkreter Produktkatalog,
Preisstrategie, vorhandenes ERP-System. Der Umgang mit diesen Lücken ist Teil der
Aufgabe: Sie werden in [`konzept.md`](konzept.md) §2 als explizite Annahmen markiert
und mit Fragen für ein nächstes Gespräch hinterlegt (§6).
