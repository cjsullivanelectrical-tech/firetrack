import type { ReactNode } from "react";
import Link from "next/link";
import {
  CalendarDays,
  ChartNoAxesCombined,
  CircleUserRound,
  Clock3,
  House,
  MessageSquareText,
  PlusCircle,
  Settings,
} from "lucide-react";

import { MobileNavigation } from "@/components/layout/mobile-navigation";
import { SignOutButton } from "@/components/auth/sign-out-button";

type AppShellProps = {
  children: ReactNode;
};

const desktopNavigation = [
  {
    label: "Dashboard",
    icon: House,
    href: "/",
  },
  {
    label: "Add activity",
    icon: PlusCircle,
    href: "/entries/new",
  },
  {
    label: "Activity",
    icon: Clock3,
    href: "/activities",
  },
  {
    label: "Calendar",
    icon: CalendarDays,
    href: "/calendar",
  },
  {
    label: "Earnings",
    icon: ChartNoAxesCombined,
    href: "/reports",
  },
  {
    label: "My roles",
    icon: CircleUserRound,
    href: "/settings/positions",
  },
];

export function AppShell({
  children,
}: AppShellProps) {
  return (
    <div className="min-h-screen bg-zinc-100">
      <aside className="fixed inset-y-0 left-0 hidden w-72 border-r border-zinc-200 bg-white p-5 lg:flex lg:flex-col">
        <Link
          href="/"
          className="flex items-center gap-3 px-2 py-3"
        >
          <div className="flex size-11 items-center justify-center rounded-2xl bg-red-600 text-lg font-black text-white shadow-lg shadow-red-600/20">
            F
          </div>

          <div>
            <div className="flex items-center gap-2">
              <p className="text-xl font-bold tracking-tight text-zinc-950">
                FirePay
              </p>

              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-amber-700">
                Beta
              </span>
            </div>

            <p className="text-xs font-medium text-zinc-500">
              Pay tracking made simple
            </p>
          </div>
        </Link>

        <nav
          className="mt-8 space-y-2"
          aria-label="Primary navigation"
        >
          {desktopNavigation.map(
            (item) => {
              const Icon =
                item.icon;

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-semibold text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-950"
                >
                  <Icon className="size-5" />
                  {item.label}
                </Link>
              );
            },
          )}
        </nav>

        <div className="mt-auto space-y-2">
          <Link
            href="/feedback"
            className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-zinc-600 hover:bg-zinc-100"
          >
            <MessageSquareText className="size-5" />
            Send feedback
          </Link>

          <Link
            href="/settings"
            className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-zinc-600 hover:bg-zinc-100"
          >
            <Settings className="size-5" />
            Settings
          </Link>

          <SignOutButton />

          <p className="px-4 pt-2 text-[10px] leading-4 text-zinc-400">
            Beta tracking tool. Always check figures against your official payslip.
          </p>
        </div>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-40 border-b border-zinc-200/80 bg-zinc-100/85 backdrop-blur-xl">
          <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
            <Link
              href="/"
              className="lg:hidden"
            >
              <div className="flex items-center gap-2">
                <p className="text-xl font-black tracking-tight text-zinc-950">
                  Fire
                  <span className="text-red-600">
                    Pay
                  </span>
                </p>

                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-amber-700">
                  Beta
                </span>
              </div>
            </Link>

            <div className="hidden lg:block">
              <p className="text-sm font-medium text-zinc-500">
                FirePay
              </p>
            </div>

            <Link
              href="/settings/profile"
              aria-label="Open profile"
              className="flex size-11 items-center justify-center rounded-full bg-zinc-900 text-sm font-bold text-white"
            >
              FP
            </Link>
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
