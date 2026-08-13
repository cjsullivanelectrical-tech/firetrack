"use client";

import { useState } from "react";
import {
  Loader2,
  PauseCircle,
  PlayCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

export function ContractStatusButton({
  positionId,
  isActive,
}: {
  positionId: string;
  isActive: boolean;
}) {
  const supabase = createClient();
  const router = useRouter();

  const [saving, setSaving] =
    useState(false);

  const [message, setMessage] =
    useState("");

  async function toggleStatus() {
    const action =
      isActive
        ? "suspend"
        : "resume";

    const confirmed =
      window.confirm(
        isActive
          ? "Suspend this contract? Historical activity will remain, but FirePay will stop using it for current calculations."
          : "Resume this contract and start using it again for current calculations?",
      );

    if (!confirmed) {
      return;
    }

    setSaving(true);
    setMessage("");

    const { error } =
      await supabase
        .from("positions")
        .update({
          is_active:
            !isActive,
        })
        .eq(
          "id",
          positionId,
        );

    if (error) {
      setMessage(
        error.message,
      );
      setSaving(false);
      return;
    }

    router.refresh();

    setSaving(false);
  }

  return (
    <div>
      <button
        type="button"
        onClick={toggleStatus}
        disabled={saving}
        className={`flex h-12 w-full items-center justify-center gap-2 rounded-2xl font-semibold transition disabled:opacity-50 ${
          isActive
            ? "border border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100"
            : "bg-emerald-600 text-white hover:bg-emerald-700"
        }`}
      >
        {saving ? (
          <Loader2 className="size-5 animate-spin" />
        ) : isActive ? (
          <PauseCircle className="size-5" />
        ) : (
          <PlayCircle className="size-5" />
        )}

        {saving
          ? "Updating..."
          : isActive
            ? "Suspend Contract"
            : "Resume Contract"}
      </button>

      {message ? (
        <p className="mt-2 text-sm font-medium text-red-600">
          {message}
        </p>
      ) : null}
    </div>
  );
}
