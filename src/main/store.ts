import Store from 'electron-store';
import {
  DateTimeDatas,
  DateWorkTimes,
  DayDetailData,
  DayDetailGraphItem,
  Job,
  JobNameDict,
  JobStore,
  MonthWorkTimes,
  YearWorkTimes,
} from '../preload/dataType';
import dayjs from 'dayjs';
import { BrowserWindow, Rectangle } from 'electron';

type Window = 'main' | 'calendar';

const defaultWindowBounds = {
  main: { width: 480, height: 320, x: undefined, y: undefined },
  calendar: { width: 800, height: 730, x: undefined, y: undefined },
};

const workTimeStore = new Store<Record<string, YearWorkTimes>>({ name: 'workTimes' });
const jobStore = new Store<JobStore>({ name: 'job' });
const windowBoundsStore = new Store<Record<Window, Rectangle>>({ name: 'windowBounds' });

let currentJob = jobStore.get('currentJob') ?? null;

export const getWindowBounds = (window: Window) => {
  return windowBoundsStore.get(window) ?? defaultWindowBounds[window];
};

export const setWindowBounds = (browserWindow: BrowserWindow, window: Window) => {
  const bounds = browserWindow.getBounds();
  windowBoundsStore.set(window, bounds);
};

export const registerJob = (jobName: string) => {
  const jobId = `${Date.now()}`;
  const jobNameDict = { ...(jobStore.get('jobName') ?? {}), [jobId]: jobName };
  jobStore.set('jobName', jobNameDict);
  if (currentJob === null) {
    currentJob = { jobId, name: jobName };
    jobStore.set('currentJob', currentJob);
  }
  return { currentJob, jobs: convertNameDictToJobs(jobNameDict) };
};

export const initializeCurrentJob = () => {
  currentJob = jobStore.get('currentJob') ?? null;
  return currentJob;
};

export const getJobs = () => {
  const jobNameDict = jobStore.get('jobName') ?? {};
  return convertNameDictToJobs(jobNameDict);
};

export const changeCurrentJob = (jobId: string) => {
  const jobNameDict = jobStore.get('jobName') ?? {};
  if (!(jobId in jobNameDict)) {
    return currentJob;
  }
  currentJob = { jobId, name: jobNameDict[jobId] };
  jobStore.set('currentJob', currentJob);
  return currentJob;
};

export const renameCurrentJob = (jobName: string) => {
  const preJobNameDict = jobStore.get('jobName') ?? {};
  if (currentJob === null) {
    return { currentJob, jobs: convertNameDictToJobs(preJobNameDict) };
  }
  const jobId = currentJob.jobId;
  const job: Job = { jobId, name: jobName };
  const jobNameDict = { ...preJobNameDict, [jobId]: jobName };
  jobStore.set('currentJob', job);
  jobStore.set('jobName', jobNameDict);
  currentJob = job;
  return { currentJob, jobs: convertNameDictToJobs(jobNameDict) };
};

export const deleteCurrentJob = () => {
  const jobNameDict = jobStore.get('jobName') ?? {};
  if (currentJob === null || !(currentJob.jobId in jobNameDict)) {
    return { currentJob, jobs: convertNameDictToJobs(jobNameDict) };
  }
  delete jobNameDict[currentJob.jobId];
  workTimeStore.delete(currentJob.jobId);
  const jobIds = Object.keys(jobNameDict);
  if (jobIds.length === 0) {
    currentJob = null;
    jobStore.clear();
    workTimeStore.clear();
    return { currentJob, jobs: [] };
  }
  const currentJobName = jobNameDict[jobIds[0]];
  currentJob = { jobId: jobIds[0], name: currentJobName };
  jobStore.set('currentJob', currentJob);
  jobStore.set('jobName', jobNameDict);
  return { currentJob, jobs: convertNameDictToJobs(jobNameDict) };
};

