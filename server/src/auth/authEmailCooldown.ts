import dayjs from 'dayjs';
import { User } from '@/db/models/User';

export const authEmailCooldownMs = 60 * 1000;
export const authEmailCooldownMessage = '送信後1分以内はメールの再送はできません';

export type AuthEmailCooldown = {
  canSend: boolean;
  cooldownUntil: number;
  retryAfterSeconds: number;
};

export const normalizeEmail = (email: string) => email.trim().toLowerCase();

export const getAuthEmailCooldown = (
  lastSentAt: dayjs.ConfigType | null | undefined,
): AuthEmailCooldown => {
  const sentAt = lastSentAt ? dayjs(lastSentAt) : null;
  if (!sentAt) {
    return {
      canSend: true,
      cooldownUntil: dayjs().add(authEmailCooldownMs, 'millisecond').valueOf(),
      retryAfterSeconds: 0,
    };
  }

  const cooldownUntil = sentAt.add(authEmailCooldownMs, 'millisecond');
  const remainingMs = cooldownUntil.diff(dayjs());
  if (remainingMs <= 0) {
    return {
      canSend: true,
      cooldownUntil: cooldownUntil.valueOf(),
      retryAfterSeconds: 0,
    };
  }

  return {
    canSend: false,
    cooldownUntil: cooldownUntil.valueOf(),
    retryAfterSeconds: Math.ceil(remainingMs / 1000),
  };
};

export const createAuthEmailCooldownPayload = (cooldownUntil: number, message?: string) => ({
  ...(message ? { message } : {}),
  cooldownUntil,
});

export const markAuthEmailSent = async (user: User) => {
  const sentAt = new Date();
  await user.update({
    lastAuthEmailSentAt: sentAt,
  });
  return sentAt.valueOf() + authEmailCooldownMs;
};
