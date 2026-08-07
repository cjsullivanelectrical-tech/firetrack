import {
  Banknote,
  BriefcaseBusiness,
  Clock3,
  Flame,
  Radio,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { StatCard } from "@/components/ui/stat-card";
import { createClient } from "@/lib/supabase/server";
import { getRotaDayIndex } from "@/lib/pay/rota";
import {
  dailyAllowanceValue,
  daysBetween,
  formatMinutes,
  getMondayBasedWeekday,
} from "@/lib/pay/calculations";

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

type TodayEntry = {
  position_id: string | null;
  entry_type: string;
  calculated_pay: number;
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

function londonToday() {
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

  return {
    iso: `${values.year}-${values.month}-${values.day}`,
    year: values.year,
    month: values.month,
  };
}

function getTodayRota(
  pattern: RotaPattern | undefined,
  days: RotaDay[],
  today: string,
) {
  if (!pattern || pattern.pattern_type === "none") {
    return {
      working: false,
      minutes: 0,
      label: "No scheduled shift",
    };
  }

  if (pattern.pattern_type === "weekly_rdo") {
    const weekday = getMondayBasedWeekday(today);

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
      today,
    );

    const week = Math.floor(difference / 7);

    const sequenceIndex =
      ((week % sequence.length) + sequence.length) %
      sequence.length;

    if (
      weekday === Number(sequence[sequenceIndex])
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
    today,
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
  today: string,
) {
  const { data } = await supabase
    .from("national_pay_rates")
    .select(
      "basic_hourly,retained_annual_full,retained_annual_day_crew",
    )
    .eq("rank", position.rank)
    .eq("competence", position.competence)
    .lte("effective_from", today)
    .or(
      `effective_to.is.null,effective_to.gte.${today}`,
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

function sumActivities(activities: ActivityTotals) {
  return Object.values(activities).reduce(
    (total, value) => total + value,
    0,
  );
}

export default async function HomePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const today = londonToday();

  const monthStart =
    `${today.year}-${today.month}-01`;

  const yearStart =
    `${today.year}-01-01`;

  const [
    profileResult,
    positionsResult,
    packagesResult,
    patternsResult,
    allowancesResult,
    todayEntriesResult,
    monthEntriesResult,
    recentResult,
    callsResult,
    overtimeResult,
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("preferred_name,full_name")
      .eq("id", user.id)
      .maybeSingle(),

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
      .lte("effective_from", today.iso)
      .or(
        `effective_to.is.null,effective_to.gte.${today.iso}`,
      ),

    supabase
      .from("entries")
      .select(
        "position_id,entry_type,calculated_pay",
      )
      .eq("user_id", user.id)
      .eq("activity_date", today.iso),

    supabase
      .from("entries")
      .select(
        "worked_minutes,calculated_pay",
      )
      .eq("user_id", user.id)
      .gte("activity_date", monthStart)
      .lte("activity_date", today.iso),

    supabase
      .from("entries")
      .select(
        "id,entry_type,title,activity_date,start_time,finish_time,worked_minutes,calculated_pay,incident_number",
      )
      .eq("user_id", user.id)
      .order("activity_date", {
        ascending: false,
      })
      .order("created_at", {
        ascending: false,
      })
      .limit(5),

    supabase
      .from("entries")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("user_id", user.id)
      .eq("entry_type", "call")
      .gte("activity_date", yearStart),

    supabase
      .from("entries")
      .select("worked_minutes")
      .eq("user_id", user.id)
      .eq("entry_type", "overtime")
      .gte("activity_date", monthStart),
  ]);

  const positions =
    (positionsResult.data ?? []) as Position[];

  if (!positions.length) {
    redirect("/onboarding");
  }

  const packages =
    (packagesResult.data ?? []) as PayPackage[];

  const patterns =
    (patternsResult.data ?? []) as RotaPattern[];

  const allowances =
    (allowancesResult.data ?? []) as Allowance[];

  const todayEntries =
    (todayEntriesResult.data ?? []) as TodayEntry[];

  const positionIds = new Set(
    positions.map((position) => position.id),
  );

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
      today.iso,
    );

    const rota = getTodayRota(
      patterns.find(
        (pattern) =>
          pattern.position_id === position.id,
      ),
      rotaDays,
      today.iso,
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

    const activities = emptyActivityTotals();

    todayEntries
      .filter(
        (entry) =>
          entry.position_id === position.id,
      )
      .forEach((entry) => {
        const amount = Number(
          entry.calculated_pay ?? 0,
        );

        if (
          entry.entry_type in activities
        ) {
          const type =
            entry.entry_type as keyof ActivityTotals;

          activities[type] += amount;
        } else {
          activities.other += amount;
        }
      });

    breakdowns.push({
      id: position.id,
      label: position.label,
      model,
      scheduled,
      retainer,
      allowances: allowanceTotal,
      activities,

      total:
        scheduled +
        retainer +
        allowanceTotal +
        sumActivities(activities),

      rotaLabel: rota.label,
    });
  }

  /*
   * Anything recorded today without a Position still
   * counts towards the grand total.
   *
   * This catches mileage, expenses and any older/test
   * entries created before Position support.
   */

  /*
   * GRAND TOTAL FOR TODAY
   *
   * We calculate recorded activity independently from the
   * position cards so absolutely every saved entry today is
   * included in the main Today figure.
   */

  const recordedTodayGrandTotal = todayEntries.reduce(
    (total, entry) =>
      total + Number(entry.calculated_pay ?? 0),
    0,
  );

  /*
   * Scheduled/fixed pay is separate from manually recorded
   * activity so we don't accidentally double-count entries.
   */

  const scheduledAndFixedToday = breakdowns.reduce(
    (total, item) =>
      total +
      item.scheduled +
      item.retainer +
      item.allowances,
    0,
  );

  const totalToday =
    scheduledAndFixedToday +
    recordedTodayGrandTotal;

  /*
   * Entries without a currently active position are still
   * displayed separately so it's obvious where they came from.
   */

  const unassignedToday = todayEntries
    .filter(
      (entry) =>
        !entry.position_id ||
        !positionIds.has(entry.position_id),
    )
    .reduce(
      (total, entry) =>
        total +
        Number(entry.calculated_pay ?? 0),
      0,
    );

  const monthMinutes = (
    monthEntriesResult.data ?? []
  ).reduce(
    (total, entry) =>
      total +
      Number(entry.worked_minutes ?? 0),
    0,
  );

  const monthRecorded = (
    monthEntriesResult.data ?? []
  ).reduce(
    (total, entry) =>
      total +
      Number(entry.calculated_pay ?? 0),
    0,
  );

  const overtimeMinutes = (
    overtimeResult.data ?? []
  ).reduce(
    (total, entry) =>
      total +
      Number(entry.worked_minutes ?? 0),
    0,
  );

  const preferredName =
    profileResult.data?.preferred_name?.trim() ||
    profileResult.data?.full_name?.trim() ||
    "Firefighter";

  const dateText = new Intl.DateTimeFormat(
    "en-GB",
    {
      weekday: "long",
      day: "numeric",
      month: "long",
      timeZone: "Europe/London",
    },
  ).format(new Date());

  const londonHour = Number(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/London",
      hour: "2-digit",
      hour12: false,
    }).format(new Date()),
  );

  const greeting =
    londonHour < 12
      ? "Good morning"
      : londonHour < 18
        ? "Good afternoon"
        : "Good evening";


  return (
    <AppShell>
      <div className="space-y-8">
        <section>
          <p className="text-sm font-semibold text-red-600">
            {dateText}
          </p>

          <h1 className="mt-1 text-3xl font-bold tracking-tight text-zinc-950 sm:text-4xl">
            {greeting}, {preferredName}
          </h1>

          <p className="mt-2 text-sm text-zinc-500 sm:text-base">
            Your FirePay records and earnings at a glance.
          </p>
        </section>

        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard
            title="Today"
            value={`£${totalToday.toFixed(2)}`}
            subtitle="Grand total earned today"
            icon={Banknote}
            variant="primary"
          />

          <StatCard
            title="Recorded hours"
            value={formatMinutes(
              monthMinutes,
            )}
            subtitle="This month"
            icon={Clock3}
          />

          <StatCard
            title="Recorded pay"
            value={`£${monthRecorded.toFixed(2)}`}
            subtitle="This month"
            icon={TrendingUp}
            variant="success"
          />

          <StatCard
            title="Calls"
            value={String(
              callsResult.count ?? 0,
            )}
            subtitle="This year"
            icon={Flame}
          />
        </section>

        <section>
          <div className="mb-4">
            <h2 className="text-lg font-bold tracking-tight text-zinc-950">
              Today by position
            </h2>

            <p className="mt-1 text-sm text-zinc-500">
              See exactly where today&apos;s pay comes from
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {breakdowns.map((item) => {
              const retained =
                item.model === "retained";

              const Icon = retained
                ? Radio
                : BriefcaseBusiness;

              return (
                <Link
                  key={item.id}
                  href={`/settings/positions/${item.id}`}
                  className="rounded-[1.75rem] border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-zinc-300"
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
                        value={
                          item.activities.overtime
                        }
                      />
                    ) : null}

                    {item.activities.call > 0 ? (
                      <PayLine
                        label="Fire calls"
                        value={
                          item.activities.call
                        }
                      />
                    ) : null}

                    {item.activities.drill > 0 ? (
                      <PayLine
                        label="Drill"
                        value={
                          item.activities.drill
                        }
                      />
                    ) : null}

                    {item.activities.standby > 0 ? (
                      <PayLine
                        label="Standby"
                        value={
                          item.activities.standby
                        }
                      />
                    ) : null}

                    {item.activities.course > 0 ? (
                      <PayLine
                        label="Courses"
                        value={
                          item.activities.course
                        }
                      />
                    ) : null}

                    {item.activities.mileage > 0 ? (
                      <PayLine
                        label="Mileage"
                        value={
                          item.activities.mileage
                        }
                      />
                    ) : null}

                    {item.activities.expense > 0 ? (
                      <PayLine
                        label="Expenses"
                        value={
                          item.activities.expense
                        }
                      />
                    ) : null}

                    {item.activities.other > 0 ? (
                      <PayLine
                        label="Other"
                        value={
                          item.activities.other
                        }
                      />
                    ) : null}

                    {!retained ? (
                      <p className="pt-1 text-xs text-zinc-400">
                        {item.rotaLabel}
                      </p>
                    ) : null}
                  </div>
                </Link>
              );
            })}
          </div>

          {unassignedToday > 0 ? (
            <div className="mt-4 rounded-[1.5rem] border border-zinc-200 bg-white px-5 py-4 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-semibold text-zinc-950">
                    Other extras
                  </p>

                  <p className="mt-1 text-sm text-zinc-500">
                    Entries today not linked to a contract
                  </p>
                </div>

                <p className="text-xl font-bold text-zinc-950">
                  £{unassignedToday.toFixed(2)}
                </p>
              </div>
            </div>
          ) : null}
        </section>

        <QuickActions />

        <div className="grid gap-8 xl:grid-cols-[1.4fr_0.6fr]">
          <RecentActivity
            activities={recentResult.data ?? []}
          />

          <section>
            <div className="mb-4">
              <h2 className="text-lg font-bold tracking-tight text-zinc-950">
                Overtime
              </h2>

              <p className="mt-1 text-sm text-zinc-500">
                Current month
              </p>
            </div>

            <div className="rounded-[1.75rem] border border-zinc-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-medium text-zinc-500">
                Hours recorded
              </p>

              <p className="mt-2 text-3xl font-bold tracking-tight text-zinc-950">
                {formatMinutes(
                  overtimeMinutes,
                )}
              </p>

              <Link
                href="/activities"
                className="mt-4 inline-flex text-sm font-semibold text-red-600"
              >
                View activity history
              </Link>
            </div>
          </section>
        </div>
      </div>
    </AppShell>
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
