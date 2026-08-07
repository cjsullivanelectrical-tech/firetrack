export function formatMinutes(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return `${hours}h ${minutes}m`;
}

export function calculateWorkedMinutes(
  startTime: string,
  finishTime: string,
) {
  if (!startTime || !finishTime) {
    return 0;
  }

  const [startHour, startMinute] = startTime
    .split(":")
    .map(Number);

  const [finishHour, finishMinute] = finishTime
    .split(":")
    .map(Number);

  const start = startHour * 60 + startMinute;

  let finish =
    finishHour * 60 + finishMinute;

  if (finish < start) {
    finish += 1440;
  }

  return Math.max(0, finish - start);
}

export function dailyAllowanceValue(
  amount: number,
  frequency: string,
  workingToday: boolean,
) {
  switch (frequency) {
    case "annual":
      return amount / 365;

    case "monthly":
      return (amount * 12) / 365;

    case "weekly":
      return amount / 7;

    case "daily":
      return amount;

    case "per_shift":
      return workingToday ? amount : 0;

    default:
      return 0;
  }
}

export function getMondayBasedWeekday(
  dateString: string,
) {
  const date = new Date(
    `${dateString}T12:00:00Z`,
  );

  const day = date.getUTCDay();

  return day === 0 ? 7 : day;
}

export function daysBetween(
  from: string,
  to: string,
) {
  const fromDate = new Date(
    `${from}T12:00:00Z`,
  );

  const toDate = new Date(
    `${to}T12:00:00Z`,
  );

  return Math.floor(
    (toDate.getTime() -
      fromDate.getTime()) /
      86400000,
  );
}
