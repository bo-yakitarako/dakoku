import Store from 'electron-store';
import {
  DateTimeDatas,
  DayDetailData,
  DayDetailGraphItem,
  Job,
  JobNameDict,
  JobStore,
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
    return { workTime: 0, restTime: 0 };
  }
  const jobWorkTime = workTimeStore.get(currentJob.jobId) ?? {};
  const now = dayjs();
  const [year, month, date] = [now.year(), now.month() + 1, now.date()];
  const work = jobWorkTime[year]?.[month]?.[date];
  if (!work) {
    return { workTime: 0, restTime: 0 };
  }
  const { workTime, restTime } = work;
  return { workTime, restTime };
};

export const registerWorkTime = (times: number[]) => {
  if (currentJob === null || times.length === 0) {
    return;
  }
  const now = dayjs(times.slice(-1)[0]);
  const [year, month, date] = [now.year(), now.month() + 1, now.date()];
  const jobWorks = workTimeStore.get(currentJob.jobId) ?? {};
  const todayWork = jobWorks[year]?.[month]?.[date];
  const { workTime, restTime } = parseWorkTime(times);
  if (todayWork) {
    todayWork.workTime += workTime;
    todayWork.restTime += restTime;
    todayWork.works = [...todayWork.works, times];
    jobWorks[year][month][date] = todayWork; // 参照一緒かもしれないけど再代入を明示して確実さとわかりやすさ重視
    workTimeStore.set(currentJob.jobId, jobWorks);
    return;
  }
  const jobWorksYear = jobWorks[year] ?? {};
  const jobWorksMonth = jobWorksYear[month] ?? {};
  const registeringMonth = { ...jobWorksMonth, [date]: { workTime, restTime, works: [times] } };
  const registeringYear = { ...jobWorksYear, [month]: registeringMonth };
  const registeringItem = { ...jobWorks, [year]: registeringYear };
  workTimeStore.set(currentJob.jobId, registeringItem);
};

const parseWorkTime = (times: number[]) => {
  let [workTime, restTime] = [0, 0];
  for (let i = 0; i < times.length - 1; i += 1) {
    const interval = times[i + 1] - times[i];
    if (i % 2 === 0) {
      workTime += interval;
    } else {
      restTime += interval;
    }
  }
  return { workTime, restTime };
};

export const getMonthWorkTime = (year: number, month: number) => {
  if (currentJob === null) {
    return { dates: {}, workTimeSum: 'なんかやったっけ？' };
  }
  const jobWorkTime = workTimeStore.get(currentJob.jobId) ?? {};
  const workTimes = jobWorkTime[year]?.[month];
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
    (pre, { works }) => {
      const curEdge = {
        start: works[0][0],
        end: works.slice(-1)[0].slice(-1)[0],
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
    const { jobId, jobName, works } = job;
    const graph = {
      ...edgeText,
      items: generateGraphItems(works, edge, width),
    };
    const workTimeSum = convertToTimeText(job.workTime);
    const restTimeSum = convertToTimeText(job.restTime);
    return { jobId, jobName, workTimeSum, restTimeSum, graph };
  });
  let jobSum: { workTimeSum: string; restTimeSum: string } | undefined = undefined;
  if (jobs.length > 1) {
    const workTimeSumNumber = jobs.reduce((pre, cur) => pre + cur.workTime, 0);
    const restTimeSumNumber = jobs.reduce((pre, cur) => pre + cur.restTime, 0);
    jobSum = {
      workTimeSum: convertToTimeText(workTimeSumNumber),
      restTimeSum: convertToTimeText(restTimeSumNumber),
    };
  }
  const date = { year, month, day };
  const data: DayDetailData = { date, jobItems, jobSum };
  const rectangle = { width, height };
  return { data, rectangle };
};

const generateGraphItems = (
  works: number[][],
  edge: { start: number; end: number },
  width: number,
) => {
  const duration = edge.end - edge.start;
  let items: DayDetailGraphItem[] = [];
  let workLastTime: number | null = null;
  for (let workIndex = 0; workIndex < works.length; workIndex += 1) {
    const times = works[workIndex];
    const firstWork = workIndex === 0;
    const lastWork = workIndex === works.length - 1;
    for (let timeIndex = 0; timeIndex < times.length - 1; timeIndex += 1) {
      const type = timeIndex % 2 === 0 ? 'work' : 'rest';
      const length = times[timeIndex + 1] - times[timeIndex];
      const lengthRate = length / duration;
      const locationStart = ((times[timeIndex] - edge.start) / duration) * 100;
      const locationLenth = lengthRate * 100;
      const location = {
        start: `${locationStart.toFixed(4)}%`,
        length: `${locationLenth.toFixed(4)}%`,
      };
      const time = {
        start: dayjs(times[timeIndex]).format('HH:mm'),
        end: dayjs(times[timeIndex + 1]).format('HH:mm'),
      };
      const durationTime = convertToTimeText(length);
      const canDisplayTime = width * lengthRate * GRAPH_RATE > DISPLAY_TIME_THRESHOLD_PX;
      let first =
        timeIndex === 0 && (workLastTime === null || times[timeIndex] - workLastTime > HOUR);
      let last = timeIndex === times.length - 2;
      if (!canDisplayTime) {
        first = first && !lastWork;
        last = last && !firstWork;
      }
      items = [...items, { type, location, time, durationTime, canDisplayTime, first, last }];
      if (last) {
        workLastTime = times[timeIndex + 1];
      }
    }
  }
  return items;
};

// (() => {
//   const workTimeStoreData = workTimeStore.store;
//   for (const jobId of Object.keys(workTimeStoreData)) {
//     const jobWorkData = workTimeStoreData[jobId];
//     for (const year of Object.keys(jobWorkData)) {
//       for (const month of Object.keys(jobWorkData[year])) {
//         for (const date of Object.keys(jobWorkData[year][month])) {
//           const { works } = jobWorkData[year][month][date];
//           const counts = works.map((work) => parseWorkTime(work));
//           const countSum = counts.reduce(
//             (pre, cur) => {
//               return {
//                 workTime: pre.workTime + cur.workTime,
//                 restTime: pre.restTime + cur.restTime,
//               };
//             },
//             { workTime: 0, restTime: 0 },
//           );
//           jobWorkData[year][month][date] = { ...countSum, works };
//         }
//       }
//     }
//     workTimeStore.set(jobId, jobWorkData);
//   }
// })();
