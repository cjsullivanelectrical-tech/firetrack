import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ContractStatusButton } from "@/components/positions/contract-status-button";
import { PayPackageManager } from "@/components/pay/pay-package-manager";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function PositionPayPage({
  params,
}: Props) {
  const { id } = await params;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: position } = await supabase
    .from("positions")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!position) {
    notFound();
  }

  const [
    payPackageResult,
    allowancesResult,
    rotaResult,
  ] = await Promise.all([
    supabase
      .from("position_pay_packages")
      .select("*")
      .eq("position_id", id)
      .maybeSingle(),

    supabase
      .from("position_allowances")
      .select("*")
      .eq("position_id", id)
      .order("created_at"),

    supabase
      .from("rota_patterns")
      .select("*")
      .eq("position_id", id)
      .maybeSingle(),
  ]);

  let rotaDays: {
    id: string;
    day_index: number;
    label: string;
    is_working: boolean;
    start_time: string | null;
    duration_minutes: number;
  }[] = [];

  if (rotaResult.data) {
    const { data } = await supabase
      .from("rota_days")
      .select("*")
      .eq(
        "rota_pattern_id",
        rotaResult.data.id,
      )
      .order("day_index");

    rotaDays = data ?? [];
  }

  return (
    <main className="min-h-screen bg-zinc-100 px-4 py-6 sm:py-10">
      <div className="mx-auto max-w-4xl">
        <Link
          href="/settings/positions"
          className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-zinc-600"
        >
          <ArrowLeft className="size-4" />
          Positions
        </Link>

        <PayPackageManager
          position={position}
          userId={user.id}
          initialPayPackage={
            payPackageResult.data
          }
          initialAllowances={
            allowancesResult.data ?? []
          }
          initialRotaPattern={
            rotaResult.data
          }
          initialRotaDays={rotaDays}
        />
        <section className="mt-8 rounded-[2rem] border border-zinc-200 bg-white p-5 shadow-sm sm:p-7">
          <h2 className="text-lg font-bold text-zinc-950">
            Contract status
          </h2>

          <p className="mt-2 text-sm leading-6 text-zinc-500">
            Suspending a contract keeps all historical activity and pay records, but stops FirePay using it for current rota and earnings calculations.
          </p>

          <div className="mt-5">
            <ContractStatusButton
              positionId={position.id}
              isActive={Boolean(position.is_active)}
            />
          </div>
        </section>

      </div>
    </main>
  );
}
