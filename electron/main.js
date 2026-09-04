const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow;
let dniWindow;
let serverProcess;

function startServer() {
  // En prod, el server ya está buildeado en dist/server.cjs
  // En dev, vite se encarga
  if (process.env.NODE_ENV === 'production') {
    const serverPath = path.join(__dirname, '../dist/server.cjs');
    serverProcess = spawn('node', [serverPath], {
      env: { ...process.env, PORT: '3000' },
      stdio: 'inherit'
    });
  }
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 700,
    backgroundColor: '#020617',
    title: 'FuerzaFit — Panel Gym (Escritorio)',
    icon: path.join(__dirname, '../public/assets/icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  const url = process.env.ELECTRON_START_URL || 'http://localhost:3000/admin';
  mainWindow.loadURL(url);

  mainWindow.on('closed', () => { mainWindow = null; });
}

function createDniWindow() {
  if (dniWindow) {
    dniWindow.focus();
    return;
  }
  dniWindow = new BrowserWindow({
    width: 420,
    height: 560,
    resizable: false,
    alwaysOnTop: true,
    backgroundColor: '#020617',
    title: 'Ingresá tu DNI — FuerzaFit',
    parent: mainWindow,
    modal: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true
    }
  });

  // Carga la misma app pero con un hash especial para mostrar solo el input DNI
  const baseUrl = process.env.ELECTRON_START_URL || 'http://localhost:3000';
  dniWindow.loadURL(`${baseUrl}/admin#dni-popup`);

  dniWindow.on('closed', () => { dniWindow = null; });
}

// IPC para abrir/cerrar ventana DNI desde el renderer (Admin panel)
ipcMain.on('open-dni-window', () => createDniWindow());
ipcMain.on('close-dni-window', () => { if (dniWindow) dniWindow.close(); });
ipcMain.on('dni-submitted', (event, dni) => {
  // Reenvía el DNI al proceso principal para que el admin lo valide
  if (mainWindow) {
    mainWindow.webContents.send('dni-from-popup', dni);
  }
  if (dniWindow) dniWindow.close();
});

app.whenReady().then(() => {
  startServer();
  setTimeout(createMainWindow, 1500); // espera a que vite/express arranque

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    if (serverProcess) serverProcess.kill();
    app.quit();
  }
});

app.on('before-quit', () => {
  if (serverProcess) serverProcess.kill();
});
