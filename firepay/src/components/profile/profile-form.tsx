"use client";

import { useState } from "react";
import {
  Check,
  Loader2,
  Save,
  UserRound,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";

type Props = {
  userId: string;
  email: string;
  initialFullName: string;
  initialPreferredName: string;
};

export function ProfileForm({
  userId,
  email,
  initialFullName,
  initialPreferredName,
}: Props) {
  const supabase = createClient();

  const [fullName, setFullName] =
    useState(initialFullName);

  const [preferredName, setPreferredName] =
    useState(initialPreferredName);

  const [saving, setSaving] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [success, setSuccess] =
    useState(false);

  async function saveProfile() {
    setSaving(true);
    setMessage("");
    setSuccess(false);

    const cleanFullName =
      fullName.trim();

    const cleanPreferredName =
      preferredName.trim();

    if (!cleanFullName) {
      setMessage(
        "Please enter your full name.",
      );
      setSaving(false);
      return;
    }

    if (!cleanPreferredName) {
      setMessage(
        "Please enter the name you want FirePay to use.",
      );
      setSaving(false);
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .upsert(
        {
          id: userId,
          full_name: cleanFullName,
          preferred_name:
            cleanPreferredName,
        },
        {
          onConflict: "id",
        },
      );

    if (error) {
      setMessage(error.message);
      setSaving(false);
      return;
    }

    setSuccess(true);
    setMessage(
      "Profile saved successfully.",
    );

    setSaving(false);

    window.setTimeout(() => {
      window.location.reload();
    }, 700);
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-zinc-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="flex items-center gap-4">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-red-50 text-red-600">
            <UserRound className="size-7" />
          </div>

          <div>
            <h2 className="text-lg font-bold text-zinc-950">
              Personal details
            </h2>

            <p className="mt-1 text-sm text-zinc-500">
              These details are used throughout FirePay.
            </p>
          </div>
        </div>

        <div className="mt-7 space-y-5">
          <Field label="Full name">
            <input
              type="text"
              value={fullName}
              onChange={(event) =>
                setFullName(
                  event.target.value,
                )
              }
              placeholder="e.g. Curtis Sullivan"
              className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-base text-zinc-950 outline-none transition focus:border-red-400 focus:ring-4 focus:ring-red-50"
            />
          </Field>

          <Field
            label="Preferred name"
            help="This is the name FirePay uses for your dashboard greeting."
          >
            <input
              type="text"
              value={preferredName}
              onChange={(event) =>
                setPreferredName(
                  event.target.value,
                )
              }
              placeholder="e.g. Curtis"
              className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-base text-zinc-950 outline-none transition focus:border-red-400 focus:ring-4 focus:ring-red-50"
            />
          </Field>

          <Field
            label="Email address"
            help="Your login email is managed by your FirePay account."
          >
            <input
              type="email"
              value={email}
              readOnly
              className="w-full cursor-not-allowed rounded-2xl border border-zinc-200 bg-zinc-100 px-4 py-3 text-base text-zinc-500"
            />
          </Field>
        </div>
      </section>

      <section className="rounded-[2rem] border border-zinc-200 bg-white p-5 shadow-sm sm:p-7">
        <h2 className="font-bold text-zinc-950">
          Work details
        </h2>

        <p className="mt-2 text-sm leading-6 text-zinc-500">
          Your fire service, station, rank, competence, Whole-time and On-call contracts are managed separately so you can have different details for each position.
        </p>

        <a
          href="/settings/positions"
          className="mt-5 inline-flex rounded-xl bg-zinc-100 px-4 py-3 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-200"
        >
          Manage positions & contracts
        </a>
      </section>

      {message ? (
        <div
          className={`flex items-center gap-3 rounded-2xl p-4 text-sm font-semibold ${
            success
              ? "bg-emerald-50 text-emerald-700"
              : "bg-red-50 text-red-700"
          }`}
        >
          {success ? (
            <Check className="size-5" />
          ) : null}

          {message}
        </div>
      ) : null}

      <button
        type="button"
        onClick={saveProfile}
        disabled={saving}
        className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-red-600 px-5 font-semibold text-white shadow-sm transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {saving ? (
          <>
            <Loader2 className="size-5 animate-spin" />
            Saving...
          </>
        ) : (
          <>
            <Save className="size-5" />
            Save profile
          </>
        )}
      </button>
    </div>
  );
}

function Field({
  label,
  help,
  children,
}: {
  label: string;
  help?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-zinc-800">
        {label}
      </span>

      {help ? (
        <p className="mt-1 text-xs leading-5 text-zinc-400">
          {help}
        </p>
      ) : null}

      <div className="mt-2">
        {children}
      </div>
    </label>
  );
}
