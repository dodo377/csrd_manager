# 📑 Technical Fact Sheet: CSRD/ESRS Manager
**Version:** 1.6.0 (Developer Preview)  
**Status:** Stabiler Probelauf / Local Environment Mode  
**Datum:** März 2026

---

## 🛠 System-Architektur
Das Tool wurde als native Desktop-Applikation auf Basis moderner Webtechnologien entwickelt. Dies kombiniert die Flexibilität eines Browsers mit der Leistungsfähigkeit einer lokalen, persistenten Datenbank.

* **Runtime:** Electron JS (Chromium Engine & Node.js v20+)
* **Datenbank:** SQLite3 (Lokale, dateibasierte SQL-Datenbank)
* **Frontend:** HTML5, CSS3 (Grid/Flexbox Layouts), Vanilla JavaScript (ES6+)
* **Daten-Stamm:** 156 ESRS-konforme Datensätze (Vollständiger Import via JSON)

---

## 🚀 Betriebsmodus: "Developer Preview"
Um maximale Stabilität, volle Debugging-Möglichkeiten und Transparenz während der Testphase zu gewährleisten, wird das Programm im **Entwicklungs-Modus** direkt über die Laufzeitumgebung gestartet.

> **💡 Hinweis zur Menüleiste (macOS):**
> Da das Programm im Developer-Modus ausgeführt wird, zeigt macOS in der oberen Menüleiste systembedingt teilweise den Namen der Laufzeitumgebung (**"Electron"**) an. In der finalen, signierten Produktions-Version wird dies durch den Produktnamen ersetzt. Das App-Icon im Dock sowie der Fenstertitel sind davon unbetroffen und zeigen das korrekte Branding.

---

## 🔒 Sicherheit & Datenhaltung
* **Local-First:** Alle eingegebenen Daten (Wesentlichkeitsanalysen, KPI-Werte, User-Profile) werden ausschließlich in der lokalen Datei `esg_data.db` gespeichert. Es findet **kein Cloud-Sync** und kein Datentransfer nach außen statt (DSGVO-konform).
* **Session-Management:** Die App nutzt ein lokales Token-System. Ein Login bleibt für 7 Tage auf diesem Gerät gültig, sofern kein manueller Logout erfolgt.
* **Integrität:** Beim Initial-Start werden die 156 ESRS-Themen automatisch validiert und in die Datenbank injiziert, falls diese noch nicht vorhanden sind.

---

## 📂 Datei-Struktur für den Testlauf
| Datei / Ordner | Funktion |
| :--- | :--- |
| **`Start_ESG_Tool`** | **Haupt-Startdatei** (Doppelklick zum Ausführen) |
| `esg_data.db` | Die Datenbank (enthält alle Ihre Eingaben und Analysen) |
| `esrs_data.json` | Master-Datenquelle für die CSRD-Themen (Referenzwerte) |
| `assets/` | Enthält das Programm-Logo, Icons und grafische Ressourcen |
| `node_modules/` | Notwendige System-Bibliotheken für die Laufzeit |

---

## ⚠️ Wichtige Hinweise für Tester
1.  **Standard-Accounts:** Beim ersten Start werden die User `admin` (PW: admin) und `demo` (PW: demo) automatisch angelegt.
2.  **Systemvoraussetzungen:** Das Dashboard ist für eine Bildschirmauflösung ab **1200x800 Pixel** optimiert.
3.  **Backups:** Um Ihren Fortschritt zu sichern oder auf ein anderes Gerät zu übertragen, kopieren Sie einfach den **gesamten Projektordner**. 
4.  **Entwicklertools:** Über `Strg+Shift+I` (Win) oder `Cmd+Option+I` (Mac) können die Entwicklertools zur Fehleranalyse eingeblendet werden.

---
*Dokumentation erstellt für den ESG-Probelauf 2026. Technische Änderungen vorbehalten.*