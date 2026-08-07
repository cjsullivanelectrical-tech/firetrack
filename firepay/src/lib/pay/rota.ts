export type RotaDay = {
  day_index: number;
  label: string;
  is_working: boolean;
  start_time: string | null;
  duration_minutes: number;
};

export function getRotaDayIndex(
  anchorDate: string,
  targetDate: string,
  cycleLength: number,
) {
  const anchor = new Date(`${anchorDate}T12:00:00Z`);
  const target = new Date(`${targetDate}T12:00:00Z`);

  const differenceMilliseconds =
    target.getTime() - anchor.getTime();

  const differenceDays = Math.round(
    differenceMilliseconds / 86400000,
  );

  return (
    ((differenceDays % cycleLength) + cycleLength) %
    cycleLength
  );
}

export function formatDuration(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (remainingMinutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${remainingMinutes}m`;
}
