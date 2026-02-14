import dayjs from 'dayjs';
import { atom, getDefaultStore } from 'jotai';
import { DateWorkTimes, Holiday, Job, TimeState, WorkStatus } from '../../../preload/dataType';
import { getParams, parseWorkTime } from '../../../commonUtility/utils';

const { status, works } = getParams<Partial<TimeState>>(location.href);
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

export const currentJobAtom = atom<Job | null>(null);

export const jobsAtom = atom<Job[]>([]);

export const canJobControlAtom = atom<boolean>(true);

export const calendarDateAtom = atom(dayjs().toDate());

export const monthWorkTimesAtom = atom<DateWorkTimes>({});

export const canOpenCalendarAtom = atom<boolean>(true);

export const calendarLoadingAtom = atom<boolean>(false);

export const calendarAllCheckAtom = atom<boolean>(false);

export const holidaysAtom = atom<Holiday[]>([]);

export const authModeAtom = atom<AuthMode>('login');
export const emailAtom = atom('');
export const passwordAtom = atom('');
export const errorAtom = atom<string | null>(null);
export const infoAtom = atom<string | null>(null);
export const accessTokenAtom = atom<string | null>(null);
export const tokenReadyAtom = atom((get) => !!get(accessTokenAtom));

void window.api.initializeCurrentJob().then((job) => {
  store.set(currentJobAtom, job);
});

void window.api.getJobs().then((jobs) => {
  store.set(jobsAtom, jobs);
});
