# 🧪 Test-Checkliste für den Probelauf (v1.7.0)

Dieses Dokument dient zur Validierung der Kernfunktionen während des ersten Probelaufs. Bitte haken Sie die Punkte nach erfolgreicher Prüfung ab.

## 1. Login & Sitzungsverwaltung
- [ ] **Erster Login:** Anmeldung mit Benutzer `Demo` und Passwort `demo` erfolgreich.
- [ ] **Session-Persistenz:** Nach einem Refresh (`Cmd+R` / `Strg+R`) erfolgt kein erneuter Login-Zwang; das Dashboard erscheint sofort.
- [ ] **Logout-Funktion:** Der Button "Logout" (bzw. "Beenden") löscht die Session und führt zum Startbildschirm zurück.

## 2. Dashboard & Navigation
- [ ] **Layout-Check:** Das Dashboard zeigt ein Raster von 3 Zeilen mit jeweils 4 Kacheln (4x3 Grid).
- [ ] **Vollständigkeit:** Alle 10 ESRS-Kapitel (E1-G1) sowie die Kachel "Alle anzeigen" sind sichtbar.
- [ ] **Responsive Icons:** Die Emojis in den Kacheln entsprechen den Themen (z. B. 🌍 für E1, 👥 für S1).
- [ ] **Tab-Wechsel:** Die Navigation zwischen Dashboard, Wesentlichkeit und Stammdaten funktioniert ohne Darstellungsfehler.

## 3. Doppelte Wesentlichkeitsanalyse
- [ ] **Daten-Check:** In der Analyse-Ansicht sind die importierten 156 Datensätze (78 Impact / 78 Financial) vorhanden.
- [ ] **Score-Berechnung:** Die Eingabe von Werten für Ausmaß, Umfang und Unumkehrbarkeit führt zu einem korrekten Gesamtergebnis.
- [ ] **Wesentlichkeits-Trigger:** Themen mit einem Score $\ge 3$ werden automatisch als "Wesentlich" markiert.
- [ ] **Dashboard-Synchronisation:** Eine als wesentlich markierte Analyse färbt die entsprechende Kachel im Dashboard rot.

## 4. KPI-Stammdaten & Erfassung
- [ ] **KPI-Zuordnung:** Unterthemen sind korrekt mit den entsprechenden Stammdaten-Platzhaltern verknüpft.
- [ ] **Dateneingabe:** Ein neuer Messwert kann über das Dashboard-Untermenü "Daten erfassen" gespeichert werden.
- [ ] **Tabellarische Ansicht:** Der gerade gespeicherte Wert erscheint sofort in der Historien-Tabelle des jeweiligen Themas.

## 5. Systemstabilität
- [ ] **Datenbank-Integrität:** Nach dem Schließen und Neustarten des Programms sind alle vorgenommenen Bewertungen und Messwerte noch vorhanden.
- [ ] **Fehlerprotokoll:** Die Browser-Konsole (`F12`) zeigt während der Nutzung keine roten Fehlermeldungen (Exceptions).

---
**Hinweis für Tester:** Bitte bei Fehlern einen Screenshot der Konsole (`F12` -> Console) an das Entwicklerteam senden.