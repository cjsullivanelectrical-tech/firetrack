import Link from "next/link";
import {
  ArrowLeft,
  Banknote,
  CalendarDays,
  CarFront,
  ChevronRight,
  Clock3,
  Flame,
  GraduationCap,
  HeartPulse,
  PoundSterling,
  Radio,
  Shapes,
} from "lucide-react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const icons = {
  call: Flame,
  overtime: Banknote,
  drill: GraduationCap,
  course: GraduationCap,
  standby: Radio,
  annual_leave: CalendarDays,
  sick_leave: HeartPulse,
  mileage: CarFront,
  expense: PoundSterling,
  other: Shapes,
};

function titleForType(type: string) {
  if (type === "call") return "Fire Call";
  if (type === "drill") return "Drill Night";
  if (type === "annual_leave") return "Annual Leave";
  if (type === "sick_leave") return "Sick Leave";

  return (
    type.charAt(0).toUpperCase() +
    type.slice(1)
  );
}

function workedTime(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  return `${hours}h ${mins}m`;
}

export default async function ActivitiesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: entries } = await supabase
    .from("entries")
    .select(`
      id,
      entry_type,
      title,
      activity_date,
      start_time,
      finish_time,
      worked_minutes,
      calculated_pay,
      incident_number,
      position_id,
      positions (
        label,
        employment_type
      )
    `)
    .eq("user_id", user.id)
    .order("activity_date", {
      ascending: false,
    })
    .order("created_at", {
      ascending: false,
    })
    .limit(250);

  return (
    <main className="min-h-screen bg-zinc-100 px-4 py-6 sm:py-10">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-600"
        >
          <ArrowLeft className="size-4" />
          Dashboard
        </Link>

        <div className="mt-6">
          <p className="text-sm font-semibold text-red-600">
            FirePay
          </p>

          <h1 className="mt-1 text-3xl font-bold tracking-tight text-zinc-950">
            Activity history
          </h1>

          <p className="mt-2 text-sm text-zinc-500">
            Review and change anything you have recorded.
          </p>
        </div>

        <div className="mt-8 overflow-hidden rounded-[2rem] border border-zinc-200 bg-white shadow-sm">
          {(entries ?? []).length === 0 ? (
            <div className="p-10 text-center">
              <p className="font-semibold text-zinc-900">
                Nothing recorded yet
              </p>

              <Link
                href="/entries/new"
                className="mt-4 inline-flex rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white"
              >
                Add activity
              </Link>
            </div>
          ) : (
            entries?.map((entry, index) => {
              const Icon =
                icons[
                  entry.entry_type as keyof typeof icons
                ] ?? Shapes;

              const position = Array.isArray(
                entry.positions,
              )
                ? entry.positions[0]
                : entry.positions;

              return (
                <Link
                  key={entry.id}
                  href={`/activities/${entry.id}/edit`}
                  className={`flex items-center gap-4 p-4 transition hover:bg-zinc-50 ${
                    index !==
                    entries.length - 1
                      ? "border-b border-zinc-100"
                      : ""
                  }`}
                >
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-red-600">
                    <Icon className="size-5" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold text-zinc-950">
                      {entry.title ||
                        titleForType(
                          entry.entry_type,
                        )}
                    </p>

                    <p className="mt-1 text-sm text-zinc-500">
                      {new Intl.DateTimeFormat(
                        "en-GB",
                        {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          timeZone:
                            "Europe/London",
                        },
                      ).format(
                        new Date(
                          `${entry.activity_date}T12:00:00Z`,
                        ),
                      )}
                    </p>

                    {position ? (
                      <p className="mt-1 text-xs font-semibold text-zinc-400">
                        {position.label}
                        {" • "}
                        {position.employment_type ===
                        "on_call"
                          ? "On-Call"
                          : "Whole-time"}
                      </p>
                    ) : null}

                    {entry.worked_minutes >
                    0 ? (
                      <div className="mt-2 flex items-center gap-1 text-xs text-zinc-400">
                        <Clock3 className="size-3.5" />

                        {entry.start_time &&
                        entry.finish_time
                          ? `${entry.start_time.slice(
                              0,
                              5,
                            )}–${entry.finish_time.slice(
                              0,
                              5,
                            )}`
                          : workedTime(
                              entry.worked_minutes,
                            )}
                      </div>
                    ) : null}
                  </div>

                  <div className="text-right">
                    <p className="font-bold text-zinc-950">
                      £
                      {Number(
                        entry.calculated_pay,
                      ).toFixed(2)}
                    </p>

                    <ChevronRight className="ml-auto mt-2 size-4 text-zinc-300" />
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </div>
    </main>
  );
}
