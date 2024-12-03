import { worksAtom, workStatusAtom } from '@renderer/modules/store';
import { useCallback } from 'react';
import { useRecoilValue, useSetRecoilState } from 'recoil';

export const useUpdateTimes = () => {
  const workStatus = useRecoilValue(workStatusAtom);
  const setWorks = useSetRecoilState(worksAtom);
  return useCallback(() => {
    setWorks((works) => {
      if (workStatus === 'workOff') {
        const nextWorks = [...works, [Date.now()]];
        localStorage.works = JSON.stringify(nextWorks);
        return nextWorks;
      }
      const lastWork = [...works[works.length - 1], Date.now()];
      const nextWorks = [...works.slice(0, works.length - 1), lastWork];
      localStorage.works = JSON.stringify(nextWorks);
      return nextWorks;
    });
  }, [workStatus, setWorks]);
};
