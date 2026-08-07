import Link from "next/link";
import {
  ArrowLeft,
  BriefcaseBusiness,
  ChevronLeft,
  ChevronRight,
  Circle,
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

function getCurrentMonth() {
  const parts =
    new Intl.DateTimeFormat(
      "en-GB",
      {
        timeZone:
          "Europe/London",
        year: "numeric",
        month: "2-digit",
      },
    ).formatToParts(
      new Date(),
    );

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
    year: date.getUTCFullYear(),
    month:
      date.getUTCMonth() + 1,
  };
}

function getLondonToday() {
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
    ).formatToParts(
      new Date(),
    );

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

function activityLabel(
  type: string,
) {
  switch (type) {
    case "call":
      return "Call";

    case "overtime":
      return "Overtime";

    case "drill":
      return "Drill";

    case "course":
      return "Course";

    case "standby":
      return "Standby";

    case "mileage":
      return "Mileage";

    case "expense":
      return "Expense";

    default:
      return "Other";
  }
}

function ActivityIcon({
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

  if (type === "standby") {
    return (
      <Radio className="size-3.5" />
    );
  }

  return (
    <Circle className="size-3" />
  );
}

function getShift(
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
      pattern.rdo_sequence
        .length
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

    const sequenceIndex =
      ((week %
        sequence.length) +
        sequence.length) %
      sequence.length;

    if (
      weekday ===
      Number(
        sequence[
          sequenceIndex
        ],
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
        "Scheduled shift",
      startTime:
        pattern.weekly_start_time,
      durationMinutes:
        Number(
          pattern.weekly_duration_minutes ??
            0,
        ),
    };
  }

  const index =
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
        day.day_index === index,
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
      "Shift",
    startTime:
      rotaDay.start_time,
    durationMinutes:
      Number(
        rotaDay.duration_minutes ??
          0,
      ),
  };
}

function shiftDuration(
  minutes: number,
) {
  const hours =
    Math.floor(
      minutes / 60,
    );

  const mins =
    minutes % 60;

  if (!mins) {
    return `${hours}h`;
  }

  return `${hours}h ${mins}m`;
}

