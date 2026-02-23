import dayjs from 'dayjs';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { WorkTimeRepository } from '@/db/repositories/WorkTimeRepository';
import * as http from '@/http';

type MonthBody = {
  year: string;
  month: string;
};

type DateBody = MonthBody & {
  date: string;
};

type HolidayCache = Record<string, string>;
type HolidayApiResponse = { error: string } | { date: string; name: string; type: string }[];

const holidayCachePath = resolve(process.cwd(), 'holidays.json');

const parsePositiveInt = (value: unknown) => {
  const number = Number(value);
  if (!Number.isInteger(number) || number <= 0) {
    return null;
  }
  return number;
};

const readHolidayCache = async (): Promise<HolidayCache> => {
  try {
    const raw = await readFile(holidayCachePath, 'utf-8');
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return {};
    }
    return Object.fromEntries(
      Object.entries(parsed).filter(
        (entry): entry is [string, string] =>
          typeof entry[0] === 'string' && typeof entry[1] === 'string',
      ),
    );
  } catch {
    return {};
  }
};

const writeHolidayCache = async (cache: HolidayCache) => {
  await writeFile(holidayCachePath, JSON.stringify(cache, null, 2), 'utf-8');
};

const fetchHolidaysByMonth = async (year: number, month: number): Promise<HolidayCache> => {
  const url = `https://api.national-holidays.jp/${year}/${`${month}`.padStart(2, '0')}`;
  const response = await fetch(url);
  if (!response.ok) {
    return {};
  }

  const data = (await response.json()) as HolidayApiResponse;
  if (!Array.isArray(data)) {
    return {};
  }

  return data.reduce<HolidayCache>((pre, item) => {
    if (!item.date || !item.name) {
      return pre;
    }
    return {
      ...pre,
      [item.date]: item.name,
    };
  }, {});
};

const listHolidaysByMonth = (cache: HolidayCache, year: number, month: number) => {
  const monthPrefix = `${year}-${`${month}`.padStart(2, '0')}-`;
  return Object.entries(cache)
    .filter(([date]) => date.startsWith(monthPrefix))
    .map(([date, holidayName]) => ({ date: dayjs(date).date(), holidayName }))
    .sort((a, b) => a.date - b.date);
};

export const registerCalendarRoutes = () => {
  http.authPost('/calendar/month', async (c, user, path) => {
    try {
      const body = await http.parseBody<MonthBody>(c, path);
      const now = dayjs();
      const year = parsePositiveInt(body.year) ?? now.year();
      const month = parsePositiveInt(body.month) ?? now.month() + 1;
      if (month < 1 || month > 12) {
        return c.json({ message: 'Invalid month' }, 400);
      }

      const workTimes = await WorkTimeRepository.findByMonth(user.id, year, month);
      return c.json(workTimes);
    } catch (error) {
      http.logApiError(path, error, { userId: user.id });
      return c.json({ message: 'Failed to fetch month work times' }, 500);
    }
  });

  http.authPost('/dayDetail/times', async (c, user, path) => {
    try {
      const { year, month, date } = await http.parseBody<DateBody>(c, path);
      const parsedYear = parsePositiveInt(year);
      const parsedMonth = parsePositiveInt(month);
      const parsedDate = parsePositiveInt(date);
      if (!parsedYear || !parsedMonth || !parsedDate) {
        return c.json({ message: 'year, month and date are required' }, 400);
      }

      const daysInMonth = dayjs(`${parsedYear}-${parsedMonth}-01`).daysInMonth();
      if (parsedMonth < 1 || parsedMonth > 12 || parsedDate > daysInMonth) {
        return c.json({ message: 'Invalid date' }, 400);
      }

      const workTimes = await WorkTimeRepository.findByDate(
        user.id,
        parsedYear,
        parsedMonth,
        parsedDate,
      );
      return c.json(workTimes);
    } catch (error) {
      http.logApiError(path, error, { userId: user.id });
      return c.json({ message: 'Failed to fetch day detail times' }, 500);
    }
  });

  http.authPost('/calendar/holidays', async (c, user, path) => {
    try {
      const body = await http.parseBody<MonthBody>(c, path);
      const now = dayjs();
      const year = parsePositiveInt(body.year) ?? now.year();
      const month = parsePositiveInt(body.month) ?? now.month() + 1;
      if (month < 1 || month > 12) {
        return c.json({ message: 'Invalid month' }, 400);
      }

      const cache = await readHolidayCache();
      const holidays = listHolidaysByMonth(cache, year, month);
      if (holidays.length > 0) {
        return c.json(holidays);
      }

      const fetched = await fetchHolidaysByMonth(year, month);
      const nextCache = { ...cache, ...fetched };
      await writeHolidayCache(nextCache);
      return c.json(listHolidaysByMonth(nextCache, year, month));
    } catch (error) {
      http.logApiError(path, error, { userId: user.id });
      return c.json({ message: 'Failed to fetch holidays' }, 500);
    }
  });
};
