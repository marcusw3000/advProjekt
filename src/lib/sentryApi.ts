export type SentryIssue = {
  id: string;
  title: string;
  culprit: string;
  level: string;
  count: string;
  userCount: number;
  lastSeen: string;
  permalink: string;
};

export async function getRecentSentryIssues(): Promise<SentryIssue[] | null> {
  const { SENTRY_AUTH_TOKEN, SENTRY_ORG, SENTRY_PROJECT } = process.env;
  if (!SENTRY_AUTH_TOKEN || !SENTRY_ORG || !SENTRY_PROJECT) return null;

  const res = await fetch(
    `https://sentry.io/api/0/projects/${SENTRY_ORG}/${SENTRY_PROJECT}/issues/?query=is:unresolved&statsPeriod=14d&limit=10`,
    {
      headers: { Authorization: `Bearer ${SENTRY_AUTH_TOKEN}` },
      cache: "no-store",
    }
  );

  if (!res.ok) return null;

  const data: unknown = await res.json();
  if (!Array.isArray(data)) return null;

  return (data as SentryIssue[]).map((issue) => ({
    id: issue.id,
    title: issue.title,
    culprit: issue.culprit,
    level: issue.level,
    count: issue.count,
    userCount: issue.userCount,
    lastSeen: issue.lastSeen,
    permalink: issue.permalink,
  }));
}
