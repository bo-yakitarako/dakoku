import { useRecoilState } from 'recoil';
import { worksAtom, WorkStatus, workStatusAtom } from '../../../modules/store';
import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import { useUpdateTimes } from './useUpdateTimes';
import { parseWorkTime } from '../../../../../commonUtility/timeConverter';

export const useTime = () => {
  const [workStatus, setWorkStatus] = useRecoilState(workStatusAtom);
  const [works, setWorks] = useRecoilState(worksAtom);
  const [count, setCount] = useState(parseWorkTime(works));
  const [preDate, setPreDate] = useState(dayjs());
  const [isLoading, setIsLoading] = useState(true);
  const updateTimes = useUpdateTimes();

  const updateWorkStatus = (workStatus: WorkStatus) => {
    setWorkStatus(workStatus);
    localStorage.workStatus = workStatus;
  };

  const start = () => {
    updateTimes();
    updateWorkStatus('working');
  };

  const pause = () => {
    updateTimes();
    updateWorkStatus('resting');
  };

  const stop = async () => {
    localStorage.removeItem('works');
    let stopTimes = [...works[works.length - 1]];
    if (stopTimes.length % 2 === 1) {
      stopTimes = [...stopTimes, Date.now()];
    }
    const registeredTimes = [...works];
    registeredTimes[registeredTimes.length - 1] = stopTimes;
    await window.api.registerWorks(registeredTimes);
    setWorks([]);
    setIsLoading(true);
    updateWorkStatus('workOff');
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
        localStorage.removeItem('works');
        if (workStatus === 'resting') {
          updateWorkStatus('workOff');
          setWorks([]);
        } else {
          const firstTimes = [[currentDate.valueOf()]];
          setWorks(firstTimes);
          localStorage.works = JSON.stringify(firstTimes);
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
    window.api.registerWorks(registeringTimes).then(() => {
      localStorage.removeItem('works');
      if (workStatus === 'resting') {
        setIsLoading(true);
        setWorks([]);
        setCount({ workTime: 0, restTime: 0 });
        updateWorkStatus('workOff');
        return;
      }
      const dayStartTimes = [[now.startOf('day').valueOf()]];
      setWorks(dayStartTimes);
      localStorage.works = JSON.stringify(dayStartTimes);
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
