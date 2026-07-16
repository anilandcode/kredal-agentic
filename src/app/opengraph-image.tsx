import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Kredal — UAE SME bank-readiness platform";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** OG card — Visual Identity v2: K-check mark + wordmark on warm ink. */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#14120b",
          color: "#edecec",
          padding: 72,
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <svg width="64" height="64" viewBox="0 0 64 64">
            <rect width="64" height="64" rx="14" fill="#f7f7f4" />
            <path
              d="M22 16v32"
              stroke="#14120b"
              strokeWidth="7"
              strokeLinecap="round"
            />
            <path
              d="M44 16 24 33"
              stroke="#14120b"
              strokeWidth="7"
              strokeLinecap="round"
            />
            <path
              d="m28 37 8 11L50 28"
              fill="none"
              stroke="#14120b"
              strokeWidth="7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <div style={{ fontSize: 44, fontWeight: 600, letterSpacing: -1 }}>
            Kredal
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div
            style={{
              fontSize: 66,
              fontWeight: 600,
              lineHeight: 1.08,
              letterSpacing: -2,
              maxWidth: 980,
            }}
          >
            Know why a bank would reject your file — before you apply.
          </div>
          <div style={{ fontSize: 30, color: "#b7b6b2" }}>
            Readiness score · risk flags · bank-ready application pack
          </div>
        </div>

        <div style={{ display: "flex", fontSize: 24, color: "#8a897f" }}>
          kredal — UAE SME bank-readiness
        </div>
      </div>
    ),
    { ...size }
  );
}
