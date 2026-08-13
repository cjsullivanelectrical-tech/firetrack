import Link from "next/link";
import {
  ArrowLeft,
  Banknote,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  Radio,
  TriangleAlert,
} from "lucide-react";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import {
  dailyAllowanceValue,
  daysBetween,
  getMondayBasedWeekday,
} from "@/lib/pay/calculations";
import { getRotaDayIndex } from "@/lib/pay/rota";

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
  pay_model:
    | "salaried"
    | "retained"
    | "custom";
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
  is_working: boolean;
  duration_minutes: number;
};

type Allowance = {
  position_id: string;
  amount: number;
  frequency: string;
};

type Entry = {
  position_id: string | null;
  entry_type: string;
  activity_date: string;
  calculated_pay: number;
};

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
            part.type !== "literal",
        )
        .map((part) => [
          part.type,
          part.value,
        ]),
    );

  return `${values.year}-${values.month}-${values.day}`;
}

function addDays(
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

function getRotaForDate(
  pattern:
    | RotaPattern
    | undefined,
  days: RotaDay[],
  date: string,
) {
  if (
    !pattern ||
    pattern.pattern_type ===
      "none"
  ) {
    return {
      working: false,
      minutes: 0,
    };
  }

  if (
    pattern.pattern_type ===
    "weekly_rdo"
  ) {
    const weekday =
      getMondayBasedWeekday(date);

    if (weekday > 5) {
      return {
        working: false,
        minutes: 0,
      };
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
      return {
        working: false,
        minutes: 0,
      };
    }

    return {
      working: true,
      minutes: Number(
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
    days.find(
      (day) =>
        day.rota_pattern_id ===
          pattern.id &&
        day.day_index === index,
    );

  return {
    working: Boolean(
      rotaDay?.is_working,
    ),
    minutes:
      rotaDay?.is_working
        ? Number(
            rotaDay.duration_minutes ??
              0,
          )
        : 0,
  };
}

async function getNationalRate(
  supabase: Awaited<
    ReturnType<
      typeof createClient
    >
  >,
  position: Position,
  date: string,
) {
  const { data } =
    await supabase
      .from(
        "national_pay_rates",
      )
      .select(
        "basic_hourly,retained_annual_full,retained_annual_day_crew",
      )
      .eq(
        "rank",
        position.rank,
      )
      .eq(
        "competence",
        position.competence,
      )
      .lte(
        "effective_from",
        date,
      )
      .or(
        `effective_to.is.null,effective_to.gte.${date}`,
      )
      .order(
        "effective_from",
        {
          ascending: false,
        },
      )
      .limit(1)
      .maybeSingle();

  return {
    basic: Number(
      data?.basic_hourly ?? 0,
    ),
    fullRetainer: Number(
      data?.retained_annual_full ??
        0,
    ),
    dayCrewRetainer: Number(
      data?.retained_annual_day_crew ??
        0,
    ),
  };
}

function money(value: number) {
  return `£${value.toFixed(2)}`;
}

export default async function ExpectedPayPage() {
  const supabase =
    await createClient();

  const {
    data: { user },
  } =
    await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const today =
    londonToday();

  const year =
    today.slice(0, 4);

  const month =
    today.slice(5, 7);

  const monthStart =
    `${year}-${month}-01`;

  const daysInMonth =
    new Date(
      Number(year),
      Number(month),
      0,
    ).getDate();

  const monthEnd =
    `${year}-${month}-${String(
      daysInMonth,
    ).padStart(2, "0")}`;

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
      .eq(
        "user_id",
        user.id,
      )
      .eq("is_active", true),

    supabase
      .from(
        "position_pay_packages",
      )
      .select(
        "position_id,use_national_rates,custom_basic_hourly,count_rota_as_base_earnings,pay_model,retained_retainer_type,custom_retainer_annual",
      )
      .eq(
        "user_id",
        user.id,
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
      .from(
        "position_allowances",
      )
      .select(
        "position_id,amount,frequency",
      )
      .eq(
        "user_id",
        user.id,
      )
      .lte(
        "effective_from",
        monthEnd,
      )
      .or(
        `effective_to.is.null,effective_to.gte.${monthStart}`,
      ),

    supabase
      .from("entries")
      .select(
        "position_id,entry_type,activity_date,calculated_pay",
      )
      .eq(
        "user_id",
        user.id,
      )
      .gte(
        "activity_date",
        monthStart,
      )
      .lte(
        "activity_date",
        monthEnd,
      ),
  ]);

  const positions =
    (positionsResult.data ??
      []) as Position[];

  const packages =
    (packagesResult.data ??
      []) as PayPackage[];

  const patterns =
    (patternsResult.data ??
      []) as RotaPattern[];

  const allowances =
    (allowancesResult.data ??
      []) as Allowance[];

  const entries =
    (entriesResult.data ??
      []) as Entry[];

  const patternIds =
    patterns.map(
      (pattern) => pattern.id,
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
          "rota_pattern_id,day_index,is_working,duration_minutes",
        )
        .in(
          "rota_pattern_id",
          patternIds,
        );

    rotaDays =
      (data ??
        []) as RotaDay[];
  }

  let baseExpected = 0;
  let retainerExpected = 0;
  let allowancesExpected = 0;

  const incomplete: string[] = [];

  for (
    const position of positions
  ) {
    const payPackage =
      packages.find(
        (item) =>
          item.position_id ===
          position.id,
      );

    if (!payPackage) {
      incomplete.push(
        `${position.label}: pay package missing`,
      );
      continue;
    }

    const rates =
      await getNationalRate(
        supabase,
        position,
        today,
      );

    const model =
      payPackage.pay_model ??
      (position.employment_type ===
      "on_call"
        ? "retained"
        : "salaried");

    if (
      model ===
      "salaried"
    ) {
      const rate =
        payPackage.use_national_rates
          ? rates.basic
          : Number(
              payPackage.custom_basic_hourly ??
                0,
            );

      const pattern =
        patterns.find(
          (item) =>
            item.position_id ===
            position.id,
        );

      if (
        payPackage
          .count_rota_as_base_earnings &&
        !pattern
      ) {
        incomplete.push(
          `${position.label}: rota missing`,
        );
      }

      for (
        let day = 1;
        day <=
        daysInMonth;
        day++
      ) {
        const date =
          `${year}-${month}-${String(
            day,
          ).padStart(2, "0")}`;

        const rota =
          getRotaForDate(
            pattern,
            rotaDays,
            date,
          );

        if (
          rota.working &&
          payPackage
            .count_rota_as_base_earnings
        ) {
          baseExpected +=
            (rota.minutes /
              60) *
            rate;
        }

        const dailyAllowance =
          allowances
            .filter(
              (item) =>
                item.position_id ===
                position.id,
            )
            .reduce(
              (
                total,
                allowance,
              ) =>
                total +
                dailyAllowanceValue(
                  Number(
                    allowance.amount,
                  ),
                  allowance.frequency,
                  rota.working,
                ),
              0,
            );

        allowancesExpected +=
          dailyAllowance;
      }
    }

    if (
      model ===
      "retained"
    ) {
      const type =
        payPackage.retained_retainer_type ??
        "full";

      let annual = 0;

      if (type === "full") {
        annual =
          rates.fullRetainer;
      }

      if (
        type === "day_crew"
      ) {
        annual =
          rates.dayCrewRetainer;
      }

      if (
        type === "custom"
      ) {
        annual =
          Number(
            payPackage.custom_retainer_annual ??
              0,
          );
      }

      retainerExpected +=
        (annual / 365) *
        daysInMonth;
    }
  }

  const recordedExtras =
    entries.reduce(
      (total, entry) =>
        total +
        Number(
          entry.calculated_pay ??
            0,
        ),
      0,
    );

  const expectedThisMonth =
    baseExpected +
    retainerExpected +
    allowancesExpected +
    recordedExtras;

  const recordedSoFar =
    entries
      .filter(
        (entry) =>
          entry.activity_date <=
          today,
      )
      .reduce(
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
      <div className="mx-auto max-w-5xl">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-600"
        >
          <ArrowLeft className="size-4" />
          Dashboard
        </Link>

        <div className="mt-6">
          <p className="text-sm font-semibold text-red-600">
            Earnings
          </p>

          <h1 className="mt-1 text-3xl font-bold tracking-tight text-zinc-950">
            Expected Pay
          </h1>

          <p className="mt-2 text-sm text-zinc-500">
            What FirePay currently expects you to earn this month based on your rota, pay package, allowances and recorded extras.
          </p>
        </div>

        <section className="mt-7 rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
          <p className="text-sm font-semibold text-zinc-500">
            Expected this month
          </p>

          <p className="mt-2 text-5xl font-bold tracking-tight text-zinc-950">
            {money(
              expectedThisMonth,
            )}
          </p>

          <p className="mt-2 text-sm text-zinc-400">
            Gross expected earnings before tax, NI and pension deductions.
          </p>
        </section>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat
            icon={BriefcaseBusiness}
            label="Base / rota pay"
            value={money(
              baseExpected,
            )}
            className="border-blue-200 bg-blue-50 text-blue-700"
          />

          <Stat
            icon={Radio}
            label="Retainer"
            value={money(
              retainerExpected,
            )}
            className="border-emerald-200 bg-emerald-50 text-emerald-700"
          />

          <Stat
            icon={CalendarDays}
            label="Allowances"
            value={money(
              allowancesExpected,
            )}
            className="border-violet-200 bg-violet-50 text-violet-700"
          />

          <Stat
            icon={Banknote}
            label="Recorded extras"
            value={money(
              recordedExtras,
            )}
            className="border-amber-200 bg-amber-50 text-amber-700"
          />
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          <section className="rounded-[1.75rem] border border-zinc-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-zinc-500">
              Recorded so far
            </p>

            <p className="mt-2 text-3xl font-bold text-zinc-950">
              {money(
                recordedSoFar,
              )}
            </p>

            <p className="mt-2 text-sm text-zinc-500">
              Extra earnings already logged this month.
            </p>
          </section>

          <section className="rounded-[1.75rem] border border-zinc-200 bg-white p-5 shadow-sm">
            {incomplete.length === 0 ? (
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 size-5 text-emerald-600" />

                <div>
                  <p className="font-bold text-zinc-950">
                    Setup looks complete
                  </p>

                  <p className="mt-1 text-sm leading-6 text-zinc-500">
                    FirePay has the main information needed to estimate this month.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-3">
                <TriangleAlert className="mt-0.5 size-5 text-amber-600" />

                <div>
                  <p className="font-bold text-zinc-950">
                    Expected pay may be incomplete
                  </p>

                  <div className="mt-2 space-y-1">
                    {incomplete.map(
                      (item) => (
                        <p
                          key={item}
                          className="text-sm text-zinc-500"
                        >
                          • {item}
                        </p>
                      ),
                    )}
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>

        <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-semibold text-amber-900">
            FirePay Beta
          </p>

          <p className="mt-1 text-sm leading-6 text-amber-800">
            Expected Pay is an estimate based on your current FirePay setup and recorded activity. Always compare it with your official payslip.
          </p>
        </div>
      </div>
    </main>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  className,
}: {
  icon: typeof Banknote;
  label: string;
  value: string;
  className: string;
}) {
  return (
    <div
      className={`rounded-[1.5rem] border p-4 ${className}`}
    >
      <Icon className="size-5" />

      <p className="mt-4 text-xs font-semibold opacity-70">
        {label}
      </p>

      <p className="mt-1 text-xl font-bold">
        {value}
      </p>
    </div>
  );
}
