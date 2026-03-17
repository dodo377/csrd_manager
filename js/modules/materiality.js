// Wir starten standardmäßig im Impact-Tab
window.currentMatTab = 'Impact';

window.switchMaterialityTab = function(tabName) {
    window.currentMatTab = tabName;
    
    const btnImpact = document.getElementById('tabImpact');
    const btnFinancial = document.getElementById('tabFinancial');
    
    if (tabName === 'Impact') {
        btnImpact.style.background = '#18bc9c'; btnImpact.style.color = 'white'; btnImpact.style.fontWeight = 'bold';
        btnFinancial.style.background = '#f8f9fa'; btnFinancial.style.color = '#333'; btnFinancial.style.fontWeight = 'normal';
    } else {
        btnFinancial.style.background = '#18bc9c'; btnFinancial.style.color = 'white'; btnFinancial.style.fontWeight = 'bold';
        btnImpact.style.background = '#f8f9fa'; btnImpact.style.color = '#333'; btnImpact.style.fontWeight = 'normal';
    }
    
    window.loadMaterialityAnalysis();
};

window.loadMaterialityAnalysis = function() {
    const thead = document.getElementById('materialityThead');
    const tbody = document.getElementById('materialityTableBody');
    if (!tbody || !thead) return;

    // 1. Tabellenkopf dynamisch aufbauen
    if (window.currentMatTab === 'Impact') {
        thead.innerHTML = `<tr>
            <th style="width: 15%;">Thema (ESRS)</th>
            <th style="width: 20%;">Unterthema</th>
            <th style="width: 12%;">Art</th>
            <th style="width: 8%;">Pos/Neg</th>
            <th style="width: 35%;">Beschreibung / Kontext</th>
            <th style="width: 10%; text-align: center;">Aktion</th>
        </tr>`;
    } else {
        thead.innerHTML = `<tr>
            <th style="width: 15%;">Thema (ESRS)</th>
            <th style="width: 25%;">Unterthema</th>
            <th style="width: 15%;">Risiko/Chance</th>
            <th style="width: 35%;">Beschreibung / Kontext</th>
            <th style="width: 10%; text-align: center;">Aktion</th>
        </tr>`;
    }

    window.db.all(`SELECT username FROM users`, [], (err, userRows) => {
        let userOptions = '<option value="">-- Bitte wählen --</option>';
        if (!err && userRows) userRows.forEach(u => userOptions += `<option value="${u.username}">${u.username}</option>`);
        
        // Zuerst alle KPIs laden, um sie später im Accordion anzuzeigen
        window.db.all(`SELECT * FROM kpi_stammdaten`, [], (err, allKpis) => {
            const kpiList = allKpis || [];
            
            window.db.all(`SELECT * FROM csrd_assessments WHERE type = ? ORDER BY thema, unterthema, subtype DESC`, [window.currentMatTab], (err, rows) => {
                if (err) return console.error(err);

                let html = '';
                rows.forEach(row => {
                    const dbId = row.id;
                    const isWesentlich = (row.erg >= 3);
                    const markerColor = isWesentlich ? '#e74c3c' : '#ecf0f1'; 
                    const typeColor = (row.subtype === 'Positiv' || row.subtype === 'Chance') ? '#27ae60' : '#e74c3c';

                    const wesentlichBadge = isWesentlich 
                        ? '<span style="background: #e74c3c; color: white; padding: 3px 6px; border-radius: 4px; font-size: 0.65rem; font-weight: bold; text-transform: uppercase; margin-top: 6px; display: block; width: max-content; letter-spacing: 0.5px;">Wesentlich</span>' 
                        : '';

                    // === SICHTBARE ZEILE ===
                    if (window.currentMatTab === 'Impact') {
                        html += `
                        <tr class="accordion-trigger" style="border-left: 5px solid ${markerColor};">
                            <td><strong>${row.thema}</strong>${wesentlichBadge}</td>
                            <td>${row.unterthema}</td>
                            <td>
                                <select id="inp_art_${dbId}" onchange="window.saveQuickArt(${dbId}, this.value)" style="padding: 5px; border-radius: 4px; border: 1px solid #ccc; width: 100%; background: #fdfdfd;">
                                    <option value="Potenziell" ${row.art !== 'Tatsächlich' ? 'selected' : ''}>Potenziell</option>
                                    <option value="Tatsächlich" ${row.art === 'Tatsächlich' ? 'selected' : ''}>Tatsächlich</option>
                                </select>
                            </td>
                            <td><strong style="color:${typeColor};">${row.subtype}</strong></td>
                            <td><textarea class="table-textarea" onchange="window.saveQuickDesc(${dbId}, this.value)" placeholder="Beschreibung hier...">${row.beschreibung || ''}</textarea></td>
                            <td style="text-align: center; white-space: nowrap;">
                                <button onclick="window.openAccordion(${dbId}, 'view')" style="border:none; background:transparent; cursor:pointer; font-size:1.2rem; margin-right:5px;" title="Anzeigen">👁️</button>
                                <button onclick="window.openAccordion(${dbId}, 'edit')" style="border:none; background:transparent; cursor:pointer; font-size:1.2rem;" title="Bearbeiten">✏️</button>
                            </td>
                        </tr>`;
                    } else {
                        html += `
                        <tr class="accordion-trigger" style="border-left: 5px solid ${markerColor};">
                            <td><strong>${row.thema}</strong>${wesentlichBadge}</td>
                            <td>${row.unterthema}</td>
                            <td><strong style="color:${typeColor};">${row.subtype}</strong></td>
                            <td><textarea class="table-textarea" onchange="window.saveQuickDesc(${dbId}, this.value)" placeholder="Beschreibung hier...">${row.beschreibung || ''}</textarea></td>
                            <td style="text-align: center; white-space: nowrap;">
                                <button onclick="window.openAccordion(${dbId}, 'view')" style="border:none; background:transparent; cursor:pointer; font-size:1.2rem; margin-right:5px;" title="Anzeigen">👁️</button>
                                <button onclick="window.openAccordion(${dbId}, 'edit')" style="border:none; background:transparent; cursor:pointer; font-size:1.2rem;" title="Bearbeiten">✏️</button>
                            </td>
                        </tr>`;
                    }

                    // --- NEU: Verknüpfte KPIs filtern und interaktive Steuerleiste bauen ---
                    const myKpis = kpiList.filter(k => k.thema === row.thema && k.unterthema === row.unterthema);
                    
                    let kpiBadgeHtml = '<div style="margin-bottom: 20px; display: flex; flex-wrap: wrap; gap: 8px; align-items: center; background: #fff; padding: 10px; border-radius: 6px; border: 1px dashed #ccc;">';
                    kpiBadgeHtml += '<strong style="font-size:0.85rem; color:#7f8c8d; text-transform:uppercase; margin-right:5px;">📊 Verknüpfte KPIs:</strong>';
                    
                    if (myKpis.length > 0) {
                        myKpis.forEach(k => {
                            // Badge mit eingebautem Löschen-Button (✖)
                            kpiBadgeHtml += `
                            <span style="background: #e8f4f8; border: 1px solid #3498db; color: #2980b9; padding: 4px 10px; border-radius: 12px; font-size: 0.8rem; display: inline-flex; align-items: center; gap: 6px;">
                                ${k.kpi_name} (${k.einheit})
                                <button type="button" onclick="window.deleteLinkedKpi(${k.id})" style="background:transparent; border:none; color:#e74c3c; cursor:pointer; font-size: 0.9rem; padding: 0; line-height: 1;" title="Verknüpfung lösen">✖</button>
                            </span>`;
                        });
                    } else {
                        kpiBadgeHtml += '<em style="font-size:0.85rem; color:#bdc3c7; margin-right: 10px;">Noch keine messbaren KPIs verknüpft.</em>';
                    }

                    // Der interaktive Button, um direkt aus der Analyse einen KPI anzulegen!
                    kpiBadgeHtml += `<button type="button" onclick="window.openAddKpiModal('${row.thema}', '${row.unterthema}')" style="background:#18bc9c; color:white; border:none; padding:5px 12px; border-radius:12px; cursor:pointer; font-size:0.8rem; margin-left:auto; font-weight:bold; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">➕ KPI anlegen</button>`;
                    kpiBadgeHtml += '</div>';

                    // === DAS ACCORDION ===
                    // Dynamischer Colspan: Impact hat 6 Spalten, Financial hat 5 Spalten
                    const colSpan = window.currentMatTab === 'Impact' ? '6' : '5';
                    html += `<tr id="accordion_${dbId}" class="accordion-content" style="display:none; background-color: #fcfcfc;">
                                <td colspan="${colSpan}" style="padding: 20px; border-bottom: 2px solid ${markerColor};">`;
                    
                    // KPIs ganz oben im Accordion einfügen
                    html += kpiBadgeHtml;

                    if (window.currentMatTab === 'Impact') {
                        html += `
                            <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 15px; margin-bottom: 15px;">
                                <label>EW (%): <input type="number" id="inp_ew_${dbId}" min="0" max="100" placeholder="0-100" value="${row.ew||''}" oninput="window.calcErgebnis(${dbId}, 'Impact')" style="width:100%; padding:8px;"></label>
                                <label>Ausmaß (1-5): <input type="number" id="inp_aus_${dbId}" min="1" max="5" value="${row.aus||''}" style="width:100%; padding:8px;"></label>
                                <label>Umfang (1-5): <input type="number" id="inp_umf_${dbId}" min="1" max="5" value="${row.umf||''}" style="width:100%; padding:8px;"></label>
                                <label>Irreversibilität: <input type="number" id="inp_irr_${dbId}" min="1" max="5" value="${row.irr||''}" style="width:100%; padding:8px;"></label>
                                <label style="color:#2980b9;">Ergebnis (Punkte): <input type="number" id="inp_erg_${dbId}" readonly value="${row.erg||''}" style="width:100%; padding:8px; background:#e8f4f8; font-weight:bold; border:1px solid #3498db;"></label>
                            </div>
                            <label>Erläuterung zur Bewertung:</label>
                            <textarea id="inp_erl_${dbId}" style="width:100%; height: 60px; padding:8px; margin-bottom: 15px;">${row.erlaeuterung||''}</textarea>
                            <label>Verantwortlich:</label>
                            <select id="inp_verant_${dbId}" style="width:100%; padding:8px;">${userOptions}</select>
                        `;
                    } else {
                        html += `
                            <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 15px; margin-bottom: 15px;">
                                <label>Kurzfr. EW (%): <input type="number" id="inp_ewk_${dbId}" min="0" max="100" placeholder="0-100" value="${row.ewk||''}" oninput="window.calcErgebnis(${dbId}, 'Financial')" style="width:100%; padding:8px;"></label>
                                <label>Mittelfr. EW (%): <input type="number" id="inp_ewm_${dbId}" min="0" max="100" placeholder="0-100" value="${row.ewm||''}" oninput="window.calcErgebnis(${dbId}, 'Financial')" style="width:100%; padding:8px;"></label>
                                <label>Langfr. EW (%): <input type="number" id="inp_ewl_${dbId}" min="0" max="100" placeholder="0-100" value="${row.ewl||''}" oninput="window.calcErgebnis(${dbId}, 'Financial')" style="width:100%; padding:8px;"></label>
                                <label>Fin. Ausmaß (1-5): <input type="number" id="inp_fin_aus_${dbId}" min="1" max="5" value="${row.fin_aus||''}" style="width:100%; padding:8px;"></label>
                                <label style="color:#2980b9;">Ergebnis (Punkte): <input type="number" id="inp_erg_${dbId}" readonly value="${row.erg||''}" style="width:100%; padding:8px; background:#e8f4f8; font-weight:bold; border:1px solid #3498db;"></label>
                            </div>
                            <label>Erläuterung zur Bewertung:</label>
                            <textarea id="inp_erl_${dbId}" style="width:100%; height: 60px; padding:8px; margin-bottom: 15px;">${row.erlaeuterung||''}</textarea>
                            <label>Verantwortlich:</label>
                            <select id="inp_verant_${dbId}" style="width:100%; padding:8px;">${userOptions}</select>
                        `;
                    }

                    html += `
                            <div style="margin-top: 15px; display: flex; gap: 10px;">
                                <button id="saveBtn_${dbId}" onclick="window.saveAssessment(${dbId}, '${window.currentMatTab}')" class="submit-btn" style="padding: 10px 20px; background:#34495e; border:none; color:white;">💾 Bewertung speichern</button>
                                <button onclick="window.closeAccordion(${dbId})" style="padding: 10px 20px; background: transparent; border: 1px solid #ccc; cursor: pointer;">Zuklappen</button>
                            </div>
                        </td></tr>
                    `;
                });
                tbody.innerHTML = html;
                
                rows.forEach(r => {
                    const sel = document.getElementById(`inp_verant_${r.id}`);
                    if(sel && r.verantwortlich) sel.value = r.verantwortlich;
                });
            });
        }); // HIER WAR DIE FEHLENDE KLAMMER!
    });
};

