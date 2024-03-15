import { ElectronAPI } from '@electron-toolkit/preload';
import { IpcRenderer } from 'electron';
import { DateWorkTimes, Job, JobStore, Jobs } from './dataType';

declare global {
  interface Window {
    electron: ElectronAPI;
    api: {
      initializeCurrentJob: () => Promise<Job>;
      getJobs: () => Promise<Jobs>;
      registerJob: (jobName: string) => Promise<Job>;
      updateCurrentJob: (jobId: string) => Promise<JobStore>;
      renameCurrentJob: (jobName: string) => Promise<JobStore>;
      deleteCurrentJob: () => Promise<JobStore>;
      registerWorkTime: (
        startTimes: number[],
        pauseTimes: number[],
        finishTime?: number,
      ) => Promise<void>;
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
