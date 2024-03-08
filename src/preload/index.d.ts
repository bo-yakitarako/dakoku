import { ElectronAPI } from '@electron-toolkit/preload';
import { IpcRenderer } from 'electron';
import { DateWorkTimes } from './dataType';

declare global {
  interface Window {
    electron: ElectronAPI;
    api: {
      registerWorkTime: (startTimes: number[], pauseTimes: number[]) => Promise<void>;
      getTodayWorkTime: () => Promise<{ startTimes: number[]; pauseTimes: number[] }>;
      openCalendar: () => Promise<void>;
      getMonthWorkTime: (
        year: number,
        month: number,
      ) => Promise<{ workTimeSum: string; dates: DateWorkTimes }>;
    };
    ipcRenderer: IpcRenderer;
  }
}
