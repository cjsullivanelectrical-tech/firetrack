function iso(
  year: number,
  month: number,
  day: number,
) {
  return `${year}-${String(month).padStart(
    2,
    "0",
  )}-${String(day).padStart(2, "0")}`;
}

function addDays(
  date: Date,
  amount: number,
) {
  const copy = new Date(date);

  copy.setUTCDate(
    copy.getUTCDate() + amount,
  );

  return copy;
}

function dateIso(date: Date) {
  return iso(
    date.getUTCFullYear(),
    date.getUTCMonth() + 1,
    date.getUTCDate(),
  );
}

function firstMonday(
  year: number,
  monthIndex: number,
) {
  const date = new Date(
    Date.UTC(year, monthIndex, 1),
  );

  while (date.getUTCDay() !== 1) {
    date.setUTCDate(
      date.getUTCDate() + 1,
    );
  }

  return date;
}

function lastMonday(
  year: number,
  monthIndex: number,
) {
  const date = new Date(
    Date.UTC(
      year,
      monthIndex + 1,
      0,
    ),
  );

  while (date.getUTCDay() !== 1) {
    date.setUTCDate(
      date.getUTCDate() - 1,
    );
  }

  return date;
}

function easterSunday(year: number) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor(
    (b - f + 1) / 3,
  );

  const h =
    (19 * a +
      b -
      d -
      g +
      15) %
    30;

  const i = Math.floor(c / 4);
  const k = c % 4;

  const l =
    (32 +
      2 * e +
      2 * i -
      h -
      k) %
    7;

  const m = Math.floor(
    (a +
      11 * h +
      22 * l) /
      451,
  );

  const month = Math.floor(
    (h + l - 7 * m + 114) /
      31,
  );

  const day =
    ((h + l - 7 * m + 114) %
      31) +
    1;

  return new Date(
    Date.UTC(
      year,
      month - 1,
      day,
    ),
  );
}

function observedDate(
  date: Date,
  occupied = new Set<string>(),
) {
  const copy = new Date(date);

  while (
    copy.getUTCDay() === 0 ||
    copy.getUTCDay() === 6 ||
    occupied.has(dateIso(copy))
  ) {
    copy.setUTCDate(
      copy.getUTCDate() + 1,
    );
  }

  return copy;
}

export function englandWalesBankHolidays(
  year: number,
) {
  const holidays =
    new Map<string, string>();

  const newYear = new Date(
    Date.UTC(year, 0, 1),
  );

  const observedNewYear =
    observedDate(newYear);

  holidays.set(
    dateIso(observedNewYear),
    "New Year's Day",
  );

  const easter =
    easterSunday(year);

  holidays.set(
    dateIso(addDays(easter, -2)),
    "Good Friday",
  );

  holidays.set(
    dateIso(addDays(easter, 1)),
    "Easter Monday",
  );

  holidays.set(
    dateIso(
      firstMonday(year, 4),
    ),
    "Early May bank holiday",
  );

  holidays.set(
    dateIso(
      lastMonday(year, 4),
    ),
    "Spring bank holiday",
  );

  holidays.set(
    dateIso(
      lastMonday(year, 7),
    ),
    "Summer bank holiday",
  );

  const occupied =
    new Set<string>();

  const christmas =
    observedDate(
      new Date(
        Date.UTC(year, 11, 25),
      ),
      occupied,
    );

  occupied.add(
    dateIso(christmas),
  );

  const boxing =
    observedDate(
      new Date(
        Date.UTC(year, 11, 26),
      ),
      occupied,
    );

  holidays.set(
    dateIso(christmas),
    "Christmas Day",
  );

  holidays.set(
    dateIso(boxing),
    "Boxing Day",
  );

  return holidays;
}

export function bankHolidayName(
  dateString: string,
) {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(
      dateString,
    )
  ) {
    return null;
  }

  const year = Number(
    dateString.slice(0, 4),
  );

  return (
    englandWalesBankHolidays(
      year,
    ).get(dateString) ?? null
  );
}

export function isEnglandWalesBankHoliday(
  dateString: string,
) {
  return Boolean(
    bankHolidayName(dateString),
  );
}
