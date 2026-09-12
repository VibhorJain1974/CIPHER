/**
 * Minimal, icon-only ways off the dossier and into the real world. No text,
 * no colour until you hover — a quiet row of logos, not a feature block.
 */
export default function LinkChips({
  github, linkedin, phone, contactEmail,
}: {
  github: string | null; linkedin: string | null;
  phone: string | null; contactEmail: string | null;
}) {
  const waDigits = phone ? phone.replace(/[^\d]/g, "") : "";

  if (!github && !linkedin && !phone && !contactEmail) return null;

  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      {github && (
        <a href={github} target="_blank" rel="noreferrer noopener" className="icon-chip" title="GitHub">
          <svg viewBox="0 0 16 16"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38
            0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53
            .63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95
            0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.6 7.6 0 0 1 4 0c1.53-1.04 2.2-.82 2.2-.82
            .44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48
            0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z"/></svg>
        </a>
      )}
      {linkedin && (
        <a href={linkedin} target="_blank" rel="noreferrer noopener" className="icon-chip" title="LinkedIn">
          <svg viewBox="0 0 16 16"><path d="M14.82 0H1.18C.53 0 0 .52 0 1.16v13.68C0 15.48.53 16 1.18 16h13.64
            c.65 0 1.18-.52 1.18-1.16V1.16C16 .52 15.47 0 14.82 0zM4.75 13.6H2.38V6h2.38v7.6zM3.56
            4.98a1.38 1.38 0 1 1 0-2.76 1.38 1.38 0 0 1 0 2.76zM13.6 13.6h-2.37V9.9c0-.88-.02-2.02-1.23-2.02
            -1.24 0-1.43.97-1.43 1.96v3.76H6.2V6h2.28v1.04h.03c.32-.6 1.1-1.23 2.26-1.23 2.42 0 2.87
            1.6 2.87 3.66v4.13z"/></svg>
        </a>
      )}
      {phone && waDigits && (
        <a href={`https://wa.me/${waDigits}`} target="_blank" rel="noreferrer noopener" className="icon-chip" title="WhatsApp">
          <svg viewBox="0 0 16 16"><path d="M8.01 0C3.65 0 .13 3.51.13 7.85c0 1.38.36 2.73 1.05 3.92L0 16l4.36-1.14
            a7.9 7.9 0 0 0 3.65.9h.01c4.36 0 7.9-3.51 7.9-7.85C15.92 3.51 12.38.02 8.01 0zm4.63
            11.11c-.2.55-1.15 1.05-1.6 1.11-.41.06-.92.09-1.49-.09-.34-.11-.79-.26-1.36-.5
            -2.39-1.03-3.95-3.44-4.07-3.6-.12-.16-.98-1.3-.98-2.48s.62-1.75.84-1.99c.22-.24.48-.3.64-.3
            l.46.01c.15.01.35-.06.54.42.2.5.68 1.72.74 1.85.06.13.1.28.02.44-.08.16-.12.26-.24.4
            -.12.14-.25.31-.36.42-.12.12-.24.25-.11.49.14.24.6 1 1.29 1.62.89.8 1.63 1.05
            1.87 1.16.24.11.38.1.52-.06.15-.16.62-.72.79-.97.16-.24.32-.2.55-.12.22.08 1.43.68
            1.68.8.24.12.4.18.46.28.06.11.06.61-.14 1.16z"/></svg>
        </a>
      )}
      {phone && (
        <a href={`tel:${phone}`} className="icon-chip" title="Call">
          <svg viewBox="0 0 16 16"><path d="M3.65.65a1 1 0 0 1 1.06-.15l2.6 1.1a1 1 0 0 1 .58 1.15l-.62
            2.42a1 1 0 0 1-.27.47l-1.1 1.1a10.3 10.3 0 0 0 4.62 4.62l1.1-1.1a1 1 0 0 1
            .47-.27l2.42-.62a1 1 0 0 1 1.15.58l1.1 2.6a1 1 0 0 1-.19 1.1l-1.62
            1.62a1.5 1.5 0 0 1-1.4.4C7.75 14.3 1.7 8.25.16 2.44a1.5 1.5 0 0 1
            .4-1.4L2.18.82z"/></svg>
        </a>
      )}
      {contactEmail && (
        <a href={`mailto:${contactEmail}`} className="icon-chip" title="Email">
          <svg viewBox="0 0 16 16"><path d="M1.5 2A1.5 1.5 0 0 0 0 3.5v9A1.5 1.5 0 0 0 1.5 14h13a1.5 1.5
            0 0 0 1.5-1.5v-9A1.5 1.5 0 0 0 14.5 2h-13zM1 4.2l6.4 4.16a1 1 0 0 0 1.08
            0L15 4.2v.5l-6.98 4.5a1 1 0 0 1-1.08 0L1 4.7v-.5z"/></svg>
        </a>
      )}
    </div>
  );
}
