import dayjs from 'dayjs';
import jwt, { JwtPayload } from 'jsonwebtoken';

type TokenPayload = {
  sub: string;
  email: string;
};

const accessTokenExpiresIn = '15m';
const refreshTokenExpiresInSeconds = 60 * 60 * 24 * 7;
const refreshTokenExpiresIn = '7d';

function getAccessSecret() {
  const secret = process.env.SERVER_JWT_SECRET;
  if (!secret) {
    throw new Error('SERVER_JWT_SECRET is not set');
  }
  return secret;
}

function getRefreshSecret() {
  const secret = process.env.SERVER_REFRESH_SECRET;
  if (!secret) {
    throw new Error('SERVER_REFRESH_SECRET is not set');
  }
  return secret;
}

export function createAccessToken(payload: TokenPayload) {
  return jwt.sign(payload, getAccessSecret(), {
    expiresIn: accessTokenExpiresIn,
  });
}

export function createRefreshToken(payload: TokenPayload) {
  return jwt.sign(payload, getRefreshSecret(), {
    expiresIn: refreshTokenExpiresIn,
  });
}

function toPayload(decoded: string | JwtPayload): TokenPayload {
  if (typeof decoded === 'string') {
    throw new Error('Invalid token payload');
  }
  if (!decoded.sub || !decoded.email) {
    throw new Error('Invalid token payload');
  }
  return {
    sub: String(decoded.sub),
    email: String(decoded.email),
  };
}

export function verifyAccessToken(token: string) {
  const decoded = jwt.verify(token, getAccessSecret());
  return toPayload(decoded);
}

export function verifyRefreshToken(token: string) {
  const decoded = jwt.verify(token, getRefreshSecret());
  return toPayload(decoded);
}

export function getRefreshCookieMaxAge() {
  return refreshTokenExpiresInSeconds;
}

export function getAccessTokenExpiresAt() {
  return dayjs().add(15, 'minute').toISOString();
}
