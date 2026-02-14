import { isWorksLoadingAtom, worksAtom, workStatusAtom } from '@renderer/modules/store';
import { useCallback } from 'react';
import { useAtom, useSetAtom } from 'jotai';
import { WorkStatus } from 'src/preload/dataType';

export const useUpdateTimes = () => {
  const [workStatus, setWorkStatus] = useAtom(workStatusAtom);
  const [works, setWorks] = useAtom(worksAtom);
  const setIsLoading = useSetAtom(isWorksLoadingAtom);

  return useCallback(
    async (nextWorkStatus: WorkStatus) => {
      if (nextWorkStatus === 'workOff') {
        await window.api.setTimeState();
        setWorks([]);
        setWorkStatus('workOff');
        return;
      }
      setIsLoading(true);
      if (workStatus === 'workOff') {
        const nextWorks = [...works, [Date.now()]];
        await window.api.setTimeState({ status: 'working', works: nextWorks });
        setWorks(nextWorks);
        setWorkStatus('working');
        return;
      }
      const lastWork = [...works[works.length - 1], Date.now()];
      const nextWorks = [...works.slice(0, works.length - 1), lastWork];
      await window.api.setTimeState({ status: nextWorkStatus, works: nextWorks });
      setWorks(nextWorks);
      setWorkStatus(nextWorkStatus);
      setIsLoading(false);
    },
    [workStatus, works],
  );
};
