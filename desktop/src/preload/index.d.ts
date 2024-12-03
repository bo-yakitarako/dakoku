import { ElectronAPI } from '@electron-toolkit/preload';
import { IpcRenderer } from 'electron';
import { DateWorkTimes, DayDetailData, Holiday, Job, JobData } from './dataType';

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
      registerWorks: (times: number[][]) => Promise<void>;
      getTodayWorks: () => Promise<number[][]>;
      openCalendar: () => Promise<void>;
      getMonthWorkTime: (
        year: number,
        month: number,
        isAll: boolean,
      ) => Promise<{ workTimeSum: string; dates: DateWorkTimes }>;
      getHolidays: (year: number, month: number) => Promise<Holiday[]>;
      openDayDetail: (
        year: number,
        month: number,
        day: number,
        isAll: boolean,
      ) => Promise<DayDetailData>;
    };
    ipcRenderer: IpcRenderer;
  }
}
