import Link from "next/link";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Flame,
  Clock3,
  GraduationCap,
  Radio,
  Circle,
} from "lucide-react";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

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

function getCurrentMonth() {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(new Date());

  const values = Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
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
  return `${year}-${String(month).padStart(
    2,
    "0",
  )}-${String(day).padStart(2, "0")}`;
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
    month: date.getUTCMonth() + 1,
  };
}

function getLondonToday() {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const values = Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );

  return `${values.year}-${values.month}-${values.day}`;
}

function activityLabel(type: string) {
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
    return <Flame className="size-3.5" />;
  }

  if (type === "overtime") {
    return <Clock3 className="size-3.5" />;
  }

  if (
    type === "drill" ||
    type === "course"
  ) {
    return <GraduationCap className="size-3.5" />;
  }

  if (type === "standby") {
    return <Radio className="size-3.5" />;
  }

  return <Circle className="size-3" />;
}

export default async function CalendarPage({
  searchParams,
}: Props) {
  const params = await searchParams;

  const current = getCurrentMonth();

  const year =
    Number(params.year) || current.year;

  const month =
    Number(params.month) || current.month;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const firstDate =
    `${year}-${String(month).padStart(
      2,
      "0",
    )}-01`;

  const daysInMonth = new Date(
    Date.UTC(year, month, 0),
  ).getUTCDate();

  const lastDate = isoDate(
    year,
    month,
    daysInMonth,
  );

  const { data } = await supabase
    .from("entries")
    .select(
      "id,entry_type,activity_date,worked_minutes,calculated_pay",
    )
    .eq("user_id", user.id)
    .gte("activity_date", firstDate)
    .lte("activity_date", lastDate)
    .order("activity_date", {
      ascending: true,
    });

  const entries =
    (data ?? []) as Entry[];

  const firstWeekday = new Date(
    Date.UTC(year, month - 1, 1),
  ).getUTCDay();

  const blankDays =
    firstWeekday === 0
      ? 6
      : firstWeekday - 1;

  const previous = moveMonth(
    year,
    month,
    -1,
  );

  const next = moveMonth(
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

  const today = getLondonToday();

  const monthTotal = entries.reduce(
    (total, entry) =>
      total +
      Number(entry.calculated_pay ?? 0),
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
              Tap any day to see exactly what you earned.
            </p>
          </div>

          <div className="flex gap-2">
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

        <div className="mt-6 rounded-[1.5rem] border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-zinc-500">
            Recorded activity this month
          </p>

          <div className="mt-1 flex items-end justify-between gap-4">
            <p className="text-3xl font-bold tracking-tight text-zinc-950">
              £{monthTotal.toFixed(2)}
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
          <section className="min-w-[900px] overflow-hidden rounded-[1.5rem] border-2 border-zinc-300 bg-white">
            <div className="grid grid-cols-7 border-b-2 border-zinc-300 bg-zinc-100">
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
                  className="border-r border-zinc-300 px-3 py-3 text-center text-sm font-bold text-zinc-700 last:border-r-0"
                >
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7">
              {Array.from({
                length: blankDays,
              }).map((_, index) => (
                <div
                  key={`blank-${index}`}
                  className="min-h-44 border-b border-r border-zinc-300 bg-zinc-50"
                />
              ))}

              {Array.from({
                length: daysInMonth,
              }).map((_, index) => {
                const day = index + 1;

                const date = isoDate(
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

                const total = dayEntries.reduce(
                  (sum, entry) =>
                    sum +
                    Number(
                      entry.calculated_pay ??
                        0,
                    ),
                  0,
                );

                const totalMinutes =
                  dayEntries.reduce(
                    (sum, entry) =>
                      sum +
                      Number(
                        entry.worked_minutes ??
                          0,
                      ),
                    0,
                  );

                const isToday =
                  date === today;

                return (
                  <Link
                    key={date}
                    href={`/day/${date}`}
                    className={`group flex min-h-44 flex-col border-b border-r border-zinc-300 p-3 transition ${
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

                      <ChevronRight className="size-4 text-zinc-300 opacity-0 transition group-hover:opacity-100" />
                    </div>

                    <div className="mt-4 flex-1 space-y-2">
                      {dayEntries
                        .slice(0, 3)
                        .map((entry) => (
                          <div
                            key={entry.id}
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
                        ))}

                      {dayEntries.length > 3 ? (
                        <p className="text-xs font-medium text-zinc-400">
                          +
                          {dayEntries.length -
                            3}{" "}
                          more
                        </p>
                      ) : null}
                    </div>

                    {dayEntries.length > 0 ? (
                      <div className="mt-4 border-t border-zinc-200 pt-3">
                        <p className="text-lg font-bold text-zinc-950">
                          £{total.toFixed(2)}
                        </p>

                        {totalMinutes > 0 ? (
                          <p className="mt-1 text-xs text-zinc-500">
                            {Math.floor(
                              totalMinutes / 60,
                            )}
                            h{" "}
                            {totalMinutes % 60}
                            m recorded
                          </p>
                        ) : null}
                      </div>
                    ) : (
                      <p className="mt-auto text-xs text-zinc-300">
                        Open day
                      </p>
                    )}
                  </Link>
                );
              })}
            </div>
          </section>
        </div>

        <div className="mt-2 rounded-2xl bg-zinc-200/60 px-4 py-3 text-sm text-zinc-600">
          On a phone you can swipe the calendar left and right. Tap the large day square itself to open that day&apos;s pay summary.
        </div>
      </div>
    </main>
  );
}
