import { parseWorkTime } from '@/commonUtility/utils';
import { getDayDetailTimes } from '@/main/api/calendarApi';
import { DayDetailData, DayDetailGraphItem, Job } from '@/preload/dataType';
import dayjs from 'dayjs';

const BASE_WIDTH = 600;
const BASE_HEIGHT = 360;
const GRAPH_RATE = 0.8;
const HOUR = 60 * 60 * 1000;
const DISPLAY_TIME_THRESHOLD_PX = 40;

type WorkTimesByJob = Record<string, number[][]>;

type Rectangle = { width: number; height: number };
type DayDetailWindowData = { data: DayDetailData; rectangle: Rectangle };

const convertToTimeText = (time: number) => {
  const seconds = Math.floor(time / 1000) % 60;
  const minutes = Math.floor(time / 1000 / 60) % 60;
  const hours = Math.floor(time / 1000 / 60 / 60);
  return hours > 0 ? `${hours}時間${minutes}分` : `${minutes}分${seconds}秒`;
};

const generateGraphItems = (
  jobName: string,
  works: number[][],
  edge: { start: number; end: number },
  width: number,
  isAll: boolean,
  // eslint-disable-next-line complexity
) => {
  const duration = edge.end - edge.start;
  let items: DayDetailGraphItem[] = [];
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
        startUnix: times[timeIndex],
        endUnix: times[timeIndex + 1],
      };
      const durationTime = convertToTimeText(length);
      const canDisplayTime = width * lengthRate * GRAPH_RATE > DISPLAY_TIME_THRESHOLD_PX;
      const nextStartTime: number | null = times[timeIndex + 2] ?? null;
      let first = timeIndex === 0;
      let last = timeIndex === times.length - 2;
      if (first && !firstWork && nextStartTime !== null) {
        const nextLengthRate = (nextStartTime - times[timeIndex]) / duration;
        first = width * nextLengthRate * GRAPH_RATE > DISPLAY_TIME_THRESHOLD_PX;
      }
      if (last && !lastWork && nextStartTime !== null) {
        const nextLengthRate = (nextStartTime - times[timeIndex + 1]) / duration;
        last = width * nextLengthRate * GRAPH_RATE > DISPLAY_TIME_THRESHOLD_PX;
      }
      if (!canDisplayTime) {
        if (!firstWork) {
          first = first && !lastWork;
        }
        if (!lastWork) {
          last = last && !firstWork;
        }
      }
      if (!canDisplayTime && first && last) {
        last = false;
      }
      items = [
        ...items,
        { type, jobName, location, time, durationTime, canDisplayTime, first, last, isAll },
      ];
    }
  }
  return items;
};

const arrangeGraphItems = (items: DayDetailGraphItem[], width: number, duration: number) => {
  return items.map((item, index) => {
    let { first, last } = item;
    const { startUnix, endUnix } = item.time;
    if (!first && !last) {
      return item;
    }
    const nextStartTime: number | null = items[index + 1]?.time.startUnix ?? null;
    if (first && nextStartTime !== null && index > 0) {
      const nextLengthRate = (nextStartTime - startUnix) / duration;
      first = width * nextLengthRate * GRAPH_RATE > DISPLAY_TIME_THRESHOLD_PX;
    }
    if (last && nextStartTime !== null) {
      const nextLengthRate = (nextStartTime - endUnix) / duration;
      last = width * nextLengthRate * GRAPH_RATE > DISPLAY_TIME_THRESHOLD_PX;
    }
    return { ...item, first, last };
  });
};

const emptyData = (year: number, month: number, day: number): DayDetailWindowData => {
  return {
    data: {
      date: { year, month, day },
      name: 'おしごとぜんぶ',
      workTimeSum: '0分0秒',
      restTimeSum: '0分0秒',
      graph: {
        startHour: '0時',
        endHour: '1時',
        items: [],
        isAll: true,
      },
    },
    rectangle: { width: BASE_WIDTH, height: BASE_HEIGHT },
  };
};

export const getDayDetailWindowData = async (
  year: number,
  month: number,
  day: number,
  isAll: boolean,
  jobs: Job[],
  currentJob: Job | null,
): Promise<DayDetailWindowData> => {
  const workTimesByJob: WorkTimesByJob = await getDayDetailTimes(year, month, day);
  const targetJobIds = isAll ? Object.keys(workTimesByJob) : currentJob ? [currentJob.jobId] : [];
  const targetWorks = targetJobIds
    .map((jobId) => {
      const works = workTimesByJob[jobId];
      if (!works || works.length === 0) {
        return null;
      }
      const jobName = jobs.find((job) => job.jobId === jobId)?.name ?? '';
      const { workTime, restTime } = parseWorkTime(works, false);
      return { jobId, jobName, works, workTime, restTime };
    })
    .filter((value): value is NonNullable<typeof value> => value !== null);

  if (targetWorks.length === 0) {
    return emptyData(year, month, day);
  }

  const edgeUnixValue = targetWorks.reduce<{ start: number; end: number }>(
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
  const height = BASE_HEIGHT;
  const edgeText = {
    startHour: dayjs(edge.start).format('H時'),
    endHour: `${dayjs(edge.end).hour() + 1}時`,
  };
  const name = isAll ? 'おしごとぜんぶ' : `おしごと: ${currentJob?.name ?? ''}`;
  const graphDatasParJob = targetWorks.map((job) => {
    const { jobName, workTime, restTime, works } = job;
    const items = generateGraphItems(jobName, works, edge, width, isAll);
    return { items, workTime, restTime };
  });
  const workTimeSumNumber = graphDatasParJob.reduce((pre, cur) => pre + cur.workTime, 0);
  const workTimeSum = convertToTimeText(workTimeSumNumber);
  const restTimeSumNumber = graphDatasParJob.reduce((pre, cur) => pre + cur.restTime, 0);
  const restTimeSum = convertToTimeText(restTimeSumNumber);
  const graphDataItems = graphDatasParJob
    .reduce<DayDetailGraphItem[]>((pre, { items }) => [...pre, ...items], [])
    .sort((a, b) => a.time.startUnix - b.time.startUnix);
  const items = arrangeGraphItems(graphDataItems, width, edge.end - edge.start);
  const graph = { ...edgeText, items, isAll };
  const date = { year, month, day };
  const data: DayDetailData = { date, name, workTimeSum, restTimeSum, graph };
  const rectangle = { width, height };
  return { data, rectangle };
};
