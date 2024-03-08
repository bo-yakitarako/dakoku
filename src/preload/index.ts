import { contextBridge, ipcRenderer } from 'electron';
import { electronAPI } from '@electron-toolkit/preload';

// Custom APIs for renderer
const api = {
  registerWorkTime: (startTimes: number[], pauseTimes: number[]) =>
    ipcRenderer.invoke('registerWorkTime', startTimes, pauseTimes),
  getTodayWorkTime: () => ipcRenderer.invoke('getTodayWorkTime'),
  openCalendar: () => ipcRenderer.invoke('openCalendar'),
  getMonthWorkTime: (year: number, month: number) =>
    ipcRenderer.invoke('getMonthWorkTime', year, month),
};

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI);
    contextBridge.exposeInMainWorld('api', api);
    contextBridge.exposeInMainWorld('ipcRenderer', {
      ...ipcRenderer,
      on: ipcRenderer.on,
      removeAllListeners: ipcRenderer.removeAllListeners,
    });
  } catch (error) {
    console.error(error);
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI;
  // @ts-ignore (define in dts)
  window.api = api;
}
