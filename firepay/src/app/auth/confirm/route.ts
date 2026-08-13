import {
  type EmailOtpType,
} from "@supabase/supabase-js";
import {
  type NextRequest,
  NextResponse,
} from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function GET(
  request: NextRequest,
) {
  const requestUrl =
    new URL(request.url);

  const code =
    requestUrl.searchParams.get(
      "code",
    );

  const tokenHash =
    requestUrl.searchParams.get(
      "token_hash",
    );

  const type =
    requestUrl.searchParams.get(
      "type",
    ) as EmailOtpType | null;

  let next =
    requestUrl.searchParams.get(
      "next",
    );

  if (!next) {
    next =
      type === "recovery"
        ? "/reset-password"
        : "/onboarding";
  }

  if (!next.startsWith("/")) {
    next = "/onboarding";
  }

  const supabase =
    await createClient();

  if (code) {
    const { error } =
      await supabase.auth
        .exchangeCodeForSession(
          code,
        );

    if (!error) {
      return NextResponse.redirect(
        new URL(
          next,
          requestUrl.origin,
        ),
      );
    }

    console.error(
      "FirePay auth code exchange failed:",
      error.message,
    );
  }

  if (tokenHash && type) {
    const { error } =
      await supabase.auth.verifyOtp({
        type,
        token_hash:
          tokenHash,
      });

    if (!error) {
      return NextResponse.redirect(
        new URL(
          next,
          requestUrl.origin,
        ),
      );
    }

    console.error(
      "FirePay OTP verification failed:",
      error.message,
    );
  }

  return NextResponse.redirect(
    new URL(
      "/login?error=confirmation",
      requestUrl.origin,
    ),
  );
}
