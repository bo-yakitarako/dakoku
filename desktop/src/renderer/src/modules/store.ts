import { atom } from 'recoil';
import { DateWorkTimes, Holiday } from '../../../preload/dataType';
import { parseWorkTime } from './timeConverter';

const defaultTimes = JSON.parse(localStorage.times ?? '[]') as number[];
type Count = { workTime: number; restTime: number };
const storedCount = JSON.parse(localStorage.count ?? '{"workTime":0,"restTime":0}') as Count;
const timeCount = parseWorkTime(defaultTimes);
const defaultCount = {
  workTime: storedCount.workTime + timeCount.workTime,
  restTime: storedCount.restTime + timeCount.restTime,
};

const defaultWorkStatus = () => {
  if (defaultTimes.length === 0) {
    return 'workOff';
  }
  if (defaultTimes.length % 2 === 1) {
    return 'working';
  }
  return 'resting';
};

export type WorkStatus = ReturnType<typeof defaultWorkStatus>;

export const workStatusAtom = atom<WorkStatus>({
  key: 'playStatusAtom',
  default: defaultWorkStatus(),
});

export const timesAtom = atom({
  key: 'timesAtom',
  default: defaultTimes,
});

export const countAtom = atom({
  key: 'countAtom',
  default: defaultCount,
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
