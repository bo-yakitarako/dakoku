import { useState } from 'react';
import { useRecoilState, useRecoilValue } from 'recoil';
import { SubmitHandler, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { canJobControlAtom, currentJobAtom } from '../../../../modules/store';
import { NameInputs, nameScheme } from './useJobRegister';
import { useUpdateJob } from './useUpdateJob';

export const useRenameJob = () => {
  const [canOpen, setCanJobControl] = useRecoilState(canJobControlAtom);
  const currentJob = useRecoilValue(currentJobAtom);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const updateJob = useUpdateJob();

  const { register, handleSubmit, formState, reset } = useForm<NameInputs>({
    resolver: yupResolver(nameScheme),
  });

  const toggleDialog = () => {
    reset();
    setIsOpen((prev) => !prev);
  };

  const onSubmit: SubmitHandler<NameInputs> = async (data) => {
    setLoading(true);
    setCanJobControl(false);
    const renamed = await window.api.renameCurrentJob(data.name);
    await updateJob(renamed);
    setLoading(false);
    setCanJobControl(true);
    setIsOpen(false);
  };
  const submit = handleSubmit(onSubmit);

  const props = register('name');
  const error = {
    hasError: formState.errors.name !== undefined,
    message: formState.errors.name?.message,
  };
  const jobName = currentJob?.name ?? '';
  return { isOpen, canOpen, toggleDialog, submit, loading, props, error, jobName };
};
