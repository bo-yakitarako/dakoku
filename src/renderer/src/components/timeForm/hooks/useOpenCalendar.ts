import { useEffect, useState } from 'react';

export const useOpenCalendar = () => {
  const [canOpen, setCanOpen] = useState(true);

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
