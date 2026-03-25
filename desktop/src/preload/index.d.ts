import { ElectronAPI } from '@electron-toolkit/preload';
import { IpcRenderer } from 'electron';
import {
  CalendarBootstrap,
  DateTimeDatas,
  DayDetailData,
  Holiday,
  Job,
  JobData,
  MainBootstrap,
  TimeState,
  WorkStatus,
} from '@/preload/dataType';
import type { AuthEmailResponse, HttpResponse, SessionResponse } from '@/main/http';

type Auth = HttpResponse<SessionResponse>;
type AuthEmail = HttpResponse<AuthEmailResponse>;

declare global {
  interface Window {
    electron: ElectronAPI;
    api: {
      authRegister: (email: string, password: string) => Promise<AuthEmail>;
      authLogin: (email: string, password: string) => Promise<Auth>;
      authRefresh: () => Promise<Auth>;
      authLogout: () => Promise<HttpResponse>;
      authResetPassword: (email: string) => Promise<AuthEmail>;
      authSendVerificationEmail: (email: string) => Promise<AuthEmail>;
      initializeCurrentJob: () => Promise<Job | null>;
      getJobs: () => Promise<Job[]>;
      registerJob: (jobName: string) => Promise<JobData>;
      changeCurrentJob: (jobId: string) => Promise<Job | null>;
      renameCurrentJob: (jobName: string) => Promise<JobData>;
      deleteCurrentJob: () => Promise<JobData>;
      setTimeState: (timeState?: Partial<TimeState>) => Promise<void>;
      registerTime: (payload: {
        index: number;
        actedAt: number;
        workStatus: WorkStatus;
      }) => Promise<number[][]>;
      getTodayWorks: () => Promise<number[][]>;
      openCalendar: () => Promise<void>;
      getMonthWorkTime: (
        year: number,
        month: number,
        isAll: boolean,
      ) => Promise<{ workTimeSum: string; dates: DateTimeDatas }>;
      getHolidays: (year: number, month: number) => Promise<Holiday[]>;
      openDayDetail: (
        year: number,
        month: number,
        day: number,
        isAll: boolean,
      ) => Promise<DayDetailData>;
      bootstrap: MainBootstrap | null;
      calendarBootstrap: CalendarBootstrap | null;
      dayDetailBootstrap: DayDetailData | null;
    };
    ipcRenderer: IpcRenderer;
  }
}
