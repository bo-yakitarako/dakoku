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
  const [preDate, setPreDate] = useState(new Date().getDate());

  const start = async () => {
    let _startTimes = [...startTimes];
    if (playStatus === 'stopped') {
      const saved = await window.api.getTodayWorkTime();
      _startTimes = [...saved.startTimes];
      localStorage.pauseTimes = JSON.stringify(saved.pauseTimes);
      setPauseTimes(saved.pauseTimes);
    }
    setPlayStatus('playing');
    const updatedStartTimes = [..._startTimes, Date.now()];
    setStartTimes(updatedStartTimes);
    localStorage.startTimes = JSON.stringify(updatedStartTimes);
  };

  const pause = () => {
    setPlayStatus('paused');
    const updatedPauseTimes = [...pauseTimes, Date.now()];
    setPauseTimes(updatedPauseTimes);
    localStorage.pauseTimes = JSON.stringify(updatedPauseTimes);
  };

  const stop = () => {
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
      const currentDate = new Date().getDate();
      if (preDate !== currentDate && playStatus !== 'stopped') {
        window.api.registerWorkTime(startTimes, pauseTimes);
        localStorage.removeItem('startTimes');
        localStorage.removeItem('pauseTimes');
        setWorkTime(0);
        setPausedTime(0);
        const now = Date.now();
        setStartTimes([now]);
        localStorage.startTimes = JSON.stringify([now]);
        if (playStatus === 'paused') {
          setPauseTimes([now]);
          localStorage.pauseTimes = JSON.stringify([now]);
        } else {
          setPauseTimes([]);
        }
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

  return {
    start,
    pause,
    stop,
    workTime,
    pausedTime,
    playStatus,
  };
};
