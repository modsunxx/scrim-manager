import { ImageResponse } from "next/og";

export const size = {
  width: 32,
  height: 32,
};
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #09090b 0%, #064e3b 100%)",
        border: "2px solid #10b981",
        borderRadius: "8px",
        color: "#34d399",
        fontSize: "16px",
        fontWeight: 900,
        letterSpacing: "-0.05em",
      }}
    >
      SB
    </div>,
    { ...size },
  );
}
