import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
} from "lucide-react";
import { redirect } from "next/navigation";

import { CalendarThemeForm } from "@/components/settings/calendar-theme-form";
import { createClient } from "@/lib/supabase/server";

export default async function CalendarSettingsPage() {
  const supabase =
    await createClient();

  const {
    data: { user },
  } =
    await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } =
    await supabase
      .from("profiles")
      .select("calendar_theme")
      .eq("id", user.id)
      .maybeSingle();

  const theme =
    profile?.calendar_theme ===
      "muted" ||
    profile?.calendar_theme ===
      "high_contrast"
      ? profile.calendar_theme
      : "classic";

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

        <div className="mt-6">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-red-600 text-white">
              <CalendarDays className="size-5" />
            </div>

            <div>
              <p className="text-sm font-semibold text-red-600">
                FirePay
              </p>

              <h1 className="text-3xl font-bold tracking-tight text-zinc-950">
                Calendar appearance
              </h1>
            </div>
          </div>

          <p className="mt-3 text-sm text-zinc-500">
            Personalise your calendar without changing how your rota or pay calculations work.
          </p>
        </div>

        <div className="mt-8">
          <CalendarThemeForm
            userId={user.id}
            initialTheme={theme}
          />
        </div>
      </div>
    </main>
  );
}
