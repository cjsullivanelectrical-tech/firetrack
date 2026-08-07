import Link from "next/link";
import {
  ArrowLeft,
  Code2,
  Play,
  RotateCcw,
  ShieldCheck,
} from "lucide-react";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export default async function DeveloperPage() {
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
    <main className="min-h-screen bg-zinc-950 px-4 py-6 text-white sm:py-10">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/settings"
          className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-400"
        >
          <ArrowLeft className="size-4" />
          Settings
        </Link>

        <div className="mt-7">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-red-600">
            <Code2 className="size-6" />
          </div>

          <h1 className="mt-5 text-3xl font-bold tracking-tight">
            Developer Tools
          </h1>

          <p className="mt-2 text-sm leading-6 text-zinc-400">
            Safe testing tools for FirePay development.
          </p>
        </div>

        <div className="mt-8 space-y-4">
          <Link
            href="/onboarding?replay=1"
            className="flex items-center justify-between gap-4 rounded-[1.75rem] border border-zinc-800 bg-zinc-900 p-5 transition hover:border-zinc-700"
          >
            <div className="flex items-center gap-4">
              <div className="flex size-11 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-400">
                <Play className="size-5" />
              </div>

              <div>
                <p className="font-bold">
                  Replay onboarding
                </p>

                <p className="mt-1 text-sm text-zinc-400">
                  Walk through the full first-time setup without changing your account
                </p>
              </div>
            </div>
          </Link>

          <div className="rounded-[1.75rem] border border-zinc-800 bg-zinc-900 p-5">
            <div className="flex items-start gap-4">
              <div className="flex size-11 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400">
                <ShieldCheck className="size-5" />
              </div>

              <div>
                <p className="font-bold">
                  Safe mode
                </p>

                <p className="mt-1 text-sm leading-6 text-zinc-400">
                  Developer tools currently contain no destructive database actions.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-zinc-800 bg-zinc-900 p-5">
            <div className="flex items-start gap-4">
              <div className="flex size-11 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400">
                <RotateCcw className="size-5" />
              </div>

              <div>
                <p className="font-bold">
                  App version
                </p>

                <p className="mt-1 text-sm text-zinc-400">
                  FirePay Beta 0.9
                </p>
              </div>
            </div>
          </div>
        </div>

        <p className="mt-8 text-xs leading-5 text-zinc-600">
          Developer mode is intended for testing only. The hidden menu is not a security boundary.
        </p>
      </div>
    </main>
  );
}
