import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PositionsManager } from "@/components/positions/positions-manager";
import { ResetTestData } from "@/components/settings/reset-test-data";

export default async function PositionsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: positions } = await supabase
    .from("positions")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at");

  return (
    <main className="min-h-screen bg-zinc-100 px-4 py-6 sm:py-10">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/"
          className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-zinc-600"
        >
          <ArrowLeft className="size-4" />
          Dashboard
        </Link>

        <div className="space-y-6">
          <PositionsManager initialPositions={positions ?? []} />
          <ResetTestData />
        </div>
      </div>
    </main>
  );
}
