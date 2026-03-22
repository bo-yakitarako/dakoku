import { Model } from '@/db/Model';

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
}

export namespace User {
  export type Data = {
    name: string;
    email: string;
    emailVerified: boolean;
    image?: string | null;
  };
}
