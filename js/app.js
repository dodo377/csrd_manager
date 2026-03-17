window.loginTarget = ''; // globaler Status, um zu wissen, ob wir in den Admin-Bereich oder normalen Bereich wollen

window.onload = async () => {
    await window.initDatabase();
    await loadSettings();

    const savedToken = localStorage.getItem('esg_token');
    const savedUser = localStorage.getItem('esg_last_user');

    if (savedToken && savedUser) {
        window.db.get(`SELECT * FROM users WHERE username = ? AND session_token = ?`, [savedUser, savedToken], (err, user) => {
            if (user && user.session_expires > Date.now()) {
                window.currentUser = user;
                window.loginTarget = 'app'; // Standardziel bei Auto-Login
                window.launchApp(true); // <--- TRUE verhindert Token-Neu-Generierung
            } else {
                window.showStartScreen();
            }
        });
    } else {
        window.showStartScreen();
    }
};

async function loadSettings() {
    return new Promise((resolve) => {
        window.db.all(`SELECT * FROM app_settings`, [], (err, rows) => {
            if(rows) rows.forEach(r => window.appSettings[r.key] = r.value);
            resolve();
        });
    });
}

// Zeigt den nackten Startbildschirm
window.showStartScreen = function() {
    document.getElementById('sidebar').style.display = 'none';
    document.getElementById('loginOverlay').style.display = 'none';
    document.getElementById('startScreen').style.display = 'flex';
    
    // Kleiner Info-Text für den Status
    const hint = document.getElementById('startScreenHint');
    if(window.appSettings.useUserManagement) {
        hint.innerText = "🔒 Usermanagement ist aktiv (Login erforderlich).";
    } else {
        hint.innerText = "🔓 Usermanagement inaktiv (Direktstart möglich).";
    }
};

window.startAppFlow = function() {
    window.loginTarget = 'app';
    if (window.appSettings.useUserManagement === '1') { // String-Check sicherheitshalber
        document.getElementById('startScreen').style.display = 'none';
        document.getElementById('loginOverlay').style.display = 'flex';
        document.getElementById('loginTitle').innerText = "Benutzer Login";
    } else {
        window.currentUser = { username: 'System-Gast', role: 'superuser' }; 
        document.getElementById('startScreen').style.display = 'none';
        
        // Titel für Gastmodus
        document.title = "CSRD Manager - Gastmodus";
        window.launchApp();
    }
};

// Klick auf "Administration"
window.startAdminFlow = function() {
    window.loginTarget = 'admin';
    // Admin erfordert IMMER einen Login, egal ob Usermanagement aktiv ist oder nicht!
    document.getElementById('startScreen').style.display = 'none';
    document.getElementById('loginOverlay').style.display = 'flex';
    document.getElementById('loginTitle').innerText = "⚙️ Superuser Login";
};


window.launchApp = async function(isAutoLogin = false) {
    if (!isAutoLogin && window.currentUser && window.currentUser.username) {
        const sessionDuration = 7 * 24 * 60 * 60 * 1000; 
        const expires = Date.now() + sessionDuration;
        const token = Math.random().toString(36).substring(2);

        window.db.run(`UPDATE users SET session_token = ?, session_expires = ? WHERE username = ?`, 
            [token, expires, window.currentUser.username]);

        localStorage.setItem('esg_token', token);
        localStorage.setItem('esg_last_user', window.currentUser.username);
    }

    // --- NEU: DYNAMISCHER FENSTERTITEL ---
    const roleText = window.currentUser.role === 'superuser' ? "Admin" : "User";
    document.title = `CSRD Manager - Eingeloggt als ${window.currentUser.username} (${roleText})`;

    // --- NEU: ANZEIGE IM DASHBOARD (falls Element vorhanden) ---
    const userDisplay = document.getElementById('display-username');
    if (userDisplay) {
        userDisplay.innerText = `${window.currentUser.username} (${roleText})`;
    }

    document.getElementById('loginOverlay').style.display = 'none';
    document.getElementById('startScreen').style.display = 'none';
    document.getElementById('sidebar').style.display = 'block';
    
    window.buildSidebar();
    
    if(window.loginTarget === 'admin') {
        window.showTab('adminArea');
    } else {
        window.showTab('unifiedDashboard');
    }
};

