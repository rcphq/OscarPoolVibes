import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const alt = "OscarPoolVibes - Oscar Prediction Pools";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #0a0f2e 0%, #1a1f4e 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            fontSize: 72,
            fontWeight: 700,
            color: "#b3862a",
            marginBottom: 16,
          }}
        >
          OscarPoolVibes
        </div>
        <div
          style={{
            fontSize: 32,
            color: "#e8e0d0",
            maxWidth: 600,
            textAlign: "center",
          }}
        >
          Predict the Oscars with Friends
        </div>
      </div>
    ),
    { ...size },
  );
}
