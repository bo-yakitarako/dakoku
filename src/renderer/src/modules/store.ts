import { atom } from 'recoil';
import { DateWorkTimes } from '../../../preload/dataType';

type PlayStatus = 'playing' | 'paused' | 'stopped';

const defaultStartTimes = JSON.parse(localStorage.startTimes ?? '[]') as number[];
const defaultPauseTimes = JSON.parse(localStorage.pauseTimes ?? '[]') as number[];

const defaultPlayStatus = (): PlayStatus => {
  if (defaultStartTimes.length === 0) {
    return 'stopped';
  }
  if (defaultStartTimes.length > defaultPauseTimes.length) {
    return 'playing';
  }
  return 'paused';
};

export const playStatusAtom = atom<PlayStatus>({
  key: 'playStatusAtom',
  default: defaultPlayStatus(),
});

export const startTimesAtom = atom({
  key: 'startTimesAtom',
  default: defaultStartTimes,
});

export const pauseTimesAtom = atom({
  key: 'pauseTimesAtom',
  default: defaultPauseTimes,
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
