window.handleLogin = function() {
    const u = document.getElementById('loginUser').value;
    const p = document.getElementById('loginPass').value;
    
    window.db.get(`SELECT * FROM users WHERE username = ? AND password = ?`, [u, p], (err, row) => {
        const errBox = document.getElementById('loginError');
        
        if(row) { 
            // SONDERSCHUTZ: Wenn Login-Ziel "Administration" ist, MUSS er superuser sein!
            if (window.loginTarget === 'admin' && row.role !== 'superuser') {
                errBox.innerText = "Zugriff verweigert! Nur für Superuser.";
                errBox.style.display = 'block';
                return;
            }
            
            // Alles okay, Login durchführen
            window.currentUser = row; 
            errBox.style.display = 'none';
            document.getElementById('loginUser').value = ''; // Felder leeren
            document.getElementById('loginPass').value = '';
            
            window.launchApp(); // Startet den Hauptteil der App
            
        } else { 
            errBox.innerText = "Falscher Benutzername oder Passwort.";
            errBox.style.display = 'block'; 
        }
    });
};

window.handleLogout = function() { 
    window.currentUser = null; 
    window.loginTarget = '';
    // location.reload() lädt die App komplett frisch, 
    // wodurch automatisch wieder der Startbildschirm mit den 2 Buttons erscheint!
    location.reload(); 
};


window.updateAdminView = function() {
    const sw = document.getElementById('moduleSwitches');
    if(sw) {
        sw.innerHTML = `<label><input type="checkbox" ${window.appSettings.useUserManagement ? 'checked' : ''} onchange="toggleModule('useUserManagement', this.checked)"> Usermanagement aktiv</label>`;
    }

    window.db.all(`SELECT * FROM users WHERE role != 'superuser'`, [], (err, users) => {
        const tbody = document.getElementById('userTableBody');
        if(!tbody) return;
        tbody.innerHTML = '';
        const allCats = [...new Set(window.alleKPIs.map(k => k.kategorie))];

        if(users) users.forEach(u => {
            window.db.all(`SELECT category FROM permissions WHERE username = ?`, [u.username], (err, perms) => {
                const pList = perms ? perms.map(p => p.category) : [];
                tbody.innerHTML += `
                    <tr>
                        <td>${u.username} (${u.role})</td>
                        <td>
                            <select onchange="addPerm('${u.username}', this.value)"><option value="">+ Kat. zuweisen</option>
                            ${allCats.map(c => `<option value="${c}">${c}</option>`).join('')}</select>
                        </td>
                        <td>${pList.map(p => `<span class="badge">${p} <b onclick="remPerm('${u.username}','${p}')" style="cursor:pointer">×</b></span>`).join(' ')}</td>
                        <td><button onclick="delUser('${u.username}')" style="background:#e74c3c; color:white; border:none; padding:5px 10px; cursor:pointer;">Löschen</button></td>
                    </tr>`;
            });
        });
    });
};

window.toggleModule = function(key, val) {
    window.db.run(`REPLACE INTO app_settings (key, value) VALUES (?, ?)`, [key, val?1:0], () => location.reload());
};

window.createUser = function() {
    const n = document.getElementById('newUserName').value;
    const p = document.getElementById('newUserPass').value;
    const r = document.getElementById('newUserRole').value;
    if(n && p) window.db.run(`INSERT INTO users (username, password, role) VALUES (?, ?, ?)`, [n, p, r], () => window.updateAdminView());
};

window.addPerm = function(u, c) { if(c) window.db.run(`INSERT OR IGNORE INTO permissions (username, category) VALUES (?, ?)`, [u, c], () => window.updateAdminView()); };
window.remPerm = function(u, c) { window.db.run(`DELETE FROM permissions WHERE username = ? AND category = ?`, [u, c], () => window.updateAdminView()); };
window.delUser = function(u) { window.db.run(`DELETE FROM users WHERE username = ?`, [u], () => window.updateAdminView()); };