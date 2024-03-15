import { useSetRecoilState } from 'recoil';
import { JobData } from '../../../../../../preload/dataType';
import { currentJobAtom, jobsAtom } from '../../../../modules/store';

export const useUpdateJob = () => {
  const setCurrentJob = useSetRecoilState(currentJobAtom);
  const setJobs = useSetRecoilState(jobsAtom);

  return async (jobData: JobData) => {
    setCurrentJob(jobData.currentJob);
    setJobs(jobData.jobs);
  };
};
