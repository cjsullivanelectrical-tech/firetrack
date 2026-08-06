import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type StatCardProps = {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  variant?: "default" | "primary" | "success";
};

const variants = {
  default: {
    card: "bg-white text-zinc-950",
    icon: "bg-zinc-100 text-zinc-700",
    subtitle: "text-zinc-500",
  },
  primary: {
    card: "bg-red-600 text-white",
    icon: "bg-white/15 text-white",
    subtitle: "text-red-100",
  },
  success: {
    card: "bg-zinc-950 text-white",
    icon: "bg-white/10 text-emerald-400",
    subtitle: "text-zinc-400",
  },
};

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = "default",
}: StatCardProps) {
  const styles = variants[variant];

  return (
    <article
      className={cn(
        "min-w-0 rounded-[1.75rem] border border-black/5 p-4 shadow-sm",
        styles.card,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p
            className={cn(
              "text-xs font-semibold uppercase tracking-[0.12em]",
              styles.subtitle,
            )}
          >
            {title}
          </p>

          <p className="mt-3 truncate text-2xl font-bold tracking-tight">
            {value}
          </p>

          {subtitle ? (
            <p className={cn("mt-1 text-sm", styles.subtitle)}>{subtitle}</p>
          ) : null}
        </div>

        <div
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-2xl",
            styles.icon,
          )}
        >
          <Icon aria-hidden="true" className="size-5" />
        </div>
      </div>
    </article>
  );
}