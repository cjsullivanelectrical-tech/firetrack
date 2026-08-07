"use client";

import { useMemo, useState } from "react";
import {
  CalendarDays,
  Check,
  Clock3,
  Flame,
  GraduationCap,
  Plus,
  Radio,
  Save,
  Trash2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getLondonDate } from "@/lib/date";

type Position = {
  id: string;
  label: string;
  fire_service: string;
  station_name: string | null;
  employment_type: string;
  rank: string;
  competence: string;
};

type PayPackage = {
  id?: string;
  position_id: string;
  user_id: string;
  use_national_rates: boolean;
  contracted_hours_per_week: number;
  custom_basic_hourly: number | null;
  count_rota_as_base_earnings: boolean;

  pay_model?: "salaried" | "retained" | "custom";

  retained_retainer_type?:
    | "full"
    | "day_crew"
    | "none"
    | "custom";

  custom_retainer_annual?: number | null;
};

type Allowance = {
  id: string;
  name: string;
  amount: number;
  frequency: string;
  effective_from: string;
  effective_to: string | null;
};

type RotaPattern = {
  id: string;
  name: string;
  anchor_date: string;
  cycle_length_days: number;

  pattern_type?: "none" | "cycle" | "weekly_rdo";

  weekly_start_time?: string | null;
  weekly_duration_minutes?: number;

  working_weekdays?: number[];
  rdo_sequence?: number[];
};

type RotaDay = {
  id?: string;
  day_index: number;
  label: string;
  is_working: boolean;
  start_time: string | null;
  duration_minutes: number;
};

type Props = {
  position: Position;
  userId: string;
  initialPayPackage: PayPackage | null;
  initialAllowances: Allowance[];
  initialRotaPattern: RotaPattern | null;
  initialRotaDays: RotaDay[];
};

const frequencyOptions = [
  ["annual", "Annual"],
  ["monthly", "Monthly"],
  ["weekly", "Weekly"],
  ["daily", "Daily"],
  ["per_shift", "Per shift"],
  ["per_pay_period", "Per pay period"],
];

const weekdays = [
  [1, "Monday"],
  [2, "Tuesday"],
  [3, "Wednesday"],
  [4, "Thursday"],
  [5, "Friday"],
] as const;

function weekdayName(day: number) {
  return (
    weekdays.find(([value]) => value === day)?.[1] ??
    "Unknown"
  );
}

function makeDays(
  length: number,
  existing: RotaDay[],
) {
  return Array.from({ length }, (_, index) => {
    const existingDay = existing.find(
      (day) => day.day_index === index,
    );

    return (
      existingDay ?? {
        day_index: index,
        label: "Off",
        is_working: false,
        start_time: null,
        duration_minutes: 0,
      }
    );
  });
}

