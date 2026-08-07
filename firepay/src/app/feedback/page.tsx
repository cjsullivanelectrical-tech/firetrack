import Link from "next/link";
import {
  ArrowLeft,
  MessageSquareText,
} from "lucide-react";
import { redirect } from "next/navigation";

import { FeedbackForm } from "@/components/feedback/feedback-form";
import { createClient } from "@/lib/supabase/server";

export default async function FeedbackPage() {
  const supabase =
    await createClient();

  const {
    data: { user },
  } =
    await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="min-h-screen bg-zinc-100 px-4 py-6 sm:py-10">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/settings"
          className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-600"
        >
          <ArrowLeft className="size-4" />
          Settings
        </Link>

        <div className="mt-6">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-red-600 text-white">
              <MessageSquareText className="size-5" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-red-600">
                  FirePay
                </p>

                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700">
                  Beta
                </span>
              </div>

              <h1 className="text-3xl font-bold tracking-tight text-zinc-950">
                Send feedback
              </h1>
            </div>
          </div>

          <p className="mt-3 text-sm leading-6 text-zinc-500">
            You are helping test an early version of FirePay. If anything feels unclear or a pay figure looks wrong, send it here.
          </p>
        </div>

        <div className="mt-8">
          <FeedbackForm
            userId={user.id}
          />
        </div>
      </div>
    </main>
  );
}
