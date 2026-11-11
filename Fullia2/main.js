const path = require('path');
const { app, BrowserWindow, ipcMain, shell } = require('electron');
const cfg = require('./src/config');
const auth = require('./src/auth');
const launcher = require('./src/launcher');
const { queryServer } = require('./src/status');

let win;

function createWindow() {
  win = new BrowserWindow({
    width: 1280,
    height: 720,
    minWidth: 960,
    minHeight: 540,
    useContentSize: true,
    frame: false, // своя рамка с кнопками в стиле лаунчера
    autoHideMenuBar: true,
    backgroundColor: '#b79cf5',
    title: 'FulliaCraft Launcher',
    icon: path.join(__dirname, 'renderer', 'assets', 'icon.png'),
    webPreferences: { preload: path.join(__dirname, 'preload.js') },
  });
  win.setAspectRatio(16 / 9);
  win.loadFile(path.join(__dirname, 'renderer', 'index.html'));
}

app.whenReady().then(() => {
  const onWin = (fn) => () => { if (win && !win.isDestroyed()) fn(win); };
  ipcMain.on('win:min', onWin((w) => w.minimize()));
  ipcMain.on('win:max', onWin((w) => (w.isMaximized() ? w.unmaximize() : w.maximize())));
  ipcMain.on('win:close', onWin((w) => w.close()));

  ipcMain.handle('app:info', () => ({
    brand: cfg.brand,
    mc: cfg.minecraftVersion,
    server: cfg.server,
    news: cfg.news,
    discord: { requireVerification: cfg.discord.requireVerification },
  }));
  ipcMain.handle('link:open', (_e, name) => {
    const url = cfg.links[name];
    if (url) shell.openExternal(url);
    return !!url;
  });
  ipcMain.handle('status:get', () => queryServer(cfg.server.host, cfg.server.port));

  ipcMain.handle('auth:login', (_e, u, p) => auth.login(u, p));
  ipcMain.handle('auth:register', (_e, u, p) => auth.register(u, p));
  ipcMain.handle('auth:logout', () => auth.logout());
  ipcMain.handle('auth:session', () => auth.getSession());
  ipcMain.handle('discord:check', () => auth.checkDiscord());

  ipcMain.handle('game:launch', async () => {
    const session = auth.getSession();
    if (!session) throw new Error('Сначала войди в аккаунт.');
    if (cfg.discord.requireVerification && !(session.discord && session.discord.verified)) {
      throw new Error('Подтверди аккаунт через Discord-бота (раздел «Профиль»).');
    }
    await launcher.launch(session, (ev) => {
      if (win && !win.isDestroyed()) win.webContents.send('game:event', ev);
    });
  });

  createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
