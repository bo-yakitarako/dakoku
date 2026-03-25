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

export const setWindowBounds = (
  browserWindow: BrowserWindow,
  window: Window,
  onlyPosition = false,
) => {
  if (!onlyPosition) {
    windowBoundsStore.set(window, browserWindow.getBounds());
    return;
  }

  const savedBounds = windowBoundsStore.get(window);
  const currentBounds = savedBounds ?? defaultWindowBounds[window];
  const nextBounds = browserWindow.getBounds();
  windowBoundsStore.set(window, {
    width: currentBounds.width,
    height: currentBounds.height,
    x: nextBounds.x,
    y: nextBounds.y,
  });
};
