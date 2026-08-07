import Link from "next/link";
import {
  ArrowLeft,
  Banknote,
  BriefcaseBusiness,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Flame,
  Radio,
} from "lucide-react";
import { notFound, redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { getRotaDayIndex } from "@/lib/pay/rota";
import {
  dailyAllowanceValue,
  daysBetween,
  formatMinutes,
  getMondayBasedWeekday,
} from "@/lib/pay/calculations";

type Props = {
  params: Promise<{
    date: string;
  }>;
};

type Position = {
  id: string;
  label: string;
  employment_type: string;
  rank: string;
  competence: string;
};

type PayPackage = {
  position_id: string;
  use_national_rates: boolean;
  custom_basic_hourly: number | null;
  count_rota_as_base_earnings: boolean;
  pay_model: "salaried" | "retained" | "custom";
  retained_retainer_type:
    | "full"
    | "day_crew"
    | "none"
    | "custom";
  custom_retainer_annual: number | null;
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

type Allowance = {
  position_id: string;
  name: string;
  amount: number;
  frequency: string;
};

type Entry = {
  id: string;
  position_id: string | null;
  entry_type: string;
  title: string | null;
  activity_date: string;
  start_time: string | null;
  finish_time: string | null;
  worked_minutes: number;
  calculated_pay: number;
  incident_number: string | null;
};

type ActivityTotals = {
  call: number;
  overtime: number;
  drill: number;
  course: number;
  standby: number;
  mileage: number;
  expense: number;
  other: number;
};

type Breakdown = {
  id: string;
  label: string;
  model: "salaried" | "retained" | "custom";
  scheduled: number;
  retainer: number;
  allowances: number;
  activities: ActivityTotals;
  total: number;
  rotaLabel: string;
};

function emptyActivityTotals(): ActivityTotals {
  return {
    call: 0,
    overtime: 0,
    drill: 0,
    course: 0,
    standby: 0,
    mileage: 0,
    expense: 0,
    other: 0,
  };
}

function validDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function changeDate(
  dateString: string,
  amount: number,
) {
  const date = new Date(
    `${dateString}T12:00:00Z`,
  );

  date.setUTCDate(
    date.getUTCDate() + amount,
  );

  return date
    .toISOString()
    .slice(0, 10);
}

function getDayRota(
  pattern: RotaPattern | undefined,
  days: RotaDay[],
  date: string,
) {
  if (!pattern || pattern.pattern_type === "none") {
    return {
      working: false,
      minutes: 0,
      label: "No scheduled shift",
    };
  }

  if (pattern.pattern_type === "weekly_rdo") {
    const weekday =
      getMondayBasedWeekday(date);

    if (weekday > 5) {
      return {
        working: false,
        minutes: 0,
        label: "Rest day",
      };
    }

    const sequence =
      Array.isArray(pattern.rdo_sequence) &&
      pattern.rdo_sequence.length > 0
        ? pattern.rdo_sequence
        : [1, 2, 3, 4, 5];

    const difference = daysBetween(
      pattern.anchor_date,
      date,
    );

    const week = Math.floor(
      difference / 7,
    );

    const sequenceIndex =
      ((week % sequence.length) +
        sequence.length) %
      sequence.length;

    if (
      weekday ===
      Number(sequence[sequenceIndex])
    ) {
      return {
        working: false,
        minutes: 0,
        label: "Rolling day off",
      };
    }

    return {
      working: true,
      minutes: Number(
        pattern.weekly_duration_minutes ?? 0,
      ),
      label: "Scheduled shift",
    };
  }

  const dayIndex = getRotaDayIndex(
    pattern.anchor_date,
    date,
    pattern.cycle_length_days,
  );

  const rotaDay = days.find(
    (day) =>
      day.rota_pattern_id === pattern.id &&
      day.day_index === dayIndex,
  );

  return {
    working: Boolean(rotaDay?.is_working),
    minutes: rotaDay?.is_working
      ? Number(rotaDay.duration_minutes)
      : 0,
    label: rotaDay?.label ?? "Rest day",
  };
}

async function getNationalRate(
  supabase: Awaited<ReturnType<typeof createClient>>,
  position: Position,
  date: string,
) {
  const { data } = await supabase
    .from("national_pay_rates")
    .select(
      "basic_hourly,retained_annual_full,retained_annual_day_crew",
    )
    .eq("rank", position.rank)
    .eq("competence", position.competence)
    .lte("effective_from", date)
    .or(
      `effective_to.is.null,effective_to.gte.${date}`,
    )
    .order("effective_from", {
      ascending: false,
    })
    .limit(1)
    .maybeSingle();

  return {
    basic: Number(data?.basic_hourly ?? 0),

    fullRetainer: Number(
      data?.retained_annual_full ?? 0,
    ),

    dayCrewRetainer: Number(
      data?.retained_annual_day_crew ?? 0,
    ),
  };
}

function sumActivities(
  activities: ActivityTotals,
) {
  return Object.values(activities).reduce(
    (total, value) => total + value,
    0,
  );
}

function activityName(type: string) {
  if (type === "call") return "Fire Call";
  if (type === "drill") return "Drill Night";

  return (
    type.charAt(0).toUpperCase() +
    type.slice(1)
  );
}

export default async function DayPage({
  params,
}: Props) {
  const { date } = await params;

  if (!validDate(date)) {
    notFound();
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [
    positionsResult,
    packagesResult,
    patternsResult,
    allowancesResult,
    entriesResult,
  ] = await Promise.all([
    supabase
      .from("positions")
      .select(
        "id,label,employment_type,rank,competence",
      )
      .eq("user_id", user.id)
      .eq("is_active", true),

    supabase
      .from("position_pay_packages")
      .select(
        "position_id,use_national_rates,custom_basic_hourly,count_rota_as_base_earnings,pay_model,retained_retainer_type,custom_retainer_annual",
      )
      .eq("user_id", user.id),

    supabase
      .from("rota_patterns")
      .select(
        "id,position_id,anchor_date,cycle_length_days,pattern_type,weekly_start_time,weekly_duration_minutes,rdo_sequence",
      )
      .eq("user_id", user.id),

    supabase
      .from("position_allowances")
      .select(
        "position_id,name,amount,frequency",
      )
      .eq("user_id", user.id)
      .lte("effective_from", date)
      .or(
        `effective_to.is.null,effective_to.gte.${date}`,
      ),

    supabase
      .from("entries")
      .select(
        "id,position_id,entry_type,title,activity_date,start_time,finish_time,worked_minutes,calculated_pay,incident_number",
      )
      .eq("user_id", user.id)
      .eq("activity_date", date)
      .order("start_time", {
        ascending: true,
      }),
  ]);

  const positions =
    (positionsResult.data ?? []) as Position[];

  const packages =
    (packagesResult.data ?? []) as PayPackage[];

  const patterns =
    (patternsResult.data ?? []) as RotaPattern[];

  const allowances =
    (allowancesResult.data ?? []) as Allowance[];

  const entries =
    (entriesResult.data ?? []) as Entry[];

  const patternIds = patterns.map(
    (pattern) => pattern.id,
  );

  let rotaDays: RotaDay[] = [];

  if (patternIds.length) {
    const { data } = await supabase
      .from("rota_days")
      .select(
        "rota_pattern_id,day_index,label,is_working,start_time,duration_minutes",
      )
      .in("rota_pattern_id", patternIds);

    rotaDays = (data ?? []) as RotaDay[];
  }

  const breakdowns: Breakdown[] = [];

  for (const position of positions) {
    const payPackage = packages.find(
      (item) =>
        item.position_id === position.id,
    );

    const model =
      payPackage?.pay_model ??
      (position.employment_type === "on_call"
        ? "retained"
        : "salaried");

    const rates = await getNationalRate(
      supabase,
      position,
      date,
    );

    const rota = getDayRota(
      patterns.find(
        (pattern) =>
          pattern.position_id === position.id,
      ),
      rotaDays,
      date,
    );

    let scheduled = 0;
    let retainer = 0;

    if (
      model === "salaried" &&
      payPackage?.count_rota_as_base_earnings &&
      rota.working
    ) {
      const rate =
        payPackage.use_national_rates
          ? rates.basic
          : Number(
              payPackage.custom_basic_hourly ?? 0,
            );

      scheduled =
        (rota.minutes / 60) * rate;
    }

    if (model === "retained") {
      const retainerType =
        payPackage?.retained_retainer_type ??
        "full";

      let annualRetainer = 0;

      if (retainerType === "full") {
        annualRetainer =
          rates.fullRetainer;
      }

      if (retainerType === "day_crew") {
        annualRetainer =
          rates.dayCrewRetainer;
      }

      if (retainerType === "custom") {
        annualRetainer = Number(
          payPackage?.custom_retainer_annual ?? 0,
        );
      }

      retainer =
        annualRetainer / 365;
    }

    const allowanceTotal = allowances
      .filter(
        (allowance) =>
          allowance.position_id === position.id,
      )
      .reduce(
        (total, allowance) =>
          total +
          dailyAllowanceValue(
            Number(allowance.amount),
            allowance.frequency,
            rota.working,
          ),
        0,
      );

    const activityTotals =
      emptyActivityTotals();

    entries
      .filter(
        (entry) =>
          entry.position_id === position.id,
      )
      .forEach((entry) => {
        const amount = Number(
          entry.calculated_pay ?? 0,
        );

        if (
          entry.entry_type in activityTotals
        ) {
          const type =
            entry.entry_type as keyof ActivityTotals;

          activityTotals[type] += amount;
        } else {
          activityTotals.other += amount;
        }
      });

    breakdowns.push({
      id: position.id,
      label: position.label,
      model,
      scheduled,
      retainer,
      allowances: allowanceTotal,
      activities: activityTotals,

      total:
        scheduled +
        retainer +
        allowanceTotal +
        sumActivities(activityTotals),

      rotaLabel: rota.label,
    });
  }

  const activePositionIds = new Set(
    positions.map((position) => position.id),
  );

  const unassigned = entries
    .filter(
      (entry) =>
        !entry.position_id ||
        !activePositionIds.has(
          entry.position_id,
        ),
    )
    .reduce(
      (total, entry) =>
        total +
        Number(
          entry.calculated_pay ?? 0,
        ),
      0,
    );

  const grandTotal =
    breakdowns.reduce(
      (total, item) =>
        total + item.total,
      0,
    ) + unassigned;

  const recordedWorkedMinutes =
    entries.reduce(
      (total, entry) =>
        total +
        Number(
          entry.worked_minutes ?? 0,
        ),
      0,
    );

  const scheduledRotaMinutes =
    breakdowns.reduce(
      (total, item) => {
        if (item.model !== "salaried") {
          return total;
        }

        const pattern = patterns.find(
          (pattern) =>
            pattern.position_id === item.id,
        );

        const rota = getDayRota(
          pattern,
          rotaDays,
          date,
        );

        return total + rota.minutes;
      },
      0,
    );

  const totalWorkedMinutes =
    scheduledRotaMinutes +
    recordedWorkedMinutes;

  const calls = entries.filter(
    (entry) =>
      entry.entry_type === "call",
  ).length;

  const overtimeMinutes = entries
    .filter(
      (entry) =>
        entry.entry_type === "overtime",
    )
    .reduce(
      (total, entry) =>
        total +
        Number(
          entry.worked_minutes ?? 0,
        ),
      0,
    );

  const previousDate = changeDate(
    date,
    -1,
  );

  const nextDate = changeDate(
    date,
    1,
  );

  const displayDate =
    new Intl.DateTimeFormat(
      "en-GB",
      {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      },
    ).format(
      new Date(
        `${date}T12:00:00Z`,
      ),
    );

  return (
    <main className="min-h-screen bg-zinc-100 px-4 py-6 sm:py-10">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-center justify-between gap-3">
          <Link
            href="/calendar"
            className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-600"
          >
            <ArrowLeft className="size-4" />
            Calendar
          </Link>

          <div className="flex gap-2">
            <Link
              href={`/day/${previousDate}`}
              className="flex size-10 items-center justify-center rounded-xl border border-zinc-200 bg-white"
              aria-label="Previous day"
            >
              <ChevronLeft className="size-5" />
            </Link>

            <Link
              href={`/day/${nextDate}`}
              className="flex size-10 items-center justify-center rounded-xl border border-zinc-200 bg-white"
              aria-label="Next day"
            >
              <ChevronRight className="size-5" />
            </Link>
          </div>
        </div>

        <section className="mt-6">
          <p className="text-sm font-semibold text-red-600">
            Daily summary
          </p>

          <h1 className="mt-1 text-3xl font-bold tracking-tight text-zinc-950">
            {displayDate}
          </h1>
        </section>

        <section className="mt-6 rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-zinc-500">
            Total earned
          </p>

          <p className="mt-2 text-4xl font-bold tracking-tight text-zinc-950">
            £{grandTotal.toFixed(2)}
          </p>

          <div className="mt-6 grid grid-cols-3 gap-3 border-t border-zinc-100 pt-5">
            <MiniStat
              label="Total hours"
              value={formatMinutes(
                totalWorkedMinutes,
              )}
            />

            <MiniStat
              label="Fire calls"
              value={String(calls)}
            />

            <MiniStat
              label="Overtime"
              value={formatMinutes(
                overtimeMinutes,
              )}
            />
          </div>
        </section>

        <section className="mt-8">
          <h2 className="text-lg font-bold text-zinc-950">
            Pay by position
          </h2>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            {breakdowns.map((item) => {
              const retained =
                item.model === "retained";

              const Icon = retained
                ? Radio
                : BriefcaseBusiness;

              return (
                <div
                  key={item.id}
                  className="rounded-[1.75rem] border border-zinc-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="flex size-11 items-center justify-center rounded-2xl bg-red-50 text-red-600">
                        <Icon className="size-5" />
                      </div>

                      <div>
                        <p className="font-bold text-zinc-950">
                          {item.label}
                        </p>

                        <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-zinc-400">
                          {retained
                            ? "On-Call / Retained"
                            : "Whole-time / Salaried"}
                        </p>
                      </div>
                    </div>

                    <p className="text-2xl font-bold text-zinc-950">
                      £{item.total.toFixed(2)}
                    </p>
                  </div>

                  <div className="mt-5 space-y-3 border-t border-zinc-100 pt-4">
                    {retained ? (
                      <PayLine
                        label="Retainer accrued"
                        value={item.retainer}
                      />
                    ) : (
                      <PayLine
                        label="Scheduled base"
                        value={item.scheduled}
                      />
                    )}

                    {item.allowances > 0 ? (
                      <PayLine
                        label="Allowances"
                        value={item.allowances}
                      />
                    ) : null}

                    {item.activities.overtime > 0 ? (
                      <PayLine
                        label="Overtime"
                        value={item.activities.overtime}
                      />
                    ) : null}

                    {item.activities.call > 0 ? (
                      <PayLine
                        label="Fire calls"
                        value={item.activities.call}
                      />
                    ) : null}

                    {item.activities.drill > 0 ? (
                      <PayLine
                        label="Drill"
                        value={item.activities.drill}
                      />
                    ) : null}

                    {item.activities.standby > 0 ? (
                      <PayLine
                        label="Standby"
                        value={item.activities.standby}
                      />
                    ) : null}

                    {item.activities.course > 0 ? (
                      <PayLine
                        label="Courses"
                        value={item.activities.course}
                      />
                    ) : null}

                    {item.activities.mileage > 0 ? (
                      <PayLine
                        label="Mileage"
                        value={item.activities.mileage}
                      />
                    ) : null}

                    {item.activities.expense > 0 ? (
                      <PayLine
                        label="Expenses"
                        value={item.activities.expense}
                      />
                    ) : null}

                    {item.activities.other > 0 ? (
                      <PayLine
                        label="Other"
                        value={item.activities.other}
                      />
                    ) : null}

                    {!retained ? (
                      <p className="pt-1 text-xs text-zinc-400">
                        {item.rotaLabel}
                      </p>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>

          {unassigned > 0 ? (
            <div className="mt-4 rounded-[1.5rem] border border-zinc-200 bg-white px-5 py-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-zinc-950">
                    Other extras
                  </p>

                  <p className="mt-1 text-sm text-zinc-500">
                    Entries not linked to an active position
                  </p>
                </div>

                <p className="text-xl font-bold text-zinc-950">
                  £{unassigned.toFixed(2)}
                </p>
              </div>
            </div>
          ) : null}
        </section>

        <section className="mt-8">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-zinc-950">
                Activities
              </h2>

              <p className="mt-1 text-sm text-zinc-500">
                Everything recorded on this day
              </p>
            </div>

            <Link
              href={`/entries/new`}
              className="text-sm font-semibold text-red-600"
            >
              Add activity
            </Link>
          </div>

          <div className="mt-4 overflow-hidden rounded-[1.75rem] border border-zinc-200 bg-white shadow-sm">
            {entries.length === 0 ? (
              <div className="p-8 text-center">
                <p className="font-semibold text-zinc-900">
                  No activity recorded
                </p>

                <p className="mt-1 text-sm text-zinc-500">
                  Scheduled and fixed pay can still appear above.
                </p>
              </div>
            ) : (
              entries.map((entry, index) => (
                <Link
                  key={entry.id}
                  href={`/activities/${entry.id}/edit`}
                  className={`flex items-center justify-between gap-4 p-4 transition hover:bg-zinc-50 ${
                    index !== entries.length - 1
                      ? "border-b border-zinc-100"
                      : ""
                  }`}
                >
                  <div>
                    <p className="font-semibold text-zinc-950">
                      {entry.title ||
                        activityName(
                          entry.entry_type,
                        )}
                    </p>

                    <p className="mt-1 text-sm text-zinc-500">
                      {entry.start_time &&
                      entry.finish_time
                        ? `${entry.start_time.slice(
                            0,
                            5,
                          )}–${entry.finish_time.slice(
                            0,
                            5,
                          )}`
                        : entry.worked_minutes > 0
                          ? formatMinutes(
                              entry.worked_minutes,
                            )
                          : "Recorded activity"}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="font-bold text-zinc-950">
                      £
                      {Number(
                        entry.calculated_pay,
                      ).toFixed(2)}
                    </p>

                    {entry.incident_number ? (
                      <p className="mt-1 text-xs text-zinc-400">
                        {entry.incident_number}
                      </p>
                    ) : null}
                  </div>
                </Link>
              ))
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function PayLine({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <p className="text-sm text-zinc-500">
        {label}
      </p>

      <p className="font-semibold text-zinc-950">
        £{value.toFixed(2)}
      </p>
    </div>
  );
}

function MiniStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-xs font-medium text-zinc-400">
        {label}
      </p>

      <p className="mt-1 text-sm font-bold text-zinc-950 sm:text-base">
        {value}
      </p>
    </div>
  );
}
