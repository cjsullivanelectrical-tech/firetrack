import Link from "next/link";
import {
  ArrowLeft,
  Flame,
  ShieldCheck,
} from "lucide-react";

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-zinc-100 px-4 py-6 sm:py-10">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/settings"
          className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-600"
        >
          <ArrowLeft className="size-4" />
          Settings
        </Link>

        <div className="mt-8 rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex size-14 items-center justify-center rounded-[1.5rem] bg-red-600 text-white">
            <Flame className="size-7" />
          </div>

          <h1 className="mt-5 text-3xl font-bold tracking-tight text-zinc-950">
            About FirePay
          </h1>

          <p className="mt-3 text-sm leading-6 text-zinc-500">
            FirePay helps firefighters track activity, rota information and expected earnings across Whole-time and On-call roles.
          </p>

          <div className="mt-7 rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 size-5 text-amber-700" />

              <div>
                <p className="font-semibold text-amber-950">
                  Beta
                </p>

                <p className="mt-1 text-sm leading-6 text-amber-800">
                  FirePay is an independent tracking and estimating tool. Always check pay figures against your official payslip and your fire service&apos;s payroll rules.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-7 border-t border-zinc-100 pt-5 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-zinc-500">
                Version
              </span>

              <span className="font-semibold text-zinc-900">
                Beta 0.9
              </span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
