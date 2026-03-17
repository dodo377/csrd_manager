window.loadKPIDataFromDB = function() {
    // Holt die Daten AUSSCHLIESSLICH aus der Datenbank
    window.db.all(`SELECT * FROM kpi_definitions ORDER BY kategorie, kpi_name`, [], (err, rows) => {
        if (err) {
            console.error("Fehler beim Laden der KPIs aus der DB:", err);
            window.alleKPIs = [];
        } else {
            window.alleKPIs = rows || [];
        }

        // Aktualisiert die Oberfläche sofort mit den geladenen Daten
        if(typeof window.generateErfassungTiles === 'function') window.generateErfassungTiles();
        if(typeof window.generateDashboardTiles === 'function') window.generateDashboardTiles();
        if(typeof window.generateDatenuebersichtTiles === 'function') window.generateDatenuebersichtTiles();
        
        // Falls wir uns gerade im Stammdaten-Reiter befinden, Tabelle neu zeichnen
        if(typeof window.updateStammdatenView === 'function') window.updateStammdatenView();
    });
};


window.updateStammdatenView = function() {
    const tbody = document.getElementById('kpiTableBody');
    if (!tbody) return;

    // 1. Hole alle KPIs und prüfe in der 'measurements' Tabelle, ob schon Daten erfasst wurden.
    const kpiQuery = `
        SELECT k.*, 
               (SELECT COUNT(*) FROM measurements m WHERE m.kpi = k.kpi_name) as anzahl_daten 
        FROM kpi_stammdaten k
    `;

    window.db.all(kpiQuery, [], (err, allKpis) => {
        // Fallback: Falls die Tabelle measurements nicht existiert/anders heißt, laden wir ohne Absturz
        if (err) {
            console.warn("Ampelsystem: Tabelle measurements evtl. nicht gefunden. Lade Fallback...", err);
            allKpis = []; 
        }

        const kpiList = allKpis || [];

        // 2. Hole die gruppierten CSRD-Themen
        const query = `
            SELECT thema, unterthema, MAX(erg) as max_erg
            FROM csrd_assessments 
            GROUP BY thema, unterthema
            ORDER BY thema, unterthema
        `;

        window.db.all(query, [], (err, rows) => {
            if (err || !rows) return;

            let html = '';
            rows.forEach(row => {
                const isWesentlich = (row.max_erg >= 3);
                const markerColor = isWesentlich ? '#e74c3c' : '#ecf0f1'; 
                const wesentlichBadge = isWesentlich 
                    ? '<span style="background: #e74c3c; color: white; padding: 3px 6px; border-radius: 4px; font-size: 0.65rem; font-weight: bold; text-transform: uppercase; margin-top: 6px; display: block; width: max-content;">Wesentlich</span>' : '';

                // KPIs für dieses Unterthema filtern
                const myKpis = kpiList.filter(k => k.thema === row.thema && k.unterthema === row.unterthema);
                
                let kpiHtml = '';
                if (myKpis.length === 0) {
                    kpiHtml = '<em style="color:#bdc3c7;">Noch keine KPIs verknüpft</em>';
                } else {
                    kpiHtml = '<div style="display:flex; flex-direction:column; gap:8px;">';
                    myKpis.forEach(k => {
                        
                        // --- NEU: DIE AMPEL LOGIK ---
                        // Wenn anzahl_daten > 0 ist, haben wir Werte -> Grün! Sonst -> Rot!
                        const hasData = (k.anzahl_daten > 0);
                        const statusIcon = hasData 
                            ? '<span title="Daten aktuell" style="font-size: 1.1rem; filter: drop-shadow(0 0 2px rgba(39, 174, 96, 0.5));">🟢</span>' 
                            : '<span title="Überfällig / Keine Daten" style="font-size: 1.1rem; filter: drop-shadow(0 0 2px rgba(231, 76, 60, 0.5));">🔴</span>';

                        kpiHtml += `
                        <div style="display:flex; justify-content:space-between; align-items:center; background:#fdfdfd; padding:6px 10px; border:1px solid #eee; border-radius:4px; box-shadow: 0 1px 3px rgba(0,0,0,0.02);">
                            <span style="display:flex; align-items:center; gap:8px;">
                                ${statusIcon}
                                <span><strong>${k.kpi_name}</strong> <span style="color:#7f8c8d; font-size:0.9rem;">(${k.einheit})</span></span>
                            </span>
                            <button onclick="window.deleteLinkedKpi(${k.id})" style="background:transparent; border:none; color:#e74c3c; cursor:pointer;" title="KPI löschen">✖</button>
                        </div>`;
                    });
                    kpiHtml += '</div>';
                }

                html += `
                    <tr style="border-left: 5px solid ${markerColor}; border-bottom: 1px solid #eee;">
                        <td style="padding: 15px 12px; vertical-align: top;"><strong>${row.thema}</strong>${wesentlichBadge}</td>
                        <td style="padding: 15px 12px; vertical-align: top;">${row.unterthema}</td>
                        <td style="padding: 15px 12px; vertical-align: top;">${kpiHtml}</td>
                        <td style="padding: 15px 12px; vertical-align: top; text-align: center;">
                            <button onclick="window.openAddKpiModal('${row.thema}', '${row.unterthema}')" style="background:#3498db; color:white; border:none; padding:6px 12px; border-radius:4px; cursor:pointer; font-size:0.85rem; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">➕ KPI anlegen</button>
                        </td>
                    </tr>
                `;
            });
            tbody.innerHTML = html;
        });
    });
};

