import { OnboardingForm } from "@/components/positions/onboarding-form";

type Props = {
  searchParams: Promise<{
    replay?: string;
    sandbox?: string;
  }>;
};

export default async function OnboardingPage({
  searchParams,
}: Props) {
  const params =
    await searchParams;

  const replay =
    params.replay === "1";

  const sandbox =
    params.sandbox === "1";

  return (
    <main className="min-h-screen bg-zinc-100 px-4 py-8">
      <section className="mx-auto max-w-xl rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-xl shadow-zinc-900/5 sm:p-8">
        {sandbox ? (
          <div className="mb-5 rounded-2xl border border-violet-200 bg-violet-50 p-4">
            <p className="font-semibold text-violet-900">
              Developer Sandbox
            </p>

            <p className="mt-1 text-sm text-violet-700">
              Complete setup exactly like a new firefighter. Nothing here will alter your real account.
            </p>
          </div>
        ) : replay ? (
          <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <p className="font-semibold text-amber-900">
              Developer Replay
            </p>

            <p className="mt-1 text-sm text-amber-700">
              Walk through onboarding safely. Nothing you enter will be saved.
            </p>
          </div>
        ) : null}

        <OnboardingForm
          replay={replay}
          sandbox={sandbox}
        />
      </section>
    </main>
  );
}
