import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { EmailOtpType } from "@supabase/supabase-js";

/**
 * Where the confirmation link lands. Supabase sends one of two shapes
 * depending on how the project is configured — ?code= for the PKCE flow,
 * ?token_hash=&type= for the older verification flow. Handling only one of
 * them is how a click ends up doing nothing, so handle both and always land
 * the member somewhere that explains itself.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/dashboard/leaderboard";

  const supabase = await createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  }

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  }

  // The link was already used, or it aged out. Either way the account is
  // usually confirmed by now, so send them to sign in rather than to a wall.
  return NextResponse.redirect(`${origin}/login?confirmed=1`);
}
