import { ImageResponse } from "next/og";

export const alt = "Kredal — UAE SME bank-readiness platform";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0b1120",
          backgroundImage: "linear-gradient(135deg, #0b1120 0%, #1e3a8a 100%)",
          color: "#f8fafc",
          fontFamily: "sans-serif",
        }}
      >
        <svg width="120" height="120" viewBox="0 0 64 64">
          <rect width="64" height="64" rx="14" fill="#1e3a8a" />
          <path
            d="M32 12l15 6v12c0 10.5-6.4 18.9-15 22-8.6-3.1-15-11.5-15-22V18l15-6z"
            fill="none"
            stroke="#f8fafc"
            strokeWidth="4"
            strokeLinejoin="round"
          />
          <path
            d="M25 32l5 5 10-10"
            fill="none"
            stroke="#f8fafc"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <div style={{ fontSize: 84, fontWeight: 700, marginTop: 32 }}>Kredal</div>
        <div style={{ fontSize: 32, color: "#dbe4f8", marginTop: 16, textAlign: "center" }}>
          Know why a UAE bank would reject your file — before you apply.
        </div>
      </div>
    ),
    size
  );
}
