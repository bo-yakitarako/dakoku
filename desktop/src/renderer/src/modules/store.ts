import dayjs from 'dayjs';
import { atom, getDefaultStore } from 'jotai';
import { DateTimeDatas, Holiday, Job, WorkStatus } from '@/preload/dataType';
import { parseWorkTime } from '@/commonUtility/utils';

const bootstrap = window.api.bootstrap;
const calendarBootstrap = window.api.calendarBootstrap;
const status = bootstrap?.status;
const works = bootstrap?.works;
const store = getDefaultStore();
type CountTime = { workTime: number; restTime: number };
export type AuthMode = 'login' | 'register';

export const workStatusAtom = atom<WorkStatus>(status ?? 'workOff');

export const worksAtom = atom<number[][]>(works ?? []);

export const countAtom = atom<CountTime>(parseWorkTime(works ?? []));

export const isWorksLoadingAtom = atom<boolean>(true);

export const workSetSelector = atom(
  (get) => get(worksAtom),
  (_get, set, newWorks: number[][]) => {
    set(worksAtom, newWorks);
    set(countAtom, parseWorkTime(newWorks));
    set(isWorksLoadingAtom, false);
  },
);

export const currentJobAtom = atom<Job | null>(bootstrap?.currentJob ?? null);

export const jobsAtom = atom<Job[]>(bootstrap?.jobs ?? []);

export const canJobControlAtom = atom<boolean>(true);

export const calendarDateAtom = atom(
  calendarBootstrap
    ? dayjs(`${calendarBootstrap.year}-${calendarBootstrap.month}-01`, 'YYYY-M-D').toDate()
    : dayjs().toDate(),
);

export const monthWorkTimesAtom = atom<DateTimeDatas>(calendarBootstrap?.dates ?? {});

export const canOpenCalendarAtom = atom<boolean>(true);

export const calendarLoadingAtom = atom<boolean>(!calendarBootstrap);

export const calendarAllCheckAtom = atom<boolean>(false);

export const holidaysAtom = atom<Holiday[]>(calendarBootstrap?.holidays ?? []);

export const authModeAtom = atom<AuthMode>('login');
export const emailAtom = atom('');
export const passwordAtom = atom('');
export const errorAtom = atom<string | null>(null);
export const infoAtom = atom<string | null>(null);

if (!bootstrap) {
  void window.api.initializeCurrentJob().then((job) => {
    store.set(currentJobAtom, job);
  });

  void window.api.getJobs().then((jobs) => {
    store.set(jobsAtom, jobs);
  });
}
