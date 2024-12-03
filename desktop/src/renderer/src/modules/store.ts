import { atom, selector } from 'recoil';
import { DateWorkTimes, Holiday } from '../../../preload/dataType';
import { parseWorkTime } from '../../../commonUtility/timeConverter';

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

export const countAtom = atom({
  key: 'countAtom',
  default: parseWorkTime(defaultWorks),
});

export const isWorksLoadingAtom = atom({
  key: 'isWorksLoadingAtom',
  default: true,
});

export const workSetSelector = selector({
  key: 'workSetSelector',
  get: ({ get }) => get(worksAtom),
  set: ({ set }, newWorks) => {
    set(worksAtom, newWorks);
    set(countAtom, parseWorkTime(newWorks as number[][]));
    set(isWorksLoadingAtom, false);
  },
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
