var fs = require('fs');
var path = require('path');
var sqlite3 = require('sqlite3').verbose();

var dbPath = path.join(__dirname, 'esg_data.db');
var db = new sqlite3.Database(dbPath);

// Hilfsfunktion für den JSON-Import (lokal)
window.getJsonPath = function() {
    return path.join(__dirname, 'esrs_data.json');
};

// Globale Variablen
window.db = db;
window.XLSX = XLSX;
window.currentUser = null;
window.alleKPIs = [];
window.appSettings = { useUserManagement: 0 };

// Erweiterte IconMap für alle ESRS-Kapitel
window.iconMap = { 
    "E1 Klimawandel": "🌍", 
    "E2 Umweltverschmutzung": "💨", 
    "E3 Wasser- und Meeresressourcen": "💧", 
    "E4 Biologische Vielfalt": "🌿", 
    "E5 Kreislaufwirtschaft": "♻️", 
    "S1 Eigene Belegschaft": "👥", 
    "S2 Wertschöpfungskette": "🔗", 
    "S3 Betroffene Gemeinschaften": "🏘️", 
    "S4 Verbraucher und Endnutzer": "🤝", 
    "G1 Unternehmensführung": "⚖️"
};

window.initDatabase = function() {
    return new Promise((resolve) => {
        window.db.serialize(() => {
            // 1. MESSWERTE & NARRATIVE
            window.db.run(`CREATE TABLE IF NOT EXISTS measurements (id INTEGER PRIMARY KEY AUTOINCREMENT, datum TEXT, kpi TEXT, wert REAL, einheit TEXT)`);
            window.db.run(`CREATE TABLE IF NOT EXISTS narratives (topic TEXT PRIMARY KEY, strategy TEXT, policies TEXT, measures TEXT)`);
            window.db.run(`CREATE TABLE IF NOT EXISTS csrd_assessments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                thema TEXT,
                unterthema TEXT,
                type TEXT,        -- 'Impact' oder 'Financial'
                subtype TEXT,     -- 'Positiv', 'Negativ', 'Risiko', 'Chance'
                beschreibung TEXT,
                art TEXT,         -- 'Tatsächlich' oder 'Potenziell'
                ew REAL DEFAULT 0, aus REAL DEFAULT 0, umf REAL DEFAULT 0, irr REAL DEFAULT 0,
                ewk REAL DEFAULT 0, ewm REAL DEFAULT 0, ewl REAL DEFAULT 0, fin_aus REAL DEFAULT 0,
                erg REAL DEFAULT 0,
                erlaeuterung TEXT,
                verantwortlich TEXT,
                kennzahlen TEXT,
                is_wesentlich INTEGER DEFAULT 0
            )`);

            // 3. KPI STAMMDATEN & DEFINITIONEN
            window.db.run(`CREATE TABLE IF NOT EXISTS kpi_stammdaten (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                thema TEXT,
                unterthema TEXT,
                kpi_name TEXT,
                einheit TEXT
            )`);

            window.db.run(`CREATE TABLE IF NOT EXISTS kpi_definitions (
                kpi_name TEXT PRIMARY KEY, 
                kategorie TEXT, 
                esrs_bezug TEXT, 
                einheit TEXT, 
                beschreibung TEXT, 
                quelle TEXT, 
                is_active INTEGER DEFAULT 1, 
                is_wesentlich INTEGER DEFAULT 0
            )`);

            // 4. REPORTING & BACKUP TRACKING
            window.db.run(`CREATE TABLE IF NOT EXISTS reports (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT,
                report_name TEXT,
                audit_file TEXT,
                report_file TEXT,
                status_audit INTEGER,
                status_report INTEGER
            )`);

            // 5. SYSTEM-TABELLEN
            window.db.run(`CREATE TABLE IF NOT EXISTS app_settings (key TEXT PRIMARY KEY, value TEXT)`);
            // 6. USER MANAGEMENT
            window.db.run(`CREATE TABLE IF NOT EXISTS users (
                username TEXT PRIMARY KEY, 
                password TEXT, 
                role TEXT,
                session_token TEXT,      -- NEU für Command+R Support
                session_expires INTEGER  -- NEU für Command+R Support
            )`);
            // 156 Datensätze importieren, damit die DB direkt mit echten Daten gefüllt ist (für Dashboard & Wesentlichkeit)
            window.db.get("SELECT COUNT(*) as count FROM csrd_assessments", [], async (err, row) => {
                if (row && row.count === 0) {await window.fillMasterData();}
                resolve();
            });
            // Standard-Settings setzen (ohne die csrd_assessments mit Testdaten zu füllen)
            window.db.run(`INSERT OR IGNORE INTO app_settings (key, value) VALUES ('useUserManagement', '1')`);
            window.db.run(`INSERT OR IGNORE INTO app_settings (key, value) VALUES ('version', '1.7.0')`);
            // --- AUTOMATISCHE USER-ERSTELLUNG BEIM ERSTEN START ---
            window.db.run(`INSERT OR IGNORE INTO users (username, password, role) VALUES ('Admin', 'admin', 'superuser')`);
            window.db.run(`INSERT OR IGNORE INTO users (username, password, role) VALUES ('Demo', 'demo', 'admin')`);

            console.log("Datenbank v1.7.0 erfolgreich initialisiert. User 'Admin' und 'Demo' sind bereit.");
            resolve();
        });
    });
};

// Hilfsfunktionen für den Datenzugriff
window.db.getAllNarratives = function() {
    return new Promise((resolve, reject) => {
        window.db.all(`SELECT * FROM narratives`, [], (err, rows) => {
            if (err) reject(err); else resolve(rows || []);
        });
    });
};

window.db.getMaterialityData = function() {
    return new Promise((resolve) => {
        window.db.all(`SELECT * FROM csrd_assessments`, [], (err, rows) => {
            if (err) resolve([]); else resolve(rows || []);
        });
    });
};
window.fillMasterData = function() {
    return new Promise((resolve, reject) => {
        try {
            // Pfad zur JSON-Datei (lokal oder in Ressourcen, je nach Umgebung)
            const dataPath = window.getJsonPath();
            // 1. JSON Datei einlesen
            const rawData = fs.readFileSync(dataPath, 'utf8');
            const esrsData = JSON.parse(rawData);

            window.db.serialize(() => {
                // 2. Prepared Statement für bessere Performance und Sicherheit
                const stmt = window.db.prepare(`
                    INSERT INTO csrd_assessments 
                    (thema, unterthema, type, subtype, beschreibung, art, is_wesentlich) 
                    VALUES (?, ?, ?, ?, ?, ?, 0)
                `);

                esrsData.forEach(item => {
                    stmt.run(
                        item.thema, 
                        item.unterthema, 
                        item.type, 
                        item.subtype, 
                        item.beschreibung, 
                        item.art
                    );
                });

                stmt.finalize((err) => {
                    if (err) {
                        reject(err);
                    } else {
                        console.log(`${esrsData.length} ESRS-Datensätze importiert.`);
                        
                        // 3. Automatisch KPI-Stammdaten aus den Unterthemen erzeugen
                        window.db.run(`
                            INSERT INTO kpi_stammdaten (thema, unterthema, kpi_name, einheit)
                            SELECT DISTINCT thema, unterthema, 'Kennzahl für ' || unterthema, 'Einheit'
                            FROM csrd_assessments
                        `, () => resolve());
                    }
                });
            });
        } catch (err) {
            console.error("Fehler beim JSON-Import:", err);
            reject(err);
        }
    });
};