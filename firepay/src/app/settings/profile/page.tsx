import Link from "next/link";
import {
  ArrowLeft,
  UserRound,
} from "lucide-react";
import { redirect } from "next/navigation";

import { ProfileForm } from "@/components/profile/profile-form";
import { createClient } from "@/lib/supabase/server";

export default async function ProfilePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } =
    await supabase
      .from("profiles")
      .select(
        "full_name,preferred_name",
      )
      .eq("id", user.id)
      .maybeSingle();

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
              <UserRound className="size-5" />
            </div>

            <div>
              <p className="text-sm font-semibold text-red-600">
                FirePay
              </p>

              <h1 className="text-3xl font-bold tracking-tight text-zinc-950">
                Profile
              </h1>
            </div>
          </div>

          <p className="mt-3 text-sm leading-6 text-zinc-500">
            Manage the personal details FirePay uses throughout the app.
          </p>
        </div>

        <div className="mt-8">
          <ProfileForm
            userId={user.id}
            email={user.email ?? ""}
            initialFullName={
              profile?.full_name ?? ""
            }
            initialPreferredName={
              profile?.preferred_name ??
              ""
            }
          />
        </div>
      </div>
    </main>
  );
}
