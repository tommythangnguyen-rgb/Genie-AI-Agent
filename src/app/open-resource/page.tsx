"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function ResourceRedirector() {
  const params = useSearchParams();
  const url = params.get("url") ?? "";
  const [counting, setCounting] = useState(true);

  useEffect(() => {
    if (!url) return;
    // Small delay so the "Back to askGenie" button is visible
    const t = setTimeout(() => {
      setCounting(false);
      window.location.href = url;
    }, 800);
    return () => clearTimeout(t);
  }, [url]);

  const handleClose = () => {
    if (typeof window !== "undefined") window.close();
  };

  if (!url) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#060e30", color: "white" }}>
        <div style={{ textAlign: "center" }}>
          <p style={{ color: "rgba(255,255,255,0.5)", marginBottom: "1rem" }}>No resource URL provided.</p>
          <button onClick={handleClose} style={{ padding: "8px 16px", background: "#0891b2", color: "white", borderRadius: "8px", border: "none", cursor: "pointer" }}>
            ← Close Tab
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#060e30", fontFamily: "system-ui, sans-serif" }}>
      {/* Sticky header */}
      <div style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "10px 20px",
        background: "rgba(4,20,56,0.98)",
        borderBottom: "1px solid rgba(6,182,212,0.18)",
        backdropFilter: "blur(12px)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ fontSize: "16px", fontWeight: 800, color: "#22d3ee", letterSpacing: "-0.02em" }}>
            askGenie
          </span>
          <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.35)", maxWidth: "260px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            Opening: {url}
          </span>
        </div>
        <button
          onClick={handleClose}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "7px 14px",
            background: "rgba(6,182,212,0.12)",
            color: "#67e8f9",
            border: "1px solid rgba(6,182,212,0.28)",
            borderRadius: "8px",
            cursor: "pointer",
            fontSize: "12px",
            fontWeight: 600,
            transition: "all 0.15s",
          }}
          onMouseEnter={e => { (e.target as HTMLElement).style.background = "rgba(6,182,212,0.22)"; }}
          onMouseLeave={e => { (e.target as HTMLElement).style.background = "rgba(6,182,212,0.12)"; }}
        >
          ← Back to askGenie
        </button>
      </div>

      {/* Loading body */}
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "calc(100vh - 52px)",
        gap: "20px",
        padding: "40px 20px",
        textAlign: "center",
      }}>
        {counting ? (
          <>
            <div style={{
              width: "40px",
              height: "40px",
              border: "3px solid rgba(6,182,212,0.15)",
              borderTopColor: "#22d3ee",
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
            }} />
            <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "14px" }}>
              Opening resource…
            </p>
            <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "11px", maxWidth: "320px", wordBreak: "break-all" }}>
              {url}
            </p>
          </>
        ) : (
          <>
            <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "14px" }}>
              Redirecting…
            </p>
            <a href={url} style={{ color: "#22d3ee", fontSize: "12px", textDecoration: "underline" }}>
              Click here if not redirected automatically
            </a>
          </>
        )}
        <button
          onClick={handleClose}
          style={{
            marginTop: "8px",
            padding: "10px 24px",
            background: "rgba(6,182,212,0.12)",
            color: "#67e8f9",
            border: "1px solid rgba(6,182,212,0.28)",
            borderRadius: "10px",
            cursor: "pointer",
            fontSize: "13px",
            fontWeight: 600,
          }}
        >
          ← Close Tab & Return to askGenie
        </button>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

export default function OpenResourcePage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", background: "#060e30", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: "32px", height: "32px", border: "2px solid rgba(6,182,212,0.2)", borderTopColor: "#22d3ee", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    }>
      <ResourceRedirector />
    </Suspense>
  );
}
