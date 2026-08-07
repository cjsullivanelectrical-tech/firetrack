"use client";

import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CircleUserRound,
  Flame,
  MapPin,
  PartyPopper,
  ShieldCheck,
} from "lucide-react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

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

type Props = {
  replay?: boolean;
};

export function OnboardingForm({
  replay = false,
}: Props) {
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] =
    useState(0);

  const [preferredName, setPreferredName] =
    useState("");

  const [fireService, setFireService] =
    useState("");

  const [station, setStation] =
    useState("");

  const [employmentType, setEmploymentType] =
    useState("on_call");

  const [rank, setRank] =
    useState("firefighter");

  const [competence, setCompetence] =
    useState("competent");

  const [saving, setSaving] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

  const totalSteps = 5;

  function next() {
    setErrorMessage("");

    if (step === 1 && !preferredName.trim()) {
      setErrorMessage(
        "Tell FirePay what you'd like to be called.",
      );
      return;
    }

    if (step === 2 && !fireService.trim()) {
      setErrorMessage(
        "Enter your Fire & Rescue Service.",
      );
      return;
    }

    setStep((current) =>
      Math.min(
        current + 1,
        totalSteps - 1,
      ),
    );
  }

  function back() {
    setErrorMessage("");

    setStep((current) =>
      Math.max(current - 1, 0),
    );
  }

  async function finishSetup() {
    setErrorMessage("");

    if (replay) {
      router.push("/developer");
      return;
    }

    setSaving(true);

    const {
      data: { user },
    } =
      await supabase.auth.getUser();

    if (!user) {
      router.replace("/login");
      return;
    }

    const { error: profileError } =
      await supabase
        .from("profiles")
        .upsert(
          {
            id: user.id,
            preferred_name:
              preferredName.trim(),
            fire_service:
              fireService.trim(),
          },
          {
            onConflict: "id",
          },
        );

    if (profileError) {
      setErrorMessage(
        profileError.message,
      );
      setSaving(false);
      return;
    }

    const employmentLabel =
      employmentType === "on_call"
        ? "On-Call"
        : "Whole-time";

    const label = `${
      station.trim() ||
      fireService.trim() ||
      "Fire Service"
    } ${employmentLabel}`;

    const {
      data: position,
      error,
    } = await supabase
      .from("positions")
      .insert({
        user_id: user.id,
        label,
        fire_service:
          fireService.trim(),
        station_name:
          station.trim() || null,
        employment_type:
          employmentType,
        rank,
        competence,
        is_default: true,
      })
      .select("id")
      .single();

    if (error || !position) {
      setErrorMessage(
        error?.message ??
          "Could not create your role.",
      );
      setSaving(false);
      return;
    }

    /*
     * Do not dump a new user on the dashboard.
     * Take them directly to pay/rota setup for
     * the role they just created.
     */
    router.replace(
      `/settings/positions/${position.id}?setup=1`,
    );

    router.refresh();
  }

  return (
    <div className="mt-8">
      <Progress
        step={step}
        total={totalSteps}
      />

      <div className="mt-8 min-h-[330px]">
        {step === 0 ? (
          <WelcomeStep />
        ) : null}

        {step === 1 ? (
          <AboutYouStep
            preferredName={
              preferredName
            }
            setPreferredName={
              setPreferredName
            }
          />
        ) : null}

        {step === 2 ? (
          <ServiceStep
            fireService={
              fireService
            }
            setFireService={
              setFireService
            }
            station={station}
            setStation={setStation}
          />
        ) : null}

        {step === 3 ? (
          <RoleStep
            employmentType={
              employmentType
            }
            setEmploymentType={
              setEmploymentType
            }
            rank={rank}
            setRank={(value) => {
              setRank(value);

              setCompetence(
                competenceOptions[
                  value
                ][0][0],
              );
            }}
            competence={
              competence
            }
            setCompetence={
              setCompetence
            }
          />
        ) : null}

        {step === 4 ? (
          <ReadyStep
            preferredName={
              preferredName
            }
            fireService={
              fireService
            }
            station={station}
            employmentType={
              employmentType
            }
            rank={rank}
            replay={replay}
          />
        ) : null}
      </div>

      {errorMessage ? (
        <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
          {errorMessage}
        </div>
      ) : null}

      <div className="mt-6 flex gap-3">
        {step > 0 ? (
          <button
            type="button"
            onClick={back}
            className="flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl border border-zinc-200 bg-white font-semibold text-zinc-700"
          >
            <ArrowLeft className="size-4" />
            Back
          </button>
        ) : null}

        {step <
        totalSteps - 1 ? (
          <button
            type="button"
            onClick={next}
            className="flex h-12 flex-[2] items-center justify-center gap-2 rounded-2xl bg-red-600 font-semibold text-white"
          >
            {step === 0
              ? "Start setup"
              : "Continue"}

            <ArrowRight className="size-5" />
          </button>
        ) : (
          <button
            type="button"
            onClick={finishSetup}
            disabled={saving}
            className="flex h-12 flex-[2] items-center justify-center gap-2 rounded-2xl bg-red-600 font-semibold text-white disabled:opacity-50"
          >
            {saving
              ? "Setting up..."
              : replay
                ? "Finish replay"
                : "Continue to pay & rota"}

            <ArrowRight className="size-5" />
          </button>
        )}
      </div>

      {replay ? (
        <p className="mt-4 text-center text-xs text-amber-600">
          Developer replay mode — nothing entered here will be saved.
        </p>
      ) : null}
    </div>
  );
}

