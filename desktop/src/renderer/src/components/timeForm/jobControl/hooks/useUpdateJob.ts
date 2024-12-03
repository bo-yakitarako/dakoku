import { useSetRecoilState } from 'recoil';
import { JobData } from '../../../../../../preload/dataType';
import {
  currentJobAtom,
  isWorksLoadingAtom,
  jobsAtom,
  workSetSelector,
} from '../../../../modules/store';

export const useUpdateJob = () => {
  const setIsLoading = useSetRecoilState(isWorksLoadingAtom);
  const setWorks = useSetRecoilState(workSetSelector);
  const setCurrentJob = useSetRecoilState(currentJobAtom);
  const setJobs = useSetRecoilState(jobsAtom);

  return (jobData: JobData) => {
    setCurrentJob(jobData.currentJob);
    setJobs(jobData.jobs);
    setIsLoading(true);
    window.api.getTodayWorks().then((works) => setWorks(works));
  };
};
