import { BrowserWindow } from 'electron';
import { join } from 'path';
import icon from '../../resources/icon.png?asset';
import { is } from '@electron-toolkit/utils';
import { getDayDetailData } from './store';

export const createDayDetailWindow = async (
  calendarWindow: BrowserWindow,
  year: number,
  month: number,
  day: number,
  isAll: boolean,
) => {
  const { data, rectangle } = getDayDetailData(year, month, day, isAll);
  const calendarBounds = calendarWindow.getBounds();
  const { width, height } = rectangle;
  const x = calendarBounds.x + Math.floor((calendarBounds.width - width) / 2);
  const y = calendarBounds.y + Math.floor((calendarBounds.height - height) / 2);
  let dayDetailWindow: BrowserWindow | null = new BrowserWindow({
    width,
    height,
    x,
    y,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    resizable: false,
    alwaysOnTop: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
    },
  });
  dayDetailWindow.on('ready-to-show', () => {
    dayDetailWindow?.show();
    calendarWindow.webContents.send('finishLoadDetail');
    dayDetailWindow?.webContents.send('data', data);
  });

  dayDetailWindow.on('closed', () => {
    dayDetailWindow = null;
  });

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    dayDetailWindow.loadURL(`${process.env['ELECTRON_RENDERER_URL']}/dayDetail.html`);
  } else {
    dayDetailWindow.loadFile(join(__dirname, '../renderer/dayDetail.html'));
  }
};
