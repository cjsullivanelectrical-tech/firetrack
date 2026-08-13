"use client";

import { useState } from "react";
import {
  CheckCircle2,
  KeyRound,
  Loader2,
  LogOut,
  Mail,
  ShieldCheck,
} from "lucide-react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

export function SecurityManager({
  email,
}: {
  email: string;
}) {
  const supabase = createClient();
  const router = useRouter();

  const [password, setPassword] =
    useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [passwordMessage, setPasswordMessage] =
    useState("");

  const [passwordSuccess, setPasswordSuccess] =
    useState(false);

  const [resetMessage, setResetMessage] =
    useState("");

  const [resetSuccess, setResetSuccess] =
    useState(false);

  const [savingPassword, setSavingPassword] =
    useState(false);

  const [sendingReset, setSendingReset] =
    useState(false);

  const [signingOut, setSigningOut] =
    useState(false);

  async function changePassword() {
    setPasswordMessage("");
    setPasswordSuccess(false);

    if (password.length < 8) {
      setPasswordMessage(
        "Use at least 8 characters.",
      );
      return;
    }

    if (password !== confirmPassword) {
      setPasswordMessage(
        "The passwords do not match.",
      );
      return;
    }

    setSavingPassword(true);

    const { error } =
      await supabase.auth.updateUser({
        password,
      });

    if (error) {
      setPasswordMessage(
        error.message,
      );
      setSavingPassword(false);
      return;
    }

    setPassword("");
    setConfirmPassword("");
    setPasswordSuccess(true);
    setPasswordMessage(
      "Password updated successfully.",
    );
    setSavingPassword(false);
  }

  async function sendResetEmail() {
    setResetMessage("");
    setResetSuccess(false);
    setSendingReset(true);

    const redirectTo =
      `${window.location.origin}/auth/confirm?next=/reset-password`;

    const { error } =
      await supabase.auth.resetPasswordForEmail(
        email,
        {
          redirectTo,
        },
      );

    if (error) {
      setResetMessage(
        error.message,
      );
      setSendingReset(false);
      return;
    }

    setResetSuccess(true);
    setResetMessage(
      "Password reset email sent.",
    );
    setSendingReset(false);
  }

  async function signOutEverywhere() {
    const confirmed =
      window.confirm(
        "Sign out of FirePay on all devices?",
      );

    if (!confirmed) {
      return;
    }

    setSigningOut(true);

    const { error } =
      await supabase.auth.signOut({
        scope: "global",
      });

    if (error) {
      setPasswordMessage(
        error.message,
      );
      setSigningOut(false);
      return;
    }

    router.replace("/login");
    router.refresh();
  }

  return (
    <div className="space-y-5">
      <section className="rounded-[2rem] border border-zinc-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="flex items-start gap-4">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            <Mail className="size-5" />
          </div>

          <div>
            <h2 className="font-bold text-zinc-950">
              Login email
            </h2>

            <p className="mt-1 text-sm text-zinc-500">
              Your FirePay account currently uses:
            </p>

            <p className="mt-3 font-semibold text-zinc-900">
              {email}
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] border border-zinc-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="flex items-start gap-4">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
            <KeyRound className="size-5" />
          </div>

          <div>
            <h2 className="font-bold text-zinc-950">
              Change password
            </h2>

            <p className="mt-1 text-sm leading-6 text-zinc-500">
              Change your password while you&apos;re signed in.
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <label className="block">
            <span className="text-sm font-semibold text-zinc-800">
              New password
            </span>

            <input
              type="password"
              value={password}
              onChange={(event) =>
                setPassword(
                  event.target.value,
                )
              }
              autoComplete="new-password"
              className="input mt-2"
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-zinc-800">
              Confirm new password
            </span>

            <input
              type="password"
              value={confirmPassword}
              onChange={(event) =>
                setConfirmPassword(
                  event.target.value,
                )
              }
              autoComplete="new-password"
              className="input mt-2"
            />
          </label>

          {passwordMessage ? (
            <Status
              success={passwordSuccess}
              text={passwordMessage}
            />
          ) : null}

          <button
            type="button"
            onClick={changePassword}
            disabled={savingPassword}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-zinc-950 font-semibold text-white disabled:opacity-50"
          >
            {savingPassword ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              <KeyRound className="size-5" />
            )}

            {savingPassword
              ? "Updating..."
              : "Change password"}
          </button>
        </div>
      </section>

      <section className="rounded-[2rem] border border-zinc-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="flex items-start gap-4">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
            <ShieldCheck className="size-5" />
          </div>

          <div>
            <h2 className="font-bold text-zinc-950">
              Password reset email
            </h2>

            <p className="mt-1 text-sm leading-6 text-zinc-500">
              Send a secure reset link to your login email.
            </p>
          </div>
        </div>

        {resetMessage ? (
          <div className="mt-5">
            <Status
              success={resetSuccess}
              text={resetMessage}
            />
          </div>
        ) : null}

        <button
          type="button"
          onClick={sendResetEmail}
          disabled={sendingReset}
          className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-zinc-200 bg-white font-semibold text-zinc-800 disabled:opacity-50"
        >
          {sendingReset ? (
            <Loader2 className="size-5 animate-spin" />
          ) : (
            <Mail className="size-5" />
          )}

          {sendingReset
            ? "Sending..."
            : "Send reset email"}
        </button>
      </section>

      <section className="rounded-[2rem] border border-red-200 bg-red-50 p-5 sm:p-7">
        <div className="flex items-start gap-4">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-red-100 text-red-700">
            <LogOut className="size-5" />
          </div>

          <div>
            <h2 className="font-bold text-red-950">
              Sign out everywhere
            </h2>

            <p className="mt-1 text-sm leading-6 text-red-800">
              Sign this account out of FirePay across all devices.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={signOutEverywhere}
          disabled={signingOut}
          className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-red-600 font-semibold text-white disabled:opacity-50"
        >
          {signingOut ? (
            <Loader2 className="size-5 animate-spin" />
          ) : (
            <LogOut className="size-5" />
          )}

          {signingOut
            ? "Signing out..."
            : "Sign out on all devices"}
        </button>
      </section>
    </div>
  );
}

function Status({
  success,
  text,
}: {
  success: boolean;
  text: string;
}) {
  return (
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

        {text}
      </div>
    </div>
  );
}
