/**
 * narratives.js - Version 1.6.0
 * Fokus: Dynamisches Reporting, Audit-Archive & KPI-Mapping
 */


// --- HILFSFUNKTIONEN ---

/**
 * Lädt alle aktuellen Messwerte aus der Datenbank für das KPI-Mapping
 */
async function getCurrentMeasurements() {
    return new Promise((resolve) => {
        window.db.all("SELECT kpi, wert, einheit FROM measurements ORDER BY datum DESC", [], (err, rows) => {
            if (err) {
                console.error("Fehler beim Laden der Messwerte:", err);
                resolve([]);
            } else {
                resolve(rows || []);
            }
        });
    });
}

/**
 * Ersetzt Platzhalter der Form {{KPI:Name}} durch echte Werte
 */
function injectKPIs(text, measurements) {
    if (!text) return text;
    return text.replace(/{{KPI:(.*?)}}/g, (match, kpiName) => {
        const name = kpiName.trim();
        const found = measurements.find(m => m.kpi === name);
        if (found) {
            return `<strong style="color: #2c3e50;">${found.wert} ${found.einheit}</strong>`;
        }
        return `<span style="color: #e67e22; border-bottom: 1px dashed;">[KPI '${name}' nicht gefunden]</span>`;
    });
}

// --- HAUPTFUNKTIONEN ---

/**
 * Generiert die dynamische Berichtsvorschau
 */
