"use client";

import { useState } from "react";
import { RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function ResetTestData() {
  const supabase = createClient();
  const router = useRouter();

  const [isResetting, setIsResetting] = useState(false);
  const [message, setMessage] = useState("");

  async function resetData() {
    const confirmed = window.confirm(
      "Delete ALL of your recorded FirePay entries? Your account and positions will stay in place.",
    );

    if (!confirmed) return;

    setIsResetting(true);
    setMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage("You need to sign in again.");
      setIsResetting(false);
      return;
    }

    const { error } = await supabase
      .from("entries")
      .delete()
      .eq("user_id", user.id);

    if (error) {
      setMessage(error.message);
      setIsResetting(false);
      return;
    }

    setMessage("Test entries cleared. Dashboard figures are back to zero.");
    setIsResetting(false);

    router.refresh();
  }

  return (
    <div className="rounded-[1.5rem] border border-amber-200 bg-amber-50 p-5">
      <p className="font-bold text-zinc-950">
        Testing tools
      </p>

      <p className="mt-1 text-sm leading-6 text-zinc-600">
        Temporary development control. This deletes your recorded entries but keeps your account and positions.
      </p>

      <button
        type="button"
        disabled={isResetting}
        onClick={resetData}
        className="mt-4 flex h-11 items-center justify-center gap-2 rounded-xl bg-zinc-950 px-4 text-sm font-semibold text-white disabled:opacity-50"
      >
        <RotateCcw className="size-4" />
        {isResetting ? "Resetting..." : "Reset test entries"}
      </button>

      {message ? (
        <p className="mt-3 text-sm font-medium text-zinc-700">
          {message}
        </p>
      ) : null}
    </div>
  );
}
