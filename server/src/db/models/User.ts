import { Model } from '@/db/Model';
import dayjs from 'dayjs';

export class User extends Model<User.Data> {
  protected static _tableName = 'users' as const;

  public get name() {
    return this._data.name;
  }

  public get email() {
    return this._data.email;
  }

  public get emailVerified() {
    return this._data.emailVerified;
  }

  public get image() {
    return this._data.image;
  }

  public get lastAuthEmailSentAt() {
    if (!this._data.lastAuthEmailSentAt) {
      return null;
    }
    return dayjs(this._data.lastAuthEmailSentAt);
  }
}

export namespace User {
  export type Data = {
    name: string;
    email: string;
    emailVerified: boolean;
    lastAuthEmailSentAt?: Date | null;
    image?: string | null;
  };
}
