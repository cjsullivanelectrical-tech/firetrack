"use client";

import { useState } from "react";
import {
  CheckCircle2,
  Loader2,
  Mail,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";

export function ForgotPasswordForm() {
  const supabase = createClient();

  const [email, setEmail] =
    useState("");

  const [sending, setSending] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [success, setSuccess] =
    useState(false);

  async function sendReset(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setMessage("");
    setSuccess(false);
    setSending(true);

    const redirectTo =
      `${window.location.origin}/auth/confirm?next=/reset-password`;

    const { error } =
      await supabase.auth.resetPasswordForEmail(
        email.trim(),
        {
          redirectTo,
        },
      );

    if (error) {
      setMessage(error.message);
      setSending(false);
      return;
    }

    /*
     * Keep this wording generic so we don't
     * unnecessarily reveal whether an account exists.
     */
    setSuccess(true);
    setMessage(
      "If that email is linked to FirePay, a reset link has been sent.",
    );
    setSending(false);
  }

  return (
    <form
      onSubmit={sendReset}
      className="mt-7 space-y-5"
    >
      <label className="block">
        <span className="text-sm font-semibold text-zinc-800">
          Email address
        </span>

        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(event) =>
            setEmail(
              event.target.value,
            )
          }
          className="input mt-2"
          placeholder="you@example.com"
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
        disabled={sending}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-red-600 font-semibold text-white disabled:opacity-50"
      >
        {sending ? (
          <Loader2 className="size-5 animate-spin" />
        ) : (
          <Mail className="size-5" />
        )}

        {sending
          ? "Sending..."
          : "Send reset link"}
      </button>
    </form>
  );
}
