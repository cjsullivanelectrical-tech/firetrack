"use client";

import {
  Save,
  Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  calculateWorkedMinutes,
} from "@/lib/pay/calculations";

type Position = {
  id: string;
  label: string;
  employment_type: string;
  rank: string;
  competence: string;
};

type Entry = {
  id: string;
  entry_type: string;
  position_id: string | null;
  activity_date: string;
  start_time: string | null;
  finish_time: string | null;
  worked_minutes: number;
  incident_number: string | null;
  incident_type: string | null;
  appliance: string | null;
  mileage: number | null;
  mileage_rate: number | null;
  expense_amount: number | null;
  notes: string | null;
  title: string | null;
};

type Props = {
  entry: Entry;
  positions: Position[];
};

const types = [
  ["call", "Fire Call"],
  ["overtime", "Overtime"],
  ["drill", "Drill Night"],
  ["course", "Course"],
  ["standby", "Standby"],
  ["mileage", "Mileage"],
  ["expense", "Expense"],
  ["other", "Other"],
] as const;

export function ActivityEditor({
  entry,
  positions,
}: Props) {
  const router = useRouter();

  const supabase = useMemo(
    () => createClient(),
    [],
  );

  const [entryType, setEntryType] =
    useState(entry.entry_type);

  const [positionId, setPositionId] =
    useState(
      entry.position_id ??
        positions[0]?.id ??
        "",
    );

  const [date, setDate] = useState(
    entry.activity_date,
  );

  const [startTime, setStartTime] =
    useState(
      entry.start_time?.slice(0, 5) ?? "",
    );

  const [finishTime, setFinishTime] =
    useState(
      entry.finish_time?.slice(0, 5) ?? "",
    );

  const [manualHours, setManualHours] =
    useState(
      String(
        Math.floor(
          Number(entry.worked_minutes) /
            60,
        ),
      ),
    );

  const [manualMinutes, setManualMinutes] =
    useState(
      String(
        Number(entry.worked_minutes) %
          60,
      ),
    );

  const [useTimes, setUseTimes] =
    useState(
      Boolean(
        entry.start_time &&
          entry.finish_time,
      ),
    );

  const [
    incidentNumber,
    setIncidentNumber,
  ] = useState(
    entry.incident_number ?? "",
  );

  const [
    incidentType,
    setIncidentType,
  ] = useState(
    entry.incident_type ?? "",
  );

  const [appliance, setAppliance] =
    useState(entry.appliance ?? "");

  const [mileage, setMileage] =
    useState(
      entry.mileage === null
        ? ""
        : String(entry.mileage),
    );

  const [
    mileageRate,
    setMileageRate,
  ] = useState(
    entry.mileage_rate === null
      ? "0.45"
      : String(entry.mileage_rate),
  );

  const [
    expenseAmount,
    setExpenseAmount,
  ] = useState(
    entry.expense_amount === null
      ? ""
      : String(entry.expense_amount),
  );

  const [notes, setNotes] =
    useState(entry.notes ?? "");

  const [saving, setSaving] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const timeBased =
    entryType !== "mileage" &&
    entryType !== "expense";

  async function getRate() {
    const position =
      positions.find(
        (item) =>
          item.id === positionId,
      );

    if (!position) {
      return {
        rate: 0,
        disturbance: 0,
      };
    }

    const { data } = await supabase
      .from("national_pay_rates")
      .select(
        "basic_hourly,overtime_hourly,retained_disturbance",
      )
      .eq("rank", position.rank)
      .eq(
        "competence",
        position.competence,
      )
      .lte(
        "effective_from",
        date,
      )
      .or(
        `effective_to.is.null,effective_to.gte.${date}`,
      )
      .order("effective_from", {
        ascending: false,
      })
      .limit(1)
      .maybeSingle();

    if (!data) {
      return {
        rate: 0,
        disturbance: 0,
      };
    }

    const rate =
      entryType === "overtime"
        ? Number(
            data.overtime_hourly ?? 0,
          )
        : Number(
            data.basic_hourly ?? 0,
          );

    const disturbance =
      entryType === "call" &&
      position.employment_type ===
        "on_call"
        ? Number(
            data.retained_disturbance ??
              0,
          )
        : 0;

    return {
      rate,
      disturbance,
    };
  }

  async function saveEntry() {
    setSaving(true);
    setMessage("");

    let workedMinutes = 0;
    let calculatedPay = 0;
    let rateOfPay: number | null = null;

    if (entryType === "mileage") {
      calculatedPay =
        Number(mileage || 0) *
        Number(mileageRate || 0);
    } else if (
      entryType === "expense"
    ) {
      calculatedPay = Number(
        expenseAmount || 0,
      );
    } else {
      workedMinutes = useTimes
        ? calculateWorkedMinutes(
            startTime,
            finishTime,
          )
        : Number(
            manualHours || 0,
          ) *
            60 +
          Number(
            manualMinutes || 0,
          );

      const {
        rate,
        disturbance,
      } = await getRate();

      if (!rate) {
        setMessage(
          "FirePay could not find the pay rate for this position and date.",
        );

        setSaving(false);
        return;
      }

      rateOfPay = rate;

      calculatedPay =
        (workedMinutes / 60) *
          rate +
        disturbance;
    }

    const title =
      incidentType.trim() ||
      types.find(
        ([value]) =>
          value === entryType,
      )?.[1] ||
      "Activity";

    const { error } = await supabase
      .from("entries")
      .update({
        entry_type: entryType,
        position_id:
          positionId || null,
        activity_date: date,

        start_time:
          timeBased && useTimes
            ? startTime
            : null,

        finish_time:
          timeBased && useTimes
            ? finishTime
            : null,

        worked_minutes:
          timeBased
            ? workedMinutes
            : 0,

        rate_of_pay:
          rateOfPay,

        calculated_pay:
          Number(
            calculatedPay.toFixed(2),
          ),

        incident_number:
          entryType === "call"
            ? incidentNumber.trim() ||
              null
            : null,

        incident_type:
          entryType === "call"
            ? incidentType.trim() ||
              null
            : null,

        appliance:
          entryType === "call"
            ? appliance.trim() ||
              null
            : null,

        mileage:
          entryType === "mileage"
            ? Number(mileage || 0)
            : null,

        mileage_rate:
          entryType === "mileage"
            ? Number(
                mileageRate || 0,
              )
            : null,

        expense_amount:
          entryType === "expense"
            ? Number(
                expenseAmount || 0,
              )
            : null,

        title,
        notes:
          notes.trim() || null,
      })
      .eq("id", entry.id);

    if (error) {
      setMessage(error.message);
      setSaving(false);
      return;
    }

    router.replace(
      "/activities",
    );

    router.refresh();
  }

  async function deleteEntry() {
    const confirmed =
      window.confirm(
        "Delete this activity permanently?",
      );

    if (!confirmed) {
      return;
    }

    const { error } = await supabase
      .from("entries")
      .delete()
      .eq("id", entry.id);

    if (error) {
      setMessage(error.message);
      return;
    }

    router.replace(
      "/activities",
    );

    router.refresh();
  }

  return (
    <div className="space-y-6 rounded-[2rem] border border-zinc-200 bg-white p-5 shadow-sm sm:p-8">
      <div>
        <p className="text-sm font-semibold text-red-600">
          Edit activity
        </p>

        <h1 className="mt-1 text-3xl font-bold text-zinc-950">
          {entry.title ||
            "FirePay activity"}
        </h1>
      </div>

      <Field label="Activity type">
        <select
          value={entryType}
          onChange={(event) =>
            setEntryType(
              event.target.value,
            )
          }
          className="input"
        >
          {types.map(
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

      <Field label="Position">
        <select
          value={positionId}
          onChange={(event) =>
            setPositionId(
              event.target.value,
            )
          }
          className="input"
        >
          {positions.map(
            (position) => (
              <option
                key={position.id}
                value={position.id}
              >
                {position.label} —{" "}
                {position.employment_type ===
                "on_call"
                  ? "On-Call"
                  : "Whole-time"}
              </option>
            ),
          )}
        </select>
      </Field>

      <Field label="Date">
        <input
          type="date"
          value={date}
          onChange={(event) =>
            setDate(
              event.target.value,
            )
          }
          className="input"
        />
      </Field>

      {timeBased ? (
        <>
          <div className="grid grid-cols-2 rounded-2xl bg-zinc-100 p-1">
            <button
              type="button"
              onClick={() =>
                setUseTimes(true)
              }
              className={`rounded-xl p-3 text-sm font-semibold ${
                useTimes
                  ? "bg-white shadow-sm"
                  : "text-zinc-500"
              }`}
            >
              Start & finish
            </button>

            <button
              type="button"
              onClick={() =>
                setUseTimes(false)
              }
              className={`rounded-xl p-3 text-sm font-semibold ${
                !useTimes
                  ? "bg-white shadow-sm"
                  : "text-zinc-500"
              }`}
            >
              Hours worked
            </button>
          </div>

          {useTimes ? (
            <div className="grid grid-cols-2 gap-4">
              <Field label="Start">
                <input
                  type="time"
                  value={startTime}
                  onChange={(event) =>
                    setStartTime(
                      event.target
                        .value,
                    )
                  }
                  className="input"
                />
              </Field>

              <Field label="Finish">
                <input
                  type="time"
                  value={finishTime}
                  onChange={(event) =>
                    setFinishTime(
                      event.target
                        .value,
                    )
                  }
                  className="input"
                />
              </Field>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <Field label="Hours">
                <input
                  type="number"
                  min="0"
                  value={manualHours}
                  onChange={(event) =>
                    setManualHours(
                      event.target
                        .value,
                    )
                  }
                  className="input"
                />
              </Field>

              <Field label="Minutes">
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={manualMinutes}
                  onChange={(event) =>
                    setManualMinutes(
                      event.target
                        .value,
                    )
                  }
                  className="input"
                />
              </Field>
            </div>
          )}
        </>
      ) : null}

      {entryType === "call" ? (
        <div className="space-y-4">
          <Field label="Incident number">
            <input
              value={incidentNumber}
              onChange={(event) =>
                setIncidentNumber(
                  event.target.value,
                )
              }
              className="input"
            />
          </Field>

          <Field label="Incident type">
            <input
              value={incidentType}
              onChange={(event) =>
                setIncidentType(
                  event.target.value,
                )
              }
              className="input"
            />
          </Field>

          <Field label="Appliance">
            <input
              value={appliance}
              onChange={(event) =>
                setAppliance(
                  event.target.value,
                )
              }
              className="input"
            />
          </Field>
        </div>
      ) : null}

      {entryType === "mileage" ? (
        <div className="grid grid-cols-2 gap-4">
          <Field label="Miles">
            <input
              type="number"
              value={mileage}
              onChange={(event) =>
                setMileage(
                  event.target.value,
                )
              }
              className="input"
            />
          </Field>

          <Field label="Rate per mile">
            <input
              type="number"
              value={mileageRate}
              onChange={(event) =>
                setMileageRate(
                  event.target.value,
                )
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
            value={expenseAmount}
            onChange={(event) =>
              setExpenseAmount(
                event.target.value,
              )
            }
            className="input"
          />
        </Field>
      ) : null}

      <Field label="Notes">
        <textarea
          rows={4}
          value={notes}
          onChange={(event) =>
            setNotes(
              event.target.value,
            )
          }
          className="input py-3"
        />
      </Field>

      {message ? (
        <div className="rounded-2xl bg-red-50 p-4 text-sm font-medium text-red-700">
          {message}
        </div>
      ) : null}

      <div className="grid grid-cols-[1fr_auto] gap-3">
        <button
          type="button"
          disabled={saving}
          onClick={saveEntry}
          className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-red-600 font-semibold text-white disabled:opacity-50"
        >
          <Save className="size-5" />

          {saving
            ? "Saving..."
            : "Save changes"}
        </button>

        <button
          type="button"
          onClick={deleteEntry}
          className="flex size-12 items-center justify-center rounded-2xl border border-red-200 bg-red-50 text-red-600"
        >
          <Trash2 className="size-5" />
        </button>
      </div>
    </div>
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