window.loadKPIDataFromDB = window.updateStammdatenView;

// --- KPI MODAL & SPEICHER-LOGIK ---

window.openAddKpiModal = function(thema, unterthema) {
    document.getElementById('addKpiSubtitle').innerText = `Zu: ${thema} -> ${unterthema}`;
    document.getElementById('addKpiThema').value = thema;
    document.getElementById('addKpiUnterthema').value = unterthema;
    document.getElementById('addKpiName').value = '';
    document.getElementById('addKpiEinheit').value = '';
    document.getElementById('addKpiModal').style.display = 'flex';
};

window.closeAddKpiModal = function() {
    document.getElementById('addKpiModal').style.display = 'none';
};

window.saveLinkedKpi = function() {
    const thema = document.getElementById('addKpiThema').value;
    const unterthema = document.getElementById('addKpiUnterthema').value;
    const name = document.getElementById('addKpiName').value;
    const einheit = document.getElementById('addKpiEinheit').value;

    if(!name || !einheit) {
        window.showStatus("Bitte Name und Einheit angeben!", "error");
        return;
    }

    window.db.run(`INSERT INTO kpi_stammdaten (thema, unterthema, kpi_name, einheit) VALUES (?, ?, ?, ?)`, 
        [thema, unterthema, name, einheit], (err) => {
        if (!err) {
            window.showStatus("KPI erfolgreich verknüpft", "success");
            window.closeAddKpiModal();
            
            // 1. Stammdaten im Hintergrund aktualisieren
            if (window.updateStammdatenView) window.updateStammdatenView(); 
            
            // 2. Wesentlichkeitsanalyse SOFORT aktualisieren, damit der neue KPI sichtbar wird!
            if (window.loadMaterialityAnalysis) window.loadMaterialityAnalysis();
        }
    });
};

window.deleteLinkedKpi = function(id) {
    if(confirm("Diesen KPI wirklich löschen? Die erfassten Daten bleiben erhalten, aber die Verknüpfung wird gelöst.")) {
        window.db.run(`DELETE FROM kpi_stammdaten WHERE id = ?`, [id], (err) => {
            if(!err) {
                // Stammdaten & Wesentlichkeitsanalyse synchron aktualisieren
                if (window.updateStammdatenView) window.updateStammdatenView();
                if (window.loadMaterialityAnalysis) window.loadMaterialityAnalysis();
            }
        });
    }
};

// Falls dein System intern noch nach diesem Namen sucht, mappen wir ihn:
window.loadKPIDataFromDB = window.updateStammdatenView;

