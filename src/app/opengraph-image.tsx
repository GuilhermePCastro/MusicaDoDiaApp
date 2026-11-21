import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "Música do Dia — Adivinhe a música pela letra";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image() {
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
          background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 55%, #312e81 100%)",
          color: "#ffffff",
          padding: "60px",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "20px",
            marginBottom: "28px",
          }}
        >
          <div
            style={{
              width: "84px",
              height: "84px",
              borderRadius: "24px",
              background: "#4f46e5",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "46px",
              boxShadow: "0 12px 30px rgba(79, 70, 229, 0.45)",
            }}
          >
            🎵
          </div>
          <div
            style={{
              fontSize: "64px",
              fontWeight: 800,
              letterSpacing: "-0.02em",
            }}
          >
            Música do Dia
          </div>
        </div>

        <div
          style={{
            fontSize: "32px",
            color: "#c7d2fe",
            textAlign: "center",
            maxWidth: "860px",
            lineHeight: 1.4,
            marginBottom: "44px",
          }}
        >
          Você consegue adivinhar a música de hoje pelos trechos da letra em até 4 tentativas?
        </div>

        <div
          style={{
            display: "flex",
            gap: "16px",
          }}
        >
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "14px",
              background: "#ef4444",
            }}
          />
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "14px",
              background: "#f59e0b",
            }}
          />
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "14px",
              background: "#10b981",
            }}
          />
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "14px",
              background: "rgba(255, 255, 255, 0.18)",
            }}
          />
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
