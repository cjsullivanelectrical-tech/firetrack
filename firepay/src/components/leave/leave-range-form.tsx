"use client";

import { useMemo, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  HeartPulse,
  Loader2,
} from "lucide-react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";
import { getLondonDate } from "@/lib/date";

type Position = {
  id: string;
  label: string;
  employment_type: string;
};

type Props = {
  userId: string;
  positions: Position[];
};

type LeaveType =
  | "annual_leave"
  | "sick_leave";

function datesBetween(
  start: string,
  end: string,
) {
  if (!start || !end) {
    return [];
  }

  const first = new Date(
    `${start}T12:00:00Z`,
  );

  const last = new Date(
    `${end}T12:00:00Z`,
  );

  if (
    Number.isNaN(first.getTime()) ||
    Number.isNaN(last.getTime()) ||
    first > last
  ) {
    return [];
  }

  const result: string[] = [];

  const current =
    new Date(first);

  while (current <= last) {
    result.push(
      current
        .toISOString()
        .slice(0, 10),
    );

    current.setUTCDate(
      current.getUTCDate() + 1,
    );
  }

  return result;
}

export function LeaveRangeForm({
  userId,
  positions,
}: Props) {
  const supabase =
    createClient();

  const router =
    useRouter();

  const [type, setType] =
    useState<LeaveType>(
      "annual_leave",
    );

  const [positionId, setPositionId] =
    useState(
      positions[0]?.id ?? "",
    );

  const [startDate, setStartDate] =
    useState(getLondonDate());

  const [endDate, setEndDate] =
    useState(getLondonDate());

  const [notes, setNotes] =
    useState("");

  const [saving, setSaving] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [success, setSuccess] =
    useState(false);

  const dates = useMemo(
    () =>
      datesBetween(
        startDate,
        endDate,
      ),
    [startDate, endDate],
  );

  async function saveRange() {
    setMessage("");
    setSuccess(false);

    if (!positionId) {
      setMessage(
        "Choose the role this relates to.",
      );
      return;
    }

    if (!dates.length) {
      setMessage(
        "Check your start and finish dates.",
      );
      return;
    }

    setSaving(true);

    /*
     * Remove an existing matching status first.
     * This prevents duplicates if somebody
     * accidentally saves the same leave twice.
     */
    const { error: deleteError } =
      await supabase
        .from("entries")
        .delete()
        .eq("user_id", userId)
        .eq(
          "position_id",
          positionId,
        )
        .eq("entry_type", type)
        .gte(
          "activity_date",
          startDate,
        )
        .lte(
          "activity_date",
          endDate,
        );

    if (deleteError) {
      setMessage(
        deleteError.message,
      );
      setSaving(false);
      return;
    }

    const rows = dates.map(
      (date) => ({
        user_id: userId,

        position_id:
          positionId,

        entry_type: type,

        activity_date:
          date,

        title:
          type ===
          "annual_leave"
            ? "Annual Leave"
            : "Sick Leave",

        notes:
          notes.trim() || null,

        worked_minutes: 0,

        calculated_pay: 0,

        generates_extra_pay:
          false,

        is_bank_holiday:
          false,
      }),
    );

    const { error } =
      await supabase
        .from("entries")
        .insert(rows);

    if (error) {
      setMessage(error.message);
      setSaving(false);
      return;
    }

    setSuccess(true);

    setMessage(
      type === "annual_leave"
        ? `Annual leave added from ${startDate} to ${endDate}.`
        : `Sick leave added from ${startDate} to ${endDate}.`,
    );

    setSaving(false);

    router.refresh();

    window.setTimeout(() => {
      router.push(
        `/calendar?year=${startDate.slice(
          0,
          4,
        )}&month=${Number(
          startDate.slice(5, 7),
        )}`,
      );
    }, 800);
  }

  return (
    <div className="space-y-5">
      <section className="rounded-[2rem] border border-zinc-200 bg-white p-5 shadow-sm sm:p-7">
        <p className="text-sm font-semibold text-zinc-500">
          Type
        </p>

        <div className="mt-3 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() =>
              setType(
                "annual_leave",
              )
            }
            className={`rounded-2xl border p-4 text-left transition ${
              type ===
              "annual_leave"
                ? "border-violet-300 bg-violet-50 text-violet-800"
                : "border-zinc-200 bg-white text-zinc-700"
            }`}
          >
            <CalendarDays className="size-5" />

            <p className="mt-3 font-bold">
              Annual Leave
            </p>
          </button>

          <button
            type="button"
            onClick={() =>
              setType(
                "sick_leave",
              )
            }
            className={`rounded-2xl border p-4 text-left transition ${
              type ===
              "sick_leave"
                ? "border-rose-300 bg-rose-50 text-rose-800"
                : "border-zinc-200 bg-white text-zinc-700"
            }`}
          >
            <HeartPulse className="size-5" />

            <p className="mt-3 font-bold">
              Sick Leave
            </p>
          </button>
        </div>

        <label className="mt-6 block">
          <span className="text-sm font-semibold text-zinc-800">
            Role / contract
          </span>

          <select
            value={positionId}
            onChange={(event) =>
              setPositionId(
                event.target.value,
              )
            }
            className="input mt-2"
          >
            {positions.map(
              (position) => (
                <option
                  key={
                    position.id
                  }
                  value={
                    position.id
                  }
                >
                  {
                    position.label
                  }
                </option>
              ),
            )}
          </select>
        </label>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label>
            <span className="text-sm font-semibold text-zinc-800">
              Start date
            </span>

            <input
              type="date"
              value={startDate}
              onChange={(
                event,
              ) => {
                const value =
                  event.target
                    .value;

                setStartDate(
                  value,
                );

                if (
                  endDate <
                  value
                ) {
                  setEndDate(
                    value,
                  );
                }
              }}
              className="input mt-2"
            />
          </label>

          <label>
            <span className="text-sm font-semibold text-zinc-800">
              Finish date
            </span>

            <input
              type="date"
              min={startDate}
              value={endDate}
              onChange={(event) =>
                setEndDate(
                  event.target.value,
                )
              }
              className="input mt-2"
            />
          </label>
        </div>

        <div className="mt-5 rounded-2xl bg-zinc-50 p-4">
          <p className="text-sm font-semibold text-zinc-800">
            {dates.length}{" "}
            {dates.length === 1
              ? "calendar day"
              : "calendar days"}
          </p>

          <p className="mt-1 text-xs leading-5 text-zinc-500">
            FirePay will mark the whole period. Your existing rota remains underneath so scheduled/base pay is not counted again as extra earnings.
          </p>
        </div>

        <label className="mt-5 block">
          <span className="text-sm font-semibold text-zinc-800">
            Notes
          </span>

          <span className="ml-2 text-xs text-zinc-400">
            Optional
          </span>

          <textarea
            rows={3}
            value={notes}
            onChange={(event) =>
              setNotes(
                event.target.value,
              )
            }
            placeholder={
              type ===
              "annual_leave"
                ? "Holiday, booked leave..."
                : "Optional sickness note..."
            }
            className="input mt-2 py-3"
          />
        </label>
      </section>

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
        type="button"
        onClick={saveRange}
        disabled={
          saving ||
          !dates.length
        }
        className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-red-600 font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
      >
        {saving ? (
          <>
            <Loader2 className="size-5 animate-spin" />
            Saving...
          </>
        ) : (
          <>
            <CalendarDays className="size-5" />

            {type ===
            "annual_leave"
              ? "Add annual leave"
              : "Add sick leave"}
          </>
        )}
      </button>
    </div>
  );
}
