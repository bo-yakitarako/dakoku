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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function toURLParams<T extends { [key in any]: any }>(object: T) {
  const keys = Object.keys(object);
  return keys
    .map((key) => {
      if (typeof object[key] === 'string') {
        return `${key}=${object[key]}`;
      }
      return `${key}=${JSON.stringify(object[key])}`;
    })
    .join('&');
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getParams<T extends { [key in any]: any }>(url: string): T {
  const paramsString = url.split('?')[1];
  if (!paramsString) {
    return {} as T;
  }
  return paramsString.split('&').reduce((acc, paramString) => {
    const [key, value] = paramString.split('=');
    try {
      return { ...acc, [key]: JSON.parse(value) };
    } catch {
      return { ...acc, [key]: value };
    }
  }, {} as T);
}
