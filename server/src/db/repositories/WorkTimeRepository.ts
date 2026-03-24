import dayjs, { Dayjs } from 'dayjs';
import { and, asc, eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { workTimes } from '@/db/schema';

type WorkTimeRow = {
  job_id: string;
  year: number;
  month: number;
  date: number;
  index: number;
  acted_at: Date;
};

type WorkGroup = {
  jobId: string;
  year: number;
  month: number;
  date: number;
  index: number;
  works: number[];
};

export type WorkTimesByJob = Record<string, number[][]>;
export type WorkTimesByJobDate = Record<
  string,
  Record<number, Record<number, Record<number, number[][]>>>
>;

export class WorkTimeRepository {
  public static findTodayByUserId = async (userId: string, now: Dayjs = dayjs()) => {
    return this.findByDate(userId, now.year(), now.month() + 1, now.date());
  };

  public static findByDate = async (userId: string, year: number, month: number, date: number) => {
    const rows = await this.fetchRows(userId, { year, month, date });

    return this.toWorkTimesByJob(rows);
  };

  public static findByMonth = async (userId: string, year: number, month: number) => {
    const rows = await this.fetchRows(userId, { year, month });

    return this.toWorkTimesByJob(rows);
  };

  public static findByMonthGroupedByDate = async (userId: string, year: number, month: number) => {
    const rows = await this.fetchRows(userId, { year, month });

    return this.toWorkTimesByJobDate(rows);
  };

  private static fetchRows = async (
    userId: string,
    filter?: { year?: number; month?: number; date?: number },
  ) => {
    const conditions = [eq(workTimes.userId, userId)];
    if (filter?.year !== undefined) {
      conditions.push(eq(workTimes.year, filter.year));
    }
    if (filter?.month !== undefined) {
      conditions.push(eq(workTimes.month, filter.month));
    }
    if (filter?.date !== undefined) {
      conditions.push(eq(workTimes.date, filter.date));
    }

    const rows = await db
      .select({
        job_id: workTimes.jobId,
        year: workTimes.year,
        month: workTimes.month,
        date: workTimes.date,
        index: workTimes.index,
        acted_at: workTimes.actedAt,
      })
      .from(workTimes)
      .where(and(...conditions))
      .orderBy(asc(workTimes.createdAt));

    return rows as WorkTimeRow[];
  };

  private static toWorkTimesByJob = (rows: WorkTimeRow[]): WorkTimesByJob => {
    const grouped = this.groupRows(rows);
    return grouped.reduce<WorkTimesByJob>((pre, group) => {
      if (!pre[group.jobId]) {
        pre[group.jobId] = [];
      }
      pre[group.jobId].push(group.works);
      return pre;
    }, {});
  };

  private static toWorkTimesByJobDate = (rows: WorkTimeRow[]): WorkTimesByJobDate => {
    const grouped = this.groupRows(rows);
    return grouped.reduce<WorkTimesByJobDate>((pre, group) => {
      if (!pre[group.jobId]) {
        pre[group.jobId] = {};
      }
      if (!pre[group.jobId][group.year]) {
        pre[group.jobId][group.year] = {};
      }
      if (!pre[group.jobId][group.year][group.month]) {
        pre[group.jobId][group.year][group.month] = {};
      }
      if (!pre[group.jobId][group.year][group.month][group.date]) {
        pre[group.jobId][group.year][group.month][group.date] = [];
      }
      pre[group.jobId][group.year][group.month][group.date].push(group.works);
      return pre;
    }, {});
  };

  private static groupRows = (rows: WorkTimeRow[]) => {
    const map = new Map<string, WorkGroup>();

    rows.forEach((row) => {
      const key = `${row.job_id}:${row.year}:${row.month}:${row.date}:${row.index}`;
      const unix = dayjs(row.acted_at).valueOf();
      const current = map.get(key);
      if (current) {
        current.works.push(unix);
        return;
      }

      map.set(key, {
        jobId: row.job_id,
        year: row.year,
        month: row.month,
        date: row.date,
        index: row.index,
        works: [unix],
      });
    });

    return [...map.values()].map((group) => ({
      ...group,
      works: [...group.works].sort((a, b) => a - b),
    }));
  };
}