// --- NEUE ACCORDION LOGIK ---

window.openAccordion = function(id, mode) {
    const row = document.getElementById(`accordion_${id}`);
    const saveBtn = document.getElementById(`saveBtn_${id}`);
    const inputs = row.querySelectorAll('input, select, textarea');

    if (row.style.display === 'none') {
        row.style.display = 'table-row';
    } else if (row.dataset.mode === mode) {
        row.style.display = 'none';
        return;
    }
    
    row.dataset.mode = mode;

    if (mode === 'view') {
        inputs.forEach(inp => inp.disabled = true);
        if (saveBtn) saveBtn.style.display = 'none';
    } else {
        inputs.forEach(inp => inp.disabled = false);
        if (saveBtn) saveBtn.style.display = 'block';
        
        const ergInput = document.getElementById(`inp_erg_${id}`);
        if (ergInput) ergInput.readOnly = true;
    }
};

window.closeAccordion = function(id) {
    document.getElementById(`accordion_${id}`).style.display = 'none';
};

// --- LOGIK & UMRECHNUNG ---

window.saveQuickDesc = function(id, text) {
    window.db.run(`UPDATE csrd_assessments SET beschreibung = ? WHERE id = ?`, [text, id], (err) => {
        if (!err) window.showStatus("Beschreibung gespeichert", "success");
    });
};

