export const MAX_ATTEMPTS = 3;

const BACKOFF_MINUTES = [5, 15, 45];

export function shouldRetry(attemptCount: number) {
  return attemptCount < MAX_ATTEMPTS;
}

export function getBackoffMs(attemptCount: number) {
  const minutes = BACKOFF_MINUTES[attemptCount] ?? BACKOFF_MINUTES[BACKOFF_MINUTES.length - 1];
  return minutes * 60 * 1000;
}
