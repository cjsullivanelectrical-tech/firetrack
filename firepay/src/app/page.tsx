import {
  Banknote,
  CalendarClock,
  Clock3,
  Flame,
  TrendingUp,
} from "lucide-react";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { AppShell } from "@/components/layout/app-shell";
import { StatCard } from "@/components/ui/stat-card";

export default function HomePage() {
  return (
    <AppShell>
      <div className="space-y-8">
        <section>
          <p className="text-sm font-semibold text-red-600">
            Thursday, 6 August
          </p>

          <div className="mt-1 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-zinc-950 sm:text-4xl">
                Good evening, Curtis
              </h1>

              <p className="mt-2 max-w-xl text-sm leading-6 text-zinc-500 sm:text-base">
                Here is what you have earned and worked during your current pay
                period.
              </p>
            </div>

            <button
              type="button"
              className="hidden items-center justify-center gap-2 rounded-2xl bg-red-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-red-600/20 transition hover:bg-red-700 sm:flex"
            >
              <Flame aria-hidden="true" className="size-5" />
              Record activity
            </button>
          </div>
        </section>

        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard
            title="Today"
            value="£42.65"
            subtitle="1 call attended"
            icon={Banknote}
            variant="primary"
          />

          <StatCard
            title="This month"
            value="18h 35m"
            subtitle="Across 7 activities"
            icon={Clock3}
          />

          <StatCard
            title="Estimated pay"
            value="£684.20"
            subtitle="Current pay period"
            icon={TrendingUp}
            variant="success"
          />

          <StatCard
            title="Calls"
            value="12"
            subtitle="42 this year"
            icon={Flame}
          />
        </section>

        <section className="rounded-[1.75rem] bg-zinc-950 p-5 text-white shadow-xl shadow-zinc-900/10 sm:p-6">
          <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-zinc-400">
                <CalendarClock aria-hidden="true" className="size-4" />
                Current pay period
              </div>

              <p className="mt-3 text-2xl font-bold tracking-tight">
                20 July – 16 August
              </p>

              <p className="mt-1 text-sm text-zinc-400">
                10 days remaining until the period closes
              </p>
            </div>

            <div className="sm:text-right">
              <p className="text-sm font-medium text-zinc-400">
                Expected payslip
              </p>

              <p className="mt-1 text-3xl font-bold tracking-tight">£684.20</p>
            </div>
          </div>

          <div className="mt-6 h-2 overflow-hidden rounded-full bg-white/10">
            <div className="h-full w-[72%] rounded-full bg-red-500" />
          </div>

          <div className="mt-2 flex justify-between text-xs font-medium text-zinc-500">
            <span>20 Jul</span>
            <span>72% complete</span>
            <span>16 Aug</span>
          </div>
        </section>

        <QuickActions />

        <div className="grid gap-8 xl:grid-cols-[1.4fr_0.6fr]">
          <RecentActivity />

          <section>
            <div className="mb-4">
              <h2 className="text-lg font-bold tracking-tight text-zinc-950">
                Next drill night
              </h2>

              <p className="mt-1 text-sm text-zinc-500">
                Your next scheduled session
              </p>
            </div>

            <div className="rounded-[1.75rem] border border-zinc-200 bg-white p-5 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="flex size-14 shrink-0 flex-col items-center justify-center rounded-2xl bg-red-50 text-red-700">
                  <span className="text-xs font-bold uppercase">Aug</span>
                  <span className="text-xl font-black leading-none">11</span>
                </div>

                <div>
                  <p className="font-bold text-zinc-950">
                    Tuesday drill night
                  </p>

                  <p className="mt-1 text-sm text-zinc-500">
                    Battle Fire Station
                  </p>

                  <p className="mt-3 text-sm font-semibold text-zinc-700">
                    19:00–21:00
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </AppShell>
  );
}