import dayjs from 'dayjs';
import { CurrentJob } from '@/db/models/CurrentJob';
import { Job } from '@/db/models/Job';
import { WorkTime } from '@/db/models/WorkTime';
import { WorkTimeRepository } from '@/db/repositories/WorkTimeRepository';
import * as http from '@/http';

type RegisterJobBody = {
  name: string;
};

type EditJobBody = {
  jobId: string;
  name: string;
};

type DeleteJobBody = {
  jobId: string;
};

type PostTimeBody = {
  jobId: string;
  index: string;
  actedAt: string;
  workStatus: string;
};

const parseNonNegativeInt = (value: unknown) => {
  const number = Number(value);
  if (!Number.isInteger(number) || number < 0) {
    return null;
  }
  return number;
};

const listJobs = async (userId: string) => {
  const jobs = await Job.findMany({ userId });
  return jobs
    .sort((a, b) => a.createdAt.valueOf() - b.createdAt.valueOf())
    .map(({ id, name }) => ({ id, name }));
};

const getCurrentWork = async (userId: string, jobId: string) => {
  const now = dayjs();
  const worksByJob = await WorkTimeRepository.findTodayByUserId(userId, now);
  const workTimes = await WorkTime.findMany({
    userId,
    jobId,
    year: now.year(),
    month: now.month() + 1,
    date: now.date(),
  });
  const latestWorkTime = workTimes
    .sort((a, b) => a.createdAt.valueOf() - b.createdAt.valueOf())
    .at(-1);

  return {
    jobId,
    status: latestWorkTime?.status ?? 'workOff',
    works: worksByJob[jobId] ?? [],
  };
};

export const registerMainRoutes = () => {
  http.authPost('/main/jobs', async (c, user, path) => {
    try {
      return c.json(await listJobs(user.id));
    } catch (error) {
      http.logApiError(path, error, { userId: user.id });
      return c.json({ message: 'Failed to fetch jobs' }, 500);
    }
  });

  http.authPost('/main/workTimes', async (c, user, path) => {
    try {
      const workTimes = await WorkTimeRepository.findTodayByUserId(user.id);
      return c.json(workTimes);
    } catch (error) {
      http.logApiError(path, error, { userId: user.id });
      return c.json({ message: 'Failed to fetch work times' }, 500);
    }
  });

  http.authPost('/main/current', async (c, user, path) => {
    try {
      const currentJob = await CurrentJob.find({ userId: user.id });
      if (!currentJob || currentJob.jobId === null) {
        return c.json(null);
      }
      return c.json(await getCurrentWork(user.id, currentJob.jobId));
    } catch (error) {
      http.logApiError(path, error, { userId: user.id });
      return c.json({ message: 'Failed to fetch current work' }, 500);
    }
  });

  http.authPost('/main/registerJob', async (c, user, path) => {
    try {
      const { name } = await http.parseBody<RegisterJobBody>(c, path);
      if (!name) {
        return c.json({ message: 'name is required' }, 400);
      }
      if (name.length > 10) {
        return c.json({ message: 'name must be 10 characters or less' }, 400);
      }

      const createdJob = await Job.create({ userId: user.id, name });
      const current = await CurrentJob.find({ userId: user.id });
      if (!current) {
        await CurrentJob.create({
          userId: user.id,
          jobId: createdJob.id,
        });
      }

      return c.json(await listJobs(user.id));
    } catch (error) {
      http.logApiError(path, error, { userId: user.id });
      return c.json({ message: 'Failed to register job' }, 500);
    }
  });

  http.authPost('/main/editJob', async (c, user, path) => {
    try {
      const { jobId, name } = await http.parseBody<EditJobBody>(c, path);
      if (!jobId || !name) {
        return c.json({ message: 'jobId and name are required' }, 400);
      }
      if (name.length > 10) {
        return c.json({ message: 'name must be 10 characters or less' }, 400);
      }

      const job = await Job.find({ id: jobId, userId: user.id });
      if (!job) {
        return c.json({ message: 'Job not found' }, 404);
      }
      await job.update({ name });

      return c.json(await listJobs(user.id));
    } catch (error) {
      http.logApiError(path, error, { userId: user.id });
      return c.json({ message: 'Failed to edit job' }, 500);
    }
  });

  http.authPost('/main/deleteJob', async (c, user, path) => {
    try {
      const { jobId } = await http.parseBody<DeleteJobBody>(c, path);
      if (!jobId) {
        return c.json({ message: 'jobId is required' }, 400);
      }

      const job = await Job.find({ id: jobId, userId: user.id });
      if (!job) {
        return c.json({ message: 'Job not found' }, 404);
      }

      await job.delete();

      const current = await CurrentJob.find({ userId: user.id });
      if (current && current.jobId === jobId) {
        const jobs = await Job.findMany({ userId: user.id });
        const nextJobId = jobs.length > 0 ? jobs[0].id : null;
        await current.update({ jobId: nextJobId });
      }

      return c.json(await listJobs(user.id));
    } catch (error) {
      http.logApiError(path, error, { userId: user.id });
      return c.json({ message: 'Failed to delete job' }, 500);
    }
  });

  // eslint-disable-next-line complexity
  http.authPost('/main/postTime', async (c, user, path) => {
    try {
      const { jobId, index, actedAt, workStatus } = await http.parseBody<PostTimeBody>(c, path);
      const parsedIndex = parseNonNegativeInt(index);
      const parsedActedAt = Number(actedAt);
      const validStatuses = ['working', 'resting', 'workOff'] as const;
      const status = validStatuses.find((value) => value === workStatus);
      if (!jobId || parsedIndex === null || !Number.isFinite(parsedActedAt) || !status) {
        return c.json({ message: 'Invalid payload' }, 400);
      }

      const job = await Job.find({ id: jobId, userId: user.id });
      if (!job) {
        return c.json({ message: 'Job not found' }, 404);
      }

      const actedAtDayjs = dayjs(parsedActedAt);
      const year = actedAtDayjs.year();
      const month = actedAtDayjs.month() + 1;
      const date = actedAtDayjs.date();
      const targetWorkTimes = await WorkTime.findMany({
        userId: user.id,
        jobId,
        year,
        month,
        date,
        index: parsedIndex,
      });
      const latestTargetWorkTime = targetWorkTimes
        .sort((a, b) => a.createdAt.valueOf() - b.createdAt.valueOf())
        .at(-1);
      const shouldInsert = !(status === 'workOff' && latestTargetWorkTime?.status === 'resting');

      if (shouldInsert) {
        await WorkTime.create({
          userId: user.id,
          jobId,
          year,
          month,
          date,
          index: parsedIndex,
          actedAt: actedAtDayjs.toDate(),
          status,
        });
      }
      await WorkTime.updateAll(
        {
          userId: user.id,
          jobId,
          year,
          month,
          date,
          index: parsedIndex,
        },
        { status },
      );

      const current = await CurrentJob.find({ userId: user.id });
      if (!current) {
        await CurrentJob.create({
          userId: user.id,
          jobId,
        });
      } else if (current.jobId !== jobId) {
        await current.update({ jobId });
      }

      return c.json(await WorkTimeRepository.findTodayByUserId(user.id));
    } catch (error) {
      http.logApiError(path, error, { userId: user.id });
      return c.json({ message: 'Failed to post time' }, 500);
    }
  });
};
