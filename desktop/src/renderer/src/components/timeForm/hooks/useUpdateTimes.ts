import { isWorksLoadingAtom, worksAtom, workStatusAtom } from '@renderer/modules/store';
import { useCallback } from 'react';
import { useRecoilState, useSetRecoilState } from 'recoil';
import { WorkStatus } from 'src/preload/dataType';

export const useUpdateTimes = () => {
  const [workStatus, setWorkStatus] = useRecoilState(workStatusAtom);
  const [works, setWorks] = useRecoilState(worksAtom);
  const setIsLoading = useSetRecoilState(isWorksLoadingAtom);

  return useCallback(
    async (nextStatus: WorkStatus) => {
      if (nextStatus === 'workOff') {
        await window.api.setTimeState({ status: 'workOff', works: [] });
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
      await window.api.setTimeState({ status: nextStatus, works: nextWorks });
      setWorks(nextWorks);
      setWorkStatus(nextStatus);
      setIsLoading(false);
    },
    [workStatus, works],
  );
};
