"use client";

import Link from "next/link";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Position = {
  id: string;
  label: string;
  fire_service: string;
  station_name: string | null;
  employment_type: string;
  rank: string;
  competence: string;
  is_default: boolean;
};

type Props = {
  initialPositions: Position[];
};

const ranks = [
  ["firefighter", "Firefighter"],
  ["crew_manager", "Crew Manager"],
  ["watch_manager", "Watch Manager"],
  ["station_manager", "Station Manager"],
  ["group_manager", "Group Manager"],
  ["area_manager", "Area Manager"],
];

const competenceOptions: Record<string, [string, string][]> = {
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

export function PositionsManager({
  initialPositions,
}: Props) {
  const supabase = createClient();

  const [positions, setPositions] =
    useState<Position[]>(initialPositions);

  const [label, setLabel] = useState("");
  const [fireService, setFireService] =
    useState("East Sussex Fire & Rescue Service");
  const [stationName, setStationName] = useState("");
  const [employmentType, setEmploymentType] =
    useState("on_call");
  const [rank, setRank] = useState("firefighter");
  const [competence, setCompetence] =
    useState("competent");

  const [error, setError] = useState("");

  async function addPosition() {
    setError("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const finalLabel =
      label.trim() ||
      `${stationName || "Fire Service"} ${
        employmentType === "on_call" ? "On-Call" : "Whole-time"
      }`;

    const { data, error } = await supabase
      .from("positions")
      .insert({
        user_id: user.id,
        label: finalLabel,
        fire_service: fireService.trim(),
        station_name: stationName.trim() || null,
        employment_type: employmentType,
        rank,
        competence,
        is_default: positions.length === 0,
      })
      .select()
      .single();

    if (error) {
      setError(error.message);
      return;
    }

    setPositions((current) => [...current, data]);
    setLabel("");
    setStationName("");
  }

  async function removePosition(id: string) {
    const { error } = await supabase
      .from("positions")
      .delete()
      .eq("id", id);

    if (error) {
      setError(error.message);
      return;
    }

    setPositions((current) =>
      current.filter((position) => position.id !== id),
    );
  }

  return (
    <section className="rounded-[2rem] border border-zinc-200 bg-white p-5 shadow-xl shadow-zinc-900/5 sm:p-8">
      <p className="text-sm font-semibold text-red-600">
        FirePay setup
      </p>

      <h1 className="mt-1 text-3xl font-bold tracking-tight text-zinc-950">
        Your positions
      </h1>

      <p className="mt-2 text-sm text-zinc-500">
        Add each role you hold. You can have different ranks for whole-time and on-call.
      </p>

      <div className="mt-8 space-y-3">
        {positions.map((position) => (
          <div
            key={position.id}
            className="flex items-center justify-between gap-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-4"
          >
            <div>
              <p className="font-bold text-zinc-950">
                {position.label}
              </p>

              <p className="mt-1 text-sm text-zinc-500">
                {position.fire_service}
                {position.station_name
                  ? ` • ${position.station_name}`
                  : ""}
              </p>

              <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-zinc-400">
                {position.employment_type === "on_call"
                  ? "On-Call"
                  : "Whole-time"}{" "}
                • {position.rank.replaceAll("_", " ")} •{" "}
                {position.competence.replaceAll("_", " ")}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href={`/settings/positions/${position.id}`}
                className="rounded-xl bg-zinc-950 px-3 py-2 text-xs font-semibold text-white"
              >
                Pay & rota
              </Link>

              <button
                type="button"
                onClick={() => removePosition(position.id)}
                className="flex size-10 items-center justify-center rounded-xl text-zinc-400 hover:bg-red-50 hover:text-red-600"
              >
                <Trash2 className="size-5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 border-t border-zinc-200 pt-8">
        <h2 className="text-lg font-bold text-zinc-950">
          Add position
        </h2>

        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <Field label="Position name">
            <input
              className="input"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Battle On-Call"
            />
          </Field>

          <Field label="Fire & Rescue Service">
            <input
              className="input"
              value={fireService}
              onChange={(e) => setFireService(e.target.value)}
            />
          </Field>

          <Field label="Station">
            <input
              className="input"
              value={stationName}
              onChange={(e) => setStationName(e.target.value)}
              placeholder="e.g. Battle"
            />
          </Field>

          <Field label="Employment type">
            <select
              className="input"
              value={employmentType}
              onChange={(e) => setEmploymentType(e.target.value)}
            >
              <option value="on_call">On-Call / Retained</option>
              <option value="wholetime">Whole-time</option>
            </select>
          </Field>

          <Field label="Rank">
            <select
              className="input"
              value={rank}
              onChange={(e) => {
                const nextRank = e.target.value;
                setRank(nextRank);
                setCompetence(
                  competenceOptions[nextRank][0][0],
                );
              }}
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
              className="input"
              value={competence}
              onChange={(e) => setCompetence(e.target.value)}
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

        {error ? (
          <p className="mt-4 text-sm font-medium text-red-600">
            {error}
          </p>
        ) : null}

        <button
          type="button"
          onClick={addPosition}
          className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-red-600 font-semibold text-white"
        >
          <Plus className="size-5" />
          Add position
        </button>
      </div>
    </section>
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
    <label>
      <span className="text-sm font-semibold text-zinc-800">
        {label}
      </span>
      <div className="mt-2">{children}</div>
    </label>
  );
}
