import Store from 'electron-store';
import {
  DateTimeDatas,
  DateWorkTimes,
  Job,
  JobStore,
  MonthWorkTimes,
  YearWorkTimes,
} from '../preload/dataType';
import dayjs from 'dayjs';

const workTimeStore = new Store<Record<string, YearWorkTimes>>({ name: 'workTimes' });
const jobStore = new Store<JobStore>({ name: 'job' });

let currentJob = jobStore.get('currentJob') ?? null;

export const registerJob = (jobName: string) => {
  const jobId = `${Date.now()}`;
  currentJob = { jobId, name: jobName };
  const jobs = { ...(jobStore.get('jobs') ?? {}), [jobId]: currentJob };
  jobStore.set('currentJob', currentJob);
  jobStore.set('jobs', jobs);
  return { currentJob, jobs };
};

export const initializeCurrentJob = () => {
  currentJob = jobStore.get('currentJob') ?? null;
  return currentJob;
};

export const getJobs = () => jobStore.get('jobs') ?? {};

export const updateCurrentJob = (jobId: string) => {
  const jobs = jobStore.get('jobs') ?? {};
  if (!(jobId in jobs)) {
    return currentJob;
  }
  currentJob = jobs[jobId];
  jobStore.set('currentJob', currentJob);
  return currentJob;
};

export const renameCurrentJob = (jobName: string) => {
  const preJobs = jobStore.get('jobs') ?? {};
  if (currentJob === null) {
    return { currentJob, jobs: preJobs };
  }
  const jobId = currentJob.jobId;
  const job: Job = { jobId, name: jobName };
  const jobs = { ...preJobs, [jobId]: job };
  jobStore.set('currentJob', job);
  jobStore.set('jobs', jobs);
  currentJob = job;
  return { currentJob, jobs };
};

export const deleteCurrentJob = () => {
  const jobs = jobStore.get('jobs') ?? {};
  if (currentJob === null || !(currentJob.jobId in jobs)) {
    return { currentJob, jobs };
  }
  delete jobs[currentJob.jobId];
  workTimeStore.delete(currentJob.jobId);
  const jobIds = Object.keys(jobs);
  if (jobIds.length === 0) {
    currentJob = null;
    jobStore.clear();
    workTimeStore.clear();
    return { currentJob, jobs: {} };
  }
  currentJob = jobs[jobIds[0]];
  jobStore.set('currentJob', currentJob);
  jobStore.set('jobs', jobs);
  return { currentJob, jobs };
};

export const getTodayWorkTime = () => {
  if (currentJob === null) {
    return { startTimes: [], pauseTimes: [] };
  }
  const jobWorkTime = workTimeStore.get(currentJob.jobId) ?? {};
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const date = now.getDate();
  const workTime = jobWorkTime[`${year}`]?.[`${month}`]?.[`${date}`];
  if (!workTime) {
    return { startTimes: [], pauseTimes: [] };
  }
  const { startTimes, pauseTimes, finishTime } = workTime;
  if (startTimes.length > pauseTimes.length) {
    pauseTimes.push(finishTime);
  }
  return { startTimes, pauseTimes };
};

export const registerWorkTime = (
  startTimes: number[],
  pauseTimes: number[],
  _finishTime?: number,
) => {
  if (currentJob === null) {
    return;
  }
  const now = new Date(_finishTime ?? Date.now());
  const finishTime = now.getTime();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const date = now.getDate();
  const preJobWorkTime = workTimeStore.get(currentJob.jobId) ?? {};
  const preYear = preJobWorkTime[`${year}`] ?? {};
  const { workTime, restTime } = parseWorkTime(startTimes, pauseTimes, finishTime);
  const preMonth = preYear[`${month}`] ?? {};
  const currentMonth: DateWorkTimes = {
    ...preMonth,
    [date]: { workTime, restTime, startTimes, pauseTimes, finishTime },
  };
  const currentYear: MonthWorkTimes = { ...preYear, [month]: currentMonth };
  const jobWorkTime = { ...preJobWorkTime, [`${year}`]: currentYear };
  workTimeStore.set(currentJob.jobId, jobWorkTime);
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
  if (currentJob === null) {
    return { dates: {}, workTimeSum: 'なんかやったっけ？' };
  }
  const jobWorkTime = workTimeStore.get(currentJob.jobId) ?? {};
  const workTimes = jobWorkTime[`${year}`]?.[`${month}`];
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