window.generateFullReport = async function() {
    console.log("Generiere CSRD-Bericht...");
    const container = document.getElementById('fullReportContent');
    if (!container) return;

    try {
        const allTexts = await window.db.getAllNarratives();
        const assessments = await window.db.getMaterialityData(); // Filtert wesentliche Themen
        const measurements = await getCurrentMeasurements();
        const kpis = window.alleKPIs || [];

        let figureCounter = 1;
        const figureList = [];

        // Inhalts-Hilfsfunktion mit KPI-Mapping
        const getT = (topic, field) => {
            const match = allTexts.find(t => t.topic === topic);
            if (!match) return field === 'image' ? "" : "<i>Noch keine qualitativen Angaben hinterlegt.</i>";

            if (field === 'image') {
                if (match.image_data && match.image_data.startsWith('data:image')) {
                    const caption = match.image_caption || `Abbildung zu ${topic}`;
                    const figureLabel = `Abb. ${figureCounter++}`;
                    figureList.push({ label: figureLabel, caption: caption });
                    return `
                        <div style="text-align: center; margin: 30px 0; page-break-inside: avoid;">
                            <img src="${match.image_data}" style="max-width: 100%; max-height: 400px; border: 1px solid #eee; padding: 5px;">
                            <p style="font-size: 0.9rem; color: #666; font-style: italic;"><strong>${figureLabel}:</strong> ${caption}</p>
                        </div>`;
                }
                return "";
            }

            // KPI Injektion anwenden
            const rawText = match[field] || "<i>Keine Daten.</i>";
            return injectKPIs(rawText, measurements);
        };

        // Kapitel-Vorbereitung
        const sectionE1 = `<h3>E1 Klimawandel</h3>
                           <p><strong>Strategie:</strong><br>${getT('E1', 'strategy')}</p>
                           <p><strong>Richtlinien:</strong><br>${getT('E1', 'policies')}</p>
                           ${getT('E1', 'image')}`;

        const sectionS1 = `<h3>S1 Eigene Belegschaft</h3>
                           <p><strong>Strategie & Maßnahmen:</strong><br>${getT('S1', 'strategy')}</p>
                           <p><strong>Zielerreichung:</strong><br>${getT('S1', 'measures')}</p>`;

        // Gesamtdokument zusammenbauen
        let html = `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; line-height: 1.6; max-width: 800px; margin: auto;">
                <div style="text-align:center; margin-top:80px; margin-bottom:100px; border-bottom: 4px solid #18bc9c; padding-bottom: 20px;">
                    <h1 style="font-size: 3.5rem; margin-bottom: 10px;">Nachhaltigkeitsbericht</h1>
                    <h2 style="color: #18bc9c; font-weight: 300;">Geschäftsjahr ${new Date().getFullYear()}</h2>
                    <p style="letter-spacing: 2px; text-transform: uppercase;">Software & IT Solutions Thüringen</p>
                </div>

                <div style="page-break-after: always;"></div>
                
                <h3>Wesentlichkeits-Index</h3>
                <ul style="list-style: none; padding: 0;">
                    ${assessments.map(a => `<li style="padding: 5px 0; border-bottom: 1px solid #eee;"><strong>${a.thema}:</strong> ${a.unterthema}</li>`).join('')}
                </ul>

                <div style="page-break-before: always;"></div>
                <h2>Strategie & Umwelt (ESRS E)</h2>
                ${sectionE1}

                <div style="page-break-before: always;"></div>
                <h2>Soziales (ESRS S)</h2>
                ${sectionS1}

                <div style="page-break-before: always;"></div>
                <h2>Anhang: KPI-Tabelle</h2>
                <table style="width:100%; border-collapse: collapse; margin-top: 20px;">
                    <thead>
                        <tr style="background: #2c3e50; color: white;">
                            <th style="padding: 12px; text-align: left;">Kennzahl</th>
                            <th style="padding: 12px; text-align: right;">Aktueller Wert</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${measurements.map(m => `
                            <tr style="border-bottom: 1px solid #ddd;">
                                <td style="padding: 10px;">${m.kpi}</td>
                                <td style="padding: 10px; text-align: right; font-weight: bold;">${m.wert} ${m.einheit}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>`;

        container.innerHTML = html;
    } catch (err) {
        console.error("Berichtsfehler:", err);
        container.innerHTML = `<p style="color:red;">Fehler bei der Generierung: ${err.message}</p>`;
    }
};

/**
 * Workflow: Datenbank sichern -> Bericht speichern -> Historie loggen
 */
window.startFinalizeProcess = function() {
    const statusEl = document.getElementById('backupStatus');
    const reportHtml = document.getElementById('fullReportContent').innerHTML;
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 16);
    const reportFileName = `ESG_Report_${timestamp}.html`;
    let auditFileName = "";

    if (statusEl) {
        statusEl.innerHTML = "⏳ Finalisierung läuft: Audit-Sicherung wird erstellt...";
        statusEl.style.color = "#2c3e50";
    }

    // Schritt 1: Audit-Backup
    ipcRenderer.send('create-db-backup', 'audit');

    ipcRenderer.once('backup-finished', (event, response) => {
        if (response && response.success) {
            auditFileName = response.fileName;
            if (statusEl) statusEl.innerHTML = "✅ Audit-DB gesichert. Exportiere Bericht-Datei...";
            
            // Schritt 2: HTML-Export
            ipcRenderer.send('save-report-file', { htmlContent: reportHtml, fileName: reportFileName });
        }
    });

    ipcRenderer.once('report-saved', (event, response) => {
        if (response && response.success) {
            // Schritt 3: In Datenbank protokollieren
            const sql = `INSERT INTO reports (timestamp, report_name, audit_file, report_file, status_audit, status_report) 
                         VALUES (DATETIME('now'), ?, ?, ?, 1, 1)`;
            
            window.db.run(sql, [reportFileName, auditFileName, reportFileName], (err) => {
                if (!err) {
                    window.showStatus("Archivierung erfolgreich abgeschlossen!", "success");
                    if (statusEl) {
                        statusEl.style.color = "#27ae60";
                        statusEl.innerHTML = `✅ Erfolgreich archiviert: ${reportFileName}`;
                    }
                    window.loadReportHistory(); // Tabelle aktualisieren
                }
            });
        }
    });
};

/**
 * Lädt die Liste der archivierten Berichte in die Tabelle oben
 */
window.loadReportHistory = function() {
    const tbody = document.getElementById('reportHistoryTable');
    if (!tbody) return;

    window.db.all("SELECT * FROM reports ORDER BY id DESC", [], (err, rows) => {
        if (err || !rows || rows.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:15px; color:#999;">Keine Archiv-Daten vorhanden.</td></tr>';
            return;
        }

        tbody.innerHTML = rows.map(row => `
            <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 10px;">${new Date(row.timestamp).toLocaleString('de-DE')}</td>
                <td style="padding: 10px; font-weight: 500;">${row.report_name}</td>
                <td style="padding: 10px; text-align: center; font-size: 1.1rem;">🛡️✅</td>
                <td style="padding: 10px; text-align: center; font-size: 1.1rem;">📄✅</td>
                <td style="padding: 10px; text-align: right;">
                    <button onclick="window.viewSavedReport('${row.report_file}')" 
                            style="background:#18bc9c; color:white; border:none; padding:5px 10px; border-radius:4px; cursor:pointer;">
                        👁️ Öffnen & Drucken
                    </button>
                    <button onclick="window.openExportFolder()" 
                            style="background:#eee; border:none; padding:5px 10px; border-radius:4px; cursor:pointer; margin-left:5px;">
                        📂
                    </button>
                </td>
            </tr>
        `).join('');
    });
};

/**
 * Öffnet einen archivierten HTML-Bericht in einem neuen Fenster
 */
window.viewSavedReport = function(fileName) {
    const path = require('path');
    const fs = require('fs');
    const filePath = path.join(__dirname, 'exports', fileName);

    if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        const win = window.open('', '_blank');
        win.document.write(content);
        win.document.close();
        
        // Druck-Overlay hinzufügen
        const header = win.document.createElement('div');
        header.className = 'no-print';
        header.style = "background:#2c3e50; color:white; padding:15px; font-family:sans-serif; display:flex; justify-content:space-between; align-items:center;";
        header.innerHTML = `
            <span>Archivierte Version: <strong>${fileName}</strong></span>
            <button onclick="window.print()" style="padding:8px 20px; cursor:pointer; background:#18bc9c; border:none; color:white; font-weight:bold; border-radius:4px;">Drucken / PDF</button>
            <style>@media print {.no-print {display:none;}}</style>
        `;
        win.document.body.insertBefore(header, win.document.body.firstChild);
    } else {
        window.showStatus("Archivdatei nicht mehr im Ordner /exports vorhanden.", "error");
    }
};

/**
 * Navigation zwischen Erfassung und Vorschau
 */
window.switchReportTab = function(tabName) {
    const divErf = document.getElementById('reportTab_erfassung');
    const divVor = document.getElementById('reportTab_vorschau');
    const btnErf = document.getElementById('tabBtnErfassung');
    const btnVor = document.getElementById('tabBtnVorschau');

    if (tabName === 'erfassung') {
        divErf.style.display = 'block';
        divVor.style.display = 'none';
        btnErf.style.background = '#18bc9c'; btnErf.style.color = 'white';
        btnVor.style.background = '#f8f9fa'; btnVor.style.color = '#333';
    } else {
        divErf.style.display = 'none';
        divVor.style.display = 'block';
        btnErf.style.background = '#f8f9fa'; btnErf.style.color = '#333';
        btnVor.style.background = '#18bc9c'; btnVor.style.color = 'white';

        window.generateFullReport();
        window.loadReportHistory();
    }
};

window.openExportFolder = function() {
    const { shell } = require('electron');
    const path = require('path');
    shell.openPath(path.join(__dirname, 'exports'));
};

window.printReport = function() {
    // Einfache Vorschau-Druckfunktion für den Entwurf
    const content = document.getElementById('fullReportContent').innerHTML;
    const win = window.open('', '_blank');
    win.document.write(`<html><head><style>body{font-family:sans-serif; padding:40px;}</style></head><body>${content}</body></html>`);
    win.document.close();
    setTimeout(() => { win.print(); win.close(); }, 500);
};