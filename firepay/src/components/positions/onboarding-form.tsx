"use client";

import {
  useMemo,
  useState,
} from "react";
import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  CircleUserRound,
  Clock3,
  Flame,
  PartyPopper,
  Radio,
  ShieldCheck,
} from "lucide-react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";
import { FireServiceAutocomplete } from "@/components/fire-service/fire-service-autocomplete";
import { getLondonDate } from "@/lib/date";

type Props = {
  replay?: boolean;
};

type EmploymentChoice =
  | "wholetime"
  | "on_call"
  | "both";

type RotaType =
  | "weekday"
  | "rolling_rdo"
  | "cycle";

const ranks = [
  ["firefighter", "Firefighter"],
  ["crew_manager", "Crew Manager"],
  ["watch_manager", "Watch Manager"],
  ["station_manager", "Station Manager"],
  ["group_manager", "Group Manager"],
  ["area_manager", "Area Manager"],
] as const;

const competenceOptions: Record<
  string,
  [string, string][]
> = {
  firefighter: [
    ["development", "Development"],
    ["competent", "Competent"],
  ],
  crew_manager: [
    ["development", "Development"],
    ["competent", "Competent"],
  ],
  watch_manager: [
    ["development", "Development"],
    ["competent_a", "Competent A"],
    ["competent_b", "Competent B"],
  ],
  station_manager: [
    ["development", "Development"],
    ["competent_a", "Competent A"],
    ["competent_b", "Competent B"],
  ],
  group_manager: [
    ["development", "Development"],
    ["competent_a", "Competent A"],
    ["competent_b", "Competent B"],
  ],
  area_manager: [
    ["development", "Development"],
    ["competent_a", "Competent A"],
    ["competent_b", "Competent B"],
  ],
};