const convertNameDictToJobs = (jobNameDict: JobNameDict): Job[] => {
  return Object.keys(jobNameDict)
    .map((jobId) => {
      const name = jobNameDict[jobId];
      return { jobId, name };
    })
    .sort((a, b) => Number(a.jobId) - Number(b.jobId));
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

const JOB_ITEM_HEIGHT = 157;
const JOB_GAP = 32;
const BASE_WIDTH = 600;
const BASE_HEIGHT = 360;
const GRAPH_RATE = 0.8;
const HOUR = 60 * 60 * 1000;
const DISPLAY_TIME_THRESHOLD_PX = 40;

export const getDayDetailData = (year: number, month: number, day: number, isAll: boolean) => {
  if (currentJob === null) {
    isAll = true;
  }
  const workTimeStoreData = workTimeStore.store;
  const jobNameDict = jobStore.get('jobName');
  const jobIds = isAll ? Object.keys(jobNameDict) : [currentJob!.jobId];
  const jobs = jobIds
    .filter((jobId) => workTimeStoreData[jobId]?.[year]?.[month]?.[day])
    .map((jobId) => {
      const workTimeData = workTimeStoreData[jobId][year][month][day];
      const jobName = jobNameDict[jobId];
      return { jobId, jobName, ...workTimeData };
    });
  const edgeUnixValue = jobs.reduce<{ start: number; end: number }>(
    (pre, cur) => {
      const curEdge = {
        start: cur.startTimes[0],
        end:
          cur.startTimes.length === cur.pauseTimes.length
            ? cur.pauseTimes.slice(-1)[0]
            : cur.finishTime,
      };
      if (pre.end === 0) {
        return { ...curEdge };
      }
      const dataEdge = { ...pre };
      if (curEdge.start < pre.start) {
        dataEdge.start = curEdge.start;
      }
      if (curEdge.end > pre.end) {
        dataEdge.end = curEdge.end;
      }
      return { ...dataEdge };
    },
    { start: 0, end: 0 },
  );
  const edge = {
    start: dayjs(edgeUnixValue.start).startOf('hour').valueOf(),
    end: dayjs(edgeUnixValue.end).endOf('hour').valueOf(),
  };
  const width = BASE_WIDTH * (edge.end - edge.start > 12 * HOUR ? 1.5 : 1);
  const height = BASE_HEIGHT + (JOB_ITEM_HEIGHT + JOB_GAP) * (jobs.length - 1);
  const edgeText = {
    startHour: dayjs(edge.start).format('H時'),
    endHour: `${dayjs(edge.end).hour() + 1}時`,
  };
  const jobItems = jobs.map((job) => {
    const { jobId, jobName, startTimes, pauseTimes, finishTime } = job;
    const graph = {
      ...edgeText,
      items: generateGraphItems(startTimes, pauseTimes, finishTime, edge, width),
    };
    const workTimeSum = convertToTimeText(job.workTime);
    const restTimeSum = convertToTimeText(job.restTime);
    return { jobId, jobName, workTimeSum, restTimeSum, graph };
  });
  let jobSum: { workTimeSum: string; restTimeSum: string } | undefined = undefined;
  if (jobs.length > 1) {
    const concatStartTimes = jobs.reduce((pre, cur) => [...pre, ...cur.startTimes], [] as number[]);
    const pauseTimeWithFinish = jobs.map(({ startTimes, pauseTimes, finishTime }) => {
      if (startTimes.length === pauseTimes.length) {
        return [...pauseTimes];
      }
      return [...pauseTimes, finishTime];
    });
    const concatPauseTimes = pauseTimeWithFinish.reduce(
      (pre, cur) => [...pre, ...cur],
      [] as number[],
    );
    const allStartTimes = concatStartTimes.sort((a, b) => a - b);
    const allPauseTimes = concatPauseTimes.sort((a, b) => a - b);
    const { workTime, restTime } = parseWorkTime(allStartTimes, allPauseTimes, edge.end);
    jobSum = { workTimeSum: convertToTimeText(workTime), restTimeSum: convertToTimeText(restTime) };
  }
  const date = { year, month, day };
  const data: DayDetailData = { date, jobItems, jobSum };
  const rectangle = { width, height };
  return { data, rectangle };
};

const generateGraphItems = (
  startTimes: number[],
  pauseTimes: number[],
  finishTime: number,
  edge: { start: number; end: number },
  width: number,
) => {
  let times = [...startTimes, ...pauseTimes].sort((a, b) => a - b);
  if (times.length % 2 === 1) {
    times = [...times, finishTime];
  }
  const duration = edge.end - edge.start;
  let items: DayDetailGraphItem[] = [];
  for (let i = 0; i < times.length - 1; i += 1) {
    const type = i % 2 === 0 ? 'work' : 'rest';
    const length = times[i + 1] - times[i];
    const lengthRate = length / duration;
    const locationStart = ((times[i] - edge.start) / duration) * 100;
    const locationLenth = lengthRate * 100;
    const location = {
      start: `${locationStart.toFixed(4)}%`,
      length: `${locationLenth.toFixed(4)}%`,
    };
    const time = {
      start: dayjs(times[i]).format('HH:mm'),
      end: dayjs(times[i + 1]).format('HH:mm'),
    };
    const durationTime = convertToTimeText(length);
    const canDisplayTime = width * lengthRate * GRAPH_RATE > DISPLAY_TIME_THRESHOLD_PX;
    items = [...items, { type, location, time, durationTime, canDisplayTime }];
  }
  return items;
};

// restTimeの計算方法を変えたときに、昔のデータを変えた計算方法に従うものにアップデートした
// 変更点: 休憩中に退勤を押した場合、最後の休憩の打刻から退勤時刻までの時間を休憩時間に含めずに、その休憩時間の打刻を退勤時間とした
// (() => {
//   const workTimeStoreData = workTimeStore.store;
//   for (const jobId of Object.keys(workTimeStoreData)) {
//     const jobWorkData = workTimeStoreData[jobId];
//     for (const year of Object.keys(jobWorkData)) {
//       for (const month of Object.keys(jobWorkData[year])) {
//         for (const date of Object.keys(jobWorkData[year][month])) {
//           const { startTimes, pauseTimes, finishTime } = jobWorkData[year][month][date];
//           const { workTime, restTime } = parseWorkTime(startTimes, pauseTimes, finishTime);
//           jobWorkData[year][month][date].workTime = workTime;
//           jobWorkData[year][month][date].restTime = restTime;
//         }
//       }
//     }
//     workTimeStore.set(jobId, jobWorkData);
//   }
// })();
