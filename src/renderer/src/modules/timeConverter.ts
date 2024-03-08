export const convertTime = (milliSecondsTime: number) => {
  const seconds = Math.floor(milliSecondsTime / 1000);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainedSeconds = seconds % 60;
  return `${zeroPad(hours)}:${zeroPad(minutes)}:${zeroPad(remainedSeconds)}`;
};

const zeroPad = (num: number) => num.toString().padStart(2, '0');

export const parseWorkTime = (startTimes: number[], pauseTimes: number[]) => {
  const copiedStartTimes = [...startTimes];
  const copiedPauseTimes = [...pauseTimes];
  let prevPauseTime: number | null = null;
  let workTime = 0;
  let pausedTime = 0;
  while (copiedStartTimes.length > 0 && copiedPauseTimes.length > 0) {
    const startTime = copiedStartTimes.splice(0, 1)[0];
    const pauseTime = copiedPauseTimes.splice(0, 1)[0];
    workTime += pauseTime - startTime;
    if (prevPauseTime !== null) {
      pausedTime += startTime - prevPauseTime;
    }
    prevPauseTime = pauseTime;
  }
  if (copiedStartTimes.length > 0) {
    workTime += Date.now() - copiedStartTimes[0];
    if (prevPauseTime !== null) {
      pausedTime += copiedStartTimes[0] - prevPauseTime;
    }
  } else if (prevPauseTime !== null) {
    pausedTime += Date.now() - prevPauseTime;
  }
  return { workTime, pausedTime };
};
