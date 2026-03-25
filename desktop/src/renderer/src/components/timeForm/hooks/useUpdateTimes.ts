import { isWorksLoadingAtom, worksAtom, workStatusAtom } from '@/renderer/src/modules/store';
import { useCallback } from 'react';
import { useAtom, useSetAtom } from 'jotai';
import { WorkStatus } from '@/preload/dataType';

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

      const actedAt = Date.now();
      if (workStatus === 'workOff') {
        const index = works.length;
        const syncedWorks = await window.api.registerTime({
          index,
          actedAt,
          workStatus: 'working',
        });
        setWorks(syncedWorks);
        setWorkStatus('working');
        setIsLoading(false);
        return;
      }

      const index = works.length - 1;
      const syncedWorks = await window.api.registerTime({
        index,
        actedAt,
        workStatus: nextWorkStatus,
      });
      setWorks(syncedWorks);
      setWorkStatus(nextWorkStatus);
      setIsLoading(false);
    },
    [workStatus, works, setIsLoading, setWorkStatus],
  );
};