export function OnboardingForm({
  replay = false,
}: Props) {
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] =
    useState(0);

  const [preferredName, setPreferredName] =
    useState("");

  const [fireService, setFireService] =
    useState("");

  const [station, setStation] =
    useState("");

  const [
    employmentChoice,
    setEmploymentChoice,
  ] =
    useState<EmploymentChoice>(
      "wholetime",
    );

  const [
    wholeTimeRank,
    setWholeTimeRank,
  ] = useState("firefighter");

  const [
    wholeTimeCompetence,
    setWholeTimeCompetence,
  ] = useState("competent");

  const [
    onCallRank,
    setOnCallRank,
  ] = useState("firefighter");

  const [
    onCallCompetence,
    setOnCallCompetence,
  ] = useState("competent");

  const [rotaType, setRotaType] =
    useState<RotaType>(
      "weekday",
    );

  const [shiftStart, setShiftStart] =
    useState("08:00");

  const [
    shiftDuration,
    setShiftDuration,
  ] = useState("9");

  const [anchorDate, setAnchorDate] =
    useState(getLondonDate());

  const [
    rollingDayOff,
    setRollingDayOff,
  ] = useState("3");

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const totalSteps = 7;

  const hasWholetime =
    employmentChoice ===
      "wholetime" ||
    employmentChoice === "both";

  const hasOnCall =
    employmentChoice ===
      "on_call" ||
    employmentChoice === "both";

  function next() {
    setError("");

    if (
      step === 1 &&
      !preferredName.trim()
    ) {
      setError(
        "Tell FirePay what you'd like to be called.",
      );
      return;
    }

    if (
      step === 2 &&
      !fireService.trim()
    ) {
      setError(
        "Choose or enter your Fire & Rescue Service.",
      );
      return;
    }

    setStep((current) =>
      Math.min(
        current + 1,
        totalSteps - 1,
      ),
    );
  }

  function back() {
    setError("");

    setStep((current) =>
      Math.max(
        current - 1,
        0,
      ),
    );
  }

  async function finish() {
    if (replay) {
      router.push("/developer");
      return;
    }

    setSaving(true);
    setError("");

    const {
      data: { user },
    } =
      await supabase.auth.getUser();

    if (!user) {
      router.replace("/login");
      return;
    }

    const {
      error: profileError,
    } = await supabase
      .from("profiles")
      .upsert(
        {
          id: user.id,
          preferred_name:
            preferredName.trim(),
          fire_service:
            fireService.trim(),
        },
        {
          onConflict: "id",
        },
      );

    if (profileError) {
      setError(
        profileError.message,
      );
      setSaving(false);
      return;
    }

    const createdPositions: {
      id: string;
      employment_type: string;
    }[] = [];

    if (hasWholetime) {
      const {
        data,
        error: positionError,
      } = await supabase
        .from("positions")
        .insert({
          user_id: user.id,
          label: `${
            station.trim() ||
            fireService.trim()
          } Whole-time`,
          fire_service:
            fireService.trim(),
          station_name:
            station.trim() ||
            null,
          employment_type:
            "wholetime",
          rank:
            wholeTimeRank,
          competence:
            wholeTimeCompetence,
          is_default: true,
        })
        .select("id")
        .single();

      if (
        positionError ||
        !data
      ) {
        setError(
          positionError
            ?.message ??
            "Could not create Whole-time role.",
        );
        setSaving(false);
        return;
      }

      createdPositions.push({
        id: data.id,
        employment_type:
          "wholetime",
      });

      if (
        rotaType ===
        "rolling_rdo"
      ) {
        await supabase
          .from("rota_patterns")
          .insert({
            user_id: user.id,
            position_id:
              data.id,
            pattern_type:
              "weekly_rdo",
            anchor_date:
              anchorDate,
            cycle_length_days:
              35,
            weekly_start_time:
              shiftStart,
            weekly_duration_minutes:
              Math.round(
                Number(
                  shiftDuration,
                ) * 60,
              ),
            rdo_sequence: [
              Number(
                rollingDayOff,
              ),
              Number(
                rollingDayOff,
              ),
              Number(
                rollingDayOff,
              ),
              Number(
                rollingDayOff,
              ),
              Number(
                rollingDayOff,
              ),
            ],
          });
      }
    }

    if (hasOnCall) {
      const {
        data,
        error: positionError,
      } = await supabase
        .from("positions")
        .insert({
          user_id: user.id,
          label: `${
            station.trim() ||
            fireService.trim()
          } On-call`,
          fire_service:
            fireService.trim(),
          station_name:
            station.trim() ||
            null,
          employment_type:
            "on_call",
          rank: onCallRank,
          competence:
            onCallCompetence,
          is_default:
            !hasWholetime,
        })
        .select("id")
        .single();

      if (
        positionError ||
        !data
      ) {
        setError(
          positionError
            ?.message ??
            "Could not create On-call role.",
        );
        setSaving(false);
        return;
      }

      createdPositions.push({
        id: data.id,
        employment_type:
          "on_call",
      });
    }

    /*
     * Existing role page already has the
     * detailed pay/rota settings.
     *
     * Take the user straight there after
     * this friendlier first-pass setup.
     */
    const first =
      createdPositions[0];

    if (first) {
      router.replace(
        `/settings/positions/${first.id}?setup=1`,
      );
    } else {
      router.replace("/");
    }

    router.refresh();
  }

  return (
    <div className="mt-8">
      <Progress
        step={step}
        total={totalSteps}
      />

      <div className="mt-8 min-h-[390px]">
        {step === 0 ? (
          <Welcome />
        ) : null}

        {step === 1 ? (
          <AboutYou
            value={preferredName}
            setValue={
              setPreferredName
            }
          />
        ) : null}

        {step === 2 ? (
          <Service
            service={
              fireService
            }
            setService={
              setFireService
            }
            station={station}
            setStation={
              setStation
            }
          />
        ) : null}

        {step === 3 ? (
          <RoleChoice
            value={
              employmentChoice
            }
            setValue={
              setEmploymentChoice
            }
          />
        ) : null}

        {step === 4 ? (
          <Ranks
            hasWholetime={
              hasWholetime
            }
            hasOnCall={
              hasOnCall
            }
            wholeTimeRank={
              wholeTimeRank
            }
            setWholeTimeRank={
              setWholeTimeRank
            }
            wholeTimeCompetence={
              wholeTimeCompetence
            }
            setWholeTimeCompetence={
              setWholeTimeCompetence
            }
            onCallRank={
              onCallRank
            }
            setOnCallRank={
              setOnCallRank
            }
            onCallCompetence={
              onCallCompetence
            }
            setOnCallCompetence={
              setOnCallCompetence
            }
          />
        ) : null}

        {step === 5 ? (
          <RotaSetup
            enabled={
              hasWholetime
            }
            rotaType={
              rotaType
            }
            setRotaType={
              setRotaType
            }
            shiftStart={
              shiftStart
            }
            setShiftStart={
              setShiftStart
            }
            shiftDuration={
              shiftDuration
            }
            setShiftDuration={
              setShiftDuration
            }
            anchorDate={
              anchorDate
            }
            setAnchorDate={
              setAnchorDate
            }
            rollingDayOff={
              rollingDayOff
            }
            setRollingDayOff={
              setRollingDayOff
            }
          />
        ) : null}

        {step === 6 ? (
          <Review
            preferredName={
              preferredName
            }
            fireService={
              fireService
            }
            station={station}
            employmentChoice={
              employmentChoice
            }
            rotaType={
              rotaType
            }
            hasWholetime={
              hasWholetime
            }
            replay={replay}
          />
        ) : null}
      </div>

      {error ? (
        <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
          {error}
        </div>
      ) : null}

      <div className="mt-6 flex gap-3">
        {step > 0 ? (
          <button
            type="button"
            onClick={back}
            className="flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl border border-zinc-200 bg-white font-semibold text-zinc-700"
          >
            <ArrowLeft className="size-4" />
            Back
          </button>
        ) : null}

        {step <
        totalSteps - 1 ? (
          <button
            type="button"
            onClick={next}
            className="flex h-12 flex-[2] items-center justify-center gap-2 rounded-2xl bg-red-600 font-semibold text-white"
          >
            {step === 0
              ? "Start setup"
              : "Continue"}

            <ArrowRight className="size-5" />
          </button>
        ) : (
          <button
            type="button"
            onClick={finish}
            disabled={saving}
            className="flex h-12 flex-[2] items-center justify-center gap-2 rounded-2xl bg-red-600 font-semibold text-white disabled:opacity-50"
          >
            {saving
              ? "Setting up..."
              : replay
                ? "Finish preview"
                : "Create my FirePay setup"}

            <ArrowRight className="size-5" />
          </button>
        )}
      </div>

      {replay ? (
        <p className="mt-4 text-center text-xs font-medium text-amber-600">
          Developer preview — nothing entered here will be saved.
        </p>
      ) : null}
    </div>
  );
}

