import { ElectronAPI } from '@electron-toolkit/preload';
import { IpcRenderer } from 'electron';
import { DateWorkTimes, Job } from './dataType';

type JobData = { currentJob: Job | null; jobs: Job[] };

declare global {
  interface Window {
    electron: ElectronAPI;
    api: {
      initializeCurrentJob: () => Promise<Job | null>;
      getJobs: () => Promise<Job[]>;
      registerJob: (jobName: string) => Promise<JobData>;
      changeCurrentJob: (jobId: string) => Promise<Job | null>;
      renameCurrentJob: (jobName: string) => Promise<JobData>;
      deleteCurrentJob: () => Promise<JobData>;
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
