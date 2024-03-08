import Store from 'electron-store';
import { DateTimeDatas, DateWorkTimes, MonthWorkTimes } from '../preload/dataType';
import dayjs from 'dayjs';

const workTimeStore = new Store<Record<string, MonthWorkTimes>>({ name: 'workTimes' });

export const getTodayWorkTime = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const date = now.getDate();
  const workTime = workTimeStore.get(`${year}`)?.[`${month}`]?.[`${date}`];
  if (!workTime) {
    return { startTimes: [], pauseTimes: [] };
  }
  const { startTimes, pauseTimes, finishTime } = workTime;
  if (startTimes.length > pauseTimes.length) {
    pauseTimes.push(finishTime);
  }
  return { startTimes, pauseTimes };
};

export const registerWorkTime = (startTimes: number[], pauseTimes: number[]) => {
  const now = new Date();
  const finishTime = now.getTime();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const date = now.getDate();
  const preYear = workTimeStore.get(`${year}`) ?? {};
  const { workTime, restTime } = parseWorkTime(startTimes, pauseTimes, finishTime);
  const preMonth = preYear[`${month}`] ?? {};
  const currentMonth: DateWorkTimes = {
    ...preMonth,
    [date]: { workTime, restTime, startTimes, pauseTimes, finishTime },
  };
  const currentYear: MonthWorkTimes = { ...preYear, [month]: currentMonth };
  workTimeStore.set(`${year}`, currentYear);
};

const parseWorkTime = (startTimes: number[], pauseTimes: number[], finishTime: number) => {
  const copiedStartTimes = [...startTimes];
  const copiedPauseTimes = [...pauseTimes];
  let prevPauseTime: number | null = null;
  let workTime = 0;
  let restTime = 0;
  while (copiedStartTimes.length > 0 && copiedPauseTimes.length > 0) {
    const startTime = copiedStartTimes.splice(0, 1)[0];
    const pauseTime = copiedPauseTimes.splice(0, 1)[0];
    workTime += pauseTime - startTime;
    if (prevPauseTime !== null) {
      restTime += startTime - prevPauseTime;
    }
    prevPauseTime = pauseTime;
  }
  if (copiedStartTimes.length > 0) {
    workTime += finishTime - copiedStartTimes[0];
    if (prevPauseTime !== null) {
      restTime += copiedStartTimes[0] - prevPauseTime;
    }
  } else if (prevPauseTime !== null) {
    restTime += finishTime - prevPauseTime;
  }
  return { workTime, restTime };
};

export const getMonthWorkTime = (year: number, month: number) => {
  const workTimes = workTimeStore.get(`${year}`)?.[`${month}`];
  if (!workTimes) {
    return { dates: {}, workTimeSum: 'なんかやったっけ？' };
  }
  const dates = Object.keys(workTimes).reduce((pre, cur) => {
    const times = workTimes[cur];
    return {
      ...pre,
      [cur]: {
        workTime: convertToCalendarTime(year, month, cur, times.workTime),
        restTime: convertToTimeText(times.restTime),
      },
    };
  }, {} as DateTimeDatas);
  const workTimeSumCalc = Object.values(workTimes).reduce((pre, cur) => pre + cur.workTime, 0);
  const workTimeSum = convertToTimeText(workTimeSumCalc);
  return { dates, workTimeSum };
};

const convertToCalendarTime = (year: number, month: number, date: string, time: number) => {
  const milliseconds = time % 1000;
  const seconds = Math.floor(time / 1000) % 60;
  const minutes = Math.floor(time / 1000 / 60) % 60;
  const hours = Math.floor(time / 1000 / 60 / 60);
  const timeText = `${year}-${month}-${date} ${hours}:${minutes}:${seconds}.${milliseconds}`;
  return dayjs(timeText, 'YYYY-M-D H:m:s.S').valueOf();
};

const convertToTimeText = (time: number) => {
  const seconds = Math.floor(time / 1000) % 60;
  const minutes = Math.floor(time / 1000 / 60) % 60;
  const hours = Math.floor(time / 1000 / 60 / 60);
  return hours > 0 ? `${hours}時間${minutes}分` : `${minutes}分${seconds}秒`;
};
