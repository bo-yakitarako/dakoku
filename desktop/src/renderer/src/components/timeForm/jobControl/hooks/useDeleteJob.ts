import { useState } from 'react';
import { useAtom, useAtomValue } from 'jotai';
import { canJobControlAtom, currentJobAtom } from '@/renderer/src/modules/store';
import { useUpdateJob } from '@/renderer/src/components/timeForm/jobControl/hooks/useUpdateJob';

export const useDeleteJob = () => {
  const [canOpen, setCanJobControl] = useAtom(canJobControlAtom);
  const currentJob = useAtomValue(currentJobAtom);
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
