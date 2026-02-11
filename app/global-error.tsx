"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif", background: "#080808", color: "#f5f5f5" }}>
        <main
          style={{
            minHeight: "100vh",
            display: "grid",
            placeItems: "center",
            padding: "24px",
          }}
        >
          <section
            style={{
              width: "100%",
              maxWidth: "520px",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: "16px",
              padding: "24px",
              background: "rgba(255,255,255,0.03)",
            }}
          >
            <h1 style={{ margin: 0, fontSize: "1.5rem" }}>Something went wrong</h1>
            <p style={{ marginTop: "10px", marginBottom: "16px", color: "rgba(245,245,245,0.8)", lineHeight: 1.5 }}>
              An unexpected error occurred while rendering this page.
            </p>
            <button
              type="button"
              onClick={reset}
              style={{
                border: "1px solid rgba(245,245,245,0.25)",
                borderRadius: "10px",
                padding: "10px 14px",
                color: "#f5f5f5",
                background: "transparent",
                cursor: "pointer",
              }}
            >
              Try again
            </button>
          </section>
        </main>
      </body>
    </html>
  );
}
