import { Model } from '@/db/Model';
import dayjs from 'dayjs';

export class Account extends Model<Account.Data> {
  protected static _tableName = 'accounts' as const;

  public get accountId() {
    return this._data.accountId;
  }

  public get providerId() {
    return this._data.providerId;
  }

  public get userId() {
    return this._data.userId;
  }

  public get accessToken() {
    return this._data.accessToken;
  }

  public get refreshToken() {
    return this._data.refreshToken;
  }

  public get idToken() {
    return this._data.idToken;
  }

  public get accessTokenExpiresAt() {
    if (!this._data.accessTokenExpiresAt) {
      return null;
    }
    return dayjs(this._data.accessTokenExpiresAt);
  }

  public get refreshTokenExpiresAt() {
    if (!this._data.refreshTokenExpiresAt) {
      return null;
    }
    return dayjs(this._data.refreshTokenExpiresAt);
  }

  public get scope() {
    return this._data.scope;
  }

  public get password() {
    return this._data.password;
  }
}

export namespace Account {
  export type Data = {
    accountId: string;
    providerId: string;
    userId: string;
    accessToken?: string | null;
    refreshToken?: string | null;
    idToken?: string | null;
    accessTokenExpiresAt?: Date | null;
    refreshTokenExpiresAt?: Date | null;
    scope?: string | null;
    password?: string | null;
  };
}
