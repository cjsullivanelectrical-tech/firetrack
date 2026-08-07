"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function DeleteActivityButton({
  entryId,
}: {
  entryId: string;
}) {
  const router = useRouter();

  const supabase = useMemo(
    () => createClient(),
    [],
  );

  const [deleting, setDeleting] =
    useState(false);

  async function deleteEntry() {
    const confirmed = window.confirm(
      "Delete this activity permanently?",
    );

    if (!confirmed) {
      return;
    }

    setDeleting(true);

    const { error } = await supabase
      .from("entries")
      .delete()
      .eq("id", entryId);

    if (error) {
      window.alert(error.message);
      setDeleting(false);
      return;
    }

    router.replace("/activities");
    router.refresh();
  }

  return (
    <button
      type="button"
      disabled={deleting}
      onClick={deleteEntry}
      className="flex h-11 items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 text-sm font-semibold text-red-700 disabled:opacity-50"
    >
      <Trash2 className="size-4" />

      {deleting
        ? "Deleting..."
        : "Delete"}
    </button>
  );
}
