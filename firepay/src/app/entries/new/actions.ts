"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const validTypes = [
  "call",
  "overtime",
  "drill",
  "course",
  "standby",
  "mileage",
  "expense",
  "other",
] as const;

function calculateMinutes(
  startTime: string,
  finishTime: string,
  breakMinutes: number,
) {
  const [startHour, startMinute] = startTime.split(":").map(Number);
  const [finishHour, finishMinute] = finishTime.split(":").map(Number);

  const start = startHour * 60 + startMinute;
  let finish = finishHour * 60 + finishMinute;

  if (finish < start) {
    finish += 24 * 60;
  }

  return Math.max(0, finish - start - breakMinutes);
}

export async function createEntry(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const entryType = String(formData.get("entry_type") ?? "");

  if (!validTypes.includes(entryType as (typeof validTypes)[number])) {
    redirect("/entries/new?error=missing-fields");
  }

  const activityDate = String(formData.get("activity_date") ?? "");

  if (!activityDate) {
    redirect(`/entries/new?type=${entryType}&error=missing-fields`);
  }

  const startTime = String(formData.get("start_time") ?? "");
  const finishTime = String(formData.get("finish_time") ?? "");

  const breakMinutes = Math.max(
    0,
    Number(formData.get("break_minutes") ?? 0),
  );

  const rateOfPay = Math.max(
    0,
    Number(formData.get("rate_of_pay") ?? 0),
  );

  const multiplier = Math.max(
    0,
    Number(formData.get("rate_multiplier") ?? 1),
  );

  const mileage = Math.max(
    0,
    Number(formData.get("mileage") ?? 0),
  );

  const mileageRate = Math.max(
    0,
    Number(formData.get("mileage_rate") ?? 0),
  );

  const expenseAmount = Math.max(
    0,
    Number(formData.get("expense_amount") ?? 0),
  );

  let workedMinutes = 0;
  let calculatedPay = 0;

  if (entryType === "mileage") {
    calculatedPay = mileage * mileageRate;
  } else if (entryType === "expense") {
    calculatedPay = expenseAmount;
  } else {
    if (!startTime || !finishTime) {
      redirect(`/entries/new?type=${entryType}&error=invalid-times`);
    }

    workedMinutes = calculateMinutes(
      startTime,
      finishTime,
      breakMinutes,
    );

    calculatedPay =
      (workedMinutes / 60) * rateOfPay * multiplier;
  }

  const incidentType = String(
    formData.get("incident_type") ?? "",
  ).trim();

  const title =
    String(formData.get("title") ?? "").trim() ||
    incidentType ||
    entryType.charAt(0).toUpperCase() + entryType.slice(1);

  const { error } = await supabase.from("entries").insert({
    user_id: user.id,
    entry_type: entryType,
    status: "recorded",
    activity_date: activityDate,
    start_time: startTime || null,
    finish_time: finishTime || null,
    break_minutes: breakMinutes,
    worked_minutes: workedMinutes,
    rate_of_pay:
      entryType === "mileage" || entryType === "expense"
        ? null
        : rateOfPay,
    rate_multiplier: multiplier,
    calculated_pay: Number(calculatedPay.toFixed(2)),
    incident_number:
      String(formData.get("incident_number") ?? "").trim() || null,
    incident_type: incidentType || null,
    appliance:
      String(formData.get("appliance") ?? "").trim() || null,
    mileage: entryType === "mileage" ? mileage : null,
    mileage_rate: entryType === "mileage" ? mileageRate : null,
    expense_amount:
      entryType === "expense" ? expenseAmount : null,
    title,
    notes:
      String(formData.get("notes") ?? "").trim() || null,
  });

  if (error) {
    console.error(error);
    redirect(`/entries/new?type=${entryType}&error=save-failed`);
  }

  redirect("/");
}
