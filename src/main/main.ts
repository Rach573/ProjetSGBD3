import { app, BrowserWindow } from 'electron';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { registerRepositories } from './registerRepositories';
import dotenv from 'dotenv';
const PRELOAD_CANDIDATES = [
  join(__dirname, '../preload/preload.js'),
  join(__dirname, '../../.vite/preload/preload.js'),
];

dotenv.config();


function resolvePreloadPath(): string {
  for (const candidate of PRELOAD_CANDIDATES) {
    if (existsSync(candidate)) {
      return candidate;
    }
  }
  return PRELOAD_CANDIDATES[0];
}

function createWindow(): void {
  const preload = resolvePreloadPath();
  const window = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload,
      contextIsolation: true,
    },
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    void window.loadURL(process.env.VITE_DEV_SERVER_URL);
    window.webContents.openDevTools();
  } else {
    const indexPath = join(__dirname, '../../dist/index.html');
    void window.loadFile(indexPath);
  }
}

app.whenReady().then(() => {
  const repositories = registerRepositories();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') { 
    app.quit();
  }
});
