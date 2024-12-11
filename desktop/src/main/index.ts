import { app, shell, BrowserWindow, ipcMain } from 'electron';
import { join } from 'path';
import { electronApp, optimizer, is } from '@electron-toolkit/utils';
import icon from '../../resources/icon.png?asset';
import {
  deleteCurrentJob,
  initializeCurrentJob,
  getJobs,
  registerJob,
  registerWorks,
  renameCurrentJob,
  changeCurrentJob,
  getWindowBounds,
  setWindowBounds,
  getTodayWorks,
  setTimeState,
  getTimeState,
} from './store';
import { createCalendarWindow } from './calendar';
import { toURLParams } from '../commonUtility/utils';
import { TimeState } from '../preload/dataType';

async function createWindow() {
  const aho = true;
  if (aho) {
    const noConnectionWindow = new BrowserWindow({
      width: 320,
      height: 200,
      show: false,
      autoHideMenuBar: true,
    });
    noConnectionWindow.on('ready-to-show', () => noConnectionWindow.show());
    const loadURL =
      is.dev && process.env['ELECTRON_RENDERER_URL']
        ? `${process.env['ELECTRON_RENDERER_URL']}/noConnection.html`
        : `file://${join(__dirname, '../renderer/noConnection.html')}`;
    noConnectionWindow.loadURL(loadURL);
    return;
  }
  // Create the browser window.
  const windowBounds = getWindowBounds('main');
  const mainWindow = new BrowserWindow({
    ...windowBounds,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
    },
  });

  mainWindow.on('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('close', () => {
    setWindowBounds(mainWindow, 'main');
    ipcMain.removeHandler('openCalendar');
    app.quit();
  });

  ipcMain.handle('openCalendar', () => {
    createCalendarWindow(mainWindow);
  });

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: 'deny' };
  });

  const initialData = getTimeState();
  const paramString = toURLParams(initialData);

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(`${process.env['ELECTRON_RENDERER_URL']}/index.html?${paramString}`);
  } else {
    mainWindow.loadURL(`file://${join(__dirname, '../renderer/index.html')}?${paramString}`);
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron');

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });

  // IPC test
  ipcMain.on('ping', () => console.log('pong'));

  createWindow();

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.

ipcMain.handle('initializeCurrentJob', () => initializeCurrentJob());
ipcMain.handle('getJobs', () => getJobs());
// @ts-ignore
ipcMain.handle('registerJob', (e, jobName: string) => registerJob(jobName));
// @ts-ignore
ipcMain.handle('changeCurrentJob', (e, jobId: string) => changeCurrentJob(jobId));
// @ts-ignore
ipcMain.handle('renameCurrentJob', (e, jobName: string) => renameCurrentJob(jobName));
ipcMain.handle('deleteCurrentJob', () => deleteCurrentJob());

// @ts-ignore
ipcMain.handle('setTimeState', (e, timeState?: Partial<TimeState>) => setTimeState(timeState));

ipcMain.handle(
  'registerWorks',
  // @ts-ignore
  (e, works: number[][]) => registerWorks(works),
);

ipcMain.handle('getTodayWorks', () => getTodayWorks());