window.toggleKPI = function(name, field, value) {
    const val = value ? 1 : 0;
    window.db.run(`UPDATE kpi_definitions SET ${field} = ? WHERE kpi_name = ?`, [val, name], () => {
        window.loadKPIDataFromDB(); // Lädt nach jeder Änderung direkt frisch aus der DB
    });
};

window.filterTable = function() {
    const input = document.getElementById("searchInput").value.toUpperCase();
    const trs = document.querySelectorAll("#kpiTable tbody tr");
    trs.forEach(tr => { 
        tr.style.display = tr.innerText.toUpperCase().includes(input) ? "" : "none"; 
    });
};

window.loadNarrative = function() {
    const topic = document.getElementById('narrativeTopicSelect').value;
    if (!topic) return;

    window.db.get(`SELECT * FROM narratives WHERE topic = ?`, [topic], (err, row) => {
        if (err) return console.error(err);

        // Elemente referenzieren
        const elStrategy = document.getElementById('txtStrategy');
        const elPolicies = document.getElementById('txtPolicies');
        const elMeasures = document.getElementById('txtMeasures');
        const editor = document.getElementById('narrativeEditor');
        
        const imgPreview = document.getElementById('imgPreview');
        const previewCont = document.getElementById('imagePreviewContainer');
        const captionCont = document.getElementById('imageCaptionContainer');
        const txtCaption = document.getElementById('txtImageCaption');

        // Titel setzen
        const titleMap = {
            'E1': 'E1: Klimawandel',
            'E2': 'E2: Umweltverschmutzung',
            'E5': 'E5: Kreislaufwirtschaft',
            'S1': 'S1: Eigene Belegschaft',
            'G1': 'G1: Governance'
        };
        
        if (document.getElementById('currentTopicTitle')) {
            document.getElementById('currentTopicTitle').innerText = titleMap[topic] || "Thema bearbeiten";
        }

        // Texte füllen
        if (elStrategy && elPolicies && elMeasures) {
            elStrategy.value = row ? (row.strategy || '') : '';
            elPolicies.value = row ? (row.policies || '') : '';
            elMeasures.value = row ? (row.measures || '') : '';
            if(editor) editor.style.display = 'block';
        }

        // Bild und Label-Feld laden
        if (imgPreview && previewCont && captionCont && txtCaption) {
            if (row && row.image_data && row.image_data.length > 10) {
                imgPreview.src = row.image_data;
                previewCont.style.display = 'block';
                captionCont.style.display = 'block'; // Label-Feld einblenden
                txtCaption.value = row.image_caption || '';
            } else {
                imgPreview.src = '';
                previewCont.style.display = 'none';
                captionCont.style.display = 'none'; // Label-Feld ausblenden
                txtCaption.value = '';
            }
        }
    });
};

// Hilfsfunktion zum Konvertieren in Base64
const fileToBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
});

// Bild-Vorschau UND Label-Feld beim Auswählen aktivieren
document.getElementById('fileImageUpload')?.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (file) {
        const base64 = await fileToBase64(file);
        
        // Bild anzeigen
        const img = document.getElementById('imgPreview');
        if (img) img.src = base64;
        
        const previewCont = document.getElementById('imagePreviewContainer');
        if (previewCont) previewCont.style.display = 'block';
        
        // WICHTIG: Das Label-Feld für die Bildunterschrift einblenden
        const captionCont = document.getElementById('imageCaptionContainer');
        if (captionCont) {
            captionCont.style.display = 'block';
        }
    }
});

window.removeImage = function() {
    if (confirm("Möchten Sie das Bild aus diesem Thema entfernen?")) {
        const fileUpload = document.getElementById('fileImageUpload');
        const imgPreview = document.getElementById('imgPreview');
        const previewCont = document.getElementById('imagePreviewContainer');
        const captionCont = document.getElementById('imageCaptionContainer');
        const txtCaption = document.getElementById('txtImageCaption');

        if (fileUpload) fileUpload.value = "";
        if (imgPreview) imgPreview.src = "";
        if (previewCont) previewCont.style.display = 'none';
        if (captionCont) captionCont.style.display = 'none';
        if (txtCaption) txtCaption.value = "";
        
        window.showStatus("Bild entfernt (Speichern erforderlich)", "info");
    }
};

