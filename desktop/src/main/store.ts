import Store from 'electron-store';
import { BrowserWindow, Rectangle } from 'electron';

type Window = 'main' | 'calendar';

const defaultWindowBounds = {
  main: { width: 480, height: 320, x: undefined, y: undefined },
  calendar: { width: 800, height: 730, x: undefined, y: undefined },
};

const windowBoundsStore = new Store<Record<Window, Rectangle>>({ name: 'windowBounds' });

export const getWindowBounds = (window: Window) => {
  return windowBoundsStore.get(window) ?? defaultWindowBounds[window];
};

export const setWindowBounds = (browserWindow: BrowserWindow, window: Window) => {
  windowBoundsStore.set(window, browserWindow.getBounds());
};
