import * as http from '@/main/http';
import { parseWorkTime } from '@/commonUtility/utils';
import dayjs from 'dayjs';
import { DateTimeDatas, Holiday } from '@/preload/dataType';

type WorkTimesByJob = Record<string, number[][]>;

type HolidayResponse = {
  date: number;
  holidayName: string;
};

const ensureData = <T>(response: http.HttpResponse<T>, fallback: T): T => {
  return response.data ?? fallback;
};

export const getMonthWorkTimes = async (year?: number, month?: number) => {
  const form =
    year !== undefined && month !== undefined
      ? {
          year: `${year}`,
          month: `${month}`,
        }
      : undefined;
  const response = await http.post<WorkTimesByJob>('/calendar/month', { form });
  return ensureData(response, {});
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

const buildMonthSummary = (
  workTimesByJob: WorkTimesByJob,
  year: number,
  month: number,
  isAll: boolean,
  currentJobId: string | null,
) => {
  const jobIds = isAll ? Object.keys(workTimesByJob) : currentJobId ? [currentJobId] : [];
  if (jobIds.length === 0) {
    return { workTimeSum: 'なんかやったっけ？', dates: {} as DateTimeDatas };
  }

  const calendarDates: Record<string, { workTime: number; restTime: number }> = {};
  let workTimeSumNumber = 0;
  for (const jobId of jobIds) {
    const works = workTimesByJob[jobId] ?? [];
    for (const work of works) {
      if (work.length === 0) {
        continue;
      }
      const date = `${dayjs(work[0]).date()}`;
      const { workTime, restTime } = parseWorkTime([work], false);
      workTimeSumNumber += workTime;
      if (!calendarDates[date]) {
        calendarDates[date] = { workTime, restTime };
        continue;
      }
      calendarDates[date].workTime += workTime;
      calendarDates[date].restTime += restTime;
    }
  }

  const dateKeys = Object.keys(calendarDates);
  if (dateKeys.length === 0) {
    return { workTimeSum: 'なんかやったっけ？', dates: {} as DateTimeDatas };
  }

  const dates = dateKeys.reduce<DateTimeDatas>((pre, date) => {
    const times = calendarDates[date];
    return {
      ...pre,
      [date]: {
        workTime: convertToCalendarTime(year, month, date, times.workTime),
        restTime: convertToTimeText(times.restTime),
      },
    };
  }, {});

  return {
    workTimeSum: convertToTimeText(workTimeSumNumber),
    dates,
  };
};

export const getMonthWorkTime = async (
  year: number,
  month: number,
  isAll: boolean,
  currentJobId: string | null,
) => {
  const workTimesByJob = await getMonthWorkTimes(year, month);
  return buildMonthSummary(workTimesByJob, year, month, isAll, currentJobId);
};

export const getHolidays = async (year?: number, month?: number): Promise<Holiday[]> => {
  const form =
    year !== undefined && month !== undefined
      ? {
          year: `${year}`,
          month: `${month}`,
        }
      : undefined;
  const response = await http.post<HolidayResponse[]>('/calendar/holidays', { form });
  const holidays = ensureData(response, []);
  return holidays.map((holiday) => ({ day: holiday.date, name: holiday.holidayName }));
};

export const getDayDetailTimes = async (year: number, month: number, date: number) => {
  const response = await http.post<WorkTimesByJob>('/dayDetail/times', {
    form: {
      year: `${year}`,
      month: `${month}`,
      date: `${date}`,
    },
  });
  return ensureData(response, {});
};
