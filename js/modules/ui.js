// --- Die "kugelsichere" Helfer-Funktion ---
window.getEsrsDisplayData = function(rawEsrs) {
    const esrsMap = {
        "E1": { name: "E1: Klimawandel", icon: "🌍" },
        "E2": { name: "E2: Umweltverschmutzung", icon: "🏭" },
        "E3": { name: "E3: Wasser- & Meeresressourcen", icon: "💧" },
        "E4": { name: "E4: Biologische Vielfalt", icon: "🌿" },
        "E5": { name: "E5: Kreislaufwirtschaft", icon: "♻️" },
        "S1": { name: "S1: Eigene Belegschaft", icon: "👥" },
        "S2": { name: "S2: Arbeitskräfte (Wertschöpfungskette)", icon: "🤝" },
        "S3": { name: "S3: Betroffene Gemeinschaften", icon: "🏘️" },
        "S4": { name: "S4: Verbraucher & Endnutzer", icon: "🛒" },
        "G1": { name: "G1: Unternehmenspolitik", icon: "⚖️" },
        "OHNE ZUORDNUNG": { name: "Ohne Zuordnung", icon: "📑" }
    };

    const upperEsrs = String(rawEsrs).trim().toUpperCase();
    const match = upperEsrs.match(/([ESG][1-5])/);
    const key = match ? match[1] : (upperEsrs === '' ? "OHNE ZUORDNUNG" : upperEsrs);

    return esrsMap[key] || { name: `ESRS: ${rawEsrs}`, icon: "📊" };
};

window.activeEsrsTopic = null; 

// --- DAS NEUE UNIFIED DASHBOARD ---
window.generateUnifiedTiles = function() {
    const container = document.getElementById('unifiedTileContainer');
    if(!container) return; 
    container.innerHTML = '';
    
    const aktiveKPIs = window.alleKPIs.filter(k => k.is_active);
    let esrsGruppen = {};
    
    aktiveKPIs.forEach(k => {
        const rawEsrs = (k.esrs_bezug && k.esrs_bezug.trim() !== '') ? k.esrs_bezug.trim() : 'Ohne Zuordnung';
        if (!esrsGruppen[rawEsrs]) esrsGruppen[rawEsrs] = { wesentlich: false };
        if (k.is_wesentlich == 1 || k.is_wesentlich === true) {
            esrsGruppen[rawEsrs].wesentlich = true;
        }
    });
    
    const sortierteESRS = Object.keys(esrsGruppen).sort();
    
    sortierteESRS.forEach(esrs => {
        const displayData = window.getEsrsDisplayData(esrs);
        const isWesentlich = esrsGruppen[esrs].wesentlich;
        
        const badge = isWesentlich ? `<div style="background:#e74c3c; color:white; font-size:0.7rem; padding:3px 8px; border-radius:12px; position:absolute; top:-10px; right:-10px; font-weight:bold;">Wesentlich</div>` : '';
        const borderStyle = isWesentlich ? 'border: 2px solid #e74c3c;' : 'border: 1px solid #ddd;';

        // NEU: Ich habe den Kacheln eine eigene ID und Klasse (.esrs-tile) gegeben, um sie hervorheben zu können
        container.innerHTML += `
            <div class="category-tile esrs-tile" id="tile_${esrs.replace(/\s+/g, '_')}" style="position:relative; cursor:pointer; padding:20px; text-align:center; background:#fff; border-radius:8px; width:150px; ${borderStyle}" onclick="window.selectEsrsTopic('${esrs}')">
                ${badge}
                <div style="font-size: 2.5rem; margin-bottom: 10px;">${displayData.icon}</div>
                <h3 style="font-size: 1rem; margin: 0;">${displayData.name}</h3>
            </div>`;
    });

    // NEU: Sobald alle Kacheln gezeichnet sind, klicken wir automatisch die erste Kachel an!
    if (sortierteESRS.length > 0) {
        setTimeout(() => {
            window.selectEsrsTopic(sortierteESRS[0]);
        }, 100); 
    }
};