function Progress({
  step,
  total,
}: {
  step: number;
  total: number;
}) {
  const percentage =
    ((step + 1) / total) *
    100;

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
          Step {step + 1} of{" "}
          {total}
        </p>

        <p className="text-xs font-semibold text-zinc-500">
          {Math.round(
            percentage,
          )}
          %
        </p>
      </div>

      <div className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-100">
        <div
          className="h-full rounded-full bg-red-600 transition-all"
          style={{
            width: `${percentage}%`,
          }}
        />
      </div>
    </div>
  );
}

function WelcomeStep() {
  return (
    <div className="text-center">
      <div className="mx-auto flex size-16 items-center justify-center rounded-[1.5rem] bg-red-600 text-white shadow-lg shadow-red-600/20">
        <Flame className="size-8" />
      </div>

      <h2 className="mt-6 text-3xl font-bold tracking-tight text-zinc-950">
        Welcome to FirePay
      </h2>

      <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-zinc-500">
        We&apos;ll get the essentials set up first, then take you straight into your pay and rota settings.
      </p>

      <div className="mt-7 rounded-2xl bg-zinc-50 p-4 text-left">
        <p className="font-semibold text-zinc-900">
          We&apos;ll set up:
        </p>

        <div className="mt-3 space-y-2 text-sm text-zinc-600">
          <CheckLine text="Your profile" />
          <CheckLine text="Your fire service" />
          <CheckLine text="Your role and rank" />
          <CheckLine text="Then your pay and rota" />
        </div>
      </div>
    </div>
  );
}

function AboutYouStep({
  preferredName,
  setPreferredName,
}: {
  preferredName: string;
  setPreferredName: (
    value: string,
  ) => void;
}) {
  return (
    <div>
      <div className="flex size-12 items-center justify-center rounded-2xl bg-red-50 text-red-600">
        <CircleUserRound className="size-6" />
      </div>

      <h2 className="mt-5 text-2xl font-bold text-zinc-950">
        What should FirePay call you?
      </h2>

      <p className="mt-2 text-sm leading-6 text-zinc-500">
        We&apos;ll use this on your dashboard and throughout the app.
      </p>

      <label className="mt-7 block">
        <span className="text-sm font-semibold text-zinc-800">
          Preferred name
        </span>

        <input
          autoFocus
          value={preferredName}
          onChange={(event) =>
            setPreferredName(
              event.target.value,
            )
          }
          className="input mt-2"
          placeholder="e.g. Curtis"
        />
      </label>
    </div>
  );
}

function ServiceStep({
  fireService,
  setFireService,
  station,
  setStation,
}: {
  fireService: string;
  setFireService: (
    value: string,
  ) => void;
  station: string;
  setStation: (
    value: string,
  ) => void;
}) {
  return (
    <div>
      <div className="flex size-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
        <MapPin className="size-6" />
      </div>

      <h2 className="mt-5 text-2xl font-bold text-zinc-950">
        Where do you work?
      </h2>

      <p className="mt-2 text-sm leading-6 text-zinc-500">
        This helps FirePay organise your roles and makes your setup easier to recognise.
      </p>

      <div className="mt-7 space-y-5">
        <label className="block">
          <span className="text-sm font-semibold text-zinc-800">
            Fire & Rescue Service
          </span>

          <input
            value={fireService}
            onChange={(event) =>
              setFireService(
                event.target.value,
              )
            }
            className="input mt-2"
            placeholder="e.g. East Sussex Fire & Rescue Service"
          />
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-zinc-800">
            Station
          </span>

          <span className="ml-2 text-xs text-zinc-400">
            Optional
          </span>

          <input
            value={station}
            onChange={(event) =>
              setStation(
                event.target.value,
              )
            }
            className="input mt-2"
            placeholder="e.g. Battle"
          />
        </label>
      </div>
    </div>
  );
}