function Progress({
  step,
  total,
}: {
  step: number;
  total: number;
}) {
  const percentage =
    ((step + 1) /
      total) *
    100;

  return (
    <div>
      <div className="flex justify-between text-xs font-semibold text-zinc-400">
        <span>
          Step {step + 1} of{" "}
          {total}
        </span>

        <span>
          {Math.round(
            percentage,
          )}
          %
        </span>
      </div>

      <div className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-100">
        <div
          className="h-full rounded-full bg-red-600 transition-all"
          style={{
            width: `${percentage}%`,
          }}
        />
      </div>
    </div>
  );
}

function Welcome() {
  return (
    <div className="text-center">
      <div className="mx-auto flex size-16 items-center justify-center rounded-[1.5rem] bg-red-600 text-white">
        <Flame className="size-8" />
      </div>

      <h2 className="mt-6 text-3xl font-bold text-zinc-950">
        Welcome to FirePay
      </h2>

      <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-zinc-500">
        We&apos;ll set up enough information for FirePay to understand your role, your rota and where your pay comes from.
      </p>

      <div className="mt-7 space-y-2 rounded-2xl bg-zinc-50 p-5 text-left text-sm text-zinc-600">
        <CheckLine text="Your profile" />
        <CheckLine text="Fire service & station" />
        <CheckLine text="Whole-time, On-call or both" />
        <CheckLine text="Rank & competence" />
        <CheckLine text="Rota basics" />
        <CheckLine text="Then detailed pay settings" />
      </div>
    </div>
  );
}