export function PayPackageManager({
  position,
  userId,
  initialPayPackage,
  initialAllowances,
  initialRotaPattern,
  initialRotaDays,
}: Props) {
  const supabase = useMemo(() => createClient(), []);

  const isRetained =
    position.employment_type === "on_call";

  const [useNationalRates, setUseNationalRates] =
    useState(
      initialPayPackage?.use_national_rates ?? true,
    );

  const [contractedHours, setContractedHours] =
    useState(
      String(
        initialPayPackage?.contracted_hours_per_week ??
          42,
      ),
    );

  const [customHourly, setCustomHourly] =
    useState(
      initialPayPackage?.custom_basic_hourly
        ? String(
            initialPayPackage.custom_basic_hourly,
          )
        : "",
    );

  const [
    countRotaAsBaseEarnings,
    setCountRotaAsBaseEarnings,
  ] = useState(
    initialPayPackage
      ?.count_rota_as_base_earnings ??
      !isRetained,
  );

  const [retainerType, setRetainerType] =
    useState<
      "full" | "day_crew" | "none" | "custom"
    >(
      initialPayPackage?.retained_retainer_type ??
        "full",
    );

  const [customRetainer, setCustomRetainer] =
    useState(
      initialPayPackage?.custom_retainer_annual
        ? String(
            initialPayPackage.custom_retainer_annual,
          )
        : "",
    );

  const [allowances, setAllowances] =
    useState(initialAllowances);

  const [allowanceName, setAllowanceName] =
    useState("");

  const [allowanceAmount, setAllowanceAmount] =
    useState("");

  const [allowanceFrequency, setAllowanceFrequency] =
    useState("annual");

  const [rotaType, setRotaType] =
    useState<
      "none" | "cycle" | "weekly_rdo"
    >(
      initialRotaPattern?.pattern_type ??
        "none",
    );

  const [rotaName, setRotaName] = useState(
    initialRotaPattern?.name ??
      (isRetained
        ? "Availability pattern"
        : "My rota"),
  );

  const [anchorDate, setAnchorDate] =
    useState(
      initialRotaPattern?.anchor_date ??
        getLondonDate(),
    );

  const [cycleLength, setCycleLength] =
    useState(
      initialRotaPattern?.cycle_length_days ?? 1,
    );

  const [rotaDays, setRotaDays] =
    useState<RotaDay[]>(
      makeDays(
        initialRotaPattern?.cycle_length_days ?? 1,
        initialRotaDays,
      ),
    );

  const [weeklyStartTime, setWeeklyStartTime] =
    useState(
      initialRotaPattern?.weekly_start_time?.slice(
        0,
        5,
      ) ?? "08:00",
    );

  const [weeklyShiftHours, setWeeklyShiftHours] =
    useState(
      String(
        (initialRotaPattern
          ?.weekly_duration_minutes ?? 480) / 60,
      ),
    );

  const [rdoSequence, setRdoSequence] =
    useState<number[]>(
      initialRotaPattern?.rdo_sequence ??
        [1, 2, 3, 4, 5],
    );

  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  function changeCycleLength(nextLength: number) {
    const safeLength = Math.max(
      1,
      Math.min(56, nextLength),
    );

    setCycleLength(safeLength);

    setRotaDays((current) =>
      makeDays(safeLength, current),
    );
  }

  function updateDay(
    index: number,
    patch: Partial<RotaDay>,
  ) {
    setRotaDays((current) =>
      current.map((day) =>
        day.day_index === index
          ? { ...day, ...patch }
          : day,
      ),
    );
  }

  function applyBattleRdo() {
    setRotaType("weekly_rdo");
    setRotaName("Rolling day off");

    setRdoSequence([
      1,
      2,
      3,
      4,
      5,
    ]);
  }

  function applyCyclePreset(
    preset: "2d2n4o" | "24on72off",
  ) {
    setRotaType("cycle");

    if (preset === "2d2n4o") {
      setCycleLength(8);

      setRotaDays([
        {
          day_index: 0,
          label: "Day",
          is_working: true,
          start_time: "09:00",
          duration_minutes: 540,
        },
        {
          day_index: 1,
          label: "Day",
          is_working: true,
          start_time: "09:00",
          duration_minutes: 540,
        },
        {
          day_index: 2,
          label: "Night",
          is_working: true,
          start_time: "18:00",
          duration_minutes: 900,
        },
        {
          day_index: 3,
          label: "Night",
          is_working: true,
          start_time: "18:00",
          duration_minutes: 900,
        },
        ...Array.from(
          { length: 4 },
          (_, index) => ({
            day_index: index + 4,
            label: "Off",
            is_working: false,
            start_time: null,
            duration_minutes: 0,
          }),
        ),
      ]);

      return;
    }

    setCycleLength(4);

    setRotaDays([
      {
        day_index: 0,
        label: "24 hour shift",
        is_working: true,
        start_time: "08:00",
        duration_minutes: 1440,
      },
      {
        day_index: 1,
        label: "Off",
        is_working: false,
        start_time: null,
        duration_minutes: 0,
      },
      {
        day_index: 2,
        label: "Off",
        is_working: false,
        start_time: null,
        duration_minutes: 0,
      },
      {
        day_index: 3,
        label: "Off",
        is_working: false,
        start_time: null,
        duration_minutes: 0,
      },
    ]);
  }

  function moveRdo(
    index: number,
    direction: -1 | 1,
  ) {
    const nextIndex = index + direction;

    if (
      nextIndex < 0 ||
      nextIndex >= rdoSequence.length
    ) {
      return;
    }

    const next = [...rdoSequence];

    [next[index], next[nextIndex]] = [
      next[nextIndex],
      next[index],
    ];

    setRdoSequence(next);
  }

  async function saveEverything() {
    setSaving(true);
    setMessage("");

    const payPackagePayload = {
      position_id: position.id,
      user_id: userId,

      use_national_rates: useNationalRates,

      contracted_hours_per_week: isRetained
        ? 0
        : Number(contractedHours || 0),

      custom_basic_hourly:
        useNationalRates || !customHourly
          ? null
          : Number(customHourly),

      count_rota_as_base_earnings: isRetained
        ? false
        : countRotaAsBaseEarnings,

      pay_model: isRetained
        ? "retained"
        : "salaried",

      retained_retainer_type: isRetained
        ? retainerType
        : "none",

      custom_retainer_annual:
        isRetained &&
        retainerType === "custom" &&
        customRetainer
          ? Number(customRetainer)
          : null,
    };

    const { error: payError } = await supabase
      .from("position_pay_packages")
      .upsert(payPackagePayload, {
        onConflict: "position_id",
      });

    if (payError) {
      setMessage(payError.message);
      setSaving(false);
      return;
    }

    const rotaPayload = {
      position_id: position.id,
      user_id: userId,

      name: rotaName,
      anchor_date: anchorDate,

      cycle_length_days:
        rotaType === "cycle"
          ? cycleLength
          : 1,

      pattern_type: rotaType,

      weekly_start_time:
        rotaType === "weekly_rdo"
          ? weeklyStartTime
          : null,

      weekly_duration_minutes:
        rotaType === "weekly_rdo"
          ? Math.round(
              Number(weeklyShiftHours || 0) * 60,
            )
          : 0,

      working_weekdays: [1, 2, 3, 4, 5],

      rdo_sequence:
        rotaType === "weekly_rdo"
          ? rdoSequence
          : [],
    };

    const {
      data: rota,
      error: rotaError,
    } = await supabase
      .from("rota_patterns")
      .upsert(rotaPayload, {
        onConflict: "position_id",
      })
      .select()
      .single();

    if (rotaError || !rota) {
      setMessage(
        rotaError?.message ??
          "Unable to save rota.",
      );

      setSaving(false);
      return;
    }

    await supabase
      .from("rota_days")
      .delete()
      .eq(
        "rota_pattern_id",
        rota.id,
      );

    if (rotaType === "cycle") {
      const rows = rotaDays.map((day) => ({
        rota_pattern_id: rota.id,
        user_id: userId,

        day_index: day.day_index,
        label: day.label,
        is_working: day.is_working,

        start_time:
          day.is_working &&
          day.start_time
            ? day.start_time
            : null,

        duration_minutes:
          day.is_working
            ? day.duration_minutes
            : 0,
      }));

      const { error } = await supabase
        .from("rota_days")
        .insert(rows);

      if (error) {
        setMessage(error.message);
        setSaving(false);
        return;
      }
    }

    setMessage(
      isRetained
        ? "On-call pay setup saved."
        : "Pay package and rota saved.",
    );

    setSaving(false);
  }

  async function addAllowance() {
    if (
      !allowanceName.trim() ||
      Number(allowanceAmount) <= 0
    ) {
      return;
    }

    const { data, error } = await supabase
      .from("position_allowances")
      .insert({
        position_id: position.id,
        user_id: userId,

        name: allowanceName.trim(),

        amount: Number(
          allowanceAmount,
        ),

        frequency:
          allowanceFrequency,

        effective_from: getLondonDate(),
      })
      .select()
      .single();

    if (error) {
      setMessage(error.message);
      return;
    }

    setAllowances((current) => [
      ...current,
      data,
    ]);

    setAllowanceName("");
    setAllowanceAmount("");
  }

  async function removeAllowance(id: string) {
    const { error } = await supabase
      .from("position_allowances")
      .delete()
      .eq("id", id);

    if (error) {
      setMessage(error.message);
      return;
    }

    setAllowances((current) =>
      current.filter(
        (allowance) =>
          allowance.id !== id,
      ),
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-zinc-200 bg-white p-5 shadow-sm sm:p-8">
        <p className="text-sm font-semibold text-red-600">
          {position.label}
        </p>

        <div className="mt-1 flex items-center gap-3">
          {isRetained ? (
            <Radio className="size-7 text-red-600" />
          ) : null}

          <h1 className="text-3xl font-bold tracking-tight text-zinc-950">
            {isRetained
              ? "On-Call pay setup"
              : "Pay package"}
          </h1>
        </div>

        <p className="mt-2 text-sm leading-6 text-zinc-500">
          {isRetained
            ? "Configure your retainer and the payments attached to your on-call position."
            : "Configure how this whole-time position is paid."}
        </p>
      </section>

      {isRetained ? (
        <>
          <section className="rounded-[2rem] border border-zinc-200 bg-white p-5 shadow-sm sm:p-8">
            <h2 className="text-xl font-bold text-zinc-950">
              Retainer
            </h2>

            <p className="mt-1 text-sm text-zinc-500">
              FirePay uses this for your retained pay forecast and daily accrued value.
            </p>

            <div className="mt-6 space-y-3">
              <RetainerOption
                title="Full national retainer"
                description="Use the current national full retainer for your rank."
                selected={
                  retainerType === "full"
                }
                onClick={() =>
                  setRetainerType("full")
                }
              />

              <RetainerOption
                title="Day-crewed retainer"
                description="Use the national day-crewed retained amount."
                selected={
                  retainerType ===
                  "day_crew"
                }
                onClick={() =>
                  setRetainerType(
                    "day_crew",
                  )
                }
              />

              <RetainerOption
                title="No retainer"
                description="Use this where the position does not receive a retainer."
                selected={
                  retainerType === "none"
                }
                onClick={() =>
                  setRetainerType("none")
                }
              />

              <RetainerOption
                title="Custom retainer"
                description="Enter an annual amount manually."
                selected={
                  retainerType ===
                  "custom"
                }
                onClick={() =>
                  setRetainerType(
                    "custom",
                  )
                }
              />
            </div>

            {retainerType === "custom" ? (
              <div className="mt-5">
                <Field label="Annual retainer">
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-zinc-500">
                      £
                    </span>

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={
                        customRetainer
                      }
                      onChange={(event) =>
                        setCustomRetainer(
                          event.target
                            .value,
                        )
                      }
                      className="input pl-8"
                    />
                  </div>
                </Field>
              </div>
            ) : null}
          </section>

          <section className="rounded-[2rem] border border-zinc-200 bg-white p-5 shadow-sm sm:p-8">
            <h2 className="text-xl font-bold text-zinc-950">
              Activity pay
            </h2>

            <p className="mt-1 text-sm text-zinc-500">
              FirePay automatically calculates these from your rank, competence and activity date.
            </p>

            <div className="mt-6 space-y-3">
              <PaymentRule
                icon={Flame}
                title="Fire calls"
                description="National work activity rate plus disturbance payment."
              />

              <PaymentRule
                icon={GraduationCap}
                title="Drill nights"
                description="Paid using the applicable national hourly rate."
              />

              <PaymentRule
                icon={Radio}
                title="Standby / station cover"
                description="Recorded hours are paid using the applicable hourly rate."
              />

              <PaymentRule
                icon={GraduationCap}
                title="Courses & training"
                description="Recorded hours are paid using the applicable hourly rate."
              />
            </div>

            <label className="mt-6 flex items-center justify-between gap-4 rounded-2xl border border-zinc-200 p-4">
              <div>
                <p className="font-semibold text-zinc-950">
                  Use national pay rates
                </p>

                <p className="mt-1 text-sm text-zinc-500">
                  Recommended. FirePay automatically selects the correct historical rate.
                </p>
              </div>

              <input
                type="checkbox"
                checked={
                  useNationalRates
                }
                onChange={(event) =>
                  setUseNationalRates(
                    event.target
                      .checked,
                  )
                }
                className="size-5"
              />
            </label>

            {!useNationalRates ? (
              <div className="mt-5">
                <Field label="Custom hourly rate">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={
                      customHourly
                    }
                    onChange={(event) =>
                      setCustomHourly(
                        event.target.value,
                      )
                    }
                    className="input"
                  />
                </Field>
              </div>
            ) : null}
          </section>

          <section className="rounded-[2rem] border border-zinc-200 bg-white p-5 shadow-sm sm:p-8">
            <h2 className="text-xl font-bold text-zinc-950">
              Availability
            </h2>

            <p className="mt-1 text-sm leading-6 text-zinc-500">
              Optional. Availability can be tracked later for cover statistics and reminders. It does not automatically count as hourly earnings.
            </p>

            <div className="mt-5 rounded-2xl bg-zinc-100 p-4">
              <div className="flex gap-3">
                <Clock3 className="mt-0.5 size-5 shrink-0 text-zinc-500" />

                <div>
                  <p className="font-semibold text-zinc-900">
                    Availability is separate from pay
                  </p>

                  <p className="mt-1 text-sm leading-6 text-zinc-500">
                    Being available on-call will not add hourly pay to the dashboard. FirePay only adds the retainer and paid activities you actually record.
                  </p>
                </div>
              </div>
            </div>

            <details className="mt-5 rounded-2xl border border-zinc-200 p-4">
              <summary className="cursor-pointer font-semibold text-zinc-800">
                Optional availability pattern
              </summary>

              <div className="mt-5">
                <Field label="Pattern">
                  <select
                    value={rotaType}
                    onChange={(event) =>
                      setRotaType(
                        event.target.value as
                          | "none"
                          | "cycle"
                          | "weekly_rdo",
                      )
                    }
                    className="input"
                  >
                    <option value="none">
                      Do not track availability
                    </option>

                    <option value="cycle">
                      Custom repeating pattern
                    </option>
                  </select>
                </Field>

                {rotaType === "cycle" ? (
                  <div className="mt-5 space-y-5">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label="Pattern name">
                        <input
                          value={rotaName}
                          onChange={(event) =>
                            setRotaName(
                              event.target
                                .value,
                            )
                          }
                          className="input"
                        />
                      </Field>

                      <Field label="Cycle length">
                        <input
                          type="number"
                          min="1"
                          max="56"
                          value={
                            cycleLength
                          }
                          onChange={(event) =>
                            changeCycleLength(
                              Number(
                                event.target
                                  .value,
                              ),
                            )
                          }
                          className="input"
                        />
                      </Field>
                    </div>

                    <Field label="Cycle starts">
                      <input
                        type="date"
                        value={anchorDate}
                        onChange={(event) =>
                          setAnchorDate(
                            event.target
                              .value,
                          )
                        }
                        className="input"
                      />
                    </Field>

                    <p className="text-sm text-zinc-500">
                      Detailed availability hours can be expanded later. This currently stores the repeating cycle without adding any earnings.
                    </p>
                  </div>
                ) : null}
              </div>
            </details>
          </section>
        </>
      ) : (
        <>
          <section className="rounded-[2rem] border border-zinc-200 bg-white p-5 shadow-sm sm:p-8">
            <h2 className="text-xl font-bold text-zinc-950">
              Whole-time pay
            </h2>

            <div className="mt-6 space-y-5">
              <label className="flex items-center justify-between gap-4 rounded-2xl border border-zinc-200 p-4">
                <div>
                  <p className="font-semibold text-zinc-950">
                    Use national pay rates
                  </p>

                  <p className="mt-1 text-sm text-zinc-500">
                    Automatically use the correct rate for rank, competence and date.
                  </p>
                </div>

                <input
                  type="checkbox"
                  checked={
                    useNationalRates
                  }
                  onChange={(event) =>
                    setUseNationalRates(
                      event.target
                        .checked,
                    )
                  }
                  className="size-5"
                />
              </label>

              <label className="flex items-center justify-between gap-4 rounded-2xl border border-zinc-200 p-4">
                <div>
                  <p className="font-semibold text-zinc-950">
                    Include scheduled shifts in earnings
                  </p>

                  <p className="mt-1 text-sm text-zinc-500">
                    Use your rota to show the value of your scheduled working day.
                  </p>
                </div>

                <input
                  type="checkbox"
                  checked={
                    countRotaAsBaseEarnings
                  }
                  onChange={(event) =>
                    setCountRotaAsBaseEarnings(
                      event.target
                        .checked,
                    )
                  }
                  className="size-5"
                />
              </label>

              <details className="rounded-2xl border border-zinc-200 p-4">
                <summary className="cursor-pointer font-semibold text-zinc-800">
                  Advanced pay settings
                </summary>

                <div className="mt-5 space-y-5">
                  <Field label="Contracted hours per week">
                    <input
                      type="number"
                      min="0"
                      step="0.25"
                      value={
                        contractedHours
                      }
                      onChange={(event) =>
                        setContractedHours(
                          event.target
                            .value,
                        )
                      }
                      className="input"
                    />
                  </Field>

                  {!useNationalRates ? (
                    <Field label="Custom basic hourly rate">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={
                          customHourly
                        }
                        onChange={(event) =>
                          setCustomHourly(
                            event.target
                              .value,
                          )
                        }
                        className="input"
                      />
                    </Field>
                  ) : null}
                </div>
              </details>
            </div>
          </section>

          <section className="rounded-[2rem] border border-zinc-200 bg-white p-5 shadow-sm sm:p-8">
            <div className="flex items-center gap-3">
              <CalendarDays className="size-6 text-red-600" />

              <div>
                <h2 className="text-xl font-bold text-zinc-950">
                  Shift pattern
                </h2>

                <p className="text-sm text-zinc-500">
                  Tell FirePay when you normally work.
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-2 sm:grid-cols-4">
              <button
                type="button"
                onClick={() =>
                  setRotaType("none")
                }
                className={`rounded-xl px-3 py-3 text-sm font-semibold ${
                  rotaType === "none"
                    ? "bg-red-600 text-white"
                    : "bg-zinc-100 text-zinc-700"
                }`}
              >
                No fixed rota
              </button>

              <button
                type="button"
                onClick={applyBattleRdo}
                className={`rounded-xl px-3 py-3 text-sm font-semibold ${
                  rotaType ===
                  "weekly_rdo"
                    ? "bg-red-600 text-white"
                    : "bg-zinc-100 text-zinc-700"
                }`}
              >
                Rolling day off
              </button>

              <button
                type="button"
                onClick={() =>
                  applyCyclePreset(
                    "2d2n4o",
                  )
                }
                className="rounded-xl bg-zinc-100 px-3 py-3 text-sm font-semibold text-zinc-700"
              >
                2D / 2N / 4 off
              </button>

              <button
                type="button"
                onClick={() =>
                  applyCyclePreset(
                    "24on72off",
                  )
                }
                className="rounded-xl bg-zinc-100 px-3 py-3 text-sm font-semibold text-zinc-700"
              >
                24h / 72h off
              </button>
            </div>

            {rotaType === "weekly_rdo" ? (
              <div className="mt-8 space-y-6">
                <div className="grid gap-5 sm:grid-cols-3">
                  <Field label="Week 1 starts">
                    <input
                      type="date"
                      value={anchorDate}
                      onChange={(event) =>
                        setAnchorDate(
                          event.target
                            .value,
                        )
                      }
                      className="input"
                    />
                  </Field>

                  <Field label="Normal start">
                    <input
                      type="time"
                      value={
                        weeklyStartTime
                      }
                      onChange={(event) =>
                        setWeeklyStartTime(
                          event.target
                            .value,
                        )
                      }
                      className="input"
                    />
                  </Field>

                  <Field label="Shift hours">
                    <input
                      type="number"
                      min="0"
                      step="0.25"
                      value={
                        weeklyShiftHours
                      }
                      onChange={(event) =>
                        setWeeklyShiftHours(
                          event.target
                            .value,
                        )
                      }
                      className="input"
                    />
                  </Field>
                </div>

                <div>
                  <p className="font-semibold text-zinc-900">
                    Rolling day off sequence
                  </p>

                  <div className="mt-4 space-y-2">
                    {rdoSequence.map(
                      (day, index) => (
                        <div
                          key={`${day}-${index}`}
                          className="flex items-center justify-between rounded-2xl bg-zinc-50 px-4 py-3"
                        >
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                              Week{" "}
                              {index + 1}
                            </p>

                            <p className="font-bold text-zinc-950">
                              {weekdayName(
                                day,
                              )}{" "}
                              off
                            </p>
                          </div>

                          <div className="flex gap-2">
                            <button
                              type="button"
                              disabled={
                                index === 0
                              }
                              onClick={() =>
                                moveRdo(
                                  index,
                                  -1,
                                )
                              }
                              className="rounded-lg bg-white px-3 py-2 text-xs font-bold text-zinc-600 disabled:opacity-30"
                            >
                              ↑
                            </button>

                            <button
                              type="button"
                              disabled={
                                index ===
                                rdoSequence.length -
                                  1
                              }
                              onClick={() =>
                                moveRdo(
                                  index,
                                  1,
                                )
                              }
                              className="rounded-lg bg-white px-3 py-2 text-xs font-bold text-zinc-600 disabled:opacity-30"
                            >
                              ↓
                            </button>
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                </div>
              </div>
            ) : null}

            {rotaType === "cycle" ? (
              <div className="mt-8">
                <div className="grid gap-5 sm:grid-cols-3">
                  <Field label="Rota name">
                    <input
                      value={rotaName}
                      onChange={(event) =>
                        setRotaName(
                          event.target
                            .value,
                        )
                      }
                      className="input"
                    />
                  </Field>

                  <Field label="Cycle starts">
                    <input
                      type="date"
                      value={anchorDate}
                      onChange={(event) =>
                        setAnchorDate(
                          event.target
                            .value,
                        )
                      }
                      className="input"
                    />
                  </Field>

                  <Field label="Cycle length">
                    <input
                      type="number"
                      min="1"
                      max="56"
                      value={
                        cycleLength
                      }
                      onChange={(event) =>
                        changeCycleLength(
                          Number(
                            event.target
                              .value,
                          ),
                        )
                      }
                      className="input"
                    />
                  </Field>
                </div>

                <div className="mt-6 space-y-3">
                  {rotaDays.map((day) => (
                    <div
                      key={day.day_index}
                      className="rounded-2xl border border-zinc-200 p-4"
                    >
                      <div className="flex items-center justify-between">
                        <p className="font-bold text-zinc-950">
                          Day{" "}
                          {day.day_index +
                            1}
                        </p>

                        <label className="flex items-center gap-2 text-sm font-semibold text-zinc-600">
                          Working

                          <input
                            type="checkbox"
                            checked={
                              day.is_working
                            }
                            onChange={(event) =>
                              updateDay(
                                day.day_index,
                                {
                                  is_working:
                                    event.target
                                      .checked,

                                  label:
                                    event.target
                                      .checked &&
                                    day.label ===
                                      "Off"
                                      ? "Shift"
                                      : day.label,
                                },
                              )
                            }
                            className="size-5"
                          />
                        </label>
                      </div>

                      {day.is_working ? (
                        <div className="mt-4 grid gap-4 sm:grid-cols-3">
                          <Field label="Name">
                            <input
                              value={
                                day.label
                              }
                              onChange={(event) =>
                                updateDay(
                                  day.day_index,
                                  {
                                    label:
                                      event.target
                                        .value,
                                  },
                                )
                              }
                              className="input"
                            />
                          </Field>

                          <Field label="Start">
                            <input
                              type="time"
                              value={
                                day.start_time ??
                                ""
                              }
                              onChange={(event) =>
                                updateDay(
                                  day.day_index,
                                  {
                                    start_time:
                                      event.target
                                        .value,
                                  },
                                )
                              }
                              className="input"
                            />
                          </Field>

                          <Field label="Shift hours">
                            <input
                              type="number"
                              min="0"
                              step="0.25"
                              value={
                                day.duration_minutes /
                                60
                              }
                              onChange={(event) =>
                                updateDay(
                                  day.day_index,
                                  {
                                    duration_minutes:
                                      Math.round(
                                        Number(
                                          event
                                            .target
                                            .value ||
                                            0,
                                        ) *
                                          60,
                                      ),
                                  },
                                )
                              }
                              className="input"
                            />
                          </Field>
                        </div>
                      ) : (
                        <p className="mt-3 text-sm text-zinc-400">
                          Rest day
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </section>
        </>
      )}

      <section className="rounded-[2rem] border border-zinc-200 bg-white p-5 shadow-sm sm:p-8">
        <h2 className="text-xl font-bold text-zinc-950">
          Allowances
        </h2>

        <p className="mt-1 text-sm text-zinc-500">
          Add housing, day-crewing or any other local payments.
        </p>

        <div className="mt-6 space-y-3">
          {allowances.map((allowance) => (
            <div
              key={allowance.id}
              className="flex items-center justify-between rounded-2xl bg-zinc-50 p-4"
            >
              <div>
                <p className="font-semibold text-zinc-950">
                  {allowance.name}
                </p>

                <p className="mt-1 text-sm text-zinc-500">
                  £
                  {Number(
                    allowance.amount,
                  ).toFixed(2)}
                  {" • "}
                  {allowance.frequency.replaceAll(
                    "_",
                    " ",
                  )}
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  removeAllowance(
                    allowance.id,
                  )
                }
                className="flex size-10 items-center justify-center rounded-xl text-zinc-400 hover:bg-red-50 hover:text-red-600"
              >
                <Trash2 className="size-5" />
              </button>
            </div>
          ))}
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <Field label="Allowance">
            <input
              value={allowanceName}
              onChange={(event) =>
                setAllowanceName(
                  event.target.value,
                )
              }
              placeholder="e.g. Housing allowance"
              className="input"
            />
          </Field>

          <Field label="Amount">
            <input
              type="number"
              min="0"
              step="0.01"
              value={
                allowanceAmount
              }
              onChange={(event) =>
                setAllowanceAmount(
                  event.target.value,
                )
              }
              className="input"
            />
          </Field>

          <Field label="Frequency">
            <select
              value={
                allowanceFrequency
              }
              onChange={(event) =>
                setAllowanceFrequency(
                  event.target.value,
                )
              }
              className="input"
            >
              {frequencyOptions.map(
                ([value, label]) => (
                  <option
                    key={value}
                    value={value}
                  >
                    {label}
                  </option>
                ),
              )}
            </select>
          </Field>
        </div>

        <button
          type="button"
          onClick={addAllowance}
          className="mt-4 flex h-11 items-center gap-2 rounded-xl bg-zinc-950 px-4 text-sm font-semibold text-white"
        >
          <Plus className="size-4" />
          Add allowance
        </button>
      </section>

      {message ? (
        <div className="rounded-2xl bg-zinc-950 p-4 text-sm font-medium text-white">
          {message}
        </div>
      ) : null}

      <button
        type="button"
        disabled={saving}
        onClick={saveEverything}
        className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-red-600 font-semibold text-white shadow-lg shadow-red-600/20 disabled:opacity-50"
      >
        <Save className="size-5" />

        {saving
          ? "Saving..."
          : isRetained
            ? "Save on-call pay setup"
            : "Save pay package & rota"}
      </button>
    </div>
  );
}

function PaymentRule({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof Flame;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-4 rounded-2xl border border-zinc-200 p-4">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
        <Icon className="size-5" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="font-semibold text-zinc-950">
          {title}
        </p>

        <p className="mt-1 text-sm leading-6 text-zinc-500">
          {description}
        </p>
      </div>

      <Check className="size-5 shrink-0 text-emerald-600" />
    </div>
  );
}

function RetainerOption({
  title,
  description,
  selected,
  onClick,
}: {
  title: string;
  description: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center justify-between gap-4 rounded-2xl border p-4 text-left transition ${
        selected
          ? "border-red-600 bg-red-50"
          : "border-zinc-200 hover:bg-zinc-50"
      }`}
    >
      <div>
        <p className="font-semibold text-zinc-950">
          {title}
        </p>

        <p className="mt-1 text-sm leading-6 text-zinc-500">
          {description}
        </p>
      </div>

      <span
        className={`flex size-6 shrink-0 items-center justify-center rounded-full border ${
          selected
            ? "border-red-600 bg-red-600 text-white"
            : "border-zinc-300"
        }`}
      >
        {selected ? (
          <Check className="size-4" />
        ) : null}
      </span>
    </button>
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

      <div className="mt-2">
        {children}
      </div>
    </label>
  );
}