window.saveNarrative = async function() {
    const topic = document.getElementById('narrativeTopicSelect').value;
    const strategy = document.getElementById('txtStrategy').value;
    const policies = document.getElementById('txtPolicies').value;
    const measures = document.getElementById('txtMeasures').value;
    
    // Daten abgreifen
    const imgData = document.getElementById('imgPreview').src || ""; 
    const caption = document.getElementById('txtImageCaption').value || "";

    const sql = `INSERT OR REPLACE INTO narratives (topic, strategy, policies, measures, image_data, image_caption) 
                 VALUES (?, ?, ?, ?, ?, ?)`;
    
    window.db.run(sql, [topic, strategy, policies, measures, imgData, caption], (err) => {
        if (err) {
            console.error("Speicherfehler:", err);
            window.showStatus("Fehler beim Speichern", "error");
        } else {
            window.showStatus("Texte, Bild und Label gespeichert!", "success");
        }
    });
};
// --- NEUE FUNKTIONEN FÜR DAS ANLEGEN VON KPIS ---

window.openNewKpiModal = function() {
    // Dropdown-Liste mit bereits existierenden Kategorien füllen, um Tippfehler zu vermeiden
    const datalist = document.getElementById('kategorieList');
    if (datalist && window.alleKPIs) {
        const uniqueCats = [...new Set(window.alleKPIs.map(k => k.kategorie))];
        datalist.innerHTML = uniqueCats.map(c => `<option value="${c}">`).join('');
    }
    
    // Formular leeren und Modal anzeigen
    document.getElementById('newKpiName').value = '';
    document.getElementById('newKpiKat').value = '';
    document.getElementById('newKpiEsrs').value = '';
    document.getElementById('newKpiEinheit').value = '';
    document.getElementById('newKpiDesc').value = '';
    document.getElementById('newKpiQuelle').value = '';
    
    document.getElementById('newKpiModal').style.display = 'flex';
};

window.closeNewKpiModal = function() {
    document.getElementById('newKpiModal').style.display = 'none';
};

window.saveNewKpi = function(event) {
    event.preventDefault(); // Verhindert, dass die Seite neu lädt
    
    const name = document.getElementById('newKpiName').value.trim();
    const kat = document.getElementById('newKpiKat').value.trim();
    const esrs = document.getElementById('newKpiEsrs').value.trim();
    const einh = document.getElementById('newKpiEinheit').value.trim();
    const desc = document.getElementById('newKpiDesc').value.trim();
    const quelle = document.getElementById('newKpiQuelle').value.trim();
    
    // SQLite INSERT Befehl (Standardmäßig ist der KPI direkt aktiv, aber noch nicht "wesentlich")
    const sql = `INSERT INTO kpi_definitions (kpi_name, kategorie, esrs_bezug, einheit, beschreibung, quelle, is_active, is_wesentlich) 
                 VALUES (?, ?, ?, ?, ?, ?, 1, 0)`;
                 
    window.db.run(sql, [name, kat, esrs, einh, desc, quelle], function(err) {
        if (err) {
            alert("Fehler beim Speichern: Möglicherweise existiert dieser KPI-Name bereits.");
            console.error(err);
            return;
        }
        
        window.closeNewKpiModal();
        
        // Stammdaten aus der DB neu laden, damit die Tabelle aktualisiert wird
        window.loadKPIDataFromDB();
        
        alert(`KPI "${name}" erfolgreich angelegt!`);
    });
};
// --- NEU: EXCEL / CSV IMPORT ---

window.triggerKpiImport = function() {
    // Klickt unsichtbar auf das Datei-Feld
    document.getElementById('kpiImportFile').click();
};

