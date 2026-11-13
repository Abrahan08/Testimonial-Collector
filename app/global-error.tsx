"use client";

// Catches errors in the root layout itself, so it replaces the whole document. The root
// layout and Tailwind CSS are not loaded here, hence the inline styles. No error details
// are rendered (PRD 5.9).
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
          padding: 16,
          textAlign: "center",
          fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
          color: "#18181b",
          background: "#ffffff",
        }}
      >
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 600 }}>Something went wrong</h1>
        <p style={{ margin: 0, fontSize: 14, color: "#52525b", maxWidth: 360 }}>
          An unexpected error happened on our side. Please try again in a moment.
        </p>
        <button
          type="button"
          onClick={() => reset()}
          style={{
            cursor: "pointer",
            border: 0,
            borderRadius: 8,
            padding: "8px 14px",
            fontSize: 14,
            fontWeight: 500,
            color: "#fff",
            background: "#18181b",
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
