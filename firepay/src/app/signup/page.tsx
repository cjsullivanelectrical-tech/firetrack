import { SignupForm } from "@/components/auth/signup-form";

export default function SignupPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-100 px-4 py-10">
      <section className="w-full max-w-md rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-xl shadow-zinc-900/5 sm:p-8">
        <div className="flex items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-red-600 text-xl font-black text-white">
            F
          </div>

          <div>
            <p className="text-2xl font-black tracking-tight text-zinc-950">
              Fire<span className="text-red-600">Pay</span>
            </p>

            <p className="text-sm text-zinc-500">
              Create your firefighter pay account
            </p>
          </div>
        </div>

        <SignupForm />
      </section>
    </main>
  );
}
