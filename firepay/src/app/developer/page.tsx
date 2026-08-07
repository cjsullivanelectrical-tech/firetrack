import Link from "next/link";
import {
  ArrowLeft,
  Code2,
  Eye,
  FlaskConical,
  Play,
  ShieldCheck,
  UserPlus,
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

          <h1 className="mt-5 text-3xl font-bold">
            Developer Tools
          </h1>

          <p className="mt-2 text-sm text-zinc-400">
            Test FirePay without risking your live account data.
          </p>
        </div>

        <div className="mt-8 space-y-4">
          <Tool
            href="/developer/sandbox"
            icon={UserPlus}
            title="Blank Sandbox"
            description="Start as a completely new firefighter"
          />

          <Tool
            href="/developer/demo"
            icon={Eye}
            title="Demo Firefighter"
            description="See how FirePay should look when fully populated"
          />

          <Tool
            href="/onboarding?replay=1"
            icon={Play}
            title="Replay Onboarding"
            description="Walk through onboarding without saving changes"
          />

          <div className="rounded-[1.75rem] border border-zinc-800 bg-zinc-900 p-5">
            <div className="flex gap-4">
              <div className="flex size-11 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-400">
                <FlaskConical className="size-5" />
              </div>

              <div>
                <p className="font-bold">
                  Coming next
                </p>

                <p className="mt-1 text-sm leading-6 text-zinc-400">
                  Generate demo weeks, clear sandbox data, jump between setup steps and inspect pay calculations.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-emerald-900/60 bg-emerald-950/40 p-5">
            <div className="flex gap-4">
              <ShieldCheck className="mt-1 size-5 text-emerald-400" />

              <div>
                <p className="font-bold text-emerald-200">
                  Safe developer mode
                </p>

                <p className="mt-1 text-sm text-emerald-300/70">
                  Demo and sandbox screens do not alter your real FirePay data.
                </p>
              </div>
            </div>
          </div>
        </div>

        <p className="mt-8 text-xs text-zinc-600">
          FirePay Beta 0.9
        </p>
      </div>
    </main>
  );
}

function Tool({
  href,
  icon: Icon,
  title,
  description,
}: {
  href: string;
  icon: typeof Code2;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-4 rounded-[1.75rem] border border-zinc-800 bg-zinc-900 p-5 transition hover:border-zinc-700"
    >
      <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-white/5 text-zinc-300">
        <Icon className="size-5" />
      </div>

      <div>
        <p className="font-bold">
          {title}
        </p>

        <p className="mt-1 text-sm text-zinc-400">
          {description}
        </p>
      </div>
    </Link>
  );
}
