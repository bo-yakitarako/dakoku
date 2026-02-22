import { useEffect } from 'react';
import { useAtom } from 'jotai';
import { canOpenCalendarAtom } from '@/renderer/src/modules/store';

export const useOpenCalendar = () => {
  const [canOpen, setCanOpen] = useAtom(canOpenCalendarAtom);

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
