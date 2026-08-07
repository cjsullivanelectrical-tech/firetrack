import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import {
  notFound,
  redirect,
} from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ActivityEditor } from "@/components/activities/activity-editor";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditActivityPage({
  params,
}: Props) {
  const { id } = await params;

  const supabase =
    await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [
    entryResult,
    positionsResult,
  ] = await Promise.all([
    supabase
      .from("entries")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle(),

    supabase
      .from("positions")
      .select(
        "id,label,employment_type,rank,competence",
      )
      .eq("user_id", user.id)
      .eq("is_active", true),
  ]);

  if (!entryResult.data) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-zinc-100 px-4 py-6 sm:py-10">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/activities"
          className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-zinc-600"
        >
          <ArrowLeft className="size-4" />
          Activity history
        </Link>

        <ActivityEditor
          entry={entryResult.data}
          positions={
            positionsResult.data ??
            []
          }
        />
      </div>
    </main>
  );
}