window.selectEsrsTopic = function(esrs) {
    window.activeEsrsTopic = esrs;
    const displayData = window.getEsrsDisplayData(esrs);
    
    // Optisches Highlight: Alle Kacheln weiß machen, die aktive leicht blau einfärben
    document.querySelectorAll('.esrs-tile').forEach(t => t.style.backgroundColor = '#fff');
    const activeTile = document.getElementById(`tile_${esrs.replace(/\s+/g, '_')}`);
    if(activeTile) activeTile.style.backgroundColor = '#e1f5fe'; // Leichtes, helles Blau
    
    document.getElementById('esrsDetailView').style.display = 'block';
    document.getElementById('activeEsrsTitle').innerText = displayData.name;
    
    // Wir erzwingen, dass immer der erste Tab (Charts) offen ist, wenn man ein neues Thema wählt
    const firstTabBtn = document.querySelector('.sub-tab-btn');
    if(firstTabBtn) window.switchSubTab('charts', firstTabBtn);
    
    // Daten laden
    window.loadInlineForm(esrs);
    window.loadInlineTable(esrs);
    window.loadInlineCharts(esrs);
};

window.switchSubTab = function(tabId, btnElement) {
    document.querySelectorAll('.sub-tab-content').forEach(el => el.style.display = 'none');
    document.getElementById(`subTab_${tabId}`).style.display = 'block';
    
    document.querySelectorAll('.sub-tab-btn').forEach(btn => {
        btn.style.background = '#ecf0f1';
        btn.style.color = 'black';
    });
    btnElement.style.background = '#3498db';
    btnElement.style.color = 'white';
};

// --- TAB 1: FORMULAR ---
window.loadInlineForm = function(esrs) {
    const sel = document.getElementById('inlineKpiSelect');
    if(!sel) return;
    
    sel.innerHTML = '<option value="">Bitte wählen...</option>';
    
    const passendeKPIs = window.alleKPIs.filter(k => {
        const kpiEsrs = (k.esrs_bezug && k.esrs_bezug.trim() !== '') ? k.esrs_bezug.trim().toUpperCase() : 'Ohne Zuordnung';
        return kpiEsrs === esrs.toUpperCase() && k.is_active;
    });
    
    passendeKPIs.forEach(k => {
        const isWesentlich = (k.is_wesentlich == 1 || k.is_wesentlich === true);
        const marker = isWesentlich ? ' [🎯 Wesentlich]' : '';
        sel.add(new Option(`${k.kpi_name}${marker}`, k.kpi_name));
    });

    document.getElementById('inlineInputDatum').value = new Date().toISOString().split('T')[0];
    document.getElementById('inlineInputWert').value = '';
    document.getElementById('inlineKpiUnitDisplay').innerText = '-';
    
    const infoBox = document.getElementById('inlineKpiInfoBox');
    if(infoBox) infoBox.style.display = 'none';
};

window.showInlineKPIInfo = function() {
    const kpiName = document.getElementById('inlineKpiSelect').value;
    const k = window.alleKPIs.find(k => k.kpi_name === kpiName);
    
    const infoBox = document.getElementById('inlineKpiInfoBox');
    const unitDisp = document.getElementById('inlineKpiUnitDisplay');
    
    if (k && infoBox && unitDisp) {
        infoBox.style.display = 'block';
        infoBox.innerHTML = `<strong>Beschreibung:</strong> ${k.beschreibung || 'Keine'}<br><strong>Quelle:</strong> ${k.quelle || 'Keine'}`;
        unitDisp.innerText = k.einheit || '';
    } else if (infoBox && unitDisp) {
        infoBox.style.display = 'none';
        unitDisp.innerText = '-';
    }
};

// --- TAB 2: TABELLE ---
window.loadInlineTable = function(esrs) {
    const table = document.getElementById('inlineHistoryTable');
    if(!table) return;
    
    table.innerHTML = '<tr><td>Lade Daten...</td></tr>';

    const kpisInKat = window.alleKPIs.filter(k => {
        const kpiEsrs = (k.esrs_bezug && k.esrs_bezug.trim() !== '') ? k.esrs_bezug.trim().toUpperCase() : 'Ohne Zuordnung';
        return kpiEsrs === esrs.toUpperCase();
    }).map(k => k.kpi_name);

    if(kpisInKat.length === 0) { 
        table.innerHTML = '<tr><td style="padding:15px; color:#7f8c8d;">Keine KPIs in diesem Bereich vorhanden.</td></tr>'; 
        return; 
    }

    const placeholders = kpisInKat.map(() => '?').join(',');
    window.db.all(`SELECT * FROM measurements WHERE kpi IN (${placeholders}) ORDER BY datum DESC LIMIT 50`, kpisInKat, (err, rows) => {
        if(err || !rows || rows.length === 0) { 
            table.innerHTML = '<tr><td colspan="4" style="padding:15px; color:#7f8c8d;">Noch keine Daten erfasst.</td></tr>'; 
            return; 
        }
        
        let html = '<thead><tr style="background:#ecf0f1; border-bottom:2px solid #bdc3c7;">';
        html += '<th style="padding:10px;">Datum</th><th style="padding:10px;">KPI</th><th style="padding:10px;">Wert</th><th style="padding:10px;">Einheit</th></tr></thead><tbody>';
        
        rows.forEach(r => { 
            html += `<tr style="border-bottom:1px solid #eee;">
                <td style="padding:10px;">${r.datum}</td>
                <td style="padding:10px;">${r.kpi}</td>
                <td style="padding:10px; font-weight:bold;">${r.wert}</td>
                <td style="padding:10px;">${r.einheit}</td>
            </tr>`; 
        });
        table.innerHTML = html + '</tbody>';
    });
};