function RoleStep({
  employmentType,
  setEmploymentType,
  rank,
  setRank,
  competence,
  setCompetence,
}: {
  employmentType: string;
  setEmploymentType: (
    value: string,
  ) => void;
  rank: string;
  setRank: (
    value: string,
  ) => void;
  competence: string;
  setCompetence: (
    value: string,
  ) => void;
}) {
  return (
    <div>
      <div className="flex size-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
        <ShieldCheck className="size-6" />
      </div>

      <h2 className="mt-5 text-2xl font-bold text-zinc-950">
        Tell us about your role
      </h2>

      <p className="mt-2 text-sm leading-6 text-zinc-500">
        Start with one role. If you&apos;re both Whole-time and On-call, you can add the second role immediately afterwards.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() =>
            setEmploymentType(
              "wholetime",
            )
          }
          className={`rounded-2xl border p-4 text-left ${
            employmentType ===
            "wholetime"
              ? "border-blue-400 bg-blue-50"
              : "border-zinc-200"
          }`}
        >
          <p className="font-bold text-zinc-950">
            Whole-time
          </p>

          <p className="mt-1 text-xs text-zinc-500">
            Salaried / shift based
          </p>
        </button>

        <button
          type="button"
          onClick={() =>
            setEmploymentType(
              "on_call",
            )
          }
          className={`rounded-2xl border p-4 text-left ${
            employmentType ===
            "on_call"
              ? "border-emerald-400 bg-emerald-50"
              : "border-zinc-200"
          }`}
        >
          <p className="font-bold text-zinc-950">
            On-call
          </p>

          <p className="mt-1 text-xs text-zinc-500">
            Retained / pager based
          </p>
        </button>
      </div>

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <label>
          <span className="text-sm font-semibold text-zinc-800">
            Rank
          </span>

          <select
            value={rank}
            onChange={(event) =>
              setRank(
                event.target.value,
              )
            }
            className="input mt-2"
          >
            {ranks.map(
              ([value, name]) => (
                <option
                  key={value}
                  value={value}
                >
                  {name}
                </option>
              ),
            )}
          </select>
        </label>

        <label>
          <span className="text-sm font-semibold text-zinc-800">
            Competence
          </span>

          <select
            value={competence}
            onChange={(event) =>
              setCompetence(
                event.target.value,
              )
            }
            className="input mt-2"
          >
            {competenceOptions[
              rank
            ].map(
              ([value, name]) => (
                <option
                  key={value}
                  value={value}
                >
                  {name}
                </option>
              ),
            )}
          </select>
        </label>
      </div>
    </div>
  );
}

function ReadyStep({
  preferredName,
  fireService,
  station,
  employmentType,
  rank,
  replay,
}: {
  preferredName: string;
  fireService: string;
  station: string;
  employmentType: string;
  rank: string;
  replay: boolean;
}) {
  return (
    <div className="text-center">
      <div className="mx-auto flex size-16 items-center justify-center rounded-[1.5rem] bg-emerald-100 text-emerald-700">
        <PartyPopper className="size-8" />
      </div>

      <h2 className="mt-5 text-2xl font-bold text-zinc-950">
        {replay
          ? "Replay complete"
          : `Nearly there, ${preferredName}`}
      </h2>

      <p className="mt-2 text-sm leading-6 text-zinc-500">
        {replay
          ? "Nothing has been changed. This was a safe developer preview."
          : "Your basic profile is ready. Next we'll set the pay and rota for this role."}
      </p>

      <div className="mt-6 space-y-3 rounded-2xl bg-zinc-50 p-5 text-left">
        <SummaryRow
          label="Name"
          value={preferredName}
        />

        <SummaryRow
          label="Service"
          value={fireService}
        />

        <SummaryRow
          label="Station"
          value={
            station || "Not set"
          }
        />

        <SummaryRow
          label="Role"
          value={
            employmentType ===
            "on_call"
              ? "On-call"
              : "Whole-time"
          }
        />

        <SummaryRow
          label="Rank"
          value={rank
            .replaceAll("_", " ")
            .replace(
              /\b\w/g,
              (letter) =>
                letter.toUpperCase(),
            )}
        />
      </div>

      {!replay ? (
        <div className="mt-5 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-left">
          <p className="font-semibold text-blue-900">
            Next: pay & rota
          </p>

          <p className="mt-1 text-sm leading-6 text-blue-700">
            FirePay needs these before it can calculate your day accurately.
          </p>
        </div>
      ) : null}
    </div>
  );
}

function CheckLine({
  text,
}: {
  text: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="flex size-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
        <Check className="size-3" />
      </span>

      {text}
    </div>
  );
}

function SummaryRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm text-zinc-500">
        {label}
      </span>

      <span className="text-right text-sm font-semibold text-zinc-900">
        {value}
      </span>
    </div>
  );
}
