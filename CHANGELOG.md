# Changelog - ESG Reporting Tool

Alle wichtigen Änderungen an diesem Projekt werden in dieser Datei festgehalten. Das Projekt folgt dem Prinzip der semantischen Versionierung.
---

## [1.7.0] - 2026-03-17
### Hinzugefügt
- **ESRS Master-Daten:** 156 standardisierte Datensätze für die Wesentlichkeitsanalyse (Impact & Financial Materiality) vorinstalliert.
- **3x4 Dashboard Grid:** Neues Layout für die Themen-Kacheln zur besseren Übersicht auf Standard-Bildschirmen.
- **Session-Persistenz:** Integration von `session_token` in der Datenbank zur Vermeidung von Re-Logins bei Programm-Neustarts.
- **Icon-Mapping:** Vollständige Emojis-Zuordnung für alle ESRS-Kapitel (E1-G1).

### Geändert
- **Datenbank-Architektur:** Migration auf ein leeres Grundsystem, das beim ersten Start automatisch die notwendigen Tabellenstrukturen ohne redundante Testdaten erzeugt.
- **Tab-Logik:** Optimierung der `app.js` für verzögerungsfreies Rendern der Kacheln beim Wechsel in das Dashboard.

### Fixes
- Problem behoben, bei dem nur wesentliche Themen im Dashboard angezeigt wurden.
- Fix für verschwindende Kacheln nach einem Browser-Refresh (Cmd+R).

---

## [1.6.0] - 2026-03-16
### Hinzugefügt
- **Finalisierungs-Engine:** Neuer Workflow `startFinalizeProcess`, der die Audit-Sicherung und den Berichtsexport in einer unteilbaren Operation bündelt.
- **Berichts-Archiv (UI):** Strategische Platzierung einer Versionstabelle im Vorschau-Bereich.
- **Druck-Management:** Historische Berichte können nun aus dem Archiv heraus in einem geschützten Fenster geöffnet und gedruckt werden.
- **Automatischer Ordner-Zugriff:** Direkter Zugriff auf den `/exports`-Ordner via Shell-Integration für den manuellen Dokumentenversand.
- **Status-Tracking:** Einführung der Tabelle `reports` zur lückenlosen Dokumentation der Berichtsgeschichte.

### Geändert
- **UI-Architektur:** Verschiebung der Berichts-Historie an den Anfang des Vorschau-Tabs zur besseren Übersicht für Auditoren.
- **Sicherheits-Logik:** Trennung zwischen flüchtigem "Direktdruck" (Entwurf) und "Finalisierung" (revisionssicherer Stand).
- **IPC-Flow:** Optimierte Kette von asynchronen Aufrufen (`Backup -> Save -> Log`), um Datenkonsistenz zu garantieren.

### Behoben
- **Kommunikations-Bug:** Korrektur der Argumentübergabe im `ipcRenderer`, wodurch Dateinamen im Frontend nun korrekt als `response.fileName` aufgelöst werden.
- **Scope-Fehler:** Alle globalen Funktionen sind nun konsistent an das `window`-Objekt gebunden, um `Uncaught TypeError`-Abstürze zu verhindern.

---

## [1.5.0] - 2026-03-16
### Hinzugefügt
- **Unified Dashboard:** Neues UI-Modul zur Zusammenführung von Analyse, Erfassung und Historie in einer Kachel-Ansicht.
- **Duale Start-Logik:** Wahlmöglichkeit zwischen "Programm starten" und "Administration" im Start-Screen.
- **Benutzer-Infrastruktur:** Neue Tabelle `users` und GUI-Sektion `adminArea` zur Benutzerverwaltung integriert.
- **Flexibler Login-Modus:** Unterstützung für einen "offenen Modus" (Sichtbarkeit aller Daten ohne Login), solange das Usermanagement nicht global aktiviert wurde.
- **ESRS Reporting Modul:** Komplett neues Modul zur Erstellung des finalen Nachhaltigkeitsberichts.
- **Smart-Tab Layout:** Einführung einer Registerkarten-Logik ("Texte erfassen" vs. "Berichtsvorschau") zur Vermeidung von UI-Überlagerungen.
- **Bild- & Anhang-Management:** - Unterstützung für Bild-Uploads pro ESRS-Thema.
    - Automatisches Generieren von Bildunterschriften und Labels.
    - Integriertes Abbildungsverzeichnis, das sich dynamisch aktualisiert.
