export type WorkTime = {
  workTime: number;
  restTime: number;
  startTimes: number[];
  pauseTimes: number[];
  finishTime: number;
};

export type DateWorkTimes = { [date in string]: WorkTime };
export type MonthWorkTimes = { [month in string]: DateWorkTimes };
