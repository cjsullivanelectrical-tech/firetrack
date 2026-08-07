"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getLondonDate } from "@/lib/date";

const ranks = [
  ["firefighter", "Firefighter"],
  ["crew_manager", "Crew Manager"],
  ["watch_manager", "Watch Manager"],
  ["station_manager", "Station Manager"],
  ["group_manager", "Group Manager"],
  ["area_manager", "Area Manager"],
] as const;

const competenceOptions: Record<
  string,
  [string, string][]
> = {
  firefighter: [
    ["development", "Development"],
    ["competent", "Competent"],
  ],
  crew_manager: [
    ["development", "Development"],
    ["competent", "Competent"],
  ],
  watch_manager: [
    ["development", "Development"],
    ["competent_a", "Competent A"],
    ["competent_b", "Competent B"],
  ],
  station_manager: [
    ["development", "Development"],
    ["competent_a", "Competent A"],
    ["competent_b", "Competent B"],
  ],
  group_manager: [
    ["development", "Development"],
    ["competent_a", "Competent A"],
    ["competent_b", "Competent B"],
  ],
  area_manager: [
    ["development", "Development"],
    ["competent_a", "Competent A"],
    ["competent_b", "Competent B"],
  ],
};

export function OnboardingForm() {
  const router = useRouter();
  const supabase = createClient();

  const [preferredName, setPreferredName] = useState("");
  const [fireService, setFireService] = useState("");
  const [station, setStation] = useState("");
  const [employmentType, setEmploymentType] =
    useState("on_call");
  const [rank, setRank] = useState("firefighter");
  const [competence, setCompetence] =
    useState("competent");

  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function finishSetup(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setSaving(true);
    setErrorMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.replace("/login");
      return;
    }

    if (preferredName.trim()) {
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          preferred_name: preferredName.trim(),
          fire_service: fireService.trim(),
        })
        .eq("id", user.id);

      if (profileError) {
        setErrorMessage(profileError.message);
        setSaving(false);
        return;
      }
    }

    const employmentLabel =
      employmentType === "on_call"
        ? "On-Call"
        : "Whole-time";

    const label = `${
      station.trim() || fireService.trim() || "Fire Service"
    } ${employmentLabel}`;

    const { error } = await supabase
      .from("positions")
      .insert({
        user_id: user.id,
        label,
        fire_service: fireService.trim(),
        station_name: station.trim() || null,
        employment_type: employmentType,
        rank,
        competence,
        is_default: true,
      });

    if (error) {
      setErrorMessage(error.message);
      setSaving(false);
      return;
    }

    router.replace("/");
    router.refresh();
  }

  return (
    <form onSubmit={finishSetup} className="mt-8 space-y-5">
      <Field label="What should FirePay call you?">
        <input
          value={preferredName}
          onChange={(event) =>
            setPreferredName(event.target.value)
          }
          className="input"
          placeholder="e.g. Curtis"
        />
      </Field>

      <Field label="Fire & Rescue Service">
        <input
          value={fireService}
          onChange={(event) =>
            setFireService(event.target.value)
          }
          required
          className="input"
          placeholder="e.g. East Sussex Fire & Rescue Service"
        />
      </Field>

      <Field label="Station">
        <input
          value={station}
          onChange={(event) =>
            setStation(event.target.value)
          }
          className="input"
          placeholder="e.g. Battle"
        />
      </Field>

      <Field label="Employment">
        <select
          value={employmentType}
          onChange={(event) =>
            setEmploymentType(event.target.value)
          }
          className="input"
        >
          <option value="on_call">
            On-Call / Retained
          </option>
          <option value="wholetime">
            Whole-time
          </option>
        </select>
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Rank">
          <select
            value={rank}
            onChange={(event) => {
              const nextRank = event.target.value;

              setRank(nextRank);
              setCompetence(
                competenceOptions[nextRank][0][0],
              );
            }}
            className="input"
          >
            {ranks.map(([value, name]) => (
              <option key={value} value={value}>
                {name}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Competence">
          <select
            value={competence}
            onChange={(event) =>
              setCompetence(event.target.value)
            }
            className="input"
          >
            {competenceOptions[rank].map(
              ([value, name]) => (
                <option key={value} value={value}>
                  {name}
                </option>
              ),
            )}
          </select>
        </Field>
      </div>

      <p className="rounded-2xl bg-zinc-100 p-4 text-sm leading-6 text-zinc-600">
        If you also hold another role, such as being Whole-time and On-Call at different ranks, you can add the second position immediately afterwards in Settings.
      </p>

      {errorMessage ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
          {errorMessage}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={saving}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-red-600 font-semibold text-white disabled:opacity-50"
      >
        {saving ? "Saving..." : "Finish setup"}
        <ArrowRight className="size-5" />
      </button>
    </form>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-zinc-800">
        {label}
      </span>
      <div className="mt-2">{children}</div>
    </label>
  );
}
