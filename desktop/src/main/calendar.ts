import { BrowserWindow, ipcMain } from 'electron';
import icon from '../../resources/icon.png?asset';
import { join } from 'path';
import { is } from '@electron-toolkit/utils';
import { getMonthWorkTime, getWindowBounds, setWindowBounds } from './store';
import dayjs from 'dayjs';
import { createDayDetailWindow } from './dayDetail';

export const createCalendarWindow = (mainWindow: BrowserWindow) => {
  const windowBounds = getWindowBounds('calendar');
  let calendarWindow: BrowserWindow | null = new BrowserWindow({
    ...windowBounds,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
    },
  });

  calendarWindow.on('ready-to-show', () => {
    calendarWindow?.show();
  });

  calendarWindow.on('close', () => {
    mainWindow.webContents.send('closedCalendar');
    setWindowBounds(calendarWindow!, 'calendar');
    ipcMain.removeHandler('openDayDetail');
  });

  calendarWindow.on('closed', () => {
    calendarWindow = null;
  });

  ipcMain.handle(
    'openDayDetail',
    // @ts-ignore
    async (e, year: number, month: number, day: number, isAll: boolean) => {
      createDayDetailWindow(calendarWindow!, year, month, day, isAll);
    },
  );

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    calendarWindow.loadURL(`${process.env['ELECTRON_RENDERER_URL']}/calendar.html`);
  } else {
    calendarWindow.loadFile(join(__dirname, '../renderer/calendar.html'));
  }
};

// @ts-ignore
ipcMain.handle('getMonthWorkTime', async (event, year: number, month: number, isAll: boolean) =>
  getMonthWorkTime(year, month, isAll),
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
