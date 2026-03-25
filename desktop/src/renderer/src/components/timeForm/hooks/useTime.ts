import { useAtom, useAtomValue } from 'jotai';
import {
  countAtom,
  isWorksLoadingAtom,
  worksAtom,
  workStatusAtom,
} from '@/renderer/src/modules/store';
import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import { useUpdateTimes } from '@/renderer/src/components/timeForm/hooks/useUpdateTimes';
import { parseWorkTime } from '@/commonUtility/utils';

export const useTime = () => {
  const workStatus = useAtomValue(workStatusAtom);
  const [works, setWorks] = useAtom(worksAtom);
  const [count, setCount] = useAtom(countAtom);
  const [preDate, setPreDate] = useState(dayjs());
  const [isLoading, setIsLoading] = useAtom(isWorksLoadingAtom);
  const updateTimes = useUpdateTimes();

  const start = () => updateTimes('working');
  const pause = () => updateTimes('resting');

  const stop = async () => {
    setIsLoading(true);
    const index = works.length - 1;
    const actedAt = Date.now();
    await window.api.registerTime({ index, actedAt, workStatus: 'workOff' });
    await updateTimes('workOff');
  };

  useEffect(() => {
    const interval = window.setInterval(async () => {
      if (workStatus === 'workOff') {
        return;
      }
      const currentDate = dayjs();
      if (preDate.date() !== currentDate.date()) {
        const dayEndTime = preDate.endOf('day').valueOf();
        await window.api.registerTime({
          index: works.length - 1,
          actedAt: dayEndTime,
          workStatus: 'workOff',
        });
        if (workStatus === 'resting') {
          await updateTimes('workOff');
        } else {
          const syncedWorks = await window.api.registerTime({
            index: 0,
            actedAt: currentDate.valueOf(),
            workStatus: 'working',
          });
          setWorks(syncedWorks);
        }
        setPreDate(currentDate);
        return;
      }
      setPreDate(currentDate);
      setCount(parseWorkTime(works));
    }, 100);
    return () => {
      window.clearInterval(interval);
    };
  }, [works, workStatus, preDate]);

  useEffect(() => {
    if (workStatus !== 'workOff') {
      setIsLoading(false);
      return;
    }
    window.api.getTodayWorks().then((todayWorks) => {
      setWorks(todayWorks);
      setCount(parseWorkTime(todayWorks));
      setIsLoading(false);
    });
  }, [workStatus]);

  useEffect(() => {
    if (workStatus === 'workOff') {
      return;
    }
    const lastSavedTime = works.slice(-1)[0].slice(-1)[0];
    const now = dayjs();
    if (now.isSame(lastSavedTime, 'day')) {
      return;
    }
    const registeringDayEndTime = dayjs(lastSavedTime).endOf('day').valueOf();
    window.api
      .registerTime({
        index: works.length - 1,
        actedAt: registeringDayEndTime,
        workStatus: 'workOff',
      })
      .then(async () => {
        if (workStatus === 'resting') {
          setIsLoading(true);
          setCount({ workTime: 0, restTime: 0 });
          await updateTimes('workOff');
          return;
        }
        const syncedWorks = await window.api.registerTime({
          index: 0,
          actedAt: now.startOf('day').valueOf(),
          workStatus: 'working',
        });
        setWorks(syncedWorks);
      });
  }, []);

  return {
    start,
    pause,
    stop,
    count,
    isLoading,
    workStatus,
  };
};
