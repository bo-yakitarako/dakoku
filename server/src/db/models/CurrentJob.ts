import { Model } from '@/db/Model';

export class CurrentJob extends Model<CurrentJob.Data> {
  protected static _tableName = 'current_jobs';

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
