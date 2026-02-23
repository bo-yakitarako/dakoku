import { Model } from '@/db/Model';

export class Job extends Model<Job.Data> {
  protected static _tableName = 'jobs';

  public get userId() {
    return this._data.userId;
  }

  public get name() {
    return this._data.name;
  }
}

export namespace Job {
  export type Data = {
    userId: string;
    name: string;
  };
}
