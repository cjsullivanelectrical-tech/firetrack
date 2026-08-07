import Link from "next/link";
import {
  ArrowLeft,
  BriefcaseBusiness,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Flame,
  GraduationCap,
  Radio,
  Star,
} from "lucide-react";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { getRotaDayIndex } from "@/lib/pay/rota";
import {
  daysBetween,
  getMondayBasedWeekday,
} from "@/lib/pay/calculations";
import {
  bankHolidayName,
} from "@/lib/pay/bank-holidays";

type Props = {
  searchParams: Promise<{
    year?: string;
    month?: string;
  }>;
};

type Theme =
  | "classic"
  | "muted"
  | "high_contrast";

type Entry = {
  id: string;
  entry_type: string;
  activity_date: string;
  worked_minutes: number;
  calculated_pay: number;
};

type Position = {
  id: string;
  label: string;
  employment_type: string;
};

type RotaPattern = {
  id: string;
  position_id: string;
  anchor_date: string;
  cycle_length_days: number;
  pattern_type:
    | "none"
    | "cycle"
    | "weekly_rdo";
  weekly_start_time: string | null;
  weekly_duration_minutes: number;
  rdo_sequence: number[];
};

type RotaDay = {
  rota_pattern_id: string;
  day_index: number;
  label: string;
  is_working: boolean;
  start_time: string | null;
  duration_minutes: number;
};

type Shift = {
  positionId: string;
  positionLabel: string;
  label: string;
  startTime: string | null;
  durationMinutes: number;
};

function currentMonth() {
  const parts =
    new Intl.DateTimeFormat(
      "en-GB",
      {
        timeZone:
          "Europe/London",
        year: "numeric",
        month: "2-digit",
      },
    ).formatToParts(new Date());

  const values =
    Object.fromEntries(
      parts
        .filter(
          (part) =>
            part.type !==
            "literal",
        )
        .map((part) => [
          part.type,
          part.value,
        ]),
    );

  return {
    year: Number(values.year),
    month: Number(values.month),
  };
}

function londonToday() {
  const parts =
    new Intl.DateTimeFormat(
      "en-GB",
      {
        timeZone:
          "Europe/London",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      },
    ).formatToParts(new Date());

  const values =
    Object.fromEntries(
      parts
        .filter(
          (part) =>
            part.type !==
            "literal",
        )
        .map((part) => [
          part.type,
          part.value,
        ]),
    );

  return `${values.year}-${values.month}-${values.day}`;
}

function isoDate(
  year: number,
  month: number,
  day: number,
) {
  return `${year}-${String(
    month,
  ).padStart(2, "0")}-${String(
    day,
  ).padStart(2, "0")}`;
}

function moveMonth(
  year: number,
  month: number,
  amount: number,
) {
  const date = new Date(
    Date.UTC(
      year,
      month - 1 + amount,
      1,
    ),
  );

  return {
    year:
      date.getUTCFullYear(),
    month:
      date.getUTCMonth() + 1,
  };
}

function shiftForDate(
  position: Position,
  pattern:
    | RotaPattern
    | undefined,
  rotaDays: RotaDay[],
  date: string,
): Shift | null {
  if (
    !pattern ||
    pattern.pattern_type ===
      "none"
  ) {
    return null;
  }

  if (
    pattern.pattern_type ===
    "weekly_rdo"
  ) {
    const weekday =
      getMondayBasedWeekday(
        date,
      );

    if (weekday > 5) {
      return null;
    }

    const sequence =
      Array.isArray(
        pattern.rdo_sequence,
      ) &&
      pattern.rdo_sequence.length
        ? pattern.rdo_sequence
        : [1, 2, 3, 4, 5];

    const difference =
      daysBetween(
        pattern.anchor_date,
        date,
      );

    const week =
      Math.floor(
        difference / 7,
      );

    const index =
      ((week %
        sequence.length) +
        sequence.length) %
      sequence.length;

    if (
      weekday ===
      Number(
        sequence[index],
      )
    ) {
      return null;
    }

    return {
      positionId:
        position.id,
      positionLabel:
        position.label,
      label:
        "Whole-time shift",
      startTime:
        pattern.weekly_start_time,
      durationMinutes:
        Number(
          pattern.weekly_duration_minutes ??
            0,
        ),
    };
  }

  const dayIndex =
    getRotaDayIndex(
      pattern.anchor_date,
      date,
      pattern.cycle_length_days,
    );

  const rotaDay =
    rotaDays.find(
      (day) =>
        day.rota_pattern_id ===
          pattern.id &&
        day.day_index ===
          dayIndex,
    );

  if (!rotaDay?.is_working) {
    return null;
  }

  return {
    positionId:
      position.id,
    positionLabel:
      position.label,
    label:
      rotaDay.label ||
      "Whole-time shift",
    startTime:
      rotaDay.start_time,
    durationMinutes:
      Number(
        rotaDay.duration_minutes ??
          0,
      ),
  };
}

