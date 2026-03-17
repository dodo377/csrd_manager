# 📊 CSRD/ESRS Manager v1.7.0

Ein desktopbasiertes Tool zur Durchführung der **doppelten Wesentlichkeitsanalyse** und zur Erfassung von **ESG-Kennzahlen** gemäß den European Sustainability Reporting Standards (ESRS).

![License](https://img.shields.io/badge/License-MIT-green.svg)
![Platform](https://img.shields.io/badge/Platform-Windows%20%7C%20macOS-blue.svg)
![Electron](https://img.shields.io/badge/Framework-Electron-47848F.svg)

---

## 🚀 Überblick
Dieses Tool unterstützt Unternehmen bei der strukturierten Umsetzung der Corporate Sustainability Reporting Directive (CSRD). Es bietet eine geführte Analyse von 156 ESRS-Themenfeldern und ein dynamisches Dashboard zur Fortschrittskontrolle.

### Kernfunktionen
- **Geführte Wesentlichkeitsanalyse:** Bewertung von Auswirkungen (Impact) und finanziellen Risiken/Chancen (Financial) für alle ESRS-Themen.
- **KPI-Stammdatenverwaltung:** Erfassung von Messwerten mit Historien-Funktion.
- **Dynamisches Dashboard:** Visuelle Aufbereitung des Berichtsstatus (Wesentlich vs. Nicht Wesentlich).
- **Benutzerverwaltung:** Rollenbasiertes System (Admin/User) mit lokaler Session-Speicherung.
- **Local-First:** Alle Daten verbleiben in einer lokalen SQLite-Datenbank.

---

## 🛠 Technische Details
- **Runtime:** Electron JS
- **Datenbank:** SQLite3 (Persistente Speicherung in `esg_data.db`)
- **Frontend:** Vanilla JavaScript (ES6+), HTML5, CSS3
- **Datenbasis:** Integrierter Import von 156 ESRS-Datenpunkten via JSON.

---

## 📥 Installation & Start
Da dieses Repository keine `node_modules` enthält, folgen Sie diesen Schritten zur Installation:

### Voraussetzungen
Stellen Sie sicher, dass [Node.js](https://nodejs.org/) (v18 oder höher) auf Ihrem System installiert ist.

### 1. Repository klonen oder herunterladen
```bash
git clone [https://github.com/DEIN-NAME/csrd-manager.git](https://github.com/DEIN-NAME/csrd-manager.git)
cd csrd-manager
```

---

### 2. Abhängigkeiten installieren
Dieser Befehl lädt Electron, SQLite3 und alle weiteren benötigten Bibliotheken herunter:
```bash
npm install
```

---

### 3. Programm starten
```bash
npm start
```

Alternativ können Windows-Nutzer nach der Installation die `Start_ESG_Tool.bat` und Mac-Nutzer die `Start_ESG_Tool.command` für einen Schnellstart per Doppelklick nutzen.

---

## 🔒 Standard-Zugangsdaten (Probelauf)
Für den ersten Testlauf sind folgende Accounts vordefiniert:
| Rolle |	Benutzername | Passwort |
| ----------- | ----------- | ----------- |
| Administrator |	`Admin` |	`admin` |
| Test-User |	`Demo` |	`demo` |

---

## 📂 Projektstruktur
* `main.js`: Steuerung des Electron-Hauptprozesses und System-Menüs.
* `database.js`: Datenbank-Initialisierung und ESRS-Datenimport.
* `app.js`: Anwendungslogik, Routing und Session-Management.
* `esrs_data.json`: Master-Referenzliste der CSRD-Themen.
* `assets/`: Grafische Ressourcen und Icons.

---

## ⚖️ Lizenz
Dieses Projekt ist unter der MIT-Lizenz lizenziert. Weitere Details finden Sie in der LICENSE Datei.

---

*Entwickelt für den CSRD-Probelauf 2026. Technische Dokumentation verfügbar in `README_TECHNICAL.md`.*
