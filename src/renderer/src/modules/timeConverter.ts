export const convertTime = (milliSecondsTime: number) => {
  const seconds = Math.floor(milliSecondsTime / 1000);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainedSeconds = seconds % 60;
  return `${zeroPad(hours)}:${zeroPad(minutes)}:${zeroPad(remainedSeconds)}`;
};

const zeroPad = (num: number) => num.toString().padStart(2, '0');
