import Link from "next/link";
import {
  ArrowLeft,
  CircleUserRound,
  Play,
} from "lucide-react";

export default function DeveloperSandboxPage() {
  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-8 text-white">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/developer"
          className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-400"
        >
          <ArrowLeft className="size-4" />
          Developer Tools
        </Link>

        <div className="mt-8">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-white/10">
            <CircleUserRound className="size-7" />
          </div>

          <p className="mt-5 text-xs font-bold uppercase tracking-widest text-violet-400">
            Blank Sandbox
          </p>

          <h1 className="mt-2 text-3xl font-bold">
            Brand-new firefighter
          </h1>

          <p className="mt-3 text-sm leading-6 text-zinc-400">
            No profile. No roles. No rota. No activities. Use this to experience FirePay as a completely new user without touching your real account.
          </p>

          <div className="mt-7 space-y-2 rounded-2xl border border-zinc-800 bg-zinc-900 p-5 text-sm text-zinc-400">
            <p>Profile: Not configured</p>
            <p>Roles: 0</p>
            <p>Rota: Not configured</p>
            <p>Activities: 0</p>
            <p>Pay: Not configured</p>
          </div>

          <Link
            href="/onboarding?replay=1&sandbox=1"
            className="mt-6 flex h-14 items-center justify-center gap-2 rounded-2xl bg-red-600 font-semibold text-white"
          >
            <Play className="size-5" />
            Start onboarding as new user
          </Link>
        </div>
      </div>
    </main>
  );
}
