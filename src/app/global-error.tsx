"use client";

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", background: "#faf7f2", color: "#1f1d1a", padding: "4rem 1.5rem" }}>
        <h1 style={{ fontWeight: 400 }}>Something went wrong.</h1>
        <p>Please refresh the page or try again in a moment.</p>
        <button type="button" onClick={reset} style={{ marginTop: 16, padding: "12px 20px", background: "#3e5242", color: "#faf7f2", border: 0 }}>
          Try again
        </button>
      </body>
    </html>
  );
}
