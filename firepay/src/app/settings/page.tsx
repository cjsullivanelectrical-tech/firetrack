import Link from "next/link";
import {
  ArrowLeft,
  ChevronRight,
  CircleUserRound,
  Settings,
} from "lucide-react";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { ResetTestData } from "@/components/settings/reset-test-data";

export default async function SettingsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

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
          <p className="text-sm font-semibold text-red-600">
            FirePay
          </p>

          <h1 className="mt-1 text-3xl font-bold tracking-tight text-zinc-950">
            Settings
          </h1>

          <p className="mt-2 text-sm text-zinc-500">
            Manage your contracts and FirePay setup.
          </p>
        </div>

        <div className="mt-8 space-y-4">
          <Link
            href="/settings/positions"
            className="flex items-center justify-between gap-4 rounded-[1.75rem] border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-zinc-300"
          >
            <div className="flex items-center gap-4">
              <div className="flex size-11 items-center justify-center rounded-2xl bg-red-50 text-red-600">
                <CircleUserRound className="size-5" />
              </div>

              <div>
                <p className="font-bold text-zinc-950">
                  Positions & contracts
                </p>

                <p className="mt-1 text-sm text-zinc-500">
                  Whole-time, on-call, rank, pay and rota
                </p>
              </div>
            </div>

            <ChevronRight className="size-5 text-zinc-300" />
          </Link>

          <div className="rounded-[1.75rem] border border-zinc-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="flex size-11 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-600">
                <Settings className="size-5" />
              </div>

              <div>
                <p className="font-bold text-zinc-950">
                  App settings
                </p>

                <p className="mt-1 text-sm text-zinc-500">
                  More preferences will appear here as FirePay grows.
                </p>
              </div>
            </div>
          </div>

          <ResetTestData />
        </div>
      </div>
    </main>
  );
}
