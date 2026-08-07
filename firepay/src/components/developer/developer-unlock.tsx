"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Code2,
} from "lucide-react";

export function DeveloperUnlock() {
  const [taps, setTaps] =
    useState(0);

  const [unlocked, setUnlocked] =
    useState(false);

  useEffect(() => {
    setUnlocked(
      window.localStorage.getItem(
        "firepayDeveloperMode",
      ) === "true",
    );
  }, []);

  function tap() {
    if (unlocked) {
      return;
    }

    const next =
      taps + 1;

    setTaps(next);

    if (next >= 7) {
      window.localStorage.setItem(
        "firepayDeveloperMode",
        "true",
      );

      setUnlocked(true);
    }
  }

  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={tap}
        className="w-full select-none rounded-[1.5rem] border border-amber-200 bg-amber-50 p-5 text-left"
      >
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-semibold text-amber-900">
              FirePay Beta
            </p>

            <p className="mt-2 text-sm leading-6 text-amber-800">
              FirePay is currently being tested. Pay figures are estimates and should always be checked against your official payslip and your fire service&apos;s payroll rules.
            </p>
          </div>

          {unlocked ? (
            <CheckCircle2 className="size-5 shrink-0 text-emerald-600" />
          ) : null}
        </div>
      </button>

      {unlocked ? (
        <Link
          href="/developer"
          className="mt-3 flex items-center gap-3 rounded-[1.5rem] border border-zinc-800 bg-zinc-950 p-4 text-white"
        >
          <div className="flex size-10 items-center justify-center rounded-xl bg-white/10">
            <Code2 className="size-5" />
          </div>

          <div>
            <p className="font-bold">
              Developer Tools
            </p>

            <p className="mt-1 text-xs text-zinc-400">
              Developer mode unlocked
            </p>
          </div>
        </Link>
      ) : null}
    </div>
  );
}
