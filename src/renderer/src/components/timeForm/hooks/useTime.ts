import { useRecoilState } from 'recoil';
import { WorkStatus, countAtom, timesAtom, workStatusAtom } from '../../../modules/store';
import { useEffect, useState } from 'react';
import { parseWorkTime } from '../../../modules/timeConverter';
import dayjs from 'dayjs';

export const useTime = () => {
  const [workStatus, setWorkStatus] = useRecoilState(workStatusAtom);
  const [times, setTimes] = useRecoilState(timesAtom);
  const [count, setCount] = useRecoilState(countAtom);
  const [savedCount, setSavedCount] = useState(count);
  const [preDate, setPreDate] = useState(dayjs());
  const [showRequiredAlert, setShowRequiredAlert] = useState(false);
  const [requiredTimeText, setRequiredTimeText] = useState('');

  const start = async () => {
    const requiredTimeText = createRequiredTimeText(times);
    if (requiredTimeText !== '') {
      setRequiredTimeText(`あと${requiredTimeText}は休んでもらわんとな...`);
      setShowRequiredAlert(true);
      return;
    }
    if (workStatus === 'workOff') {
      const saved = await window.api.getTodayWorkTime();
      setCount(saved);
      setSavedCount(saved);
      localStorage.count = JSON.stringify(saved);
    }
    setWorkStatus('working');
    const updatedTimes = [...times, Date.now()];
    setTimes(updatedTimes);
    localStorage.times = JSON.stringify(updatedTimes);
  };

  const pause = () => {
    const requiredTimeText = createRequiredTimeText(times);
    if (requiredTimeText !== '') {
      setRequiredTimeText(`あと${requiredTimeText}くらいは頑張ろうぜ`);
      setShowRequiredAlert(true);
      return;
    }
    setWorkStatus('resting');
    const updatedTimes = [...times, Date.now()];
    setTimes(updatedTimes);
    localStorage.times = JSON.stringify(updatedTimes);
  };

  const stop = () => {
    if (workStatus === 'working') {
      const requiredTimeText = createRequiredTimeText(times);
      if (requiredTimeText !== '') {
        setRequiredTimeText(`${requiredTimeText}だけはやってみよ？`);
        setShowRequiredAlert(true);
        return;
      }
    }
    setWorkStatus('workOff');
    localStorage.removeItem('times');
    localStorage.removeItem('count');
    let registerTimes = [...times];
    if (times.length % 2 === 1) {
      registerTimes = [...times, Date.now()];
    }
    window.api.registerWorkTime(registerTimes);
    setCount({ workTime: 0, restTime: 0 });
    setTimes([]);
  };

  useEffect(() => {
    const interval = window.setInterval(async () => {
      const currentDate = dayjs();
      if (preDate.date() !== currentDate.date() && workStatus !== 'workOff') {
        let registerTimes = [...times];
        if (times.length % 2 === 1) {
          const dayEndTime = preDate.endOf('day').valueOf();
          registerTimes = [...times, dayEndTime];
        }
        window.api.registerWorkTime(registerTimes);
        localStorage.removeItem('count');
        localStorage.removeItem('times');
        setCount({ workTime: 0, restTime: 0 });
        if (workStatus === 'resting') {
          setWorkStatus('workOff');
          setTimes([]);
        } else {
          const now = currentDate.valueOf();
          setTimes([now]);
          localStorage.times = JSON.stringify([now]);
        }
        setPreDate(currentDate);
        return;
      }
      setPreDate(currentDate);
      const { workTime, restTime } = parseWorkTime(times);
      setCount({
        workTime: savedCount.workTime + workTime,
        restTime: savedCount.restTime + restTime,
      });
    }, 100);
    return () => {
      window.clearInterval(interval);
    };
  }, [times, workStatus, preDate]);

  useEffect(() => {
    if (workStatus === 'workOff') {
      return;
    }
    const lastSavedTime = times.slice(-1)[0];
    const now = dayjs();
    if (now.isSame(lastSavedTime, 'day')) {
      return;
    }
    let registeringTimes = [...times];
    if (times.length % 2 === 1) {
      const registeringDayEndTime = dayjs(lastSavedTime).endOf('day').valueOf();
      registeringTimes = [...times, registeringDayEndTime];
    }
    window.api.registerWorkTime(registeringTimes);
    localStorage.removeItem('times');
    localStorage.removeItem('count');
    if (workStatus === 'resting') {
      setTimes([]);
      setCount({ workTime: 0, restTime: 0 });
      setWorkStatus('workOff');
      return;
    }
    const dayStartTime = now.startOf('day').valueOf();
    setTimes([dayStartTime]);
    localStorage.times = JSON.stringify([dayStartTime]);
  }, []);

  const handleAlertClose = () => setShowRequiredAlert(false);

  return {
    start,
    pause,
    stop,
    count,
    workStatus: workStatus as WorkStatus,
    showRequiredAlert,
    requiredTimeText,
    handleAlertClose,
  };
};

const REQUIRED_TIME = 5 * 60 * 1000; // 5分

const createRequiredTimeText = (times: number[]) => {
  if (times.length === 0) {
    return '';
  }
  const targetTime = times.slice(-1)[0];
  const remainedRequiredTime = REQUIRED_TIME - (Date.now() - targetTime);
  if (remainedRequiredTime < 0) {
    return '';
  }
  const minutes = Math.floor(remainedRequiredTime / 60000);
  const seconds = Math.floor((remainedRequiredTime % 60000) / 1000);
  if (minutes === 0) {
    return `${seconds}秒`;
  }
  return `${minutes}分${seconds}秒`;
};