window.saveQuickArt = function(id, artValue) {
    window.db.run(`UPDATE csrd_assessments SET art = ? WHERE id = ?`, [artValue, id], (err) => {
        if (!err) window.showStatus("Art erfolgreich aktualisiert!", "success");
    });
};

// NEU: Rechnet Prozentwerte intelligent in Punkte (1, 2 oder 3) um
window.calcErgebnis = function(id, type) {
    const convertPercentToPoints = (percentValue) => {
        if (isNaN(percentValue) || percentValue === '') return 0;
        if (percentValue <= 33) return 1;
        if (percentValue <= 66) return 2;
        return 3;
    };

    if (type === 'Impact') {
        const ewPercent = parseFloat(document.getElementById(`inp_ew_${id}`).value);
        const points = convertPercentToPoints(ewPercent);
        document.getElementById(`inp_erg_${id}`).value = points;
    } else {
        const ewkPercent = parseFloat(document.getElementById(`inp_ewk_${id}`).value);
        const ewmPercent = parseFloat(document.getElementById(`inp_ewm_${id}`).value);
        const ewlPercent = parseFloat(document.getElementById(`inp_ewl_${id}`).value);
        
        // Wir nehmen den höchsten Prozent-basierten Punktewert (Maximal 3)
        const maxPoints = Math.max(
            convertPercentToPoints(ewkPercent), 
            convertPercentToPoints(ewmPercent), 
            convertPercentToPoints(ewlPercent)
        );
        document.getElementById(`inp_erg_${id}`).value = maxPoints;
    }
};

