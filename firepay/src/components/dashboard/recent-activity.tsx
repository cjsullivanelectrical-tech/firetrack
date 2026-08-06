import { Clock3, Flame, GraduationCap, Radio } from "lucide-react";

const activities = [
  {
    id: 1,
    title: "Shed fire",
    meta: "Battle • Incident 10428",
    time: "14:32–16:18",
    amount: "£42.65",
    icon: Flame,
  },
  {
    id: 2,
    title: "Drill night",
    meta: "Battle Fire Station",
    time: "19:00–21:00",
    amount: "£31.20",
    icon: GraduationCap,
  },
  {
    id: 3,
    title: "Standby",
    meta: "The Ridge Fire Station",
    time: "10:00–14:00",
    amount: "£62.40",
    icon: Radio,
  },
];

export function RecentActivity() {
  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-zinc-950">
            Recent activity
          </h2>

          <p className="mt-1 text-sm text-zinc-500">
            Your latest paid activities
          </p>
        </div>

        <button
          type="button"
          className="text-sm font-semibold text-red-600 hover:text-red-700"
        >
          View all
        </button>
      </div>

      <div className="overflow-hidden rounded-[1.75rem] border border-zinc-200 bg-white shadow-sm">
        {activities.map((activity, index) => {
          const Icon = activity.icon;

          return (
            <article
              key={activity.id}
              className={`flex items-center gap-4 p-4 ${
                index !== activities.length - 1
                  ? "border-b border-zinc-100"
                  : ""
              }`}
            >
              <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-red-600">
                <Icon aria-hidden="true" className="size-5" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-zinc-950">
                  {activity.title}
                </p>

                <p className="mt-0.5 truncate text-sm text-zinc-500">
                  {activity.meta}
                </p>

                <div className="mt-2 flex items-center gap-1.5 text-xs font-medium text-zinc-400">
                  <Clock3 aria-hidden="true" className="size-3.5" />
                  {activity.time}
                </div>
              </div>

              <p className="shrink-0 font-bold text-zinc-950">
                {activity.amount}
              </p>
            </article>
          );
        })}
      </div>
    </section>
  );
}