- **Automatisierte Berichts-Engine:** - `generateFullReport`-Logik, die Texte, Bilder und Kennzahlen-Tabellen in einem Dokument zusammenführt.
    - Automatisches Inhaltsverzeichnis basierend auf wesentlichen Themen.
- **PDF-Export-Funktion:** Druckoptimierte Ansicht für den direkten Export aus der Electron-App.

### Geändert
- **UI-Refactoring:** Entfernung redundanter Modals (Entry-Modal, New-KPI-Modal) zugunsten von Inline-Formularen.
- **Sidebar-Dynamik:** Die Navigation generiert sich nun basierend auf dem `loginTarget` und der Benutzerberechtigung.
- **Skript-Integrität:** Optimierung der Ladereihenfolge (XLSX -> Database -> Modules -> App), um Electron-Security-Warnings und Referenzfehler zu vermeiden.
- **UI-Refactoring:** Das Narrativen-Modul wurde an das Design-System der Wesentlichkeitsanalyse angepasst (identische Tab-Styles und Farbcodes).
- **Datenbank-Schema:** Erweiterung der `narratives` Tabelle um `image_data` (Base64) und `image_caption`.

### Entfernt
- Doppelte HTML-Elemente und IDs in `index.html`.
- Veraltetes `entryModal` für die Datenerfassung.

---

## [1.4.0] - 2026-03-16
### Hinzugefügt
* **Relationales KPI-Management:** Neue Datenbanktabelle `kpi_stammdaten` implementiert, um messbare Kennzahlen (inkl. Einheit) direkt mit spezifischen ESRS-Themen und Unterthemen zu verknüpfen.
* **Interaktive KPI-Steuerung:** KPIs können nun direkt im Accordion der Wesentlichkeitsanalyse (sowohl im Impact- als auch im Financial-Tab) über eine neue Steuerleiste eingesehen, live neu angelegt und gelöscht werden, ohne die Ansicht wechseln zu müssen.

### Geändert
* **Automatisierte Stammdaten (Single Source of Truth):** Die Ansicht "KPI Stammdaten" wurde komplett überarbeitet. Sie wird nicht mehr manuell befüllt, sondern generiert sich vollautomatisch und gruppiert aus den Themen der Wesentlichkeitsanalyse.
* **Einheitliches Design-System:** Die Stammdaten-Übersicht erbt das visuelle Feedback der Analyse. Themen mit einem Ergebnis >= 3 erhalten automatisch den roten Seitenbalken und das "WESENTLICH"-Badge.
* **Synchrones UI-Rendering:** Das Speichern oder Löschen eines KPIs (egal ob aus den Stammdaten oder der Analyse heraus) aktualisiert nun sofort beide Ansichten im Hintergrund, ohne dass ein Page-Reload nötig ist.

---

## [1.3.0] - 2026-03-13
### Hinzugefügt
* **Doppelte Wesentlichkeit (Tabs):** Die Analyse wurde in zwei dedizierte Reiter aufgeteilt: "Impact Materiality" (Inside-Out) und "Financial Materiality" (Outside-In).
* **Intelligente Prozent-Umrechnung:** Eintrittswahrscheinlichkeiten (EW) werden jetzt intuitiv in Prozent (0-100%) erfasst und vom System automatisch in das 3-Punkte-System umgerechnet (0-33% = 1 Punkt, 34-66% = 2 Punkte, 67-100% = 3 Punkte).
* **Dynamisches Hilfe-Modal:** Ein kontextsensitives, zweispaltiges und scrollbares Hilfe-Fenster (max. 85vh) erklärt die Bewertungslogik passend zum aktuell ausgewählten Tab.
* **Sicheres Accordion:** Das Accordion wird jetzt gezielt über zwei neue Action-Buttons gesteuert:
  * 👁️ **Anzeigen:** Öffnet die Details im Nur-Lese-Modus (gesperrte Felder, kein Speichern-Button).
  * ✏️ **Bearbeiten:** Öffnet die Details im Bearbeitungsmodus inkl. Speicher-Button.
