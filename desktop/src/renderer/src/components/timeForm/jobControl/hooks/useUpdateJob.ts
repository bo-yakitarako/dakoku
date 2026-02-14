import { useSetAtom } from 'jotai';
import { JobData } from '../../../../../../preload/dataType';
import {
  currentJobAtom,
  isWorksLoadingAtom,
  jobsAtom,
  workSetSelector,
} from '../../../../modules/store';

export const useUpdateJob = () => {
  const setIsLoading = useSetAtom(isWorksLoadingAtom);
  const setWorks = useSetAtom(workSetSelector);
  const setCurrentJob = useSetAtom(currentJobAtom);
  const setJobs = useSetAtom(jobsAtom);

  return (jobData: JobData) => {
    setCurrentJob(jobData.currentJob);
    setJobs(jobData.jobs);
    setIsLoading(true);
    window.api.getTodayWorks().then((works) => setWorks(works));
  };
};
