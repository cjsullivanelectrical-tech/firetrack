"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Banknote,
  CarFront,
  ChevronDown,
  Clock3,
  Flame,
  GraduationCap,
  PoundSterling,
  Radio,
  Save,
  Shapes,
  Timer,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getLondonDate } from "@/lib/date";
import {
  bankHolidayName,
  isEnglandWalesBankHoliday,
} from "@/lib/pay/bank-holidays";

const entryTypes = [
  { value: "call", label: "Call", icon: Flame },
  { value: "overtime", label: "Overtime", icon: Banknote },
  { value: "drill", label: "Drill", icon: GraduationCap },
  { value: "course", label: "Course", icon: GraduationCap },
  { value: "standby", label: "Standby", icon: Radio },
  { value: "mileage", label: "Mileage", icon: CarFront },
  { value: "expense", label: "Expense", icon: PoundSterling },
  { value: "other", label: "Other", icon: Shapes },
] as const;

type EntryType = (typeof entryTypes)[number]["value"];
type TimeEntryMode = "times" | "duration";

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
  initialType?: string;
  positions: Position[];
};

function validType(value?: string): value is EntryType {
  return entryTypes.some((type) => type.value === value);
}

function getMinutes(start: string, finish: string) {
  if (!start || !finish) return 0;

  const [sh, sm] = start.split(":").map(Number);
  const [fh, fm] = finish.split(":").map(Number);

  const startMinutes = sh * 60 + sm;
  let finishMinutes = fh * 60 + fm;

  if (finishMinutes < startMinutes) {
    finishMinutes += 1440;
  }

  return Math.max(0, finishMinutes - startMinutes);
}

