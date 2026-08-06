import {
  Banknote,
  CarFront,
  Flame,
  GraduationCap,
  Plus,
  Radio,
} from "lucide-react";

const actions = [
  { label: "Call", icon: Flame },
  { label: "Overtime", icon: Banknote },
  { label: "Drill", icon: GraduationCap },
  { label: "Standby", icon: Radio },
  { label: "Mileage", icon: CarFront },
  { label: "Other", icon: Plus },
];

export function QuickActions() {
  return (
    <section>
      <div className="mb-4">
        <h2 className="text-lg font-bold tracking-tight text-zinc-950">
          Add activity
        </h2>

        <p className="mt-1 text-sm text-zinc-500">
          Record something you should be paid for
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
        {actions.map((action) => {
          const Icon = action.icon;

          return (
            <button
              key={action.label}
              type="button"
              className="group flex min-h-24 flex-col items-center justify-center gap-2 rounded-[1.5rem] border border-zinc-200 bg-white p-3 text-sm font-semibold text-zinc-700 shadow-sm transition hover:-translate-y-0.5 hover:border-red-200 hover:text-red-600 hover:shadow-md"
            >
              <span className="flex size-10 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-700 transition group-hover:bg-red-50 group-hover:text-red-600">
                <Icon aria-hidden="true" className="size-5" />
              </span>

              {action.label}
            </button>
          );
        })}
      </div>
    </section>
  );
}