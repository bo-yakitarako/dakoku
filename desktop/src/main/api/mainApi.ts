import { WorkStatus } from '@/preload/dataType';
import * as http from '@/main/http';

type Job = {
  id: string;
  name: string;
};

type CurrentWork = {
  jobId: string;
  status: WorkStatus;
  works: number[][];
} | null;

type WorkTimesByJob = Record<string, number[][]>;

export type PostTimeBody = {
  jobId: string;
  index: number;
  actedAt: number;
  workStatus: 'working' | 'resting' | 'workOff';
};

const ensureData = <T>(response: http.HttpResponse<T>, fallback: T): T => {
  return response.data ?? fallback;
};

export const getJobs = async () => {
  const response = await http.post<Job[]>('/main/jobs');
  return ensureData(response, []);
};

export const getWorkTimes = async () => {
  const response = await http.post<WorkTimesByJob>('/main/workTimes');
  return ensureData(response, {});
};

export const getCurrent = async () => {
  const response = await http.post<CurrentWork>('/main/current');
  return ensureData(response, null);
};

export const registerJob = async (name: string) => {
  const response = await http.post<Job[]>('/main/registerJob', {
    form: { name },
  });
  return ensureData(response, []);
};

export const editJob = async (jobId: string, name: string) => {
  const response = await http.post<Job[]>('/main/editJob', {
    form: { jobId, name },
  });
  return ensureData(response, []);
};

export const deleteJob = async (jobId: string) => {
  const response = await http.post<Job[]>('/main/deleteJob', {
    form: { jobId },
  });
  return ensureData(response, []);
};

export const postTime = async (body: PostTimeBody) => {
  const response = await http.post<WorkTimesByJob>('/main/postTime', {
    form: {
      jobId: body.jobId,
      index: `${body.index}`,
      actedAt: `${body.actedAt}`,
      workStatus: body.workStatus,
    },
  });
  return ensureData(response, {});
};
