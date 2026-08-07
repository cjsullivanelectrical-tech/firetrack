"use client";

import { useMemo, useState } from "react";
import {
  Building2,
  Check,
} from "lucide-react";

import { UK_FIRE_SERVICES } from "@/lib/fire-services";

type Props = {
  value: string;
  onChange: (value: string) => void;
  label?: string;
};

export function FireServiceAutocomplete({
  value,
  onChange,
  label = "Fire & Rescue Service",
}: Props) {
  const [open, setOpen] =
    useState(false);

  const suggestions =
    useMemo(() => {
      const query =
        value.trim().toLowerCase();

      if (!query) {
        return UK_FIRE_SERVICES.slice(
          0,
          8,
        );
      }

      return UK_FIRE_SERVICES.filter(
        (service) =>
          service
            .toLowerCase()
            .includes(query),
      ).slice(0, 8);
    }, [value]);

  return (
    <label className="relative block">
      <span className="text-sm font-semibold text-zinc-800">
        {label}
      </span>

      <div className="relative mt-2">
        <Building2 className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />

        <input
          value={value}
          onChange={(event) => {
            onChange(
              event.target.value,
            );
            setOpen(true);
          }}
          onFocus={() =>
            setOpen(true)
          }
          onBlur={() => {
            window.setTimeout(
              () => setOpen(false),
              150,
            );
          }}
          placeholder="Start typing your fire service..."
          autoComplete="off"
          className="input pl-11"
        />
      </div>

      {open &&
      suggestions.length ? (
        <div className="absolute z-50 mt-2 max-h-72 w-full overflow-auto rounded-2xl border border-zinc-200 bg-white p-2 shadow-xl">
          {suggestions.map(
            (service) => (
              <button
                key={service}
                type="button"
                onMouseDown={(
                  event,
                ) =>
                  event.preventDefault()
                }
                onClick={() => {
                  onChange(service);
                  setOpen(false);
                }}
                className="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium text-zinc-700 transition hover:bg-zinc-100"
              >
                <span>
                  {service}
                </span>

                {value ===
                service ? (
                  <Check className="size-4 text-emerald-600" />
                ) : null}
              </button>
            ),
          )}
        </div>
      ) : null}
    </label>
  );
}
