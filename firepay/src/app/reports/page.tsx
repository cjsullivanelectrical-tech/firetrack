import Link from "next/link";
import {
  ArrowLeft,
  Banknote,
  BriefcaseBusiness,
  Clock3,
  Flame,
  GraduationCap,
  Radio,
  TrendingUp,
} from "lucide-react";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { formatMinutes } from "@/lib/pay/calculations";

type Position = {
  id: string;
  label: string;
  employment_type: string;
};

type Entry = {
  id: string;
  position_id: string | null;
  entry_type: string;
  activity_date: string;
  worked_minutes: number;
  calculated_pay: number;
  mileage: number | null;
  expense_amount: number | null;
};

function londonParts() {
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
    year: values.year,
    month: values.month,
    day: values.day,
    today: `${values.year}-${values.month}-${values.day}`,
  };
}

function sumPay(entries: Entry[]) {
  return entries.reduce(
    (total, entry) =>
      total +
      Number(entry.calculated_pay ?? 0),
    0,
  );
}

function sumMinutes(entries: Entry[]) {
  return entries.reduce(
    (total, entry) =>
      total +
      Number(entry.worked_minutes ?? 0),
    0,
  );
}

export default async function ReportsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const now = londonParts();

  const monthStart =
    `${now.year}-${now.month}-01`;

  const yearStart =
    `${now.year}-01-01`;

  const [
    positionsResult,
    monthResult,
    yearResult,
  ] = await Promise.all([
    supabase
      .from("positions")
      .select(
        "id,label,employment_type",
      )
      .eq("user_id", user.id),

    supabase
      .from("entries")
      .select(
        "id,position_id,entry_type,activity_date,worked_minutes,calculated_pay,mileage,expense_amount",
      )
      .eq("user_id", user.id)
      .gte("activity_date", monthStart)
      .lte("activity_date", now.today),

    supabase
      .from("entries")
      .select(
        "id,position_id,entry_type,activity_date,worked_minutes,calculated_pay,mileage,expense_amount",
      )
      .eq("user_id", user.id)
      .gte("activity_date", yearStart)
      .lte("activity_date", now.today),
  ]);

  const positions =
    (positionsResult.data ?? []) as Position[];

  const monthEntries =
    (monthResult.data ?? []) as Entry[];

  const yearEntries =
    (yearResult.data ?? []) as Entry[];

  const monthCalls =
    monthEntries.filter(
      (entry) =>
        entry.entry_type === "call",
    );

  const monthOvertime =
    monthEntries.filter(
      (entry) =>
        entry.entry_type === "overtime",
    );

  const monthDrill =
    monthEntries.filter(
      (entry) =>
        entry.entry_type === "drill",
    );

  const yearCalls =
    yearEntries.filter(
      (entry) =>
        entry.entry_type === "call",
    );

  const yearOvertime =
    yearEntries.filter(
      (entry) =>
        entry.entry_type === "overtime",
    );

  const wholeTimePositionIds =
    positions
      .filter(
        (position) =>
          position.employment_type ===
          "wholetime",
      )
      .map((position) => position.id);

  const onCallPositionIds =
    positions
      .filter(
        (position) =>
          position.employment_type ===
          "on_call",
      )
      .map((position) => position.id);

  const monthWholeTime =
    monthEntries.filter(
      (entry) =>
        entry.position_id !== null &&
        wholeTimePositionIds.includes(
          entry.position_id,
        ),
    );

  const monthOnCall =
    monthEntries.filter(
      (entry) =>
        entry.position_id !== null &&
        onCallPositionIds.includes(
          entry.position_id,
        ),
    );

  const totalMileage =
    monthEntries.reduce(
      (total, entry) =>
        total +
        Number(entry.mileage ?? 0),
      0,
    );

  const totalExpenses =
    monthEntries
      .filter(
        (entry) =>
          entry.entry_type === "expense",
      )
      .reduce(
        (total, entry) =>
          total +
          Number(
            entry.expense_amount ??
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
            Reports
          </p>

          <h1 className="mt-1 text-3xl font-bold tracking-tight text-zinc-950">
            Earnings & statistics
          </h1>

          <p className="mt-2 text-sm text-zinc-500">
            Live figures from everything you have recorded in FirePay.
          </p>
        </div>

        <section className="mt-8">
          <div>
            <h2 className="text-xl font-bold text-zinc-950">
              This month
            </h2>

            <p className="mt-1 text-sm text-zinc-500">
              Recorded activity only
            </p>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <ReportCard
              label="Recorded pay"
              value={`£${sumPay(
                monthEntries,
              ).toFixed(2)}`}
              icon={Banknote}
            />

            <ReportCard
              label="Hours worked"
              value={formatMinutes(
                sumMinutes(monthEntries),
              )}
              icon={Clock3}
            />

            <ReportCard
              label="Fire calls"
              value={String(
                monthCalls.length,
              )}
              icon={Flame}
            />

            <ReportCard
              label="Overtime"
              value={formatMinutes(
                sumMinutes(
                  monthOvertime,
                ),
              )}
              icon={TrendingUp}
            />
          </div>
        </section>

        <section className="mt-8 grid gap-4 lg:grid-cols-2">
          <ContractCard
            title="Whole-time"
            subtitle="Recorded extras this month"
            value={sumPay(
              monthWholeTime,
            )}
            icon={BriefcaseBusiness}
          />

          <ContractCard
            title="On-call"
            subtitle="Recorded activity this month"
            value={sumPay(
              monthOnCall,
            )}
            icon={Radio}
          />
        </section>

        <section className="mt-8 rounded-[2rem] border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-lg font-bold text-zinc-950">
            Activity breakdown
          </h2>

          <div className="mt-5 space-y-4">
            <BreakdownLine
              label="Fire calls"
              count={monthCalls.length}
              hours={sumMinutes(
                monthCalls,
              )}
              pay={sumPay(monthCalls)}
            />

            <BreakdownLine
              label="Overtime"
              count={
                monthOvertime.length
              }
              hours={sumMinutes(
                monthOvertime,
              )}
              pay={sumPay(
                monthOvertime,
              )}
            />

            <BreakdownLine
              label="Drill nights"
              count={monthDrill.length}
              hours={sumMinutes(
                monthDrill,
              )}
              pay={sumPay(monthDrill)}
            />

            <div className="flex items-center justify-between border-t border-zinc-100 pt-4">
              <div>
                <p className="font-semibold text-zinc-950">
                  Mileage
                </p>

                <p className="mt-1 text-sm text-zinc-500">
                  This month
                </p>
              </div>

              <p className="font-bold text-zinc-950">
                {totalMileage.toFixed(1)} miles
              </p>
            </div>

            <div className="flex items-center justify-between border-t border-zinc-100 pt-4">
              <div>
                <p className="font-semibold text-zinc-950">
                  Expenses
                </p>

                <p className="mt-1 text-sm text-zinc-500">
                  This month
                </p>
              </div>

              <p className="font-bold text-zinc-950">
                £{totalExpenses.toFixed(2)}
              </p>
            </div>
          </div>
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-bold text-zinc-950">
            This year
          </h2>

          <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <ReportCard
              label="Recorded pay"
              value={`£${sumPay(
                yearEntries,
              ).toFixed(2)}`}
              icon={Banknote}
            />

            <ReportCard
              label="Hours"
              value={formatMinutes(
                sumMinutes(yearEntries),
              )}
              icon={Clock3}
            />

            <ReportCard
              label="Calls"
              value={String(
                yearCalls.length,
              )}
              icon={Flame}
            />

            <ReportCard
              label="Overtime"
              value={formatMinutes(
                sumMinutes(
                  yearOvertime,
                ),
              )}
              icon={GraduationCap}
            />
          </div>
        </section>

        <div className="mt-8 rounded-2xl border border-zinc-200 bg-white p-5 text-sm leading-6 text-zinc-500">
          Payslip comparison, pay periods and PDF exports will build on these live figures next.
        </div>
      </div>
    </main>
  );
}

function ReportCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: typeof Banknote;
}) {
  return (
    <div className="rounded-[1.5rem] border border-zinc-200 bg-white p-4 shadow-sm">
      <Icon className="size-5 text-red-600" />

      <p className="mt-4 text-sm text-zinc-500">
        {label}
      </p>

      <p className="mt-1 text-2xl font-bold tracking-tight text-zinc-950">
        {value}
      </p>
    </div>
  );
}

function ContractCard({
  title,
  subtitle,
  value,
  icon: Icon,
}: {
  title: string;
  subtitle: string;
  value: number;
  icon: typeof BriefcaseBusiness;
}) {
  return (
    <div className="rounded-[1.75rem] border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-2xl bg-red-50 text-red-600">
            <Icon className="size-5" />
          </div>

          <div>
            <p className="font-bold text-zinc-950">
              {title}
            </p>

            <p className="mt-1 text-sm text-zinc-500">
              {subtitle}
            </p>
          </div>
        </div>

        <p className="text-2xl font-bold text-zinc-950">
          £{value.toFixed(2)}
        </p>
      </div>
    </div>
  );
}

function BreakdownLine({
  label,
  count,
  hours,
  pay,
}: {
  label: string;
  count: number;
  hours: number;
  pay: number;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-zinc-100 pb-4">
      <div>
        <p className="font-semibold text-zinc-950">
          {label}
        </p>

        <p className="mt-1 text-sm text-zinc-500">
          {count} recorded •{" "}
          {formatMinutes(hours)}
        </p>
      </div>

      <p className="font-bold text-zinc-950">
        £{pay.toFixed(2)}
      </p>
    </div>
  );
}
