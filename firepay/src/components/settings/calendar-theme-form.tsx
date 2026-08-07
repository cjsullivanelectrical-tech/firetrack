"use client";

import { useState } from "react";
import {
  Check,
  Palette,
  Save,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";

type Theme =
  | "classic"
  | "muted"
  | "high_contrast";

type Props = {
  userId: string;
  initialTheme: Theme;
};

const themes: {
  id: Theme;
  name: string;
  description: string;
}[] = [
  {
    id: "classic",
    name: "Classic",
    description:
      "Clear colours for shifts, calls, overtime and training.",
  },
  {
    id: "muted",
    name: "Muted",
    description:
      "Softer colours with a calmer calendar appearance.",
  },
  {
    id: "high_contrast",
    name: "High contrast",
    description:
      "Stronger colours that are easier to identify at a glance.",
  },
];

export function CalendarThemeForm({
  userId,
  initialTheme,
}: Props) {
  const supabase = createClient();

  const [theme, setTheme] =
    useState<Theme>(initialTheme);

  const [saving, setSaving] =
    useState(false);

  const [message, setMessage] =
    useState("");

  async function save() {
    setSaving(true);
    setMessage("");

    const { error } = await supabase
      .from("profiles")
      .upsert(
        {
          id: userId,
          calendar_theme: theme,
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

    setMessage(
      "Calendar appearance saved.",
    );

    setSaving(false);
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-zinc-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-2xl bg-red-50 text-red-600">
            <Palette className="size-5" />
          </div>

          <div>
            <h2 className="font-bold text-zinc-950">
              Calendar style
            </h2>

            <p className="mt-1 text-sm text-zinc-500">
              Choose how your rota and activities appear.
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          {themes.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() =>
                setTheme(option.id)
              }
              className={`flex w-full items-center justify-between gap-4 rounded-2xl border p-4 text-left transition ${
                theme === option.id
                  ? "border-red-500 bg-red-50"
                  : "border-zinc-200 bg-white hover:bg-zinc-50"
              }`}
            >
              <div>
                <p className="font-semibold text-zinc-950">
                  {option.name}
                </p>

                <p className="mt-1 text-sm text-zinc-500">
                  {option.description}
                </p>

                <ThemePreview
                  theme={option.id}
                />
              </div>

              {theme === option.id ? (
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-red-600 text-white">
                  <Check className="size-4" />
                </span>
              ) : (
                <span className="size-7 shrink-0 rounded-full border border-zinc-300" />
              )}
            </button>
          ))}
        </div>
      </section>

      {message ? (
        <div className="rounded-2xl bg-zinc-950 p-4 text-sm font-semibold text-white">
          {message}
        </div>
      ) : null}

      <button
        type="button"
        onClick={save}
        disabled={saving}
        className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-red-600 font-semibold text-white disabled:opacity-50"
      >
        <Save className="size-5" />

        {saving
          ? "Saving..."
          : "Save calendar appearance"}
      </button>
    </div>
  );
}

function ThemePreview({
  theme,
}: {
  theme: Theme;
}) {
  const styles =
    theme === "muted"
      ? [
          "bg-sky-100 text-sky-700",
          "bg-rose-100 text-rose-700",
          "bg-orange-100 text-orange-700",
          "bg-violet-100 text-violet-700",
        ]
      : theme === "high_contrast"
        ? [
            "bg-blue-700 text-white",
            "bg-red-700 text-white",
            "bg-amber-500 text-black",
            "bg-purple-700 text-white",
          ]
        : [
            "bg-blue-100 text-blue-700",
            "bg-red-100 text-red-700",
            "bg-amber-100 text-amber-700",
            "bg-purple-100 text-purple-700",
          ];

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      <span
        className={`rounded-lg px-2 py-1 text-[11px] font-bold ${styles[0]}`}
      >
        Shift
      </span>

      <span
        className={`rounded-lg px-2 py-1 text-[11px] font-bold ${styles[1]}`}
      >
        Call
      </span>

      <span
        className={`rounded-lg px-2 py-1 text-[11px] font-bold ${styles[2]}`}
      >
        Overtime
      </span>

      <span
        className={`rounded-lg px-2 py-1 text-[11px] font-bold ${styles[3]}`}
      >
        Training
      </span>
    </div>
  );
}
