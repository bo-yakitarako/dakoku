import { contextBridge, ipcRenderer } from 'electron';
import { electronAPI } from '@electron-toolkit/preload';

// Custom APIs for renderer
const api = {
  initializeCurrentJob: () => ipcRenderer.invoke('initializeCurrentJob'),
  getJobs: () => ipcRenderer.invoke('getJobs'),
  registerJob: (jobName: string) => ipcRenderer.invoke('registerJob', jobName),
  changeCurrentJob: (jobId: string) => ipcRenderer.invoke('changeCurrentJob', jobId),
  renameCurrentJob: (jobName: string) => ipcRenderer.invoke('renameCurrentJob', jobName),
  deleteCurrentJob: () => ipcRenderer.invoke('deleteCurrentJob'),
  registerWorkTime: (times: number) => ipcRenderer.invoke('registerWorkTime', times),
  getTodayWorkTime: () => ipcRenderer.invoke('getTodayWorkTime'),
  openCalendar: () => ipcRenderer.invoke('openCalendar'),
  getMonthWorkTime: (year: number, month: number, isAll: boolean) =>
    ipcRenderer.invoke('getMonthWorkTime', year, month, isAll),
  getHolidays: (year: number, month: number) => ipcRenderer.invoke('getHolidays', year, month),
  openDayDetail: (year: number, month: number, day: number, isAll: boolean) =>
    ipcRenderer.invoke('openDayDetail', year, month, day, isAll),
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