// --- TAB 3: GRAFIKEN & NARRATIVEN ---
window.loadInlineCharts = function(esrs) {
    const container = document.getElementById('chartsContainer');
    if(!container) return;

    container.innerHTML = '<div style="padding: 20px; text-align: center; color: #7f8c8d;">Lade Auswertungen...</div>';

    // 1. Thema bestimmen (z.B. "E1")
    const upperEsrs = String(esrs).trim().toUpperCase();
    const match = upperEsrs.match(/([ESG][1-5])/);
    const dbEsrsKey = match ? match[1] : (upperEsrs === '' ? "OHNE ZUORDNUNG" : upperEsrs);

    // 2. KPIs filtern (mit dem verbesserten .includes() Filter)
    const relevantKPIs = window.alleKPIs.filter(k => {
        if (!k.is_active) return false;
        const kpiEsrs = (k.esrs_bezug && k.esrs_bezug.trim() !== '') ? k.esrs_bezug.trim().toUpperCase() : 'OHNE ZUORDNUNG';
        return kpiEsrs.includes(dbEsrsKey);
    });
    
    const kpiNames = relevantKPIs.map(k => k.kpi_name);

    // 3. Narrativen und Messwerte laden
    window.db.get(`SELECT * FROM narratives WHERE topic = ?`, [dbEsrsKey], (err, narrativeRow) => {
        let html = '';

        // Narrativen anzeigen, falls vorhanden
        if (narrativeRow && (narrativeRow.strategy || narrativeRow.policies || narrativeRow.measures)) {
            html += `
            <div style="background: #f8f9fa; padding: 20px; border-left: 4px solid #3498db; border-radius: 4px; margin-bottom: 30px;">
                <h3 style="margin-top:0; margin-bottom: 15px; color: #2c3e50;">📖 Kontext & Narrative (${dbEsrsKey})</h3>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; font-size: 0.95rem;">
                    <div><strong>Strategie:</strong><br><span style="color:#555;">${narrativeRow.strategy || '-'}</span></div>
                    <div><strong>Richtlinien:</strong><br><span style="color:#555;">${narrativeRow.policies || '-'}</span></div>
                    <div><strong>Maßnahmen:</strong><br><span style="color:#555;">${narrativeRow.measures || '-'}</span></div>
                </div>
            </div>`;
        }

        if (kpiNames.length === 0) {
            container.innerHTML = html + `<div style="text-align:center; padding: 20px; color: #7f8c8d;">Keine aktiven KPIs für dieses Thema gefunden.</div>`;
            return;
        }

        // Messwerte aus der DB holen
        const placeholders = kpiNames.map(() => '?').join(',');
        const query = `SELECT * FROM measurements WHERE kpi IN (${placeholders}) ORDER BY datum ASC`;

        window.db.all(query, kpiNames, (err, rows) => {
            if (err || !rows || rows.length === 0) {
                container.innerHTML = html + `<div style="text-align:center; padding: 20px; color: #7f8c8d;">Noch keine Messwerte für die KPIs dieses Bereichs vorhanden.</div>`;
                return;
            }

            // Daten gruppieren
            let grouped = {};
            rows.forEach(r => {
                if (!grouped[r.kpi]) grouped[r.kpi] = { dates: [], values: [], unit: r.einheit };
                grouped[r.kpi].dates.push(r.datum);
                const val = parseFloat(String(r.wert).replace(',', '.'));
                grouped[r.kpi].values.push(isNaN(val) ? 0 : val);
            });

            // HTML für Charts generieren
            html += `<div style="display: flex; flex-wrap: wrap; gap: 20px;">`;
            Object.keys(grouped).forEach((name, index) => {
                const canvasId = 'chartCanvas_' + index + '_' + Date.now();
                grouped[name].canvasId = canvasId;

                html += `
                <div style="flex: 1 1 calc(50% - 20px); min-width: 300px; background: #fff; border: 1px solid #eee; border-radius: 8px; padding: 15px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
                    <h4 style="margin-top:0; color: #34495e; text-align: center; font-size: 1rem;">${name}</h4>
                    <div style="position: relative; height: 200px; width: 100%;">
                        <canvas id="${canvasId}"></canvas>
                    </div>
                </div>`;
            });
            html += `</div>`;
            container.innerHTML = html;

            // Chart.js zeichnen
            setTimeout(() => {
                if (typeof Chart === 'undefined') return;
                Object.entries(grouped).forEach(([name, data]) => {
                    const ctx = document.getElementById(data.canvasId);
                    if (ctx) {
                        new Chart(ctx.getContext('2d'), {
                            type: 'line',
                            data: {
                                labels: data.dates,
                                datasets: [{
                                    label: name,
                                    data: data.values,
                                    borderColor: '#3498db',
                                    backgroundColor: 'rgba(52, 152, 219, 0.1)',
                                    tension: 0.3,
                                    fill: true
                                }]
                            },
                            options: {
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: { legend: { display: false } },
                                scales: { y: { beginAtZero: true } }
                            }
                        });
                    }
                });
            }, 50);
        });
    });
};

