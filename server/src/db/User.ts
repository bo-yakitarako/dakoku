import { Model } from './Model';

namespace User {
  export type Data = {
    name: string;
    email: string;
  };
}

export class User extends Model<User.Data> {
  static collectionName = 'users';

  public get name() {
    return this._data.name;
  }

  public get email() {
    return this._data.email;
  }
}
