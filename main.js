const { app, BrowserWindow, ipcMain, nativeImage, Menu } = require('electron');
const path = require('path');
const fs = require('fs');

app.name = "CSRD Manager";
function createMenu() {
    const isMac = process.platform === 'darwin';

    const template = [
        ...(isMac ? [{
            label: app.name,
            submenu: [
                { 
                    label: 'Über CSRD Manager', 
                    click: () => {
                        const { dialog } = require('electron');
                        dialog.showMessageBox({
                            type: 'info',
                            title: 'Über dieses Programm',
                            message: 'CSRD & ESRS Manager v1.7.0',
                            detail: 'Ein Tool zur Wesentlichkeitsanalyse und KPI-Erfassung.\n\nEntwickelt für den Probelauf 2026.',
                            icon: path.join(__dirname, 'assets/logo.png') // Dein Logo im Dialog
                        });
                    }
                },
                { type: 'separator' },
                { role: 'services' },
                { type: 'separator' },
                { role: 'hide' },
                { role: 'hideOthers' },
                { role: 'unhide' },
                { type: 'separator' },
                { role: 'quit', label: 'Beenden' }
            ]
        }] : []),
        // Bearbeiten-Menü (Wichtig für Copy & Paste!)
        {
            label: 'Bearbeiten',
            submenu: [
                { role: 'undo', label: 'Rückgängig' },
                { role: 'redo', label: 'Wiederholen' },
                { type: 'separator' },
                { role: 'cut', label: 'Ausschneiden' },
                { role: 'copy', label: 'Kopieren' },
                { role: 'paste', label: 'Einfügen' },
                { role: 'selectAll', label: 'Alles auswählen' }
            ]
        },
        // Ansicht-Menü (Hilfreich zum Debuggen)
        {
            label: 'Ansicht',
            submenu: [
                { role: 'reload', label: 'Neu laden' },
                { role: 'forceReload', label: 'Erzwungenes neu laden' },
                { role: 'toggleDevTools', label: 'Entwicklertools öffnen' },
                { type: 'separator' },
                { role: 'resetZoom', label: 'Zoom zurücksetzen' },
                { role: 'zoomIn', label: 'Vergrößern' },
                { role: 'zoomOut', label: 'Verkleinern' },
                { type: 'separator' },
                { role: 'togglefullscreen', label: 'Vollbild' }
            ]
        }
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
}

function createWindow() {
    const win = new BrowserWindow({
        width: 1600,
        height: 1200,
        icon: path.join(__dirname, 'assets/web-app-manifest-512x512.png'),
        webPreferences: {
            nodeIntegration: true, 
            contextIsolation: false
        }
    });
    // --- SPEZIELL FÜR MACOS DOCK ICON ---
    if (process.platform === 'darwin') {
        const image = nativeImage.createFromPath(path.join(__dirname, 'assets/web-app-manifest-512x512.png'));
        app.dock.setIcon(image);
    }
    win.loadFile('index.html');
}

// --- BACKUP LOGIK ---
ipcMain.on('create-db-backup', (event, type) => {
    const dbPath = path.join(__dirname, 'esg_data.db');
    const backupDir = path.join(__dirname, 'backups');
    
    // Zeitstempel für den Dateinamen
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    
    // Unterscheidung zwischen automatischem Backup und manuellem Audit-Freeze
    const prefix = type === 'audit' ? 'AUDIT_FREEZE_' : 'esg_data_backup_';
    const backupName = `${prefix}${timestamp}.db`;
    const backupPath = path.join(backupDir, backupName);

    try {
        if (!fs.existsSync(dbPath)) {
            event.reply('backup-finished', { success: false, error: "Datenbankdatei nicht gefunden." });
            return;
        }

        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir);
        }

        // 1. Das Backup erstellen
        fs.copyFileSync(dbPath, backupPath);
        console.log(`✅ Backup erstellt: ${backupName}`);

        // 2. AUFRÄUMEN (Nur für normale Backups, Audit-Files bleiben zur Sicherheit erhalten)
        if (type !== 'audit') {
            const files = fs.readdirSync(backupDir)
                .filter(file => file.startsWith('esg_data_backup_')) 
                .map(file => ({
                    name: file,
                    time: fs.statSync(path.join(backupDir, file)).mtime.getTime()
                }))
                .sort((a, b) => b.time - a.time);

            if (files.length > 10) {
                files.slice(10).forEach(file => {
                    fs.unlinkSync(path.join(backupDir, file.name));
                    console.log(`🗑️ Altes Backup gelöscht: ${file.name}`);
                });
            }
        }

        event.reply('backup-finished', { 
            success: true, 
            path: backupPath, 
            fileName: backupName,
            isAudit: type === 'audit'
        });
    } catch (err) {
        console.error("❌ Backup-Fehler:", err);
        event.reply('backup-finished', { success: false, error: err.message });
    }
});
ipcMain.on('save-report-file', (event, { htmlContent, fileName }) => {
    const reportDir = path.join(__dirname, 'exports');
    if (!fs.existsSync(reportDir)) fs.mkdirSync(reportDir);

    const filePath = path.join(reportDir, fileName);
    
    // Speichert den Bericht als HTML-Datei (einfachste Form für PDF-Druck/Archiv)
    fs.writeFileSync(filePath, htmlContent, 'utf8');
    
    event.reply('report-saved', { success: true, path: filePath, fileName: fileName });
});

app.whenReady().then(() => {
  createMenu();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMenu();
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});