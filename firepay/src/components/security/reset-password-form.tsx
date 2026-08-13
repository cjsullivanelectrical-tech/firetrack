"use client";

import { useState } from "react";
import {
  CheckCircle2,
  KeyRound,
  Loader2,
} from "lucide-react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

export function ResetPasswordForm() {
  const supabase = createClient();
  const router = useRouter();

  const [password, setPassword] =
    useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [saving, setSaving] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [success, setSuccess] =
    useState(false);

  async function updatePassword(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setMessage("");
    setSuccess(false);

    if (password.length < 8) {
      setMessage(
        "Use at least 8 characters.",
      );
      return;
    }

    if (password !== confirmPassword) {
      setMessage(
        "The passwords do not match.",
      );
      return;
    }

    setSaving(true);

    const { error } =
      await supabase.auth.updateUser({
        password,
      });

    if (error) {
      setMessage(
        error.message,
      );
      setSaving(false);
      return;
    }

    setSuccess(true);
    setMessage(
      "Password changed successfully.",
    );
    setSaving(false);

    window.setTimeout(() => {
      router.replace("/");
      router.refresh();
    }, 1000);
  }

  return (
    <form
      onSubmit={updatePassword}
      className="mt-7 space-y-5"
    >
      <label className="block">
        <span className="text-sm font-semibold text-zinc-800">
          New password
        </span>

        <input
          type="password"
          required
          autoComplete="new-password"
          value={password}
          onChange={(event) =>
            setPassword(
              event.target.value,
            )
          }
          className="input mt-2"
        />
      </label>

      <label className="block">
        <span className="text-sm font-semibold text-zinc-800">
          Confirm password
        </span>

        <input
          type="password"
          required
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(event) =>
            setConfirmPassword(
              event.target.value,
            )
          }
          className="input mt-2"
        />
      </label>

      {message ? (
        <div
          className={`rounded-2xl p-4 text-sm font-semibold ${
            success
              ? "bg-emerald-50 text-emerald-700"
              : "bg-red-50 text-red-700"
          }`}
        >
          <div className="flex items-center gap-2">
            {success ? (
              <CheckCircle2 className="size-5" />
            ) : null}

            {message}
          </div>
        </div>
      ) : null}

      <button
        type="submit"
        disabled={saving}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-red-600 font-semibold text-white disabled:opacity-50"
      >
        {saving ? (
          <Loader2 className="size-5 animate-spin" />
        ) : (
          <KeyRound className="size-5" />
        )}

        {saving
          ? "Updating..."
          : "Set new password"}
      </button>
    </form>
  );
}
