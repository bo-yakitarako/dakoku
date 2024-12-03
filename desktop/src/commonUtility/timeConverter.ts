export const convertTime = (milliSecondsTime: number) => {
  const seconds = Math.floor(milliSecondsTime / 1000);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainedSeconds = seconds % 60;
  return `${zeroPad(hours)}:${zeroPad(minutes)}:${zeroPad(remainedSeconds)}`;
};

const zeroPad = (num: number) => num.toString().padStart(2, '0');

export const parseWorkTime = (works: number[][], addNow = true) => {
  let [workTime, restTime] = [0, 0];
  for (let workIndex = 0; workIndex < works.length; workIndex += 1) {
    let calcTimes = [...works[workIndex]];
    if (addNow && workIndex === works.length - 1) {
      calcTimes = [...calcTimes, Date.now()];
    }
    for (let timeIndex = 0; timeIndex < calcTimes.length - 1; timeIndex += 1) {
      const interval = calcTimes[timeIndex + 1] - calcTimes[timeIndex];
      if (timeIndex % 2 === 0) {
        workTime += interval;
      } else {
        restTime += interval;
      }
    }
  }
  return { workTime, restTime };
};