function AboutYou({
  value,
  setValue,
}: {
  value: string;
  setValue: (
    value: string,
  ) => void;
}) {
  return (
    <div>
      <CircleUserRound className="size-10 text-red-600" />

      <h2 className="mt-5 text-2xl font-bold text-zinc-950">
        What should FirePay call you?
      </h2>

      <p className="mt-2 text-sm text-zinc-500">
        This is used for things like “Good morning, Curtis”.
      </p>

      <input
        autoFocus
        value={value}
        onChange={(event) =>
          setValue(
            event.target.value,
          )
        }
        placeholder="Preferred name"
        className="input mt-7"
      />
    </div>
  );
}

function Service({
  service,
  setService,
  station,
  setStation,
}: {
  service: string;
  setService: (
    value: string,
  ) => void;
  station: string;
  setStation: (
    value: string,
  ) => void;
}) {
  return (
    <div>
      <ShieldCheck className="size-10 text-blue-600" />

      <h2 className="mt-5 text-2xl font-bold text-zinc-950">
        Where do you work?
      </h2>

      <div className="mt-7 space-y-5">
        <FireServiceAutocomplete
          value={service}
          onChange={
            setService
          }
        />

        <label className="block">
          <span className="text-sm font-semibold text-zinc-800">
            Station
          </span>

          <span className="ml-2 text-xs text-zinc-400">
            Optional
          </span>

          <input
            value={station}
            onChange={(event) =>
              setStation(
                event.target.value,
              )
            }
            className="input mt-2"
            placeholder="e.g. Battle"
          />
        </label>
      </div>
    </div>
  );
}

function RoleChoice({
  value,
  setValue,
}: {
  value: EmploymentChoice;
  setValue: (
    value: EmploymentChoice,
  ) => void;
}) {
  return (
    <div>
      <BriefcaseBusiness className="size-10 text-emerald-600" />

      <h2 className="mt-5 text-2xl font-bold text-zinc-950">
        Which roles do you work?
      </h2>

      <p className="mt-2 text-sm text-zinc-500">
        FirePay keeps each contract separate because your rank, rota and pay can be different.
      </p>

      <div className="mt-6 space-y-3">
        <RoleButton
          active={
            value ===
            "wholetime"
          }
          title="Whole-time"
          description="Salaried / shift-based contract"
          icon={BriefcaseBusiness}
          onClick={() =>
            setValue(
              "wholetime",
            )
          }
        />

        <RoleButton
          active={
            value ===
            "on_call"
          }
          title="On-call"
          description="Retained / pager-based contract"
          icon={Radio}
          onClick={() =>
            setValue(
              "on_call",
            )
          }
        />

        <RoleButton
          active={
            value === "both"
          }
          title="Both"
          description="Separate Whole-time and On-call roles"
          icon={Flame}
          onClick={() =>
            setValue("both")
          }
        />
      </div>
    </div>
  );
}

