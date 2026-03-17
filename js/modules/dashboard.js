window.generateUnifiedTiles = window.generateDashboardTiles = function() {
    const container = document.getElementById('unifiedTileContainer');
    if(!container) return;
    if (!window.db) return;

    window.db.all(`SELECT thema, MAX(is_wesentlich) as wesentlich, MAX(erg) as maxScore 
                   FROM csrd_assessments 
                   GROUP BY thema 
                   ORDER BY thema`, [], (err, rows) => {
        
        if (err || !rows) return;
        container.innerHTML = '';

        // 1. "Alle anzeigen" Kachel
        const allTile = document.createElement('div');
        allTile.style = `
            background: #f8f9fa; border: 1px solid #ddd; cursor: pointer; 
            padding: 15px; border-radius: 8px; text-align: center;
            display: flex; flex-direction: column; align-items: center; justify-content: center;
            min-height: 110px; transition: transform 0.2s; box-shadow: 0 2px 4px rgba(0,0,0,0.05);`;
        allTile.onclick = () => window.updateDashboard(null);
        allTile.innerHTML = `<div style="font-size:22px;">📊</div><h3 style="font-size:0.8rem; margin:8px 0;">Alle anzeigen</h3>`;
        container.appendChild(allTile);
        
        // 2. Die 11 Themen-Kacheln aus der DB
        rows.forEach(row => { 
            const t = row.thema;
            const isWesentlich = (row.wesentlich === 1 || row.maxScore >= 3);
            const farbe = isWesentlich ? '#e74c3c' : '#bdc3c7';

            const tile = document.createElement('div');
            tile.style = `
                background: white; border: 1px solid #eee; border-top: 5px solid ${farbe}; 
                cursor: pointer; padding: 15px; border-radius: 8px; text-align: center;
                display: flex; flex-direction: column; align-items: center; justify-content: center;
                min-height: 110px; transition: all 0.2s; box-shadow: 0 2px 4px rgba(0,0,0,0.05);`;
            
            tile.onmouseover = () => { tile.style.transform = 'translateY(-3px)'; tile.style.boxShadow = '0 4px 10px rgba(0,0,0,0.1)'; };
            tile.onmouseout = () => { tile.style.transform = 'translateY(0)'; tile.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)'; };
            
            tile.onclick = () => window.updateDashboard(t);
            
            tile.innerHTML = `
                <div style="font-size:22px; margin-bottom:5px;">${window.iconMap[t] || "📋"}</div>
                <h3 style="font-size: 0.75rem; margin: 5px 0; color: #2c3e50; line-height:1.1;">${t}</h3>
                <div style="font-size: 0.6rem; color: ${farbe}; font-weight: bold; text-transform: uppercase; margin-top:auto;">
                    ${isWesentlich ? 'Wesentlich' : 'Nicht Wesentlich'}
                </div>`;
            container.appendChild(tile);
        });
    });
};

// Falls updateDashboard noch nicht existiert oder angepasst werden muss:
window.updateDashboard = function(selectedKat) {
    console.log("Ausgewähltes Thema:", selectedKat);
    
    // Detail-Ansicht einblenden
    const detailView = document.getElementById('esrsDetailView');
    if(detailView) detailView.style.display = 'block';
    
    const titleEl = document.getElementById('activeEsrsTitle');
    if(titleEl) titleEl.innerText = selectedKat || "Alle Themen";
    
    // Hier kannst du später deine Charts-Logik einfügen (window.loadCharts(selectedKat))
};