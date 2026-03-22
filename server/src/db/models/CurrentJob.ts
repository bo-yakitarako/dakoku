import { Model } from '@/db/Model';

export class CurrentJob extends Model<CurrentJob.Data> {
  protected static _tableName = 'currentJobs' as const;

  public get userId() {
    return this._data.userId;
  }

  public get jobId() {
    return this._data.jobId;
  }
}

export namespace CurrentJob {
  export type Data = {
    userId: string;
    jobId: string | null;
  };
}
