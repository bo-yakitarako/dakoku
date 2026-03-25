import Store from 'electron-store';
import { BrowserWindow, Rectangle, screen } from 'electron';

type Window = 'main' | 'calendar';

const defaultWindowBounds = {
  main: { width: 480, height: 320, x: undefined, y: undefined },
  calendar: { width: 800, height: 730, x: undefined, y: undefined },
};

const windowBoundsStore = new Store<Record<Window, Rectangle>>({ name: 'windowBounds' });

const isVisibleBounds = (bounds: Rectangle) => {
  if (typeof bounds.x !== 'number' || typeof bounds.y !== 'number') {
    return true;
  }

  return screen.getAllDisplays().some((display) => {
    const area = display.workArea;
    const horizontal = bounds.x < area.x + area.width && bounds.x + bounds.width > area.x;
    const vertical = bounds.y < area.y + area.height && bounds.y + bounds.height > area.y;
    return horizontal && vertical;
  });
};

export const getWindowBounds = (window: Window) => {
  const savedBounds = windowBoundsStore.get(window);
  if (!savedBounds) {
    return defaultWindowBounds[window];
  }
  if (!isVisibleBounds(savedBounds)) {
    return defaultWindowBounds[window];
  }
  return savedBounds;
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