// WICHTIG: Die Funktion muss "async" sein!
window.handleKpiImport = function(event) {
    const file = event.target.files[0];
    if (!file) return;

    console.log("--- START IMPORT DEBUG ---");
    console.log("Dateiname:", file.name);
    console.log("Dateityp:", file.type);

    if (typeof XLSX === 'undefined') {
        alert("KRITISCH: Die Bibliothek 'XLSX' fehlt! Prüfe Schritt 1.");
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            console.log("Rohdaten geladen (Bytes):", data.length);

            // Wir erzwingen das Lesen ohne Automatik-Schnickschnack
            const workbook = XLSX.read(data, { 
                type: 'array',
                cellDates: true,
                cellText: false 
            });

            if (!workbook || !workbook.SheetNames.length) {
                throw new Error("Keine Tabellenblätter in der Datei gefunden.");
            }

            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 }); // 'header: 1' liest ALLES als Arrays

            console.log("Erste 3 Zeilen der Datei:", rows.slice(0, 3));

            if (rows.length < 2) { // Kopfzeile + mindestens 1 Datenzeile
                window.showStatus("Datei zu kurz oder leer!", "error");
                return;
            }

            // Kopfzeile analysieren (erste Zeile)
            const headers = rows[0].map(h => String(h).toLowerCase().trim());
            const nameIdx = headers.findIndex(h => h.includes("kpi") || h.includes("name"));

            if (nameIdx === -1) {
                console.error("Spalten gefunden:", headers);
                window.showStatus("Spalte 'KPI Name' fehlt!", "error");
                return;
            }

            // Import starten
            let importCount = 0;
            window.db.serialize(() => {
                const stmt = window.db.prepare(`INSERT OR IGNORE INTO kpi_definitions 
                    (kpi_name, kategorie, esrs_bezug, einheit, beschreibung, quelle, is_active, is_wesentlich) 
                    VALUES (?, ?, ?, ?, ?, ?, 1, 0)`);

                for (let i = 1; i < rows.length; i++) {
                    const row = rows[i];
                    const nameValue = row[nameIdx];

                    if (nameValue && String(nameValue).trim() !== "") {
                        // Wir mappen die Spalten fix (0=Name, 1=Kat, 2=ESRS, 3=Einheit...)
                        // Das ist sicherer als die JSON-Objekt-Suche
                        stmt.run(
                            String(nameValue).trim(),
                            String(row[1] || 'Import'),
                            String(row[2] || ''),
                            String(row[3] || ''),
                            String(row[4] || ''),
                            String(row[5] || '')
                        );
                        importCount++;
                    }
                }
                stmt.finalize(() => {
                    window.showStatus(`${importCount} KPIs importiert!`, "success");
                    if (window.loadKPIDataFromDB) window.loadKPIDataFromDB();
                    event.target.value = "";
                });
            });

        } catch (err) {
            console.error("XLSX DETEKTIV-FEHLER:", err);
            window.showStatus("Fehler: " + err.message, "error");
        }
    };
    reader.readAsArrayBuffer(file);
};
window.downloadKpiTemplate = function() {
    // Wir bauen die Datei als reinen Text auf. 
    // WICHTIG: Wir nutzen Semikolons (;), damit ein deutsches Excel die Spalten sofort automatisch erkennt!
    const header = "KPI Name;Kategorie;ESRS Bezug;Einheit;Beschreibung;Quelle\n";
    const example = "Beispiel: Stromverbrauch Serverraum;Energie & Infrastruktur;E1;kWh;Jährlicher Stromverbrauch der zentralen Server;Stromrechnung / Smart Meter\n";
    
    // Das \uFEFF am Anfang ist ein geheimer Trick (Byte Order Mark). 
    // Er zwingt Excel dazu, Umlaute (ä, ö, ü) sofort korrekt anzuzeigen.
    const csvContent = "\uFEFF" + header + example;
    
    // Wir verpacken den Text in eine Datei
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    // Wir erstellen einen unsichtbaren Link und "klicken" ihn per Skript an
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "KPI_Import_Muster.csv");
    document.body.appendChild(link);
    
    link.click(); // Startet den Download sofort
    
    // Räumt den unsichtbaren Link wieder auf
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};