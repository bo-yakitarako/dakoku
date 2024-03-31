import { useRecoilState } from 'recoil';
import { pauseTimesAtom, playStatusAtom, startTimesAtom } from '../../../modules/store';
import { useEffect, useState } from 'react';
import { parseWorkTime } from '../../../modules/timeConverter';
import dayjs from 'dayjs';

export const useTime = () => {
  const [playStatus, setPlayStatus] = useRecoilState(playStatusAtom);
  const [startTimes, setStartTimes] = useRecoilState(startTimesAtom);
  const [pauseTimes, setPauseTimes] = useRecoilState(pauseTimesAtom);

  const firstTimes = parseWorkTime(startTimes, pauseTimes);
  const [workTime, setWorkTime] = useState(firstTimes.workTime);
  const [pausedTime, setPausedTime] = useState(firstTimes.pausedTime);
  const [preDate, setPreDate] = useState(dayjs());
  const [showRequiredAlert, setShowRequiredAlert] = useState(false);
  const [requiredTimeText, setRequiredTimeText] = useState('');

  const start = async () => {
    let _startTimes = [...startTimes];
    let _pauseTimes = [...pauseTimes];
    if (playStatus === 'stopped') {
      const saved = await window.api.getTodayWorkTime();
      _startTimes = [...saved.startTimes];
      _pauseTimes = [...saved.pauseTimes];
    }
    const requiredTimeText = createRequiredTimeText(_startTimes, _pauseTimes);
    if (requiredTimeText !== '') {
      if (playStatus === 'stopped') {
        setRequiredTimeText(`せっかく退勤したんだし、あと${requiredTimeText}くらいはやめとこうぜ`);
      } else {
        setRequiredTimeText(`あと${requiredTimeText}は休んでもらわんとな...`);
      }
      setShowRequiredAlert(true);
      return;
    } else if (playStatus === 'stopped') {
      localStorage.pauseTimes = JSON.stringify(_pauseTimes);
      setPauseTimes(_pauseTimes);
    }
    setPlayStatus('playing');
    const updatedStartTimes = [..._startTimes, Date.now()];
    setStartTimes(updatedStartTimes);
    localStorage.startTimes = JSON.stringify(updatedStartTimes);
  };

  const pause = () => {
    const requiredTimeText = createRequiredTimeText(startTimes, pauseTimes);
    if (requiredTimeText !== '') {
      setRequiredTimeText(`あと${requiredTimeText}くらいは頑張ろうぜ`);
      setShowRequiredAlert(true);
      return;
    }
    setPlayStatus('paused');
    const updatedPauseTimes = [...pauseTimes, Date.now()];
    setPauseTimes(updatedPauseTimes);
    localStorage.pauseTimes = JSON.stringify(updatedPauseTimes);
  };

  const stop = () => {
    if (playStatus === 'playing') {
      const requiredTimeText = createRequiredTimeText(startTimes, pauseTimes);
      if (requiredTimeText !== '') {
        setRequiredTimeText(`${requiredTimeText}だけはやってみよ？`);
        setShowRequiredAlert(true);
        return;
      }
    }
    setPlayStatus('stopped');
    localStorage.removeItem('startTimes');
    localStorage.removeItem('pauseTimes');
    window.api.registerWorkTime(startTimes, pauseTimes);
    setWorkTime(0);
    setPausedTime(0);
    setStartTimes([]);
    setPauseTimes([]);
  };

  useEffect(() => {
    const interval = window.setInterval(async () => {
      const currentDate = dayjs();
      if (preDate.date() !== currentDate.date() && playStatus !== 'stopped') {
        const dayEndTime = preDate.endOf('day').valueOf();
        window.api.registerWorkTime(startTimes, pauseTimes, dayEndTime);
        localStorage.removeItem('startTimes');
        localStorage.removeItem('pauseTimes');
        setWorkTime(0);
        setPausedTime(0);
        if (playStatus === 'paused') {
          setStartTimes([]);
          setPlayStatus('stopped');
        } else {
          const now = currentDate.valueOf();
          setStartTimes([now]);
          localStorage.startTimes = JSON.stringify([now]);
        }
        setPauseTimes([]);
        setPreDate(currentDate);
        return;
      }
      setPreDate(currentDate);
      const now = parseWorkTime(startTimes, pauseTimes);
      setWorkTime(now.workTime);
      setPausedTime(now.pausedTime);
    }, 100);
    return () => {
      window.clearInterval(interval);
    };
  }, [startTimes, pauseTimes, playStatus, preDate]);

  useEffect(() => {
    if (playStatus === 'stopped') {
      return;
    }
    const lastSavedTime =
      playStatus === 'playing'
        ? startTimes[startTimes.length - 1]
        : pauseTimes[pauseTimes.length - 1];
    const now = dayjs();
    if (now.isSame(lastSavedTime, 'day')) {
      return;
    }
    const dayStartTime = now.startOf('day').valueOf();
    window.api.registerWorkTime(startTimes, pauseTimes, dayStartTime - 1);
    localStorage.removeItem('startTimes');
    localStorage.removeItem('pauseTimes');
    if (playStatus === 'paused') {
      setWorkTime(0);
      setPausedTime(0);
      setStartTimes([]);
      setPauseTimes([]);
      setPlayStatus('stopped');
      return;
    }
    setStartTimes([dayStartTime]);
    localStorage.startTimes = JSON.stringify([dayStartTime]);
    setPauseTimes([]);
  }, []);

  const handleAlertClose = () => setShowRequiredAlert(false);

  return {
    start,
    pause,
    stop,
    workTime,
    pausedTime,
    playStatus,
    showRequiredAlert,
    requiredTimeText,
    handleAlertClose,
  };
};

const REQUIRED_TIME = 5 * 60 * 1000; // 5分

const createRequiredTimeText = (startTimes: number[], pauseTimes: number[]) => {
  if (startTimes.length === 0) {
    return '';
  }
  const targetTIme =
    startTimes.length > pauseTimes.length
      ? startTimes[startTimes.length - 1]
      : pauseTimes[pauseTimes.length - 1];
  const remainedRequiredTime = REQUIRED_TIME - (Date.now() - targetTIme);
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