function durationText(
  minutes: number,
) {
  const hours =
    Math.floor(minutes / 60);

  const mins =
    minutes % 60;

  return mins
    ? `${hours}h ${mins}m`
    : `${hours}h`;
}

function themeStyles(
  theme: Theme,
) {
  if (
    theme ===
    "high_contrast"
  ) {
    return {
      shift:
        "bg-blue-700 text-white",
      call:
        "bg-red-700 text-white",
      overtime:
        "bg-amber-500 text-zinc-950",
      training:
        "bg-purple-700 text-white",
      standby:
        "bg-emerald-700 text-white",
      leave:
        "bg-violet-700 text-white",
      sick:
        "bg-rose-700 text-white",
      other:
        "bg-zinc-700 text-white",
      holiday:
        "bg-yellow-400 text-zinc-950",
    };
  }

  if (theme === "muted") {
    return {
      shift:
        "bg-sky-100 text-sky-800",
      call:
        "bg-rose-100 text-rose-800",
      overtime:
        "bg-orange-100 text-orange-800",
      training:
        "bg-violet-100 text-violet-800",
      standby:
        "bg-emerald-100 text-emerald-800",
      leave:
        "bg-violet-100 text-violet-800",
      sick:
        "bg-rose-100 text-rose-800",
      other:
        "bg-zinc-100 text-zinc-700",
      holiday:
        "bg-yellow-100 text-yellow-800",
    };
  }

  return {
    shift:
      "bg-blue-100 text-blue-800",
    call:
      "bg-red-100 text-red-800",
    overtime:
      "bg-amber-100 text-amber-800",
    training:
      "bg-purple-100 text-purple-800",
    standby:
      "bg-emerald-100 text-emerald-800",
    leave:
      "bg-violet-100 text-violet-800",
    sick:
      "bg-rose-100 text-rose-800",
    other:
      "bg-zinc-100 text-zinc-700",
    holiday:
      "bg-yellow-100 text-yellow-800",
  };
}

function entryClass(
  type: string,
  theme: ReturnType<
    typeof themeStyles
  >,
) {
  if (type === "call") {
    return theme.call;
  }

  if (type === "overtime") {
    return theme.overtime;
  }

  if (
    type === "drill" ||
    type === "course"
  ) {
    return theme.training;
  }

  if (type === "standby") {
    return theme.standby;
  }

  if (type === "annual_leave") {
    return theme.leave;
  }

  if (type === "sick_leave") {
    return theme.sick;
  }

  return theme.other;
}

function entryLabel(
  type: string,
) {
  if (type === "call") {
    return "Fire call";
  }

  if (type === "overtime") {
    return "Overtime";
  }

  if (type === "drill") {
    return "Drill";
  }

  if (type === "course") {
    return "Course";
  }

  if (type === "standby") {
    return "Standby";
  }

  if (type === "annual_leave") {
    return "Annual Leave";
  }

  if (type === "sick_leave") {
    return "Sick Leave";
  }

  if (type === "mileage") {
    return "Mileage";
  }

  if (type === "expense") {
    return "Expense";
  }

  return "Other";
}

