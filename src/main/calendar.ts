import { BrowserWindow, ipcMain } from 'electron';
import icon from '../../resources/icon.png?asset';
import { join } from 'path';
import { is } from '@electron-toolkit/utils';
import { getMonthWorkTime, getWindowBounds, setWindowBounds } from './store';
import dayjs from 'dayjs';

let mainWindow: BrowserWindow;
let _calendarWindow: BrowserWindow | null = null;
export const createCalendarWindow = () => {
  const windowBounds = getWindowBounds('calendar');
  const calendarWindow = new BrowserWindow({
    ...windowBounds,
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

  calendarWindow.on('close', () => {
    mainWindow.webContents.send('closedCalendar');
    setWindowBounds(calendarWindow, 'calendar');
  });

  calendarWindow.on('closed', () => {
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

type Res = { error: string } | { date: string; name: string; type: string }[];
// @ts-ignore
ipcMain.handle('getHolidays', async (e, year: number, month: number) => {
  const url = `https://api.national-holidays.jp/${year}/${`${month}`.padStart(2, '0')}`;
  const res: Res = await (await fetch(url)).json();
  if ('error' in res) {
    return [];
  }
  return res.map(({ date, name }) => ({
    day: dayjs(date).date(),
    name,
  }));
});
