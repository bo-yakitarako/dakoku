export type WorkTime = {
  workTime: number;
  restTime: number;
  startTimes: number[];
  pauseTimes: number[];
  finishTime: number;
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
