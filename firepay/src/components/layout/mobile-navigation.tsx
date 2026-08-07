import Link from "next/link";
import {
  CalendarDays,
  ChartNoAxesCombined,
  CircleUserRound,
  House,
  Plus,
} from "lucide-react";

const navigationItems = [
  {
    label: "Home",
    icon: House,
    href: "/",
  },
  {
    label: "Calendar",
    icon: CalendarDays,
    href: "/calendar",
  },
  {
    label: "Add",
    icon: Plus,
    href: "/entries/new",
    prominent: true,
  },
  {
    label: "Earnings",
    icon: ChartNoAxesCombined,
    href: "/reports",
  },
  {
    label: "Profile",
    icon: CircleUserRound,
    href: "/settings/profile",
  },
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
              <Link
                key={item.label}
                href={item.href}
                className="flex flex-col items-center gap-1 text-xs font-medium text-zinc-500"
              >
                <span className="-mt-7 flex size-14 items-center justify-center rounded-full border-4 border-zinc-100 bg-red-600 text-white shadow-lg">
                  <Icon className="size-6" />
                </span>

                <span>{item.label}</span>
              </Link>
            );
          }

          return (
            <Link
              key={item.label}
              href={item.href}
              className="flex min-h-14 flex-col items-center justify-center gap-1 text-xs font-medium text-zinc-500"
            >
              <Icon className="size-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