window.saveAssessment = function(id, type) {
    const erg = parseFloat(document.getElementById(`inp_erg_${id}`).value) || 0;
    const isWesentlich = erg >= 3 ? 1 : 0;
    const erl = document.getElementById(`inp_erl_${id}`).value;
    const verant = document.getElementById(`inp_verant_${id}`).value;

    if (type === 'Impact') {
        const ew = document.getElementById(`inp_ew_${id}`).value; // Wir speichern weiterhin den originalen %-Wert!
        const aus = document.getElementById(`inp_aus_${id}`).value;
        const umf = document.getElementById(`inp_umf_${id}`).value;
        const irr = document.getElementById(`inp_irr_${id}`).value;

        window.db.run(`UPDATE csrd_assessments SET ew=?, aus=?, umf=?, irr=?, erg=?, erlaeuterung=?, verantwortlich=?, is_wesentlich=? WHERE id=?`,
            [ew, aus, umf, irr, erg, erl, verant, isWesentlich, id], (err) => {
                if(!err) { window.showStatus("Impact gespeichert!", "success"); window.closeAccordion(id); window.loadMaterialityAnalysis(); }
            });
    } else {
        const ewk = document.getElementById(`inp_ewk_${id}`).value;
        const ewm = document.getElementById(`inp_ewm_${id}`).value;
        const ewl = document.getElementById(`inp_ewl_${id}`).value;
        const aus = document.getElementById(`inp_fin_aus_${id}`).value;
        const kenn = document.getElementById(`inp_kennzahlen_${id}`).value;

        window.db.run(`UPDATE csrd_assessments SET ewk=?, ewm=?, ewl=?, fin_aus=?, erg=?, erlaeuterung=?, verantwortlich=?, kennzahlen=?, is_wesentlich=? WHERE id=?`,
            [ewk, ewm, ewl, aus, erg, erl, verant, kenn, isWesentlich, id], (err) => {
                if(!err) { window.showStatus("Financial gespeichert!", "success"); window.closeAccordion(id); window.loadMaterialityAnalysis(); }
            });
    }
};

