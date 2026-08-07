"use client";

import { useState } from "react";
import {
  CheckCircle2,
  MessageSquareText,
  Send,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";

export function FeedbackForm({
  userId,
}: {
  userId: string;
}) {
  const supabase = createClient();

  const [message, setMessage] =
    useState("");

  const [page, setPage] =
    useState("");

  const [sending, setSending] =
    useState(false);

  const [status, setStatus] =
    useState("");

  const [sent, setSent] =
    useState(false);

  async function sendFeedback() {
    const cleanMessage =
      message.trim();

    if (!cleanMessage) {
      setStatus(
        "Tell us what happened or what could be easier.",
      );
      return;
    }

    setSending(true);
    setStatus("");
    setSent(false);

    const { error } = await supabase
      .from("feedback")
      .insert({
        user_id: userId,
        message: cleanMessage,
        page:
          page.trim() || null,
      });

    if (error) {
      setStatus(error.message);
      setSending(false);
      return;
    }

    setMessage("");
    setPage("");
    setSent(true);
    setStatus(
      "Thanks — your feedback has been saved.",
    );

    setSending(false);
  }

  return (
    <div className="space-y-5">
      <div className="rounded-[2rem] border border-zinc-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-2xl bg-red-50 text-red-600">
            <MessageSquareText className="size-5" />
          </div>

          <div>
            <h2 className="font-bold text-zinc-950">
              Tell us what you think
            </h2>

            <p className="mt-1 text-sm text-zinc-500">
              Confusing, wrong or annoying — we want to know.
            </p>
          </div>
        </div>

        <label className="mt-6 block">
          <span className="text-sm font-semibold text-zinc-800">
            What happened?
          </span>

          <textarea
            rows={6}
            value={message}
            onChange={(event) =>
              setMessage(
                event.target.value,
              )
            }
            placeholder="For example: I couldn't work out how to change my rota..."
            className="input mt-2 py-3"
          />
        </label>

        <label className="mt-5 block">
          <span className="text-sm font-semibold text-zinc-800">
            Where were you?
          </span>

          <p className="mt-1 text-xs text-zinc-400">
            Optional — e.g. Calendar, Dashboard, Add Activity.
          </p>

          <input
            value={page}
            onChange={(event) =>
              setPage(
                event.target.value,
              )
            }
            placeholder="Calendar"
            className="input mt-2"
          />
        </label>
      </div>

      {status ? (
        <div
          className={`rounded-2xl p-4 text-sm font-semibold ${
            sent
              ? "bg-emerald-50 text-emerald-700"
              : "bg-red-50 text-red-700"
          }`}
        >
          <div className="flex items-center gap-2">
            {sent ? (
              <CheckCircle2 className="size-5" />
            ) : null}

            {status}
          </div>
        </div>
      ) : null}

      <button
        type="button"
        onClick={sendFeedback}
        disabled={sending}
        className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-red-600 font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
      >
        <Send className="size-5" />

        {sending
          ? "Sending..."
          : "Send feedback"}
      </button>
    </div>
  );
}
