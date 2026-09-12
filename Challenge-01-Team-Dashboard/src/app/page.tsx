import Link from "next/link";
import DecryptField from "@/components/DecryptField";
import ThemeToggle from "@/components/ThemeToggle";

export default function Gate() {
  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, position: "relative" }}>
      <DecryptField />
      <div style={{ position: "fixed", top: 16, right: 18, zIndex: 3 }}><ThemeToggle /></div>
      <div style={{ textAlign: "center", position: "relative", zIndex: 2, background: "var(--void)", border: "1px solid var(--line)", padding: "40px 46px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginBottom: 12 }}>
          <span style={{ width: 12, height: 12, background: "var(--hot)", display: "inline-block" }} />
          <span style={{ fontSize: 40, letterSpacing: ".3em", paddingLeft: ".3em" }}>CIPHER</span>
        </div>
        <div className="lbl-faint" style={{ marginBottom: 36 }}>SEALED · 75-DAY WINDOW · NO PUBLIC ROUTE</div>
        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          <Link href="/login" className="btn btn-hot">ENTER</Link>
          <Link href="/signup" className="btn">ENROL</Link>
        </div>
      </div>
    </main>
  );
}
