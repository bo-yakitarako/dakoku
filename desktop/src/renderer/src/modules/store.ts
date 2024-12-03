import { atom } from 'recoil';
import { DateWorkTimes, Holiday } from '../../../preload/dataType';

export type WorkStatus = 'workOff' | 'working' | 'resting';

const defaultWorkStatus = localStorage.workStatus ?? 'workOff';
const defaultWorks = JSON.parse(localStorage.works ?? '[]') as number[][];

export const workStatusAtom = atom<WorkStatus>({
  key: 'playStatusAtom',
  default: defaultWorkStatus,
});

export const worksAtom = atom({
  key: 'worksAtom',
  default: defaultWorks,
});

export const currentJobAtom = atom({
  key: 'currentJobAtom',
  default: window.api.initializeCurrentJob(),
});

export const jobsAtom = atom({
  key: 'jobsAtom',
  default: window.api.getJobs(),
});

export const canJobControlAtom = atom({
  key: 'canJobControlAtom',
  default: true,
});

export const calendarDateAtom = atom({
  key: 'calendarDateAtom',
  default: new Date(),
});

export const monthWorkTimesAtom = atom({
  key: 'monthWorkTimesAtom',
  default: {} as DateWorkTimes,
});

export const canOpenCalendarAtom = atom({
  key: 'canOpenCalendarAtom',
  default: true,
});

export const calendarLoadingAtom = atom({
  key: 'calendarLoadingAtom',
  default: false,
});

export const calendarAllCheckAtom = atom({
  key: 'calendarAllCheckAtom',
  default: false,
});

export const holidaysAtom = atom({
  key: 'holidaysAtom',
  default: [] as Holiday[],
});
