import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import {
  canJobControlAtom,
  currentJobAtom,
  isWorksLoadingAtom,
  jobsAtom,
  workSetSelector,
} from '../../../modules/store';
import { SelectChangeEvent } from '@mui/material';

export const useJobSelect = () => {
  const jobs = useAtomValue(jobsAtom);
  const [currentJob, setCurrentJob] = useAtom(currentJobAtom);
  const setCanJobControl = useSetAtom(canJobControlAtom);
  const setIsLoading = useSetAtom(isWorksLoadingAtom);
  const setWorks = useSetAtom(workSetSelector);
  const jobIdValue = currentJob?.jobId;

  const onChange = async (e: SelectChangeEvent<string>) => {
    setCanJobControl(false);
    e.preventDefault();
    const jobId = e.target.value;
    const changedJob = await window.api.changeCurrentJob(jobId);
    setCurrentJob(changedJob);
    setIsLoading(true);
    setWorks(await window.api.getTodayWorks());
    setCanJobControl(true);
  };

  return { jobs, jobIdValue, onChange };
};
