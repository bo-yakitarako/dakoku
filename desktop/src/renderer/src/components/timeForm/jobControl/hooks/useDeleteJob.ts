import { useState } from 'react';
import { useRecoilState, useRecoilValue } from 'recoil';
import { canJobControlAtom, currentJobAtom } from '../../../../modules/store';
import { useUpdateJob } from './useUpdateJob';

export const useDeleteJob = () => {
  const [canOpen, setCanJobControl] = useRecoilState(canJobControlAtom);
  const currentJob = useRecoilValue(currentJobAtom);
  const [isOpen, setIsOpen] = useState(false);
  const updateJob = useUpdateJob();

  const toggleDialog = () => {
    setIsOpen((prev) => !prev);
  };

  const deleteJob = async () => {
    setCanJobControl(false);
    const deleted = await window.api.deleteCurrentJob();
    updateJob(deleted);
    setCanJobControl(true);
    setIsOpen(false);
  };

  const jobName = currentJob?.name ?? '';
  return { isOpen, toggleDialog, jobName, canOpen, deleteJob };
};