window.buildSidebar = function() {
    const nav = document.getElementById('navLinks');
    if(!nav) return;

    // Wir prüfen, ob Usermanagement aktiv ist ODER ob wir als Admin/Superuser eingeloggt sind
    // Wenn useUserManagement AUS ist, verhält sich das System wie ein "Superuser"
    const isAdmin = !window.appSettings.useUserManagement || 
                    (window.currentUser.role === 'admin' || window.currentUser.role === 'superuser');

    let html = '';

    // 1. Dashboard (Immer sichtbar)
    html += `<button class="nav-btn" onclick="showTab('unifiedDashboard', this)">📊 Dashboard</button>`;
    
    // 2. Wesentlichkeitsanalyse (Immer sichtbar)
    html += `<button class="nav-btn" onclick="showTab('wesentlichkeit', this)">🎯 Wesentlichkeitsanalyse</button>`;

    // 3. KPI-Stammdaten (Sichtbar für Admins oder wenn Usermanagement aus ist)
    if (isAdmin) {
        html += `<button class="nav-btn" onclick="showTab('stammdaten', this)">⚙️ KPI-Stammdaten</button>`;
    }

    // 4. Bericht (Texte) - Entspricht deiner Sektion 'narrativen'
    if (isAdmin) {
        html += `<button class="nav-btn" onclick="showTab('narrativen', this)">📝 Bericht (Texte)</button>`;
    }
    
    // 5. System-Admin (Nur wenn explizit über den Admin-Flow gestartet wurde)
    if (window.loginTarget === 'admin' && window.currentUser.role === 'superuser') {
        html += `<hr style="border: 0; border-top: 1px solid #3e4f5f; margin: 10px 0;">`;
        html += `<button class="nav-btn" style="background:#34495e; color:white;" onclick="showTab('adminArea', this)">👤 User-Verwaltung</button>`;
    }
    
    // 6. Logout / Beenden
    const btnText = window.appSettings.useUserManagement ? "🔒 Logout" : "🔙 Beenden";
    html += `<hr style="border: 0; border-top: 1px solid #3e4f5f; margin: 20px 0;">`;
    html += `<button class="nav-btn" style="color:#e74c3c; cursor:pointer;" onclick="window.handleLogout()">${btnText}</button>`;
    
    nav.innerHTML = html;
};

window.showTab = function(tabId, btnElement) {
    const target = document.getElementById(tabId);
    if(!target) {
        console.warn(`Achtung: HTML-Bereich mit der ID '${tabId}' nicht gefunden!`);
        return;
    }

    // 1. Alle Karten ausblenden, die gewählte einblenden
    document.querySelectorAll('.card').forEach(c => c.classList.remove('active'));
    target.classList.add('active');
    
    // 2. Button in der Sidebar optisch aktivieren
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    if(btnElement) btnElement.classList.add('active');
    
    // 3. SICHERES Laden der jeweiligen Daten
    try {
        if (tabId === 'adminArea' && typeof window.updateAdminView === 'function') window.updateAdminView();
        
        if (tabId === 'unifiedDashboard') {
    // Wir prüfen beide möglichen Namen, falls du dich beim Benennen umentschieden hast
    const generator = window.generateUnifiedTiles || window.generateDashboardTiles;
    
    if (typeof generator === 'function') {
        // Kurzes Timeout (50ms), damit der Tab-Wechsel im Browser abgeschlossen ist
        setTimeout(() => {
            generator();
        }, 50);
        
        const detailView = document.getElementById('esrsDetailView');
        if(detailView) detailView.style.display = 'none';
    } else {
        console.error("Dashboard-Generator Funktion nicht gefunden! Prüfe dashboard.js");
    }
}

        if (tabId === 'status' && typeof window.updateStatusView === 'function') window.updateStatusView();
        
        // Stammdaten (heißt je nach Version anders)
        if (tabId === 'stammdaten') {
            if (typeof window.updateStammdatenView === 'function') window.updateStammdatenView();
            else if (typeof window.loadKPIDataFromDB === 'function') window.loadKPIDataFromDB();
        }
        
        // CSRD Wesentlichkeit
        if (tabId === 'wesentlichkeit' && typeof window.loadMaterialityAnalysis === 'function') {
            window.loadMaterialityAnalysis();
        }
        // In window.showTab hinzufügen:
        if (tabId === 'narrativen' && typeof window.loadNarrative === 'function') {
            window.loadNarrative(); 
        }
        
    } catch (err) {
        console.error(`Fehler beim Laden der Inhalte für den Tab '${tabId}':`, err);
    }
};

window.showStatus = function(message, type = 'default') {
    const bar = document.getElementById('statusBar');
    const text = document.getElementById('statusText');
    if (!bar || !text) return;

    text.innerText = message;
    
    // Farben je nach Typ anpassen
    if (type === 'success') {
        bar.style.background = '#27ae60'; // Grün
    } else if (type === 'error') {
        bar.style.background = '#e74c3c'; // Rot
    } else if (type === 'progress') {
        bar.style.background = '#2980b9'; // Blau
    }

    // Nach 4 Sekunden wieder auf Standard zurücksetzen
    setTimeout(() => {
        bar.style.background = '#34495e';
        text.innerText = "System bereit.";
    }, 4000);
};
window.handleLogout = function() {
    if (window.currentUser) {
        window.db.run(`UPDATE users SET session_token = NULL, session_expires = NULL WHERE username = ?`, 
            [window.currentUser.username]);
    }
    document.title = "CSRD Manager";
    localStorage.clear();
    location.reload();
};