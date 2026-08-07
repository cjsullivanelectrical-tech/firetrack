import Link from "next/link";
import {
  ArrowLeft,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Flame,
  Radio,
  Settings,
} from "lucide-react";

export default function SandboxDashboardPage() {
  return (
    <main className="min-h-screen bg-zinc-100 px-4 py-6 sm:py-10">
      <div className="mx-auto max-w-6xl">
        <div className="rounded-2xl border border-violet-300 bg-violet-100 px-4 py-3 text-sm font-bold text-violet-800">
          DEVELOPER SANDBOX — no real account data is being changed
        </div>

        <div className="mt-5 flex items-center justify-between gap-4">
          <Link
            href="/developer"
            className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-600"
          >
            <ArrowLeft className="size-4" />
            Developer Tools
          </Link>

          <Link
            href="/onboarding?replay=1&sandbox=1"
            className="rounded-xl bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white"
          >
            Restart sandbox
          </Link>
        </div>

        <section className="mt-8">
          <p className="text-sm font-semibold text-red-600">
            Sandbox account
          </p>

          <h1 className="mt-1 text-3xl font-bold tracking-tight text-zinc-950">
            Setup complete
          </h1>

          <p className="mt-2 text-sm text-zinc-500">
            This is what a newly configured firefighter should see after onboarding.
          </p>
        </section>

        <div className="mt-7 rounded-[2rem] border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
              <CheckCircle2 className="size-5" />
            </div>

            <div>
              <p className="font-bold text-emerald-950">
                FirePay setup complete
              </p>

              <p className="mt-1 text-sm leading-6 text-emerald-800">
                Profile, role and initial rota questions have been completed.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatusCard
            icon={BriefcaseBusiness}
            title="Role"
            value="Configured"
            className="border-blue-200 bg-blue-50 text-blue-700"
          />

          <StatusCard
            icon={CalendarDays}
            title="Rota"
            value="Configured"
            className="border-violet-200 bg-violet-50 text-violet-700"
          />

          <StatusCard
            icon={Clock3}
            title="Activities"
            value="None yet"
            className="border-amber-200 bg-amber-50 text-amber-700"
          />

          <StatusCard
            icon={Flame}
            title="Incidents"
            value="0"
            className="border-red-200 bg-red-50 text-red-700"
          />
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          <section className="rounded-[1.75rem] border border-zinc-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-zinc-500">
              Today&apos;s earnings
            </p>

            <p className="mt-2 text-4xl font-bold tracking-tight text-zinc-950">
              £0.00
            </p>

            <p className="mt-2 text-sm text-zinc-500">
              A genuine new account may show £0 until its exact pay package and rota are fully configured.
            </p>
          </section>

          <section className="rounded-[1.75rem] border border-zinc-200 bg-white p-5 shadow-sm">
            <p className="font-bold text-zinc-950">
              What should the new user do next?
            </p>

            <div className="mt-4 space-y-3">
              <NextItem
                icon={Settings}
                text="Confirm detailed pay settings"
              />

              <NextItem
                icon={CalendarDays}
                text="Check the rota calendar"
              />

              <NextItem
                icon={Flame}
                text="Add the first fire call or activity"
              />
            </div>
          </section>
        </div>

        <div className="mt-6 rounded-[1.75rem] border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <Radio className="size-5 text-emerald-600" />

            <div>
              <p className="font-bold text-zinc-950">
                Sandbox journey complete
              </p>

              <p className="mt-1 text-sm text-zinc-500">
                If arriving at this screen feels confusing, we know the onboarding still needs work.
              </p>
            </div>
          </div>

          <Link
            href="/developer/demo"
            className="mt-5 inline-flex rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white"
          >
            Compare with fully populated demo
          </Link>
        </div>
      </div>
    </main>
  );
}

function StatusCard({
  icon: Icon,
  title,
  value,
  className,
}: {
  icon: typeof Flame;
  title: string;
  value: string;
  className: string;
}) {
  return (
    <div
      className={`rounded-[1.5rem] border p-4 ${className}`}
    >
      <Icon className="size-5" />

      <p className="mt-4 text-xs font-semibold opacity-70">
        {title}
      </p>

      <p className="mt-1 text-lg font-bold">
        {value}
      </p>
    </div>
  );
}

function NextItem({
  icon: Icon,
  text,
}: {
  icon: typeof Flame;
  text: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-zinc-50 p-3">
      <Icon className="size-4 text-zinc-500" />

      <p className="text-sm font-medium text-zinc-700">
        {text}
      </p>
    </div>
  );
}
