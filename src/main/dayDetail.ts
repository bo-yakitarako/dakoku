import { BrowserWindow } from 'electron';
import { join } from 'path';
import icon from '../../resources/icon.png?asset';
import { is } from '@electron-toolkit/utils';

export const createDayDetailWindow = async (calendarWindow: BrowserWindow) => {
  const calendarBounds = calendarWindow.getBounds();
  const width = 600;
  const height = 400;
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
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
    },
  });
  dayDetailWindow.on('ready-to-show', () => {
    dayDetailWindow?.show();
    calendarWindow.webContents.send('finishLoadDetail');
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
