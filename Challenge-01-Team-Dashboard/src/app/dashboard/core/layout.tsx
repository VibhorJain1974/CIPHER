import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Guards QUEU, TRCE and KEYS. Hiding a nav link is not access control:
 * without this, a member who types the URL still loads the page shell.
 * The database would refuse them any data, but they should not get the
 * door either.
 */
export default async function CoreLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).maybeSingle();

  if (profile?.role !== "core") redirect("/dashboard/home");

  return <>{children}</>;
}