export default async function CalendarPage({
  searchParams,
}: Props) {
  const params =
    await searchParams;

  const current =
    getCurrentMonth();

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
        .from(
          "rota_days",
        )
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
    getLondonToday();

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
      <div className="mx-auto max-w-6xl">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-600"
        >
          <ArrowLeft className="size-4" />
          Dashboard
        </Link>

        <div className="mt-6 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-red-600">
              Calendar
            </p>

            <h1 className="mt-1 text-3xl font-bold tracking-tight text-zinc-950">
              {monthTitle}
            </h1>

            <p className="mt-2 text-sm text-zinc-500">
              Your rota, activities and earnings in one place.
            </p>
          </div>

          <div className="flex gap-2">
            <Link
              href={`/calendar?year=${previous.year}&month=${previous.month}`}
              className="flex size-11 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-700 shadow-sm"
            >
              <ChevronLeft className="size-5" />
            </Link>

            <Link
              href={`/calendar?year=${next.year}&month=${next.month}`}
              className="flex size-11 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-700 shadow-sm"
            >
              <ChevronRight className="size-5" />
            </Link>
          </div>
        </div>

        <div className="mt-6 rounded-[1.5rem] border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-zinc-500">
            Recorded extras this month
          </p>

          <div className="mt-1 flex items-end justify-between gap-4">
            <p className="text-3xl font-bold tracking-tight text-zinc-950">
              £
              {monthTotal.toFixed(
                2,
              )}
            </p>

            <p className="text-sm font-semibold text-zinc-500">
              {entries.length}{" "}
              {entries.length === 1
                ? "activity"
                : "activities"}
            </p>
          </div>
        </div>

        <div className="mt-6 overflow-x-auto pb-3">
          <section className="min-w-[950px] overflow-hidden rounded-[1.5rem] border-2 border-zinc-300 bg-white">
            <div className="grid grid-cols-7 border-b-2 border-zinc-300 bg-zinc-100">
              {[
                "Monday",
                "Tuesday",
                "Wednesday",
                "Thursday",
                "Friday",
                "Saturday",
                "Sunday",
              ].map(
                (day) => (
                  <div
                    key={day}
                    className="border-r border-zinc-300 px-3 py-3 text-center text-sm font-bold text-zinc-700 last:border-r-0"
                  >
                    {day}
                  </div>
                ),
              )}
            </div>

            <div className="grid grid-cols-7">
              {Array.from({
                length:
                  blankDays,
              }).map(
                (_, index) => (
                  <div
                    key={`blank-${index}`}
                    className="min-h-52 border-b border-r border-zinc-300 bg-zinc-50"
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

                  const dayPay =
                    dayEntries.reduce(
                      (
                        sum,
                        entry,
                      ) =>
                        sum +
                        Number(
                          entry.calculated_pay ??
                            0,
                        ),
                      0,
                    );

                  const wholeTimePositions =
                    positions.filter(
                      (position) =>
                        position.employment_type ===
                        "wholetime",
                    );

                  const shifts =
                    wholeTimePositions
                      .map(
                        (
                          position,
                        ) =>
                          getShift(
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
                    date ===
                    today;

                  return (
                    <Link
                      key={date}
                      href={`/day/${date}`}
                      className={`group flex min-h-52 flex-col border-b border-r border-zinc-300 p-3 transition ${
                        isToday
                          ? "bg-red-50"
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
                            title={
                              holiday
                            }
                            className="flex size-7 items-center justify-center rounded-full bg-amber-100 text-amber-700"
                          >
                            <Star className="size-3.5" />
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
                              className="rounded-lg bg-blue-50 px-2 py-2 text-blue-700"
                            >
                              <div className="flex items-center gap-1.5 text-xs font-bold">
                                <BriefcaseBusiness className="size-3.5" />

                                {shift.label}
                              </div>

                              <p className="mt-1 text-[10px] font-medium">
                                {shift.startTime
                                  ? `${shift.startTime.slice(
                                      0,
                                      5,
                                    )} • `
                                  : ""}
                                {shiftDuration(
                                  shift.durationMinutes,
                                )}
                              </p>
                            </div>
                          ),
                        )}

                        {dayEntries
                          .slice(
                            0,
                            3,
                          )
                          .map(
                            (
                              entry,
                            ) => (
                              <div
                                key={
                                  entry.id
                                }
                                className="flex items-center gap-2 text-xs font-semibold text-zinc-600"
                              >
                                <ActivityIcon
                                  type={
                                    entry.entry_type
                                  }
                                />

                                <span className="truncate">
                                  {activityLabel(
                                    entry.entry_type,
                                  )}
                                </span>
                              </div>
                            ),
                          )}

                        {dayEntries.length >
                        3 ? (
                          <p className="text-xs font-medium text-zinc-400">
                            +
                            {dayEntries.length -
                              3}{" "}
                            more
                          </p>
                        ) : null}
                      </div>

                      {holiday ? (
                        <p className="mt-2 truncate text-[10px] font-semibold text-amber-700">
                          {holiday}
                        </p>
                      ) : null}

                      {dayPay >
                      0 ? (
                        <div className="mt-3 border-t border-zinc-200 pt-2">
                          <p className="text-sm font-bold text-zinc-950">
                            Extras £
                            {dayPay.toFixed(
                              2,
                            )}
                          </p>
                        </div>
                      ) : null}
                    </Link>
                  );
                },
              )}
            </div>
          </section>
        </div>

        <div className="mt-3 flex flex-wrap gap-4 text-xs font-medium text-zinc-500">
          <span className="flex items-center gap-2">
            <span className="size-3 rounded bg-blue-100" />
            Scheduled shift
          </span>

          <span className="flex items-center gap-2">
            <Flame className="size-3.5 text-red-600" />
            Fire call
          </span>

          <span className="flex items-center gap-2">
            <Clock3 className="size-3.5" />
            Overtime
          </span>

          <span className="flex items-center gap-2">
            <Star className="size-3.5 text-amber-600" />
            Bank holiday
          </span>
        </div>
      </div>
    </main>
  );
}
