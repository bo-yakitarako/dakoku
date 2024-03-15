import { BrowserWindow, ipcMain } from 'electron';
import icon from '../../resources/icon.png?asset';
import { join } from 'path';
import { is } from '@electron-toolkit/utils';
import { getMonthWorkTime } from './store';

let mainWindow: BrowserWindow;
let _calendarWindow: BrowserWindow | null = null;
export const createCalendarWindow = () => {
  const calendarWindow = new BrowserWindow({
    width: 800,
    height: 730,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
    },
  });
  _calendarWindow = calendarWindow;

  calendarWindow.on('ready-to-show', () => {
    calendarWindow.show();
  });

  calendarWindow.on('closed', () => {
    mainWindow.webContents.send('closedCalendar');
    _calendarWindow = null;
  });

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    calendarWindow.loadURL(`${process.env['ELECTRON_RENDERER_URL']}/calendar.html`);
  } else {
    calendarWindow.loadFile(join(__dirname, '../renderer/calendar.html'));
  }
};

export const setMainWindow = (window: BrowserWindow) => {
  mainWindow = window;
};

export const closeCalendarWindow = () => {
  _calendarWindow?.close();
  _calendarWindow = null;
};

// @ts-ignore
ipcMain.handle('getMonthWorkTime', async (event, year: number, month: number) =>
  getMonthWorkTime(year, month),
);