* **"WESENTLICH" Badge:** Themen mit einem berechneten Ergebnis (ERG) von >= 3 werden nun prominent mit einer roten Seitenlinie und einem CSS-Badge markiert.

### Geändert
* **Visuelle Themen-Gruppierung:** Die unübersichtliche Endlos-Tabelle wurde durch aufgeräumte, nach ESRS-Themen (E1, E2, S1 etc.) gruppierte Daten-Karten (Cards) ersetzt.
* **Auto-Save für Schnelleingaben:** Dropdowns (z. B. "Art" der Auswirkung) und Textfelder in der sichtbaren Tabellenzeile speichern Änderungen jetzt sofort ab, ohne dass das Accordion geöffnet werden muss.

### Behoben
* **Sicheres Tab-Routing:** `try...catch`-Blöcke und `typeof`-Prüfungen in der `app.js` verhindern nun Abstürze der Anwendung, falls HTML-Bereiche noch nicht geladen sind.
* **White-Screen Fix:** Ein Fehler mit der CSS-Klasse `.card` bei den dynamisch generierten CSRD-Themenboxen wurde behoben, sodass die Tab-Ansicht nicht mehr ungewollt das gesamte Layout ausblendet.
* **Testdaten-Struktur:** Die Datenbank-Initialisierung generiert nun exakt vier Zeilen pro Unterthema (Impact: Positiv/Negativ, Financial: Risiko/Chance), um die doppelte Wesentlichkeit fehlerfrei abzubilden.

---

## [1.2.0] - 2026-03-11
### Hinzugefügt
* **Musterdatei-Export:** Funktion `downloadKpiTemplate` für den Download einer vorkonfigurierten CSV-Datei.
* **Excel-Kompatibilität:** Implementierung von UTF-8 mit BOM (`\uFEFF`) im Export, um Umlaute in Microsoft Excel korrekt darzustellen.
* **Intelligentes Mapping:** Die Import-Logik erkennt nun verschiedene Spaltenbezeichnungen (z. B. "KPI", "Name", "KPI Name") automatisch.

### Behoben
* **Kritischer Startfehler:** `Uncaught SyntaxError: Identifier 'XLSX' has already been declared` behoben (Doppeldeklaration in `database.js` entfernt).
* **Initialisierungs-Fix:** `TypeError: window.initDatabase is not a function` korrigiert, indem die Ladereihenfolge der Skripte stabilisiert wurde.

---

## [1.1.5] - 2026-03-11
### Hinzugefügt
* **Massen-Import-Schnittstelle:** Integration der `SheetJS` (XLSX) Bibliothek zum Importieren von Stammdaten.
* **UI-Komponenten:** Neuer Button "📥 Excel/CSV Import" und verstecktes File-Input-Handling in der Stammdaten-Ansicht.

---

## [1.1.0] - 2026-03-11
### Hinzugefügt
* **Zeitreise-Funktion:** Buttons zur dynamischen Verschiebung des 5-Jahres-Horizonts (Vergangenheit & Zukunft).
* **Auto-Save-Trigger:** Automatische Speicherung der Matrix-Daten beim Blättern durch die Jahre, um Datenverlust zu verhindern.
* **Dynamische Labels:** Anzeige des aktuellen Zeithorizonts (z. B. "2025 bis 2029") direkt im UI.

---

## [1.0.5] - 2026-03-11
### Hinzugefügt
* **Strategischer 5-Jahresplan:** Implementierung der Timeline-Tabelle für wesentliche KPIs.
* **Farbmetrik:** Status-Dropdowns mit dynamischer Hintergrundfarbe (Kritisch/In Arbeit/Erreicht).
* **Doppelte Wesentlichkeit:** Integration der Inside-Out- und Outside-In-Bewertung (Low/Medium/High) direkt in die Planungstabelle.
* **DB-Erweiterung:** Neue Tabelle `materiality_timeline` in SQLite angelegt.

---

## [1.0.0] - 2026-03-11
### Basis-Setup
* Initialer Release des Frameworks (Electron + SQLite).
* Grundfunktionen: KPI-Stammdaten anlegen, Bearbeiten-Dialoge und einfache Filterung.