// --- HILFE MODAL LOGIK ---

window.openHelpModal = function() {
    const title = document.getElementById('helpModalTitle');
    const content = document.getElementById('helpModalContent');

    if (window.currentMatTab === 'Impact') {
        title.innerHTML = "🌍 Hilfe: Impact Materiality (Inside-Out)";
        content.innerHTML = `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px;">
        <div>
        <h2>Allgemeine Informationen zur Bewertung nach ESRS 1</h2>
        <h3>Auswirkungen (Impact Materiality)</h3>
            <p>Bewertung der Wesentlichkeit schließt folgende Dimensionen ein:</p>
            <ul style="margin-left: 20px; margin-top: 10px; margin-bottom: 15px;">
                <li style="margin-bottom: 5px;">Tatsächlich oder Potenziell</li>
                <li style="margin-bottom: 5px;">Positiv oder Negativ</li>
                <li style="margin-bottom: 5px;">Auswirkungen auf Menschen und Umwelt</li>
                <li style="margin-bottom: 5px;">Kurz-, Mittel- und Langfristige Zeiträume</li>
            </ul>
            <div style="background: #e8f4f8; border-left: 4px solid #3498db; padding: 10px; border-radius: 0 4px 4px 0;">
                <strong>Ablauf:</strong>
                <ol style="margin-left: 20px; margin-top: 10px;">
                    <li>Kontext in Bezug zu Auswirkungen erkennen (Aktivitäten, Beziehungen, Stakeholder, …)</li>
                    <li>Tatsächliche und potenzielle Auswirkungen identifizieren (in Einbeziehung der Stakeholder und Experten)</li>
                    <li>Auswirkungen bewerten (siehe unten, Einbeziehung Stakeholder und Experten)</li>
                    <li>Wesentliche Auswirkungen ermitteln (Wesentlichkeitskriterien)</li>
                </ol>
            </div>
             <div style="background: #e8f4f8; border-left: 4px solid #3498db; padding: 10px; border-radius: 0 4px 4px 0;">
                <strong>Bewertungen von Auswirkungen:</strong>
                <ul style="margin-left: 20px; margin-top: 10px;">
                    <li><u>Wahrscheinlichkeit</u> des Auftretens (bei tatsächlichen Auswirkungen wird dieser Wert auf 100% gesetzt)</li>
                    <li><u>Schweregrad der Auswirkung:</u> Dieser stellt sich zusammen aus Ausmaß (wie schwerwiegend?), Umfang (wie weit verbreitet?) und bei negativen Auswirkungen die Irreversibilität (wie unumkehrbar sind die Auswirkungen?)</li>
                </ul>
                <p>Bei potenziellen negativen menschenrechtsbezogenen Auswirkungen hat der Schweregrad eine größere Bedeutung als die Wahrscheinlichkeit (die Eintrittswahrscheinlichkeit wird auf 100 % gesetzt)</p>
            </div>
            </div>
            <div>
            <h2>Anwendung der Bewertung</h2>
            <p>Die Wesentlichkeit eines Nachhaltigkeitsthemas wird in den folgenden Kategorien beurteilt:</p>
            <ul style="margin-left: 20px; margin-top: 10px; margin-bottom: 15px;">
                <li style="margin-bottom: 5px;">Positive Auswirkungen des Unternehmens auf das Thema</li>
                <li style="margin-bottom: 5px;">Negative Auswirkungen des Unternehmens auf das Thema</li>
                <li style="margin-bottom: 5px;">Chancen, die sich aus dem Thema für das Unternehmen ergeben</li>
                <li style="margin-bottom: 5px;">Risiken, die sich durch das Thema für das Unternehmen ergeben</li>
            </ul>
            <div style="background: #e8f4f8; border-left: 4px solid #3498db; padding: 10px; border-radius: 0 4px 4px 0;">
                <strong>Ablauf:</strong>
                <ol style="margin-left: 20px; margin-top: 10px;">
                    <li>Zu jedem Thema werden potentielle oder tatsächliche Auswirkungen, sowie Risiken und Chancen ermittelt.</li>
                    <li>Jedes Thema wird anhand der einzelnen Bewertungskritereien auf einer 5-Punkte Skala bewertet (siehe Erklärungen in den jew. Zellen)</li>
                    <li>Es wird ein Wesentlichkeitskriterium je Kategorie festgelegt. Liegt die Summe der Einzelkriterien über Diesem, gilt das Thema als wesentlich.</li>
                    <li>Die wesentlichen Themen werden mit "JA" und farblich rot markiert. </li>
                </ol>
            </div>
            </div>
         </div>   
        `;
    } else {
        title.innerHTML = "💰 Hilfe: Financial Materiality (Outside-In)";
        content.innerHTML = `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px;">
        <div>
            <h2>Allgemeine Informationen zur Bewertung nach ESRS 1</h2>
            <h3>Risiken und Chancen (Financial Materiality)</h3>
            <p>Bewertung der Wesentlichkeit schließt folgende Dimensionen ein:</p>
            <ul style="margin-left: 20px; margin-top: 10px; margin-bottom: 15px;">
                <li style="margin-bottom: 5px;">Abhängigkeit von natürlichen, sozialen oder finanziellen Ressourcen</li>
                <li style="margin-bottom: 5px;">Risiken aufgrund von negativen Auswirkungen des Unternehmens</li>
                <li style="margin-bottom: 5px;">Risiken, die auf die Stakeholder, z.B. die Lieferkette, wirken und indirekt das Unternehmen betreffen</li>
            </ul>
            <div style="background: #e8f4f8; border-left: 4px solid #3498db; padding: 10px; border-radius: 0 4px 4px 0;">
                <strong>Ablauf:</strong>
                <ol style="margin-left: 20px; margin-top: 10px;">
                    <li>Kontext in Bezug zu Risiken und Chancen erkennen (Aktivitäten, Beziehungen, Stakeholder, …)</li>
                    <li>Risiken und Chancen identifizieren (Abhängigkeit von Ressourcen, Auswirkung dieser Abhängigkeiten)</li>
                    <li>Risiken und Chancen bewerten (siehe unten, Einbeziehung Stakeholder und Experten)</li>
                    <li>Wesentliche Auswirkungen ermitteln (Wesentlichkeitskriterien)</li>
                </ol>
            </div>
             <div style="background: #e8f4f8; border-left: 4px solid #3498db; padding: 10px; border-radius: 0 4px 4px 0;">
                <strong>Bewertungen von Risiken und Chancen:</strong>
                <ul style="margin-left: 20px; margin-top: 10px;">
                    <li><u>Wahrscheinlichkeit</u> , unterteilt in kurz-, mittel- und langfristige Eintrittswahrscheinlichkeit.</li>
                    <li><u>Schweregrad</u> der finanziellen Effekte (positiv oder negativ)</li>
                </ul>
            </div>
            </div>
             <div>
             <h2>Anwendung der Bewertung</h2>
            <p>Die Wesentlichkeit eines Nachhaltigkeitsthemas wird in den folgenden Kategorien beurteilt:</p>
            <ul style="margin-left: 20px; margin-top: 10px; margin-bottom: 15px;">
                <li style="margin-bottom: 5px;">Positive Auswirkungen des Unternehmens auf das Thema</li>
                <li style="margin-bottom: 5px;">Negative Auswirkungen des Unternehmens auf das Thema</li>
                <li style="margin-bottom: 5px;">Chancen, die sich aus dem Thema für das Unternehmen ergeben</li>
                <li style="margin-bottom: 5px;">Risiken, die sich durch das Thema für das Unternehmen ergeben</li>
            </ul>
            <div style="background: #e8f4f8; border-left: 4px solid #3498db; padding: 10px; border-radius: 0 4px 4px 0;">
                <strong>Ablauf:</strong>
                <ol style="margin-left: 20px; margin-top: 10px;">
                    <li>Zu jedem Thema werden potentielle oder tatsächliche Auswirkungen, sowie Risiken und Chancen ermittelt.</li>
                    <li>Jedes Thema wird anhand der einzelnen Bewertungskritereien auf einer 5-Punkte Skala bewertet (siehe Erklärungen in den jew. Zellen)</li>
                    <li>Es wird ein Wesentlichkeitskriterium je Kategorie festgelegt. Liegt die Summe der Einzelkriterien über Diesem, gilt das Thema als wesentlich.</li>
                    <li>Die wesentlichen Themen werden mit "JA" und farblich rot markiert. </li>
                </ol>
            </div>
            </div>
            </div>
        `;
    }

    document.getElementById('helpModal').style.display = 'flex';
};

window.closeHelpModal = function() {
    document.getElementById('helpModal').style.display = 'none';
};