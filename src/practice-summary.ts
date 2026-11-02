export type AttemptStamp = {
  drillId: string;
  createdAt: Date | null;
};

export type PracticeSummary<T extends AttemptStamp> = {
  total: number;
  drills: number;
  streak: number;
  latestForDrill: T | null;
};

export function summarizePractice<T extends AttemptStamp>(
  attempts: readonly T[],
  drillId: string,
  now = new Date(),
): PracticeSummary<T> {
  const drills = new Set(attempts.map((attempt) => attempt.drillId)).size;
  return {
    total: attempts.length,
    drills,
    streak: practiceStreak(
      attempts.map((attempt) => attempt.createdAt),
      now,
    ),
    latestForDrill: attempts.find((attempt) => attempt.drillId === drillId) ?? null,
  };
}

export function practiceStreak(dates: readonly (Date | null)[], now = new Date()): number {
  const days = new Set<string>();
  for (const date of dates) {
    if (date) days.add(utcDay(date));
  }
  if (days.size === 0) return 0;

  const cursor = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  if (!days.has(utcDay(cursor))) {
    cursor.setUTCDate(cursor.getUTCDate() - 1);
    if (!days.has(utcDay(cursor))) return 0;
  }

  let streak = 0;
  while (days.has(utcDay(cursor))) {
    streak += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return streak;
}

function utcDay(date: Date): string {
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${date.getUTCFullYear()}-${month}-${day}`;
}