function Ranks(props: {
  hasWholetime: boolean;
  hasOnCall: boolean;
  wholeTimeRank: string;
  setWholeTimeRank: (value: string) => void;
  wholeTimeCompetence: string;
  setWholeTimeCompetence: (value: string) => void;
  onCallRank: string;
  setOnCallRank: (value: string) => void;
  onCallCompetence: string;
  setOnCallCompetence: (value: string) => void;
}) {
  return (
    <div>
      <ShieldCheck className="size-10 text-violet-600" />

      <h2 className="mt-5 text-2xl font-bold text-zinc-950">
        Rank & competence
      </h2>

      <p className="mt-2 text-sm text-zinc-500">
        If you hold different ranks on different contracts, set them separately here.
      </p>

      <div className="mt-6 space-y-5">
        {props.hasWholetime ? (
          <RankFields
            title="Whole-time"
            rank={
              props.wholeTimeRank
            }
            setRank={
              props.setWholeTimeRank
            }
            competence={
              props.wholeTimeCompetence
            }
            setCompetence={
              props.setWholeTimeCompetence
            }
          />
        ) : null}

        {props.hasOnCall ? (
          <RankFields
            title="On-call"
            rank={
              props.onCallRank
            }
            setRank={
              props.setOnCallRank
            }
            competence={
              props.onCallCompetence
            }
            setCompetence={
              props.setOnCallCompetence
            }
          />
        ) : null}
      </div>
    </div>
  );
}

function RotaSetup({
  enabled,
  rotaType,
  setRotaType,
  shiftStart,
  setShiftStart,
  shiftDuration,
  setShiftDuration,
  anchorDate,
  setAnchorDate,
  rollingDayOff,
  setRollingDayOff,
}: {
  enabled: boolean;
  rotaType: RotaType;
  setRotaType: (
    value: RotaType,
  ) => void;
  shiftStart: string;
  setShiftStart: (
    value: string,
  ) => void;
  shiftDuration: string;
  setShiftDuration: (
    value: string,
  ) => void;
  anchorDate: string;
  setAnchorDate: (
    value: string,
  ) => void;
  rollingDayOff: string;
  setRollingDayOff: (
    value: string,
  ) => void;
}) {
  if (!enabled) {
    return (
      <div className="text-center">
        <Radio className="mx-auto size-12 text-emerald-600" />

        <h2 className="mt-5 text-2xl font-bold text-zinc-950">
          On-call setup
        </h2>

        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-zinc-500">
          On-call availability and retainer rules are more flexible, so FirePay will take you through those detailed settings immediately after this wizard.
        </p>
      </div>
    );
  }

  return (
    <div>
      <CalendarDays className="size-10 text-blue-600" />

      <h2 className="mt-5 text-2xl font-bold text-zinc-950">
        What does your normal rota look like?
      </h2>

      <p className="mt-2 text-sm text-zinc-500">
        We&apos;ll start with the basics. You can fine-tune it afterwards.
      </p>

      <div className="mt-6 grid gap-2 sm:grid-cols-3">
        <SmallChoice
          active={
            rotaType ===
            "weekday"
          }
          label="Weekdays"
          onClick={() =>
            setRotaType(
              "weekday",
            )
          }
        />

        <SmallChoice
          active={
            rotaType ===
            "rolling_rdo"
          }
          label="Rolling RDO"
          onClick={() =>
            setRotaType(
              "rolling_rdo",
            )
          }
        />

        <SmallChoice
          active={
            rotaType ===
            "cycle"
          }
          label="Shift cycle"
          onClick={() =>
            setRotaType(
              "cycle",
            )
          }
        />
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label>
          <span className="text-sm font-semibold text-zinc-800">
            Shift starts
          </span>

          <input
            type="time"
            value={shiftStart}
            onChange={(event) =>
              setShiftStart(
                event.target.value,
              )
            }
            className="input mt-2"
          />
        </label>

        <label>
          <span className="text-sm font-semibold text-zinc-800">
            Shift length
          </span>

          <div className="relative mt-2">
            <input
              type="number"
              min="1"
              max="24"
              step="0.5"
              value={
                shiftDuration
              }
              onChange={(event) =>
                setShiftDuration(
                  event.target.value,
                )
              }
              className="input pr-16"
            />

            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-zinc-400">
              hours
            </span>
          </div>
        </label>

        <label>
          <span className="text-sm font-semibold text-zinc-800">
            Reference date
          </span>

          <input
            type="date"
            value={anchorDate}
            onChange={(event) =>
              setAnchorDate(
                event.target.value,
              )
            }
            className="input mt-2"
          />
        </label>

        {rotaType ===
        "rolling_rdo" ? (
          <label>
            <span className="text-sm font-semibold text-zinc-800">
              Current RDO weekday
            </span>

            <select
              value={
                rollingDayOff
              }
              onChange={(event) =>
                setRollingDayOff(
                  event.target.value,
                )
              }
              className="input mt-2"
            >
              <option value="1">
                Monday
              </option>
              <option value="2">
                Tuesday
              </option>
              <option value="3">
                Wednesday
              </option>
              <option value="4">
                Thursday
              </option>
              <option value="5">
                Friday
              </option>
            </select>
          </label>
        ) : null}
      </div>

      <RotaPreview
        rotaType={rotaType}
        rollingDayOff={
          rollingDayOff
        }
      />
    </div>
  );
}

