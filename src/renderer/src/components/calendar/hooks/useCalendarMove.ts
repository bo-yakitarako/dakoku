import { useEffect, useRef, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import { useRecoilState, useSetRecoilState } from 'recoil';
import { calendarDateAtom, holidaysAtom, monthWorkTimesAtom } from '../../../modules/store';
import dayjs from 'dayjs';
import { EventSourceInput } from '@fullcalendar/core';

export const useCalendarMove = () => {
  const ref = useRef<FullCalendar>(null);
  const [currentDate, setCurrentDate] = useRecoilState(calendarDateAtom);
  const setMonthWorkTimes = useSetRecoilState(monthWorkTimesAtom);
  const [holidays, setHolidays] = useRecoilState(holidaysAtom);
  const [calendarEvents, setCalendarEvents] = useState<EventSourceInput>([]);
  const [workTimeSum, setWorkTimeSum] = useState('');
  const [holidayGrids, setHolidayGrids] = useState<{ row: number; column: number }[]>([]);
  const [loading, setLoading] = useState(false);

  const setMonthData = async (monthMove: number) => {
    const nextMonth = dayjs(currentDate).add(monthMove, 'month');
    const { workTimeSum, dates } = await window.api.getMonthWorkTime(
      nextMonth.year(),
      nextMonth.month() + 1,
    );
    const holidays = await window.api.getHolidays(nextMonth.year(), nextMonth.month() + 1);
    setHolidays(holidays);
    setHolidayGrids(
      holidays.map(({ day }) => convertToGrid(nextMonth.year(), nextMonth.month(), day)),
    );
    setMonthWorkTimes(dates);
    setWorkTimeSum(workTimeSum);
    const events = Object.values(dates).map(({ workTime }) => ({ date: new Date(workTime) }));
    setCalendarEvents(events);
    setCurrentDate(nextMonth.toDate());
  };

  const currentMonth = dayjs(currentDate).format('YYYY年M月');

  const move = {
    next: async () => {
      if (loading) return;
      const api = ref.current?.getApi();
      if (!api) return;
      setLoading(true);
      await setMonthData(1);
      api.next();
      setLoading(false);
    },
    nextYear: async () => {
      if (loading) return;
      const api = ref.current?.getApi();
      if (!api) return;
      setLoading(true);
      await setMonthData(12);
      const targetDate = api.getDate();
      targetDate.setFullYear(targetDate.getFullYear() + 1);
      api.gotoDate(targetDate);
      setLoading(false);
    },
    prev: async () => {
      if (loading) return;
      const api = ref.current?.getApi();
      if (!api) return;
      setLoading(true);
      await setMonthData(-1);
      api.prev();
      setLoading(false);
    },
    prevYear: async () => {
      if (loading) return;
      const api = ref.current?.getApi();
      if (!api) return;
      setLoading(true);
      await setMonthData(-12);
      const targetDate = api.getDate();
      targetDate.setFullYear(targetDate.getFullYear() - 1);
      api.gotoDate(targetDate);
      setLoading(false);
    },
  };

  useEffect(() => {
    setLoading(true);
    setMonthData(0).then(() => {
      setLoading(false);
    });
  }, []);

  return { ref, currentMonth, calendarEvents, workTimeSum, move, loading, holidays, holidayGrids };
};

const convertToGrid = (year: number, monthIndex: number, date: number) => {
  const target = dayjs(`${year}-${monthIndex + 1}-${date}`);
  const firstDay = target.startOf('month').day();
  const row = Math.floor((firstDay + date - 1) / 7) + 1;
  const column = target.day() + 1;
  return { row, column };
};
