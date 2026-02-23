import { contextBridge, ipcRenderer } from 'electron';
import { electronAPI } from '@electron-toolkit/preload';
import { CalendarBootstrap, DayDetailData, MainBootstrap, TimeState } from '@/preload/dataType';

const parseBootstrapArg = <T>(name: string): T | null => {
  const arg = process.argv.find((item) => item.startsWith(`--${name}=`));
  if (!arg) {
    return null;
  }
  try {
    const raw = arg.replace(`--${name}=`, '');
    return JSON.parse(decodeURIComponent(raw)) as T;
  } catch {
    return null;
  }
};

const bootstrap = parseBootstrapArg<MainBootstrap>('mainBootstrap');
const calendarBootstrap = parseBootstrapArg<CalendarBootstrap>('calendarBootstrap');
const dayDetailBootstrap = parseBootstrapArg<DayDetailData>('dayDetailBootstrap');

// Custom APIs for renderer
const api = {
  initializeCurrentJob: () => ipcRenderer.invoke('initializeCurrentJob'),
  getJobs: () => ipcRenderer.invoke('getJobs'),
  registerJob: (jobName: string) => ipcRenderer.invoke('registerJob', jobName),
  changeCurrentJob: (jobId: string) => ipcRenderer.invoke('changeCurrentJob', jobId),
  renameCurrentJob: (jobName: string) => ipcRenderer.invoke('renameCurrentJob', jobName),
  deleteCurrentJob: () => ipcRenderer.invoke('deleteCurrentJob'),
  setTimeState: (timeState?: Partial<TimeState>) => ipcRenderer.invoke('setTimeState', timeState),
  registerWorks: (times: number[][]) => ipcRenderer.invoke('registerWorks', times),
  getTodayWorks: () => ipcRenderer.invoke('getTodayWorks'),
  authRegister: (email: string, password: string) =>
    ipcRenderer.invoke('authRegister', email, password),
  authLogin: (email: string, password: string) => ipcRenderer.invoke('authLogin', email, password),
  authRefresh: () => ipcRenderer.invoke('authRefresh'),
  authLogout: () => ipcRenderer.invoke('authLogout'),
  authResetPassword: (email: string) => ipcRenderer.invoke('authResetPassword', email),
  openCalendar: () => ipcRenderer.invoke('openCalendar'),
  getMonthWorkTime: (year: number, month: number, isAll: boolean) =>
    ipcRenderer.invoke('getMonthWorkTime', year, month, isAll),
  getHolidays: (year: number, month: number) => ipcRenderer.invoke('getHolidays', year, month),
  openDayDetail: (year: number, month: number, day: number, isAll: boolean) =>
    ipcRenderer.invoke('openDayDetail', year, month, day, isAll),
  bootstrap,
  calendarBootstrap,
  dayDetailBootstrap,
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
