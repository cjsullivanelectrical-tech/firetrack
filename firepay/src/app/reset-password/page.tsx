import {
  KeyRound,
} from "lucide-react";

import { ResetPasswordForm } from "@/components/security/reset-password-form";

export default function ResetPasswordPage() {
  return (
    <main className="min-h-screen bg-zinc-100 px-4 py-10">
      <div className="mx-auto max-w-md">
        <div className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-red-50 text-red-600">
            <KeyRound className="size-6" />
          </div>

          <h1 className="mt-5 text-2xl font-bold text-zinc-950">
            Choose a new password
          </h1>

          <p className="mt-2 text-sm leading-6 text-zinc-500">
            Enter the new password you&apos;d like to use for FirePay.
          </p>

          <ResetPasswordForm />
        </div>
      </div>
    </main>
  );
}
