const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('fuerzaFitDesktop', {
  openDniWindow: () => ipcRenderer.send('open-dni-window'),
  closeDniWindow: () => ipcRenderer.send('close-dni-window'),
  submitDni: (dni) => ipcRenderer.send('dni-submitted', dni),
  onDniFromPopup: (callback) => ipcRenderer.on('dni-from-popup', (event, dni) => callback(dni))
});
