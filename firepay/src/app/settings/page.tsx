import Link from "next/link";
import {
  ArrowLeft,
  Banknote,
  CalendarDays,
  ChevronRight,
  CircleUserRound,
  HeartPulse,
  Info,
  KeyRound,
  MessageSquareText,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { redirect } from "next/navigation";

import { DeveloperUnlock } from "@/components/developer/developer-unlock";
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
            Manage your account, work setup and FirePay preferences.
          </p>
        </div>

        <SettingsSection
          title="Account"
          className="mt-8"
        >
          <SettingsLink
            href="/settings/profile"
            title="Profile"
            description="Name and personal details"
            icon={UserRound}
            iconClass="bg-red-50 text-red-600"
          />

          <SettingsLink
            href="/settings/security"
            title="Login & Security"
            description="Password, reset email and account sessions"
            icon={KeyRound}
            iconClass="bg-zinc-100 text-zinc-700"
          />
        </SettingsSection>

        <SettingsSection
          title="Work"
          className="mt-8"
        >
          <SettingsLink
            href="/settings/positions"
            title="My Roles & Contracts"
            description="Whole-time, On-call, rank, pay and rota"
            icon={CircleUserRound}
            iconClass="bg-blue-50 text-blue-600"
          />

          <SettingsLink
            href="/expected-pay"
            title="Expected Pay"
            description="Expected gross earnings and setup confidence"
            icon={Banknote}
            iconClass="bg-emerald-50 text-emerald-600"
          />

          <SettingsLink
            href="/leave"
            title="Leave & Sickness"
            description="Annual leave and sickness date ranges"
            icon={HeartPulse}
            iconClass="bg-violet-50 text-violet-600"
          />
        </SettingsSection>

        <SettingsSection
          title="FirePay"
          className="mt-8"
        >
          <SettingsLink
            href="/settings/calendar"
            title="Calendar Appearance"
            description="Colours and calendar style"
            icon={CalendarDays}
            iconClass="bg-amber-50 text-amber-600"
          />
        </SettingsSection>

        <SettingsSection
          title="Support"
          className="mt-8"
        >
          <SettingsLink
            href="/feedback"
            title="Send Feedback"
            description="Tell us what is confusing, wrong or missing"
            icon={MessageSquareText}
            iconClass="bg-emerald-50 text-emerald-600"
          />

          <SettingsLink
            href="/about"
            title="About FirePay"
            description="Version, beta status and important information"
            icon={Info}
            iconClass="bg-zinc-100 text-zinc-700"
          />
        </SettingsSection>

        <div className="mt-8 rounded-[1.5rem] border border-amber-200 bg-amber-50 p-5">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 size-5 text-amber-700" />

            <div>
              <p className="font-semibold text-amber-950">
                FirePay Beta
              </p>

              <p className="mt-1 text-sm leading-6 text-amber-800">
                Pay figures are estimates and should always be checked against official payroll information.
              </p>
            </div>
          </div>
        </div>

        <DeveloperUnlock />
      </div>
    </main>
  );
}

function SettingsSection({
  title,
  children,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={className}>
      <p className="mb-3 px-1 text-xs font-bold uppercase tracking-wider text-zinc-400">
        {title}
      </p>

      <div className="space-y-3">
        {children}
      </div>
    </section>
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
      <div className="flex min-w-0 items-center gap-4">
        <div
          className={`flex size-11 shrink-0 items-center justify-center rounded-2xl ${iconClass}`}
        >
          <Icon className="size-5" />
        </div>

        <div className="min-w-0">
          <p className="font-bold text-zinc-950">
            {title}
          </p>

          <p className="mt-1 text-sm text-zinc-500">
            {description}
          </p>
        </div>
      </div>

      <ChevronRight className="size-5 shrink-0 text-zinc-300" />
    </Link>
  );
}
