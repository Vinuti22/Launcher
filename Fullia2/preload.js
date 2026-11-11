const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('launcherAPI', {
  info: () => ipcRenderer.invoke('app:info'),
  win: (action) => ipcRenderer.send('win:' + action),
  openLink: (name) => ipcRenderer.invoke('link:open', name),
  status: () => ipcRenderer.invoke('status:get'),
  login: (u, p) => ipcRenderer.invoke('auth:login', u, p),
  register: (u, p) => ipcRenderer.invoke('auth:register', u, p),
  logout: () => ipcRenderer.invoke('auth:logout'),
  getSession: () => ipcRenderer.invoke('auth:session'),
  checkDiscord: () => ipcRenderer.invoke('discord:check'),
  launch: () => ipcRenderer.invoke('game:launch'),
  onGameEvent: (cb) => ipcRenderer.on('game:event', (_e, ev) => cb(ev)),
});
