import { useEffect, useState } from 'react';
import { useRecoilState, useRecoilValue } from 'recoil';
import * as yup from 'yup';
import { SubmitHandler, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { canJobControlAtom, currentJobAtom } from '../../../../modules/store';
import { useUpdateJob } from './useUpdateJob';

export type NameInputs = { name: string };

export const nameScheme = yup.object().shape({
  name: yup
    .string()
    .required('名前がほしかったんだなぁ...')
    .max(10, 'MAX10文字、そこんとこヨロシク')
    .matches(/[^\s]/, '"空白"を受け入れてやる度量はないよ'),
});

export const useJobRegister = () => {
  const currentJob = useRecoilValue(currentJobAtom);
  const [canOpen, setCanJobControl] = useRecoilState(canJobControlAtom);
  const [isOpen, setIsOpen] = useState(currentJob === null);
  const [loading, setLoading] = useState(false);
  const updateJob = useUpdateJob();

  const { register, handleSubmit, formState, reset } = useForm<NameInputs>({
    resolver: yupResolver(nameScheme),
  });

  const toggleDialog = () => {
    if (currentJob === null) {
      return;
    }
    reset();
    setIsOpen((prev) => !prev);
  };

  const onSubmit: SubmitHandler<NameInputs> = async (data) => {
    setLoading(true);
    setCanJobControl(false);
    const registered = await window.api.registerJob(data.name);
    await updateJob(registered);
    setLoading(false);
    setCanJobControl(true);
    setIsOpen(false);
  };
  const submit = handleSubmit(onSubmit);

  useEffect(() => {
    if (currentJob === null) {
      setIsOpen(true);
    }
  }, [currentJob]);

  const showCancel = currentJob !== null;
  const props = register('name');
  const error = {
    hasError: formState.errors.name !== undefined,
    message: formState.errors.name?.message,
  };
  return { isOpen, canOpen, toggleDialog, showCancel, submit, loading, props, error };
};
