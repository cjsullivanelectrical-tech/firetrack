import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
} from "lucide-react";
import { redirect } from "next/navigation";

import { LeaveRangeForm } from "@/components/leave/leave-range-form";
import { createClient } from "@/lib/supabase/server";

export default async function LeavePage() {
  const supabase =
    await createClient();

  const {
    data: { user },
  } =
    await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: positions } =
    await supabase
      .from("positions")
      .select(
        "id,label,employment_type",
      )
      .eq(
        "user_id",
        user.id,
      )
      .eq(
        "is_active",
        true,
      )
      .order("created_at");

  return (
    <main className="min-h-screen bg-zinc-100 px-4 py-6 sm:py-10">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-600"
        >
          <ArrowLeft className="size-4" />
          Dashboard
        </Link>

        <div className="mt-6">
          <div className="flex size-11 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
            <CalendarDays className="size-5" />
          </div>

          <h1 className="mt-4 text-3xl font-bold tracking-tight text-zinc-950">
            Leave & sickness
          </h1>

          <p className="mt-2 text-sm leading-6 text-zinc-500">
            Add a single day or a whole date range in one go.
          </p>
        </div>

        <div className="mt-8">
          {(positions ?? [])
            .length ? (
            <LeaveRangeForm
              userId={user.id}
              positions={
                positions ?? []
              }
            />
          ) : (
            <div className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-sm">
              <p className="font-bold text-zinc-950">
                Add a role first
              </p>

              <p className="mt-2 text-sm text-zinc-500">
                FirePay needs to know which contract the leave relates to.
              </p>

              <Link
                href="/settings/positions"
                className="mt-5 inline-flex rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white"
              >
                Set up my role
              </Link>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
