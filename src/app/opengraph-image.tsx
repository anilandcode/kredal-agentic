import { ImageResponse } from "next/og";

export const alt = "Kredal — UAE SME bank-readiness platform";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** OG card — the Kredal mark + wordmark on warm ink. */
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
          <svg width="76" height="76" viewBox="0 0 100 100" fill="none">
            <g fill="#f7f7f4" opacity="0.9">
              <path
                fillOpacity="0.82"
                d="M12.716 15.7284L2.2854 66.7298L2.3236 66.768L41.753 58.694L44.1095 47.1219L12.716 15.7284Z"
              />
              <path
                fillOpacity="0.82"
                d="M33.7363 98.1807L84.7183 87.7307L53.3249 56.3373L41.7529 58.694L33.6789 98.1233L33.7363 98.1807Z"
              />
              <path
                fillOpacity="0.82"
                d="M67.2265 2.78356L16.2255 13.2138L47.619 44.6073L59.2102 42.2315L67.2647 2.82176L67.2265 2.78356Z"
              />
              <path
                fillOpacity="0.82"
                d="M88.228 85.2164L98.658 34.215L98.6197 34.1767L59.2099 42.2313L56.8341 53.8225L88.228 85.2164Z"
              />
              <path d="M2.32373 66.7681L33.6791 98.1234L41.753 58.6941L2.32373 66.7681Z" />
              <path d="M98.6205 34.1763L67.2651 2.821L59.21 42.2316L98.6205 34.1763Z" />
            </g>
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