export function EntryForm({ initialType, positions }: Props) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [entryType, setEntryType] = useState<EntryType>(
    validType(initialType) ? initialType : "call",
  );

  const [positionId, setPositionId] = useState(
    positions[0]?.id ?? "",
  );

  const [activityDate, setActivityDate] = useState(
    getLondonDate(),
  );

  const [timeEntryMode, setTimeEntryMode] =
    useState<TimeEntryMode>("times");

  const [startTime, setStartTime] = useState("");
  const [finishTime, setFinishTime] = useState("");

  const [durationHours, setDurationHours] = useState("0");
  const [durationMinutes, setDurationMinutes] = useState("0");

  const [incidentNumber, setIncidentNumber] = useState("");
  const [incidentType, setIncidentType] = useState("");
  const [appliance, setAppliance] = useState("");

  const [mileage, setMileage] = useState("");
  const [mileageRate, setMileageRate] = useState("0.45");
  const [expenseAmount, setExpenseAmount] = useState("");

  const [notes, setNotes] = useState("");
  const [showOptional, setShowOptional] = useState(false);

  const [generatesExtraPay, setGeneratesExtraPay] =
    useState(true);

  const [
    bankHolidayMultiplier,
    setBankHolidayMultiplier,
  ] = useState(2);

  const [basicRate, setBasicRate] = useState<number | null>(null);
  const [overtimeRate, setOvertimeRate] = useState<number | null>(null);
  const [disturbanceRate, setDisturbanceRate] =
    useState<number | null>(null);

  const [loadingRate, setLoadingRate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const selectedPosition = positions.find(
    (position) => position.id === positionId,
  );

  const timeBased =
    entryType !== "mileage" && entryType !== "expense";

  const isBankHoliday =
    isEnglandWalesBankHoliday(activityDate);

  const holidayName =
    bankHolidayName(activityDate);

  useEffect(() => {
    if (entryType === "call") {
      setGeneratesExtraPay(
        selectedPosition?.employment_type ===
          "on_call",
      );
    } else {
      setGeneratesExtraPay(true);
    }
  }, [
    entryType,
    selectedPosition?.employment_type,
  ]);

  useEffect(() => {
    async function loadPayPackage() {
      if (!selectedPosition) {
        setBankHolidayMultiplier(2);
        return;
      }

      const { data } = await supabase
        .from("position_pay_packages")
        .select("bank_holiday_multiplier")
        .eq(
          "position_id",
          selectedPosition.id,
        )
        .maybeSingle();

      setBankHolidayMultiplier(
        Number(
          data?.bank_holiday_multiplier ??
            2,
        ),
      );
    }

    loadPayPackage();
  }, [selectedPosition, supabase]);

  const workedMinutes = useMemo(() => {
    if (!timeBased) return 0;

    if (timeEntryMode === "times") {
      return getMinutes(startTime, finishTime);
    }

    const hours = Math.max(0, Number(durationHours || 0));
    const minutes = Math.max(
      0,
      Math.min(59, Number(durationMinutes || 0)),
    );

    return Math.round(hours * 60 + minutes);
  }, [
    timeBased,
    timeEntryMode,
    startTime,
    finishTime,
    durationHours,
    durationMinutes,
  ]);

  useEffect(() => {
    async function loadRate() {
      if (!selectedPosition || !activityDate || !timeBased) {
        setBasicRate(null);
        setOvertimeRate(null);
        setDisturbanceRate(null);
        return;
      }

      setLoadingRate(true);

      const { data, error } = await supabase
        .from("national_pay_rates")
        .select(
          "basic_hourly,overtime_hourly,retained_disturbance",
        )
        .eq("rank", selectedPosition.rank)
        .eq("competence", selectedPosition.competence)
        .lte("effective_from", activityDate)
        .or(
          `effective_to.is.null,effective_to.gte.${activityDate}`,
        )
        .order("effective_from", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error || !data) {
        setBasicRate(null);
        setOvertimeRate(null);
        setDisturbanceRate(null);
      } else {
        setBasicRate(Number(data.basic_hourly));

        setOvertimeRate(
          data.overtime_hourly === null
            ? null
            : Number(data.overtime_hourly),
        );

        setDisturbanceRate(
          data.retained_disturbance === null
            ? null
            : Number(data.retained_disturbance),
        );
      }

      setLoadingRate(false);
    }

    loadRate();
  }, [activityDate, selectedPosition, supabase, timeBased]);

  const rateUsed =
    entryType === "overtime" ? overtimeRate : basicRate;

  const effectiveRate =
    rateUsed === null
      ? null
      : entryType === "overtime" &&
          isBankHoliday
        ? rateUsed *
          bankHolidayMultiplier
        : rateUsed;

  const estimatedPay = useMemo(() => {
    if (entryType === "mileage") {
      return Number(mileage || 0) * Number(mileageRate || 0);
    }

    if (entryType === "expense") {
      return Number(expenseAmount || 0);
    }

    if (
      entryType === "call" &&
      !generatesExtraPay
    ) {
      return 0;
    }

    if (!effectiveRate) return 0;

    let amount =
      (workedMinutes / 60) *
      effectiveRate;

    if (
      entryType === "call" &&
      generatesExtraPay &&
      selectedPosition?.employment_type === "on_call" &&
      disturbanceRate
    ) {
      amount += disturbanceRate;
    }

    return amount;
  }, [
    entryType,
    mileage,
    mileageRate,
    expenseAmount,
    rateUsed,
    effectiveRate,
    workedMinutes,
    selectedPosition,
    disturbanceRate,
    generatesExtraPay,
  ]);

  async function saveEntry(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setErrorMessage("");

    if (!positionId && timeBased) {
      setErrorMessage(
        "Add a position before recording this activity.",
      );
      return;
    }

    if (
      timeBased &&
      timeEntryMode === "times" &&
      (!startTime || !finishTime)
    ) {
      setErrorMessage("Enter the start and finish time.");
      return;
    }

    if (timeBased && workedMinutes <= 0) {
      setErrorMessage("Enter the time or hours worked.");
      return;
    }

    if (
      timeBased &&
      !(
        entryType === "call" &&
        !generatesExtraPay
      ) &&
      !rateUsed
    ) {
      setErrorMessage(
        "FirePay could not find a national pay rate for this position and date.",
      );
      return;
    }

    setSaving(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.replace("/login");
      return;
    }

    const title =
      incidentType.trim() ||
      entryTypes.find((type) => type.value === entryType)?.label ||
      "Entry";

    const { error } = await supabase.from("entries").insert({
      user_id: user.id,
      position_id: positionId || null,

      entry_type: entryType,
      status: "recorded",
      activity_date: activityDate,

      start_time:
        timeBased && timeEntryMode === "times"
          ? startTime
          : null,

      finish_time:
        timeBased && timeEntryMode === "times"
          ? finishTime
          : null,

      break_minutes: 0,
      worked_minutes: timeBased ? workedMinutes : 0,

      rate_of_pay:
        timeBased ? effectiveRate : null,

      rate_multiplier:
        entryType === "overtime" &&
        isBankHoliday
          ? bankHolidayMultiplier
          : 1,

      calculated_pay: Number(
        estimatedPay.toFixed(2),
      ),

      generates_extra_pay:
        entryType === "call"
          ? generatesExtraPay
          : true,

      is_bank_holiday:
        isBankHoliday,

      incident_number:
        (entryType === "call" ||
          entryType === "overtime") &&
        incidentNumber.trim()
          ? incidentNumber.trim()
          : null,

      incident_type:
        (entryType === "call" ||
          entryType === "overtime") &&
        incidentType.trim()
          ? incidentType.trim()
          : null,

      appliance:
        (entryType === "call" ||
          entryType === "overtime") &&
        appliance.trim()
          ? appliance.trim()
          : null,

      mileage:
        entryType === "mileage"
          ? Number(mileage || 0)
          : null,

      mileage_rate:
        entryType === "mileage"
          ? Number(mileageRate || 0)
          : null,

      expense_amount:
        entryType === "expense"
          ? Number(expenseAmount || 0)
          : null,

      title,
      notes: notes.trim() || null,
    });

    if (error) {
      setErrorMessage(error.message);
      setSaving(false);
      return;
    }

    router.replace("/");
    router.refresh();
  }

  if (positions.length === 0) {
    return (
      <section className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-xl shadow-zinc-900/5">
        <p className="text-sm font-semibold text-red-600">
          One quick setup
        </p>

        <h1 className="mt-1 text-3xl font-bold text-zinc-950">
          Add your fire service position
        </h1>

        <p className="mt-3 text-zinc-500">
          FirePay needs your position to calculate pay automatically.
        </p>

        <Link
          href="/settings/positions"
          className="mt-6 flex h-12 items-center justify-center rounded-2xl bg-red-600 font-semibold text-white"
        >
          Add position
        </Link>
      </section>
    );
  }

  return (
    <section className="rounded-[2rem] border border-zinc-200 bg-white p-5 shadow-xl shadow-zinc-900/5 sm:p-8">
      <p className="text-sm font-semibold text-red-600">
        New entry
      </p>

      <h1 className="mt-1 text-3xl font-bold tracking-tight text-zinc-950">
        Record activity
      </h1>

      <div className="mt-7 grid grid-cols-4 gap-2 sm:grid-cols-8">
        {entryTypes.map((type) => {
          const Icon = type.icon;
          const active = type.value === entryType;

          return (
            <button
              key={type.value}
              type="button"
              onClick={() => setEntryType(type.value)}
              className={`flex min-h-20 flex-col items-center justify-center gap-2 rounded-2xl border p-2 text-xs font-semibold transition ${
                active
                  ? "border-red-600 bg-red-600 text-white"
                  : "border-zinc-200 bg-zinc-50 text-zinc-600"
              }`}
            >
              <Icon className="size-5" />
              {type.label}
            </button>
          );
        })}
      </div>

      <form onSubmit={saveEntry} className="mt-8 space-y-6">
        <Field label="Date">
          <input
            type="date"
            value={activityDate}
            onChange={(e) => setActivityDate(e.target.value)}
            className="input"
          />
        </Field>

        {positions.length > 1 ? (
          <Field label="Position">
            <select
              value={positionId}
              onChange={(e) => setPositionId(e.target.value)}
              className="input"
            >
              {positions.map((position) => (
                <option
                  key={position.id}
                  value={position.id}
                >
                  {position.label}
                </option>
              ))}
            </select>
          </Field>
        ) : null}

        {timeBased ? (
          <div>
            <p className="text-sm font-semibold text-zinc-800">
              Time worked
            </p>

            <div className="mt-2 grid grid-cols-2 rounded-2xl bg-zinc-100 p-1">
              <button
                type="button"
                onClick={() => setTimeEntryMode("times")}
                className={`flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-semibold transition ${
                  timeEntryMode === "times"
                    ? "bg-white text-zinc-950 shadow-sm"
                    : "text-zinc-500"
                }`}
              >
                <Clock3 className="size-4" />
                Start & finish
              </button>

              <button
                type="button"
                onClick={() => setTimeEntryMode("duration")}
                className={`flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-semibold transition ${
                  timeEntryMode === "duration"
                    ? "bg-white text-zinc-950 shadow-sm"
                    : "text-zinc-500"
                }`}
              >
                <Timer className="size-4" />
                Hours worked
              </button>
            </div>
          </div>
        ) : null}

        {timeBased && timeEntryMode === "times" ? (
          <div className="grid grid-cols-2 gap-4">
            <Field label="Start">
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="input"
              />
            </Field>

            <Field label="Finish">
              <input
                type="time"
                value={finishTime}
                onChange={(e) => setFinishTime(e.target.value)}
                className="input"
              />
            </Field>
          </div>
        ) : null}

        {timeBased && timeEntryMode === "duration" ? (
          <div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Hours">
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={durationHours}
                  onChange={(e) =>
                    setDurationHours(e.target.value)
                  }
                  className="input"
                />
              </Field>

              <Field label="Minutes">
                <input
                  type="number"
                  min="0"
                  max="59"
                  step="1"
                  value={durationMinutes}
                  onChange={(e) =>
                    setDurationMinutes(e.target.value)
                  }
                  className="input"
                />
              </Field>
            </div>

            <div className="mt-3 grid grid-cols-4 gap-2">
              {[1, 2, 3, 4].map((hours) => (
                <button
                  key={hours}
                  type="button"
                  onClick={() => {
                    setDurationHours(String(hours));
                    setDurationMinutes("0");
                  }}
                  className="rounded-xl bg-zinc-100 px-2 py-2 text-sm font-semibold text-zinc-600 hover:bg-zinc-200"
                >
                  {hours} hr
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {entryType === "mileage" ? (
          <div className="grid grid-cols-2 gap-4">
            <Field label="Miles">
              <input
                type="number"
                min="0"
                step="0.1"
                value={mileage}
                onChange={(e) => setMileage(e.target.value)}
                className="input"
              />
            </Field>

            <Field label="Rate per mile">
              <input
                type="number"
                min="0"
                step="0.01"
                value={mileageRate}
                onChange={(e) =>
                  setMileageRate(e.target.value)
                }
                className="input"
              />
            </Field>
          </div>
        ) : null}

        {entryType === "expense" ? (
          <Field label="Expense amount">
            <input
              type="number"
              min="0"
              step="0.01"
              value={expenseAmount}
              onChange={(e) =>
                setExpenseAmount(e.target.value)
              }
              className="input"
            />
          </Field>
        ) : null}

        {entryType === "call" ? (
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
            <p className="font-semibold text-zinc-900">
              Did this call generate extra pay?
            </p>

            <p className="mt-1 text-sm text-zinc-500">
              Choose No if you attended while already being paid on a scheduled shift.
            </p>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() =>
                  setGeneratesExtraPay(true)
                }
                className={`rounded-xl px-3 py-3 text-sm font-semibold ${
                  generatesExtraPay
                    ? "bg-red-600 text-white"
                    : "bg-white text-zinc-600"
                }`}
              >
                Yes — extra pay
              </button>

              <button
                type="button"
                onClick={() =>
                  setGeneratesExtraPay(false)
                }
                className={`rounded-xl px-3 py-3 text-sm font-semibold ${
                  !generatesExtraPay
                    ? "bg-zinc-950 text-white"
                    : "bg-white text-zinc-600"
                }`}
              >
                No — already paid
              </button>
            </div>
          </div>
        ) : null}

        {entryType === "call" ||
        entryType === "overtime" ? (
          <div>
            <button
              type="button"
              onClick={() =>
                setShowOptional((current) => !current)
              }
              className="flex w-full items-center justify-between rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-4 text-sm font-semibold text-zinc-700"
            >
              Add incident details
              <ChevronDown
                className={`size-5 transition ${
                  showOptional ? "rotate-180" : ""
                }`}
              />
            </button>

            {showOptional ? (
              <div className="mt-4 space-y-4">
                <Field label="Incident number">
                  <input
                    value={incidentNumber}
                    onChange={(e) =>
                      setIncidentNumber(e.target.value)
                    }
                    className="input"
                  />
                </Field>

                <Field label="Incident type">
                  <input
                    value={incidentType}
                    onChange={(e) =>
                      setIncidentType(e.target.value)
                    }
                    className="input"
                  />
                </Field>

                <Field label="Appliance">
                  <input
                    value={appliance}
                    onChange={(e) =>
                      setAppliance(e.target.value)
                    }
                    className="input"
                  />
                </Field>

                <Field label="Notes">
                  <textarea
                    rows={3}
                    value={notes}
                    onChange={(e) =>
                      setNotes(e.target.value)
                    }
                    className="input py-3"
                  />
                </Field>
              </div>
            ) : null}
          </div>
        ) : (
          <Field label="Notes (optional)">
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="input py-3"
            />
          </Field>
        )}

        {errorMessage ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
            {errorMessage}
          </div>
        ) : null}

        {isBankHoliday ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <p className="font-semibold text-amber-900">
              Bank holiday detected
            </p>

            <p className="mt-1 text-sm text-amber-700">
              {holidayName}
              {entryType === "overtime"
                ? ` • ${bankHolidayMultiplier.toFixed(
                    2,
                  )}× overtime multiplier`
                : ""}
            </p>
          </div>
        ) : null}

        <div className="rounded-[1.5rem] bg-zinc-950 p-5 text-white">
          <p className="text-sm text-zinc-400">
            Estimated earnings
          </p>

          <p className="mt-1 text-3xl font-bold">
            {loadingRate
              ? "..."
              : `£${estimatedPay.toFixed(2)}`}
          </p>

          {timeBased ? (
            <p className="mt-2 text-sm text-zinc-400">
              {Math.floor(workedMinutes / 60)}h{" "}
              {workedMinutes % 60}m
              {effectiveRate
                ? ` • £${effectiveRate.toFixed(
                    2,
                  )}/hr`
                : ""}
              {entryType === "call" &&
              selectedPosition?.employment_type ===
                "on_call" &&
              disturbanceRate
                ? ` • + £${disturbanceRate.toFixed(
                    2,
                  )} disturbance`
                : ""}
            </p>
          ) : null}
        </div>

        <button
          type="submit"
          disabled={saving}
          className="flex h-13 w-full items-center justify-center gap-2 rounded-2xl bg-red-600 font-semibold text-white disabled:opacity-50"
        >
          <Save className="size-5" />

          {saving
            ? "Saving..."
            : `Save ${
                entryTypes.find(
                  (type) => type.value === entryType,
                )?.label ?? "entry"
              }`}
        </button>
      </form>
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
    <label className="block">
      <span className="text-sm font-semibold text-zinc-800">
        {label}
      </span>
      <div className="mt-2">{children}</div>
    </label>
  );
}
