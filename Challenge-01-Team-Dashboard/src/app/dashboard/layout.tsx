import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Nav from "@/components/Nav";
import Ceremony from "@/components/Ceremony";
import Chat from "@/components/Chat";
import type { Profile } from "@/lib/types";

const NAV = [
  { key: "HOME", href: "/dashboard/home",        clearance: "all" },
  { key: "RANK", href: "/dashboard/leaderboard", clearance: "all" },
  { key: "ARCS", href: "/dashboard/arcs",        clearance: "all" },
  { key: "NODE", href: "/dashboard",             clearance: "logger" },
  { key: "CREW", href: "/dashboard/roster",      clearance: "all" },
  { key: "FILE", href: "/dashboard/profile",     clearance: "all" },
  { key: "CRED", href: "/dashboard/credits",     clearance: "review" },
  { key: "QUEU", href: "/dashboard/core",        clearance: "core" },
  { key: "TRCE", href: "/dashboard/core/audit",  clearance: "core" },
  { key: "KEYS", href: "/dashboard/core/access", clearance: "core" },
  { key: "SEEN", href: "/dashboard/review",      clearance: "review" },
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles").select("*").eq("id", user.id).maybeSingle<Profile>();

  // authenticated but no node record: finish enrolment rather than
  // dropping them into the dashboard as a ghost
  if (!profile) redirect("/enrol");

  const role = profile.role;
  const items = NAV.filter((n) =>
    n.clearance === "all" ||
    (n.clearance === "core" && role === "core") ||
    (n.clearance === "review" && (role === "core" || role === "judge")) ||
    (n.clearance === "logger" && role !== "judge")
  ).map(({ key, href }) => ({ key, href }));

  return (
    <div style={{ minHeight: "100vh", background: "var(--void)" }}>
      <Nav items={items} name={profile.full_name} role={role} selfId={profile.id} />
      <main style={{ padding: "20px 18px 70px", maxWidth: 1640, margin: "0 auto" }}>{children}</main>
      <Ceremony userId={profile.id} />
      <Chat userId={profile.id} />
    </div>
  );
}
