import Link from "next/link";
import {
  Banknote,
  CarFront,
  ChevronRight,
  Clock3,
  Flame,
  GraduationCap,
  PoundSterling,
  Radio,
  Shapes,
} from "lucide-react";

type Activity = {
  id: string;
  entry_type: string;
  title: string | null;
  activity_date: string;
  start_time: string | null;
  finish_time: string | null;
  worked_minutes: number;
  calculated_pay: number;
  incident_number: string | null;
};

type Props = {
  activities: Activity[];
};

const icons = {
  call: Flame,
  overtime: Banknote,
  drill: GraduationCap,
  course: GraduationCap,
  standby: Radio,
  mileage: CarFront,
  expense: PoundSterling,
  other: Shapes,
};

function typeName(type: string) {
  if (type === "call") return "Fire Call";
  if (type === "drill") return "Drill Night";

  return (
    type.charAt(0).toUpperCase() +
    type.slice(1)
  );
}

function formatDuration(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  return `${hours}h ${mins}m`;
}

export function RecentActivity({
  activities,
}: Props) {
  return (
    <section>
      <div className="mb-4 flex items-end justify-between">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-zinc-950">
            Recent activity
          </h2>

          <p className="mt-1 text-sm text-zinc-500">
            Tap anything to edit it
          </p>
        </div>

        <Link
          href="/activities"
          className="text-sm font-semibold text-red-600"
        >
          See all
        </Link>
      </div>

      <div className="overflow-hidden rounded-[1.75rem] border border-zinc-200 bg-white shadow-sm">
        {activities.length === 0 ? (
          <div className="p-8 text-center">
            <p className="font-semibold text-zinc-900">
              Nothing recorded yet
            </p>

            <p className="mt-1 text-sm text-zinc-500">
              Add your first activity.
            </p>
          </div>
        ) : (
          activities.map((activity, index) => {
            const Icon =
              icons[
                activity.entry_type as keyof typeof icons
              ] ?? Shapes;

            return (
              <Link
                key={activity.id}
                href={`/activities/${activity.id}/edit`}
                className={`group flex items-center gap-4 p-4 transition hover:bg-zinc-50 ${
                  index !== activities.length - 1
                    ? "border-b border-zinc-100"
                    : ""
                }`}
              >
                <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-red-600">
                  <Icon className="size-5" />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-zinc-950">
                    {activity.title ||
                      typeName(activity.entry_type)}
                  </p>

                  <p className="mt-0.5 text-sm text-zinc-500">
                    {new Intl.DateTimeFormat(
                      "en-GB",
                      {
                        day: "numeric",
                        month: "short",
                        timeZone:
                          "Europe/London",
                      },
                    ).format(
                      new Date(
                        `${activity.activity_date}T12:00:00Z`,
                      ),
                    )}

                    {activity.incident_number
                      ? ` • ${activity.incident_number}`
                      : ""}
                  </p>

                  {activity.worked_minutes > 0 ? (
                    <div className="mt-1.5 flex items-center gap-1 text-xs text-zinc-400">
                      <Clock3 className="size-3.5" />

                      {activity.start_time &&
                      activity.finish_time
                        ? `${activity.start_time.slice(
                            0,
                            5,
                          )}–${activity.finish_time.slice(
                            0,
                            5,
                          )}`
                        : formatDuration(
                            activity.worked_minutes,
                          )}
                    </div>
                  ) : null}
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <p className="font-bold text-zinc-950">
                    £
                    {Number(
                      activity.calculated_pay,
                    ).toFixed(2)}
                  </p>

                  <ChevronRight className="size-4 text-zinc-300 transition group-hover:translate-x-0.5" />
                </div>
              </Link>
            );
          })
        )}
      </div>
    </section>
  );
}
