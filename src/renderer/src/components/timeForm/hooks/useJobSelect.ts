import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';
import { canJobControlAtom, currentJobAtom, jobsAtom } from '../../../modules/store';
import { SelectChangeEvent } from '@mui/material';

export const useJobSelect = () => {
  const jobs = useRecoilValue(jobsAtom);
  const [currentJob, setCurrentJob] = useRecoilState(currentJobAtom);
  const setCanJobControl = useSetRecoilState(canJobControlAtom);
  const jobIdValue = currentJob?.jobId;

  const onChange = async (e: SelectChangeEvent<string>) => {
    setCanJobControl(false);
    e.preventDefault();
    const jobId = e.target.value;
    const changedJob = await window.api.changeCurrentJob(jobId);
    setCurrentJob(changedJob);
    setCanJobControl(true);
  };

  return { jobs, jobIdValue, onChange };
};
