import { useAtom, useAtomValue } from 'jotai';
import { countAtom, isWorksLoadingAtom, worksAtom, workStatusAtom } from '../../../modules/store';
import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import { useUpdateTimes } from './useUpdateTimes';
import { parseWorkTime } from '../../../../../commonUtility/utils';

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
    let stopTimes = [...works[works.length - 1]];
    if (stopTimes.length % 2 === 1) {
      stopTimes = [...stopTimes, Date.now()];
    }
    const registeredTimes = [...works];
    registeredTimes[registeredTimes.length - 1] = stopTimes;
    await window.api.registerWorks(registeredTimes);
    await updateTimes('workOff');
  };

  useEffect(() => {
    const interval = window.setInterval(async () => {
      if (workStatus === 'workOff') {
        return;
      }
      const currentDate = dayjs();
      if (preDate.date() !== currentDate.date()) {
        let stopTimes = [...works[works.length - 1]];
        if (works.length % 2 === 1) {
          const dayEndTime = preDate.endOf('day').valueOf();
          stopTimes = [...stopTimes, dayEndTime];
        }
        const registeredTimes = [...works];
        registeredTimes[registeredTimes.length - 1] = stopTimes;
        await window.api.registerWorks(registeredTimes);
        if (workStatus === 'resting') {
          await updateTimes('workOff');
        } else {
          const firstTimes = [[currentDate.valueOf()]];
          await window.api.setTimeState({ works: firstTimes });
          setWorks(firstTimes);
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
    let stopTimes = [...works.slice(-1)[0]];
    if (works.length % 2 === 1) {
      const registeringDayEndTime = dayjs(lastSavedTime).endOf('day').valueOf();
      stopTimes = [...stopTimes, registeringDayEndTime];
    }
    const registeringTimes = [...works];
    registeringTimes[registeringTimes.length - 1] = stopTimes;
    window.api.registerWorks(registeringTimes).then(async () => {
      if (workStatus === 'resting') {
        setIsLoading(true);
        setCount({ workTime: 0, restTime: 0 });
        await updateTimes('workOff');
        return;
      }
      const dayStartTimes = [[now.startOf('day').valueOf()]];
      await window.api.setTimeState({ works: dayStartTimes });
      setWorks(dayStartTimes);
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
