export type WorkTime = {
  workTime: number;
  restTime: number;
  works: number[][];
};

export type DateWorkTimes = { [date in string]: WorkTime };
export type MonthWorkTimes = { [month in string]: DateWorkTimes };
export type YearWorkTimes = { [year in string]: MonthWorkTimes };

export type TimeData = { workTime: number; restTime: string };
export type DateTimeDatas = { [date in string]: TimeData };

export type Job = { jobId: string; name: string };
export type JobNameDict = { [jobId in string]: string };
export type JobData = { currentJob: Job | null; jobs: Job[] };
export type JobStore = { currentJob: Job | null; jobName: JobNameDict };

export type Holiday = { day: number; name: string };

export type DayDetailGraphItem = {
  type: 'work' | 'rest';
  jobName: string;
  location: {
    start: string; // xx.xxx%
    length: string; // zz.zzz%
  };
  time: {
    start: string; // HH時mm分
    end: string; // HH時mm分
    startUnix: number;
    endUnix: number;
  };
  durationTime: string; // HH時間mm分 or mm分ss秒
  canDisplayTime: boolean;
  first: boolean;
  last: boolean;
  isAll: boolean;
};

export type DayDetailGraph = {
  startHour: string; // HH時
  endHour: string; // HH時
  items: DayDetailGraphItem[];
  isAll: boolean;
};

export type DayDetailData = {
  date: {
    year: number;
    month: number;
    day: number;
  };
  name: string;
  workTimeSum: string;
  restTimeSum: string;
  graph: DayDetailGraph;
};
