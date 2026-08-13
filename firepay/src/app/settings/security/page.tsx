import Link from "next/link";
import {
  ArrowLeft,
  ShieldCheck,
} from "lucide-react";
import { redirect } from "next/navigation";

import { SecurityManager } from "@/components/security/security-manager";
import { createClient } from "@/lib/supabase/server";

export default async function SecurityPage() {
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
          href="/settings"
          className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-600"
        >
          <ArrowLeft className="size-4" />
          Settings
        </Link>

        <div className="mt-6">
          <div className="flex size-11 items-center justify-center rounded-2xl bg-zinc-950 text-white">
            <ShieldCheck className="size-5" />
          </div>

          <h1 className="mt-4 text-3xl font-bold tracking-tight text-zinc-950">
            Login & Security
          </h1>

          <p className="mt-2 text-sm text-zinc-500">
            Manage your FirePay login and password.
          </p>
        </div>

        <div className="mt-8">
          <SecurityManager
            email={user.email ?? ""}
          />
        </div>
      </div>
    </main>
  );
}
