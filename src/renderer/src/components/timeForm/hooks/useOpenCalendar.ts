import { useEffect } from 'react';
import { useRecoilState } from 'recoil';
import { canOpenCalendarAtom } from '../../../modules/store';

export const useOpenCalendar = () => {
  const [canOpen, setCanOpen] = useRecoilState(canOpenCalendarAtom);

  useEffect(() => {
    const closedCalendar = window.ipcRenderer.on('closedCalendar', () => {
      setCanOpen(true);
    });
    return () => {
      closedCalendar.removeAllListeners('closedCalendar');
    };
  }, []);

  const openCalendar = () => {
    window.api.openCalendar();
    setCanOpen(false);
  };

  return { canOpen, openCalendar };
};
