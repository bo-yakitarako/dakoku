import { atom } from 'recoil';

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
