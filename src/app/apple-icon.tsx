import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/**
 * iOS home-screen icon. Unlike the favicon this one sits on a solid ink field:
 * an app icon is composited over an unknown wallpaper, so a free-standing mark
 * would be unreadable. `apple-icon` does not accept SVG, hence a generated PNG.
 */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#14120b",
        }}
      >
        <svg width="120" height="120" viewBox="0 0 100 100" fill="none">
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
      </div>
    ),
    { ...size }
  );
}
