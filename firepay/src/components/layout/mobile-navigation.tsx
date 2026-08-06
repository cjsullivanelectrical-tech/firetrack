import {
  CalendarDays,
  ChartNoAxesCombined,
  CircleUserRound,
  House,
  Plus,
} from "lucide-react";

const navigationItems = [
  { label: "Home", icon: House, active: true },
  { label: "Calendar", icon: CalendarDays, active: false },
  { label: "Add", icon: Plus, active: false, prominent: true },
  { label: "Reports", icon: ChartNoAxesCombined, active: false },
  { label: "Profile", icon: CircleUserRound, active: false },
];

export function MobileNavigation() {
  return (
    <nav
      aria-label="Primary navigation"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-zinc-200/80 bg-white/90 pb-[max(env(safe-area-inset-bottom),0.5rem)] backdrop-blur-xl lg:hidden"
    >
      <div className="mx-auto grid max-w-lg grid-cols-5 px-2 pt-2">
        {navigationItems.map((item) => {
          const Icon = item.icon;

          if (item.prominent) {
            return (
              <button
                key={item.label}
                type="button"
                className="flex flex-col items-center gap-1 text-xs font-medium text-zinc-500"
              >
                <span className="-mt-7 flex size-14 items-center justify-center rounded-full border-4 border-zinc-100 bg-red-600 text-white shadow-lg">
                  <Icon className="size-6" />
                </span>

                <span>{item.label}</span>
              </button>
            );
          }

          return (
            <button
              key={item.label}
              type="button"
              className={`flex min-h-14 flex-col items-center justify-center gap-1 text-xs font-medium ${
                item.active ? "text-red-600" : "text-zinc-500"
              }`}
            >
              <Icon className="size-5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}