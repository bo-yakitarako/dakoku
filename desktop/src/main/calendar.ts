import { BrowserWindow, ipcMain } from 'electron';
import icon from '@resources/icon.png?asset';
import { join } from 'path';
import { is } from '@electron-toolkit/utils';
import { getWindowBounds, setWindowBounds } from '@/main/store';
import { createDayDetailWindow } from '@/main/dayDetail';
import { CalendarBootstrap, DayDetailData } from '@/preload/dataType';

export const createCalendarWindow = (
  mainWindow: BrowserWindow,
  getCalendarBootstrap: () => Promise<CalendarBootstrap>,
  getDayDetailWindowData: (
    year: number,
    month: number,
    day: number,
    isAll: boolean,
  ) => Promise<{ data: DayDetailData; rectangle: { width: number; height: number } }>,
) => {
  const open = async () => {
    const bootstrap = await getCalendarBootstrap();
    const windowBounds = getWindowBounds('calendar');
    let calendarWindow: BrowserWindow | null = new BrowserWindow({
      ...windowBounds,
      show: false,
      autoHideMenuBar: true,
      ...(process.platform === 'linux' ? { icon } : {}),
      webPreferences: {
        preload: join(__dirname, '../preload/index.js'),
        sandbox: false,
        additionalArguments: [
          `--calendarBootstrap=${encodeURIComponent(JSON.stringify(bootstrap))}`,
        ],
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
      async (_event, year: number, month: number, day: number, isAll: boolean) => {
        const payload = await getDayDetailWindowData(year, month, day, isAll);
        createDayDetailWindow(calendarWindow!, payload);
      },
    );

    if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
      calendarWindow.loadURL(`${process.env['ELECTRON_RENDERER_URL']}/calendar.html`);
    } else {
      calendarWindow.loadFile(join(__dirname, '../renderer/calendar.html'));
    }
  };

  return open();
};
