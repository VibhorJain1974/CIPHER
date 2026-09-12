import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/** SEEN is for judges and core. Members never reach it, by link or by URL. */
export default async function ReviewLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).maybeSingle();

  if (profile?.role !== "core" && profile?.role !== "judge") redirect("/dashboard/home");

  return <>{children}</>;
}
