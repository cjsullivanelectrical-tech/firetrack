import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  ChevronRight,
  CircleUserRound,
  MessageSquareText,
  UserRound,
} from "lucide-react";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export default async function SettingsPage() {
  const supabase =
    await createClient();

  const {
    data: { user },
  } =
    await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="min-h-screen bg-zinc-100 px-4 py-6 sm:py-10">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-600"
        >
          <ArrowLeft className="size-4" />
          Dashboard
        </Link>

        <div className="mt-6">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-red-600">
              FirePay
            </p>

            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-amber-700">
              Beta
            </span>
          </div>

          <h1 className="mt-1 text-3xl font-bold tracking-tight text-zinc-950">
            Settings
          </h1>

          <p className="mt-2 text-sm text-zinc-500">
            Manage your account, roles, rota and FirePay preferences.
          </p>
        </div>

        <div className="mt-8 space-y-4">
          <SettingsLink
            href="/settings/profile"
            title="Profile"
            description="Name and account details"
            icon={UserRound}
            iconClass="bg-red-50 text-red-600"
          />

          <SettingsLink
            href="/settings/positions"
            title="My roles & contracts"
            description="Whole-time, on-call, rank, pay and rota"
            icon={CircleUserRound}
            iconClass="bg-blue-50 text-blue-600"
          />

          <SettingsLink
            href="/settings/calendar"
            title="Calendar appearance"
            description="Choose your calendar colours and style"
            icon={CalendarDays}
            iconClass="bg-amber-50 text-amber-600"
          />

          <SettingsLink
            href="/feedback"
            title="Send feedback"
            description="Tell us what is confusing, wrong or missing"
            icon={MessageSquareText}
            iconClass="bg-emerald-50 text-emerald-600"
          />

          <div className="rounded-[1.5rem] border border-amber-200 bg-amber-50 p-5">
            <p className="font-semibold text-amber-900">
              FirePay Beta
            </p>

            <p className="mt-2 text-sm leading-6 text-amber-800">
              FirePay is currently being tested. Pay figures are estimates and should always be checked against your official payslip and your fire service&apos;s payroll rules.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

function SettingsLink({
  href,
  title,
  description,
  icon: Icon,
  iconClass,
}: {
  href: string;
  title: string;
  description: string;
  icon: typeof UserRound;
  iconClass: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between gap-4 rounded-[1.75rem] border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-zinc-300"
    >
      <div className="flex items-center gap-4">
        <div
          className={`flex size-11 items-center justify-center rounded-2xl ${iconClass}`}
        >
          <Icon className="size-5" />
        </div>

        <div>
          <p className="font-bold text-zinc-950">
            {title}
          </p>

          <p className="mt-1 text-sm text-zinc-500">
            {description}
          </p>
        </div>
      </div>

      <ChevronRight className="size-5 text-zinc-300" />
    </Link>
  );
}