function RotaPreview({
  rotaType,
  rollingDayOff,
}: {
  rotaType: RotaType;
  rollingDayOff: string;
}) {
  const days = [
    "Mon",
    "Tue",
    "Wed",
    "Thu",
    "Fri",
    "Sat",
    "Sun",
  ];

  const states =
    useMemo(() => {
      if (
        rotaType ===
        "rolling_rdo"
      ) {
        return days.map(
          (_, index) => {
            if (index > 4) {
              return "Off";
            }

            return index + 1 ===
              Number(
                rollingDayOff,
              )
              ? "RDO"
              : "Work";
          },
        );
      }

      if (
        rotaType ===
        "weekday"
      ) {
        return days.map(
          (_, index) =>
            index < 5
              ? "Work"
              : "Off",
        );
      }

      return [
        "Work",
        "Work",
        "Off",
        "Off",
        "Work",
        "Off",
        "Off",
      ];
    }, [
      rotaType,
      rollingDayOff,
    ]);

  return (
    <div className="mt-6 rounded-2xl bg-zinc-50 p-4">
      <p className="text-sm font-semibold text-zinc-800">
        Preview
      </p>

      <div className="mt-3 grid grid-cols-7 gap-1">
        {days.map(
          (day, index) => (
            <div
              key={day}
              className="text-center"
            >
              <p className="text-[10px] font-semibold text-zinc-400">
                {day}
              </p>

              <div
                className={`mt-2 rounded-lg px-1 py-2 text-[9px] font-bold ${
                  states[index] ===
                  "Work"
                    ? "bg-blue-100 text-blue-700"
                    : states[index] ===
                        "RDO"
                      ? "bg-amber-100 text-amber-700"
                      : "bg-zinc-200 text-zinc-500"
                }`}
              >
                {states[index]}
              </div>
            </div>
          ),
        )}
      </div>

      {rotaType === "cycle" ? (
        <p className="mt-3 text-xs leading-5 text-zinc-500">
          This is only a preview. FirePay will take you to the full cycle editor next so you can enter 24-hour, 2-2-4, day/night or other patterns accurately.
        </p>
      ) : null}
    </div>
  );
}