// --- DATEN SPEICHERN ---
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('inlineDataForm');
    if(form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault(); 
            
            const d = document.getElementById('inlineInputDatum').value;
            const k = document.getElementById('inlineKpiSelect').value;
            const w = parseFloat(document.getElementById('inlineInputWert').value);
            const kpiObj = window.alleKPIs.find(x => x.kpi_name === k);
            
            if(!k) { alert("Bitte wähle einen KPI aus dem Dropdown!"); return; }
            
            window.db.run(`INSERT INTO measurements (datum, kpi, wert, einheit) VALUES (?, ?, ?, ?)`, [d, k, w, kpiObj ? kpiObj.einheit : ''], () => {
                
                const msg = document.getElementById('inlineErfolgsMeldung'); 
                if(msg) { 
                    msg.style.display = 'block'; 
                    setTimeout(() => msg.style.display = 'none', 3000); 
                }
                
                document.getElementById('inlineInputWert').value = ''; 
                
                if(window.activeEsrsTopic) {
                    window.loadInlineTable(window.activeEsrsTopic);
                }
            });
        });
    }
});


// --- ALTES STATUS-MODUL (Bleibt erhalten) ---
window.updateStatusView = function() {
    window.db.all(`SELECT kpi, MAX(datum) as last_date FROM measurements GROUP BY kpi`, [], (err, rows) => {
        let dbData = {}; 
        if(rows) rows.forEach(r => dbData[r.kpi] = r.last_date);
        
        const table = document.getElementById('statusTable');
        if(!table) return;
        
        let html = '<thead><tr><th>Status</th><th>ESRS</th><th>KPI Name</th><th>Letzter Wert</th></tr></thead><tbody id="statusTbody">';
        let thirtyDaysAgo = new Date(); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        window.alleKPIs.filter(k => k.is_active).forEach(k => {
            let last = dbData[k.kpi_name], icon = '🔴', color = '#fdedec';
            if (last) {
                icon = (new Date(last) >= thirtyDaysAgo) ? '🟢' : '🟡';
                color = (new Date(last) >= thirtyDaysAgo) ? '#eafaf1' : '#fef9e7';
            }
            html += `<tr style="background:${color}"><td>${icon}</td><td>${k.esrs_bezug}</td><td>${k.kpi_name}</td><td>${last || '-'}</td></tr>`;
        });
        table.innerHTML = html + '</tbody>';
    });
};

window.filterStatus = function(color) {
    const rows = document.querySelectorAll("#statusTbody tr");
    rows.forEach(r => r.style.display = (color === 'alle' || r.cells[0].innerText.includes(color)) ? "" : "none");
};