import { useEffect, useRef, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import { useRecoilState, useSetRecoilState } from 'recoil';
import { calendarDateAtom, monthWorkTimesAtom } from '../../../modules/store';
import dayjs from 'dayjs';
import { EventSourceInput } from '@fullcalendar/core';

export const useCalendarMove = () => {
  const ref = useRef<FullCalendar>(null);
  const [currentDate, setCurrentDate] = useRecoilState(calendarDateAtom);
  const setMonthWorkTimes = useSetRecoilState(monthWorkTimesAtom);
  const [calendarEvents, setCalendarEvents] = useState<EventSourceInput>([]);
  const [workTimeSum, setWorkTimeSum] = useState('');
  const [loading, setLoading] = useState(false);

  const setMonthData = async (monthMove: number) => {
    const nextMonth = dayjs(currentDate).add(monthMove, 'month');
    const { workTimeSum, dates } = await window.api.getMonthWorkTime(
      nextMonth.year(),
      nextMonth.month() + 1,
    );
    setMonthWorkTimes(dates);
    setWorkTimeSum(workTimeSum);
    setCurrentDate(nextMonth.toDate());
    const events = Object.values(dates).map(({ workTime }) => ({ date: new Date(workTime) }));
    setCalendarEvents(events);
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

  return { ref, currentMonth, calendarEvents, workTimeSum, move };
};
