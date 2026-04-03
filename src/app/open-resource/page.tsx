"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

// Tries to focus the askGenie opener tab then closes this tab.
// If no opener (e.g. user navigated here directly), just closes.
function closeAndReturn() {
  if (typeof window === "undefined") return;
  try {
    if (window.opener && !window.opener.closed) {
      window.opener.focus();
    }
  } catch {}
  window.close();
}

function ResourceViewer() {
  const params = useSearchParams();
  const url = params.get("url") ?? "";

  // Try to pull a human-readable label from the URL
  let hostname = "";
  try {
    const parsed = new URL(url, typeof window !== "undefined" ? window.location.href : "https://genie127.com");
    hostname = parsed.hostname.replace(/^www\./, "") + (parsed.pathname !== "/" ? parsed.pathname : "");
  } catch {}

  if (!url) {
    return (
      <div style={styles.page}>
        <Header url="" onClose={closeAndReturn} />
        <div style={styles.body}>
          <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "14px", marginBottom: "16px" }}>
            No resource URL was provided.
          </p>
          <Btn onClick={closeAndReturn}>← Close Tab</Btn>
        </div>
        <Footer onClose={closeAndReturn} />
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <Header url={url} onClose={closeAndReturn} />

      {/* Body */}
      <div style={styles.body}>
        {/* Resource card */}
        <div style={styles.card}>
          <div style={styles.cardIcon}>🔗</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: "15px", fontWeight: 700, color: "#e0f2fe", marginBottom: "4px", wordBreak: "break-word" }}>
              {hostname}
            </p>
            <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.35)", wordBreak: "break-all" }}>
              {url}
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", width: "100%", maxWidth: "340px" }}>
          {/* Primary: open resource in new tab (preserves this tab for easy close) */}
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            style={styles.primaryBtn}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(6,182,212,0.30)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(6,182,212,0.16)"; }}
          >
            Open Resource ↗
          </a>

          {/* Secondary: open in same tab (browser back returns here) */}
          <a
            href={url}
            style={styles.secondaryBtn}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.07)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
          >
            Open in this tab
          </a>

          {/* Close */}
          <button
            onClick={closeAndReturn}
            style={styles.closeBtn}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(6,182,212,0.18)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(6,182,212,0.08)"; }}
          >
            ← Close Tab &amp; Return to askGenie
          </button>
        </div>

        <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.22)", marginTop: "24px", textAlign: "center", maxWidth: "320px" }}>
          Tip: "Open in this tab" then use your browser back button to return here and close the tab.
        </p>
      </div>

      <Footer onClose={closeAndReturn} />
    </div>
  );
}

// ── Shared sub-components ────────────────────────────────────────────────────

function Header({ url, onClose }: { url: string; onClose: () => void }) {
  return (
    <div style={styles.header}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
        {/* askGenie logo mark */}
        <span style={{ fontSize: "18px", fontWeight: 900, color: "#22d3ee", letterSpacing: "-0.03em", whiteSpace: "nowrap" }}>
          askGenie
        </span>
        {url && (
          <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.28)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "260px" }}>
            Resource Viewer
          </span>
        )}
      </div>
      <button
        onClick={onClose}
        style={styles.headerBtn}
        title="Close this tab and return to askGenie"
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(6,182,212,0.24)"; (e.currentTarget as HTMLElement).style.color = "#ffffff"; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(6,182,212,0.10)"; (e.currentTarget as HTMLElement).style.color = "#67e8f9"; }}
      >
        ← Back to askGenie
      </button>
    </div>
  );
}

function Footer({ onClose }: { onClose: () => void }) {
  return (
    <div style={styles.footer}>
      <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.22)" }}>
        askGenie — Student Aid Hub
      </span>
      <button
        onClick={onClose}
        style={styles.footerBtn}
        title="Close tab and return to askGenie"
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(6,182,212,0.22)"; (e.currentTarget as HTMLElement).style.color = "#ffffff"; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(6,182,212,0.10)"; (e.currentTarget as HTMLElement).style.color = "#67e8f9"; }}
      >
        🔮 Open askGenie
      </button>
    </div>
  );
}

function Btn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} style={styles.closeBtn}>
      {children}
    </button>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    background: "linear-gradient(160deg, #060e30 0%, #07143d 50%, #060e30 100%)",
    fontFamily: "system-ui, -apple-system, sans-serif",
    color: "white",
  },
  header: {
    position: "sticky",
    top: 0,
    zIndex: 50,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "12px 24px",
    background: "rgba(4,14,44,0.97)",
    borderBottom: "1px solid rgba(6,182,212,0.16)",
    backdropFilter: "blur(16px)",
    WebkitBackdropFilter: "blur(16px)",
    gap: "12px",
  },
  headerBtn: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "8px 16px",
    background: "rgba(6,182,212,0.10)",
    color: "#67e8f9",
    border: "1px solid rgba(6,182,212,0.25)",
    borderRadius: "9px",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: 700,
    whiteSpace: "nowrap",
    transition: "background 0.15s, color 0.15s",
  },
  body: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "48px 24px",
    gap: "20px",
  },
  card: {
    display: "flex",
    alignItems: "flex-start",
    gap: "14px",
    padding: "20px 24px",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(6,182,212,0.16)",
    borderRadius: "16px",
    width: "100%",
    maxWidth: "340px",
    marginBottom: "8px",
  },
  cardIcon: {
    fontSize: "24px",
    lineHeight: 1,
    flexShrink: 0,
    marginTop: "2px",
  },
  primaryBtn: {
    display: "block",
    textAlign: "center",
    textDecoration: "none",
    padding: "13px 24px",
    background: "rgba(6,182,212,0.16)",
    color: "#67e8f9",
    border: "1px solid rgba(6,182,212,0.32)",
    borderRadius: "11px",
    fontSize: "14px",
    fontWeight: 700,
    cursor: "pointer",
    transition: "background 0.15s",
  },
  secondaryBtn: {
    display: "block",
    textAlign: "center",
    textDecoration: "none",
    padding: "11px 24px",
    background: "transparent",
    color: "rgba(255,255,255,0.45)",
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: "11px",
    fontSize: "13px",
    fontWeight: 500,
    cursor: "pointer",
    transition: "background 0.15s",
  },
  closeBtn: {
    display: "block",
    textAlign: "center",
    padding: "11px 24px",
    background: "rgba(6,182,212,0.08)",
    color: "#67e8f9",
    border: "1px solid rgba(6,182,212,0.18)",
    borderRadius: "11px",
    fontSize: "13px",
    fontWeight: 600,
    cursor: "pointer",
    transition: "background 0.15s",
  },
  footer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "14px 24px",
    borderTop: "1px solid rgba(255,255,255,0.06)",
    background: "rgba(4,10,32,0.60)",
  },
  footerBtn: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "8px 16px",
    background: "rgba(6,182,212,0.10)",
    color: "#67e8f9",
    border: "1px solid rgba(6,182,212,0.22)",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: 700,
    transition: "background 0.15s, color 0.15s",
  },
};

// ── Page export ──────────────────────────────────────────────────────────────

export default function OpenResourcePage() {
  return (
    <Suspense
      fallback={
        <div style={{ ...styles.page, alignItems: "center", justifyContent: "center" }}>
          <div style={{
            width: "36px", height: "36px",
            border: "3px solid rgba(6,182,212,0.15)",
            borderTopColor: "#22d3ee",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      }
    >
      <ResourceViewer />
    </Suspense>
  );
}
