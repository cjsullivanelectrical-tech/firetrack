import Link from "next/link";
import {
  Banknote,
  CalendarDays,
  CarFront,
  Flame,
  GraduationCap,
  HeartPulse,
  Plus,
  Radio,
} from "lucide-react";

const actions = [
  {
    label: "Call",
    icon: Flame,
    href: "/entries/new?type=call",
  },
  {
    label: "Overtime",
    icon: Banknote,
    href: "/entries/new?type=overtime",
  },
  {
    label: "Drill",
    icon: GraduationCap,
    href: "/entries/new?type=drill",
  },
  {
    label: "Standby",
    icon: Radio,
    href: "/entries/new?type=standby",
  },
  {
    label: "Leave",
    icon: CalendarDays,
    href: "/leave",
  },
  {
    label: "Sick",
    icon: HeartPulse,
    href: "/leave",
  },
  {
    label: "Mileage",
    icon: CarFront,
    href: "/entries/new?type=mileage",
  },
  {
    label: "Other",
    icon: Plus,
    href: "/entries/new?type=other",
  },
];

export function QuickActions() {
  return (
    <section>
      <div className="mb-4">
        <h2 className="text-lg font-bold tracking-tight text-zinc-950">
          Add activity
        </h2>

        <p className="mt-1 text-sm text-zinc-500">
          Record work, leave, sickness or anything else from your day
        </p>
      </div>

      <div className="grid grid-cols-4 gap-3 sm:grid-cols-8">
        {actions.map(
          (action) => {
            const Icon =
              action.icon;

            return (
              <Link
                key={action.label}
                href={action.href}
                className="group flex min-h-24 flex-col items-center justify-center gap-2 rounded-[1.5rem] border border-zinc-200 bg-white p-3 text-center text-xs font-semibold text-zinc-700 shadow-sm transition hover:-translate-y-0.5 hover:border-red-200 hover:text-red-600 hover:shadow-md sm:text-sm"
              >
                <span className="flex size-10 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-700 transition group-hover:bg-red-50 group-hover:text-red-600">
                  <Icon className="size-5" />
                </span>

                {action.label}
              </Link>
            );
          },
        )}
      </div>
    </section>
  );
}
