import Link from "next/link";
import {
  ArrowLeft,
  KeyRound,
} from "lucide-react";

import { ForgotPasswordForm } from "@/components/security/forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <main className="min-h-screen bg-zinc-100 px-4 py-10">
      <div className="mx-auto max-w-md">
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-600"
        >
          <ArrowLeft className="size-4" />
          Sign in
        </Link>

        <div className="mt-8 rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-red-50 text-red-600">
            <KeyRound className="size-6" />
          </div>

          <h1 className="mt-5 text-2xl font-bold text-zinc-950">
            Reset your password
          </h1>

          <p className="mt-2 text-sm leading-6 text-zinc-500">
            Enter your email and FirePay will send you a password-reset link.
          </p>

          <ForgotPasswordForm />
        </div>
      </div>
    </main>
  );
}
