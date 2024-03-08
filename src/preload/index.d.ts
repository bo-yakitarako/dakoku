import { ElectronAPI } from '@electron-toolkit/preload';
import { IpcRenderer } from 'electron';

declare global {
  interface Window {
    electron: ElectronAPI;
    api: {
      registerWorkTime: (startTimes: number[], pauseTimes: number[]) => Promise<void>;
      getTodayWorkTime: () => Promise<{ startTimes: number[]; pauseTimes: number[] }>;
      openCalendar: () => Promise<void>;
    };
    ipcRenderer: IpcRenderer;
  }
}
