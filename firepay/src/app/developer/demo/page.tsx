import Link from "next/link";
import {
  ArrowLeft,
  Banknote,
  BriefcaseBusiness,
  CalendarDays,
  Clock3,
  Flame,
  Radio,
  Sparkles,
} from "lucide-react";

export default function DeveloperDemoPage() {
  return (
    <main className="min-h-screen bg-zinc-100 px-4 py-6 sm:py-10">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/developer"
          className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-600"
        >
          <ArrowLeft className="size-4" />
          Developer Tools
        </Link>

        <div className="mt-6 rounded-2xl border border-violet-300 bg-violet-100 px-4 py-3 text-sm font-bold text-violet-800">
          DEMO MODE — Example data only. Nothing here is from your real account.
        </div>

        <section className="mt-6">
          <p className="text-sm font-semibold text-red-600">
            Friday 7 August
          </p>

          <h1 className="mt-1 text-3xl font-bold tracking-tight text-zinc-950">
            Good evening, Alex
          </h1>

          <p className="mt-2 text-sm text-zinc-500">
            Here&apos;s what a fully-set-up FirePay account can look like.
          </p>
        </section>

        <div className="mt-8 grid gap-5 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <p className="text-sm font-semibold text-zinc-500">
              Earned today
            </p>

            <p className="mt-2 text-4xl font-bold tracking-tight text-zinc-950">
              £286.42
            </p>

            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Metric
                icon={BriefcaseBusiness}
                label="Shift"
                value="9h"
              />

              <Metric
                icon={Flame}
                label="Incidents"
                value="2"
              />

              <Metric
                icon={Clock3}
                label="Overtime"
                value="2h"
              />

              <Metric
                icon={Banknote}
                label="Extras"
                value="£93.14"
              />
            </div>
          </Card>

          <Card>
            <CalendarDays className="size-5 text-blue-600" />

            <p className="mt-4 text-sm font-medium text-zinc-500">
              Next shift
            </p>

            <p className="mt-1 text-xl font-bold text-zinc-950">
              Monday
            </p>

            <p className="mt-1 text-sm text-zinc-500">
              08:00–17:00
            </p>
          </Card>
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          <ContractCard
            icon={BriefcaseBusiness}
            title="Battle Whole-time"
            subtitle="Firefighter • Competent"
            total="£193.28"
            items={[
              [
                "Scheduled shift",
                "£173.28",
              ],
              [
                "Allowance",
                "£20.00",
              ],
            ]}
          />

          <ContractCard
            icon={Radio}
            title="Battle On-call"
            subtitle="Firefighter • Competent"
            total="£93.14"
            items={[
              [
                "Retainer accrued",
                "£7.14",
              ],
              [
                "Paid call",
                "£38.00",
              ],
              [
                "Overtime",
                "£48.00",
              ],
            ]}
          />
        </div>

        <Card className="mt-5">
          <div className="flex items-center gap-2">
            <Sparkles className="size-5 text-amber-600" />

            <h2 className="font-bold text-zinc-950">
              Example recent activity
            </h2>
          </div>

          <div className="mt-5 space-y-3">
            <Activity
              icon={Flame}
              title="Shed fire"
              detail="11:42 • Incident 042731"
              pay="£38.00"
            />

            <Activity
              icon={Clock3}
              title="Overtime"
              detail="17:00–19:00"
              pay="£48.00"
            />

            <Activity
              icon={CalendarDays}
              title="Annual Leave"
              detail="12–16 August"
              pay="Status"
            />
          </div>
        </Card>
      </div>
    </main>
  );
}

function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-[1.75rem] border border-zinc-200 bg-white p-5 shadow-sm ${className}`}
    >
      {children}
    </section>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Flame;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-zinc-50 p-3">
      <Icon className="size-4 text-red-500" />

      <p className="mt-3 text-xs text-zinc-400">
        {label}
      </p>

      <p className="mt-1 font-bold text-zinc-950">
        {value}
      </p>
    </div>
  );
}

function ContractCard({
  icon: Icon,
  title,
  subtitle,
  total,
  items,
}: {
  icon: typeof Radio;
  title: string;
  subtitle: string;
  total: string;
  items: [string, string][];
}) {
  return (
    <Card>
      <div className="flex items-start justify-between gap-4">
        <div className="flex gap-3">
          <div className="flex size-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            <Icon className="size-5" />
          </div>

          <div>
            <p className="font-bold text-zinc-950">
              {title}
            </p>

            <p className="mt-1 text-xs text-zinc-400">
              {subtitle}
            </p>
          </div>
        </div>

        <p className="text-xl font-bold text-zinc-950">
          {total}
        </p>
      </div>

      <div className="mt-5 space-y-3 border-t border-zinc-100 pt-4">
        {items.map(
          ([label, value]) => (
            <div
              key={label}
              className="flex justify-between gap-4 text-sm"
            >
              <span className="text-zinc-500">
                {label}
              </span>

              <span className="font-semibold text-zinc-900">
                {value}
              </span>
            </div>
          ),
        )}
      </div>
    </Card>
  );
}

function Activity({
  icon: Icon,
  title,
  detail,
  pay,
}: {
  icon: typeof Flame;
  title: string;
  detail: string;
  pay: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-zinc-50 p-4">
      <div className="flex size-10 items-center justify-center rounded-xl bg-white text-red-600">
        <Icon className="size-5" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="font-semibold text-zinc-900">
          {title}
        </p>

        <p className="mt-1 text-xs text-zinc-400">
          {detail}
        </p>
      </div>

      <p className="font-bold text-zinc-900">
        {pay}
      </p>
    </div>
  );
}
