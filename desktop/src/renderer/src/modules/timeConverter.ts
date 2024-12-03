export const convertTime = (milliSecondsTime: number) => {
  const seconds = Math.floor(milliSecondsTime / 1000);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainedSeconds = seconds % 60;
  return `${zeroPad(hours)}:${zeroPad(minutes)}:${zeroPad(remainedSeconds)}`;
};

const zeroPad = (num: number) => num.toString().padStart(2, '0');

export const parseWorkTime = (times: number[]) => {
  let [workTime, restTime] = [0, 0];
  const calcTimes = [...times, Date.now()];
  for (let i = 0; i < times.length; i += 1) {
    const interval = calcTimes[i + 1] - calcTimes[i];
    if (i % 2 === 0) {
      workTime += interval;
    } else {
      restTime += interval;
    }
  }
  return { workTime, restTime };
};