function Review({
  preferredName,
  fireService,
  station,
  employmentChoice,
  rotaType,
  hasWholetime,
  replay,
}: {
  preferredName: string;
  fireService: string;
  station: string;
  employmentChoice: EmploymentChoice;
  rotaType: RotaType;
  hasWholetime: boolean;
  replay: boolean;
}) {
  return (
    <div className="text-center">
      <div className="mx-auto flex size-16 items-center justify-center rounded-[1.5rem] bg-emerald-100 text-emerald-700">
        <PartyPopper className="size-8" />
      </div>

      <h2 className="mt-5 text-2xl font-bold text-zinc-950">
        {replay
          ? "Preview complete"
          : `Looking good, ${preferredName}`}
      </h2>

      <p className="mt-2 text-sm text-zinc-500">
        Here&apos;s what FirePay has understood.
      </p>

      <div className="mt-6 space-y-3 rounded-2xl bg-zinc-50 p-5 text-left">
        <Summary
          label="Service"
          value={fireService}
        />

        <Summary
          label="Station"
          value={
            station ||
            "Not entered"
          }
        />

        <Summary
          label="Contracts"
          value={
            employmentChoice ===
            "both"
              ? "Whole-time + On-call"
              : employmentChoice ===
                  "wholetime"
                ? "Whole-time"
                : "On-call"
          }
        />

        <Summary
          label="Rota"
          value={
            hasWholetime
              ? rotaType
                  .replaceAll(
                    "_",
                    " ",
                  )
                  .replace(
                    /^./,
                    (letter) =>
                      letter.toUpperCase(),
                  )
              : "On-call setup next"
          }
        />
      </div>

      {!replay ? (
        <div className="mt-5 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-left">
          <p className="font-semibold text-blue-900">
            Next step
          </p>

          <p className="mt-1 text-sm leading-6 text-blue-700">
            We&apos;ll now open your role settings so you can confirm exact pay, allowances and any advanced rota details.
          </p>
        </div>
      ) : null}
    </div>
  );
}

function RoleButton({
  active,
  title,
  description,
  icon: Icon,
  onClick,
}: {
  active: boolean;
  title: string;
  description: string;
  icon: typeof Flame;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition ${
        active
          ? "border-red-300 bg-red-50"
          : "border-zinc-200 bg-white"
      }`}
    >
      <div className="flex size-11 items-center justify-center rounded-2xl bg-zinc-100">
        <Icon className="size-5" />
      </div>

      <div>
        <p className="font-bold text-zinc-950">
          {title}
        </p>

        <p className="mt-1 text-xs text-zinc-500">
          {description}
        </p>
      </div>
    </button>
  );
}

function RankFields({
  title,
  rank,
  setRank,
  competence,
  setCompetence,
}: {
  title: string;
  rank: string;
  setRank: (
    value: string,
  ) => void;
  competence: string;
  setCompetence: (
    value: string,
  ) => void;
}) {
  return (
    <div className="rounded-2xl border border-zinc-200 p-4">
      <p className="font-bold text-zinc-950">
        {title}
      </p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <select
          value={rank}
          onChange={(event) => {
            const value =
              event.target.value;

            setRank(value);

            setCompetence(
              competenceOptions[
                value
              ][0][0],
            );
          }}
          className="input"
        >
          {ranks.map(
            ([value, name]) => (
              <option
                key={value}
                value={value}
              >
                {name}
              </option>
            ),
          )}
        </select>

        <select
          value={competence}
          onChange={(event) =>
            setCompetence(
              event.target.value,
            )
          }
          className="input"
        >
          {competenceOptions[
            rank
          ].map(
            ([value, name]) => (
              <option
                key={value}
                value={value}
              >
                {name}
              </option>
            ),
          )}
        </select>
      </div>
    </div>
  );
}

function SmallChoice({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border px-3 py-3 text-sm font-semibold ${
        active
          ? "border-red-300 bg-red-50 text-red-700"
          : "border-zinc-200 bg-white text-zinc-600"
      }`}
    >
      {label}
    </button>
  );
}

function CheckLine({
  text,
}: {
  text: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <Check className="size-4 text-emerald-600" />
      {text}
    </div>
  );
}

function Summary({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex justify-between gap-4 text-sm">
      <span className="text-zinc-500">
        {label}
      </span>

      <span className="text-right font-semibold text-zinc-900">
        {value}
      </span>
    </div>
  );
}
