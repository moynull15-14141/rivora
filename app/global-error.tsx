"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[GlobalError]", error);
  }, [error]);

  return (
    <html>
      <body>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "sans-serif",
            padding: "1rem",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <h1 style={{ color: "#0e7c7b", fontSize: "1.5rem", fontWeight: 700 }}>
              Something went wrong
            </h1>
            <p style={{ color: "#6b7280", marginTop: "0.5rem", fontSize: "0.875rem" }}>
              {error.message}
            </p>
            <button
              onClick={reset}
              style={{
                marginTop: "1.5rem",
                background: "#0e7c7b",
                color: "white",
                border: "none",
                borderRadius: "0.5rem",
                padding: "0.5rem 1.5rem",
                cursor: "pointer",
                fontSize: "0.875rem",
                fontWeight: 600,
              }}
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
