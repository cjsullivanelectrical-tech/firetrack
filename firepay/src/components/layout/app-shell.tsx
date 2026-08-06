import type { ReactNode } from "react";
import {
  Bell,
  CalendarDays,
  ChartNoAxesCombined,
  CircleUserRound,
  House,
  LogOut,
  Settings,
} from "lucide-react";
import { MobileNavigation } from "@/components/layout/mobile-navigation";

type AppShellProps = {
  children: ReactNode;
};

const desktopNavigation = [
  { label: "Dashboard", icon: House, active: true },
  { label: "Calendar", icon: CalendarDays, active: false },
  { label: "Reports", icon: ChartNoAxesCombined, active: false },
  { label: "Profile", icon: CircleUserRound, active: false },
];

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-zinc-100">
      <aside className="fixed inset-y-0 left-0 hidden w-72 border-r border-zinc-200 bg-white p-5 lg:flex lg:flex-col">
        <div className="flex items-center gap-3 px-2 py-3">
          <div className="flex size-11 items-center justify-center rounded-2xl bg-red-600 text-lg font-black text-white shadow-lg shadow-red-600/20">
            F
          </div>

          <div>
            <p className="text-xl font-bold tracking-tight text-zinc-950">
              FirePay
            </p>
            <p className="text-xs font-medium text-zinc-500">
              Pay tracking made simple
            </p>
          </div>
        </div>

        <nav className="mt-8 space-y-2" aria-label="Primary navigation">
          {desktopNavigation.map((item) => {
            const Icon = item.icon;

            return (
              <button
                key={item.label}
                type="button"
                className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-semibold transition ${
                  item.active
                    ? "bg-red-50 text-red-700"
                    : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950"
                }`}
              >
                <Icon aria-hidden="true" className="size-5" />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="mt-auto space-y-2">
          <button
            type="button"
            className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-zinc-600 hover:bg-zinc-100"
          >
            <Settings aria-hidden="true" className="size-5" />
            Settings
          </button>

          <button
            type="button"
            className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-zinc-600 hover:bg-zinc-100"
          >
            <LogOut aria-hidden="true" className="size-5" />
            Sign out
          </button>
        </div>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-40 border-b border-zinc-200/80 bg-zinc-100/85 backdrop-blur-xl">
          <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
            <div className="lg:hidden">
              <p className="text-xl font-black tracking-tight text-zinc-950">
                Fire<span className="text-red-600">Pay</span>
              </p>
            </div>

            <div className="hidden lg:block">
              <p className="text-sm font-medium text-zinc-500">Dashboard</p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                aria-label="Notifications"
                className="relative flex size-11 items-center justify-center rounded-full bg-white text-zinc-700 shadow-sm ring-1 ring-zinc-200"
              >
                <Bell aria-hidden="true" className="size-5" />
                <span className="absolute right-2.5 top-2.5 size-2 rounded-full bg-red-600 ring-2 ring-white" />
              </button>

              <button
                type="button"
                aria-label="Open profile"
                className="flex size-11 items-center justify-center rounded-full bg-zinc-900 text-sm font-bold text-white"
              >
                CS
              </button>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-4 pb-28 pt-6 sm:px-6 lg:px-8 lg:pb-10">
          {children}
        </main>
      </div>

      <MobileNavigation />
    </div>
  );
}