function EntryIcon({
  type,
}: {
  type: string;
}) {
  if (type === "call") {
    return (
      <Flame className="size-3.5" />
    );
  }

  if (type === "overtime") {
    return (
      <Clock3 className="size-3.5" />
    );
  }

  if (
    type === "drill" ||
    type === "course"
  ) {
    return (
      <GraduationCap className="size-3.5" />
    );
  }

  return (
    <Radio className="size-3.5" />
  );
}

export default async function CalendarPage({
  searchParams,
}: Props) {
  const params =
    await searchParams;

  const current =
    currentMonth();

  const year =
    Number(params.year) ||
    current.year;

  const month =
    Number(params.month) ||
    current.month;

  const supabase =
    await createClient();

  const {
    data: { user },
  } =
    await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const firstDate =
    `${year}-${String(
      month,
    ).padStart(2, "0")}-01`;

  const daysInMonth =
    new Date(
      Date.UTC(
        year,
        month,
        0,
      ),
    ).getUTCDate();

  const lastDate =
    isoDate(
      year,
      month,
      daysInMonth,
    );

  const [
    entriesResult,
    positionsResult,
    patternsResult,
    profileResult,
  ] = await Promise.all([
    supabase
      .from("entries")
      .select(
        "id,entry_type,activity_date,worked_minutes,calculated_pay",
      )
      .eq(
        "user_id",
        user.id,
      )
      .gte(
        "activity_date",
        firstDate,
      )
      .lte(
        "activity_date",
        lastDate,
      )
      .order(
        "activity_date",
        {
          ascending: true,
        },
      ),

    supabase
      .from("positions")
      .select(
        "id,label,employment_type",
      )
      .eq(
        "user_id",
        user.id,
      )
      .eq(
        "is_active",
        true,
      ),

    supabase
      .from("rota_patterns")
      .select(
        "id,position_id,anchor_date,cycle_length_days,pattern_type,weekly_start_time,weekly_duration_minutes,rdo_sequence",
      )
      .eq(
        "user_id",
        user.id,
      ),

    supabase
      .from("profiles")
      .select(
        "calendar_theme",
      )
      .eq("id", user.id)
      .maybeSingle(),
  ]);

  const entries =
    (entriesResult.data ??
      []) as Entry[];

  const positions =
    (positionsResult.data ??
      []) as Position[];

  const patterns =
    (patternsResult.data ??
      []) as RotaPattern[];

  const rawTheme =
    profileResult.data
      ?.calendar_theme;

  const calendarTheme: Theme =
    rawTheme === "muted" ||
    rawTheme ===
      "high_contrast"
      ? rawTheme
      : "classic";

  const colours =
    themeStyles(
      calendarTheme,
    );

  const patternIds =
    patterns.map(
      (pattern) =>
        pattern.id,
    );

  let rotaDays:
    RotaDay[] = [];

  if (
    patternIds.length
  ) {
    const { data } =
      await supabase
        .from("rota_days")
        .select(
          "rota_pattern_id,day_index,label,is_working,start_time,duration_minutes",
        )
        .in(
          "rota_pattern_id",
          patternIds,
        );

    rotaDays =
      (data ??
        []) as RotaDay[];
  }

  const firstWeekday =
    new Date(
      Date.UTC(
        year,
        month - 1,
        1,
      ),
    ).getUTCDay();

  const blankDays =
    firstWeekday === 0
      ? 6
      : firstWeekday - 1;

  const previous =
    moveMonth(
      year,
      month,
      -1,
    );

  const next =
    moveMonth(
      year,
      month,
      1,
    );

  const monthTitle =
    new Intl.DateTimeFormat(
      "en-GB",
      {
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      },
    ).format(
      new Date(
        Date.UTC(
          year,
          month - 1,
          1,
        ),
      ),
    );

  const today =
    londonToday();

  const monthTotal =
    entries.reduce(
      (total, entry) =>
        total +
        Number(
          entry.calculated_pay ??
            0,
        ),
      0,
    );

  return (
    <main className="min-h-screen bg-zinc-100 px-4 py-6 sm:py-10">
      <div className="mx-auto max-w-7xl">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-600"
        >
          <ArrowLeft className="size-4" />
          Dashboard
        </Link>

        <div className="mt-6 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-red-600">
              Calendar
            </p>

            <h1 className="mt-1 text-3xl font-bold tracking-tight text-zinc-950 sm:text-4xl">
              {monthTitle}
            </h1>

            <p className="mt-2 text-sm text-zinc-500">
              Your rota, incidents and extra earnings.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/settings/calendar"
              className="mr-2 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 shadow-sm"
            >
              Appearance
            </Link>

            <Link
              href={`/calendar?year=${previous.year}&month=${previous.month}`}
              className="flex size-11 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-700 shadow-sm"
              aria-label="Previous month"
            >
              <ChevronLeft className="size-5" />
            </Link>

            <Link
              href={`/calendar?year=${next.year}&month=${next.month}`}
              className="flex size-11 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-700 shadow-sm"
              aria-label="Next month"
            >
              <ChevronRight className="size-5" />
            </Link>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between rounded-[1.5rem] border border-zinc-200 bg-white px-5 py-4 shadow-sm">
          <div>
            <p className="text-sm text-zinc-500">
              Recorded extras this month
            </p>

            <p className="mt-1 text-2xl font-bold text-zinc-950">
              £
              {monthTotal.toFixed(
                2,
              )}
            </p>
          </div>

          <div className="text-right">
            <p className="text-sm font-semibold text-zinc-700">
              {entries.length}{" "}
              {entries.length === 1
                ? "activity"
                : "activities"}
            </p>

            <p className="mt-1 text-xs capitalize text-zinc-400">
              {calendarTheme.replaceAll(
                "_",
                " ",
              )}{" "}
              theme
            </p>
          </div>
        </div>

        <div className="mt-6 overflow-x-auto pb-3">
          <section className="min-w-[980px] overflow-hidden rounded-[1.75rem] border border-zinc-300 bg-white shadow-sm">
            <div className="grid grid-cols-7 border-b border-zinc-300 bg-zinc-50">
              {[
                "Monday",
                "Tuesday",
                "Wednesday",
                "Thursday",
                "Friday",
                "Saturday",
                "Sunday",
              ].map((day) => (
                <div
                  key={day}
                  className="border-r border-zinc-200 px-3 py-3 text-center text-xs font-bold uppercase tracking-wide text-zinc-500 last:border-r-0"
                >
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7">
              {Array.from({
                length:
                  blankDays,
              }).map(
                (_, index) => (
                  <div
                    key={`blank-${index}`}
                    className="min-h-56 border-b border-r border-zinc-200 bg-zinc-50/60"
                  />
                ),
              )}

              {Array.from({
                length:
                  daysInMonth,
              }).map(
                (_, index) => {
                  const day =
                    index + 1;

                  const date =
                    isoDate(
                      year,
                      month,
                      day,
                    );

                  const dayEntries =
                    entries.filter(
                      (entry) =>
                        entry.activity_date ===
                        date,
                    );

                  const wholeTime =
                    positions.filter(
                      (position) =>
                        position.employment_type ===
                        "wholetime",
                    );

                  const shifts =
                    wholeTime
                      .map(
                        (
                          position,
                        ) =>
                          shiftForDate(
                            position,
                            patterns.find(
                              (
                                pattern,
                              ) =>
                                pattern.position_id ===
                                position.id,
                            ),
                            rotaDays,
                            date,
                          ),
                      )
                      .filter(
                        (
                          shift,
                        ): shift is Shift =>
                          Boolean(
                            shift,
                          ),
                      );

                  const holiday =
                    bankHolidayName(
                      date,
                    );

                  const isToday =
                    date === today;

                  const dayPay =
                    dayEntries.reduce(
                      (
                        total,
                        entry,
                      ) =>
                        total +
                        Number(
                          entry.calculated_pay ??
                            0,
                        ),
                      0,
                    );

                  return (
                    <Link
                      key={date}
                      href={`/day/${date}`}
                      className={`group relative flex min-h-56 flex-col border-b border-r border-zinc-200 p-3 transition ${
                        isToday
                          ? "z-10 -m-px border-2 border-red-500 bg-white shadow-md"
                          : "bg-white hover:bg-zinc-50"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span
                          className={`flex size-9 items-center justify-center rounded-full text-lg font-bold ${
                            isToday
                              ? "bg-red-600 text-white"
                              : "text-zinc-950"
                          }`}
                        >
                          {day}
                        </span>

                        {holiday ? (
                          <span
                            className={`flex size-8 items-center justify-center rounded-full ${colours.holiday}`}
                            title={holiday}
                          >
                            <Star className="size-4" />
                          </span>
                        ) : null}
                      </div>

                      <div className="mt-3 flex-1 space-y-2">
                        {shifts.map(
                          (
                            shift,
                          ) => (
                            <div
                              key={`${shift.positionId}-${date}`}
                              className={`rounded-xl px-2.5 py-2 ${colours.shift}`}
                            >
                              <div className="flex items-center gap-1.5 text-[11px] font-bold">
                                <BriefcaseBusiness className="size-3.5" />

                                <span className="truncate">
                                  {shift.label}
                                </span>
                              </div>

                              <p className="mt-1 text-[10px] font-medium opacity-75">
                                {shift.startTime
                                  ? `${shift.startTime.slice(
                                      0,
                                      5,
                                    )} • `
                                  : ""}
                                {durationText(
                                  shift.durationMinutes,
                                )}
                              </p>
                            </div>
                          ),
                        )}

                        {dayEntries
                          .slice(
                            0,
                            4,
                          )
                          .map(
                            (
                              entry,
                            ) => (
                              <div
                                key={
                                  entry.id
                                }
                                className={`flex items-center gap-1.5 rounded-xl px-2.5 py-2 text-[11px] font-bold ${entryClass(
                                  entry.entry_type,
                                  colours,
                                )}`}
                              >
                                <EntryIcon
                                  type={
                                    entry.entry_type
                                  }
                                />

                                <span className="truncate">
                                  {entryLabel(
                                    entry.entry_type,
                                  )}
                                </span>
                              </div>
                            ),
                          )}

                        {dayEntries.length >
                        4 ? (
                          <p className="px-1 text-[10px] font-semibold text-zinc-400">
                            +
                            {dayEntries.length -
                              4}{" "}
                            more
                          </p>
                        ) : null}
                      </div>

                      {holiday ? (
                        <p className="mt-2 truncate text-[10px] font-semibold text-amber-700">
                          {holiday}
                        </p>
                      ) : null}

                      <div className="mt-3 border-t border-zinc-100 pt-2.5">
                        {dayPay > 0 ? (
                          <>
                            <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
                              Extras
                            </p>

                            <p className="mt-0.5 text-base font-bold text-zinc-950">
                              £
                              {dayPay.toFixed(
                                2,
                              )}
                            </p>
                          </>
                        ) : shifts.length >
                          0 ? (
                          <p className="text-xs font-medium text-zinc-400">
                            Scheduled work
                          </p>
                        ) : (
                          <p className="text-xs text-zinc-300">
                            No activity
                          </p>
                        )}
                      </div>
                    </Link>
                  );
                },
              )}
            </div>
          </section>
        </div>

        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-3 rounded-2xl bg-white px-4 py-3 text-xs font-medium text-zinc-600 shadow-sm">
          <Legend
            className={colours.shift}
            label="Whole-time shift"
          />

          <Legend
            className={colours.call}
            label="Fire call"
          />

          <Legend
            className={
              colours.overtime
            }
            label="Overtime"
          />

          <Legend
            className={
              colours.training
            }
            label="Drill / course"
          />

          <Legend
            className={
              colours.standby
            }
            label="Standby"
          />

          <Legend
            className={
              colours.holiday
            }
            label="Bank holiday"
          />
        </div>
      </div>
    </main>
  );
}

function Legend({
  className,
  label,
}: {
  className: string;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={`size-3 rounded ${className}`}
      />

      {label}
    </div>
  );
}
