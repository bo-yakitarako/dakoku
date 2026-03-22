import dayjs from 'dayjs';
import { Model } from '@/db/Model';

export class WorkTime extends Model<WorkTime.Data> {
  protected static _tableName = 'workTimes' as const;

  public get userId() {
    return this._data.userId;
  }

  public get jobId() {
    return this._data.jobId;
  }

  public get year() {
    return this._data.year;
  }

  public get month() {
    return this._data.month;
  }

  public get date() {
    return this._data.date;
  }

  public get index() {
    return this._data.index;
  }

  public get actedAt() {
    return dayjs(this._data.actedAt);
  }

  public get status() {
    return this._data.status;
  }
}

export namespace WorkTime {
  export type Status = 'working' | 'resting' | 'workOff';

  export type Data = {
    userId: string;
    jobId: string;
    year: number;
    month: number;
    date: number;
    index: number;
    actedAt: string;
    status: Status;
  };
}
