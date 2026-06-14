"use client";

import { useEffect } from "react";

// Keyframe names are prefixed "lb-" to avoid collisions with any other global CSS.
const STYLE_ID = "login-animated-bg-keyframes";

const KEYFRAME_CSS = `
@keyframes lb-drift-a {
  0%, 100% { transform: translate(0px,   0px)  scale(1);    }
  38%       { transform: translate(72px, -52px) scale(1.09); }
  70%       { transform: translate(-42px, 36px) scale(0.93); }
}
@keyframes lb-drift-b {
  0%, 100% { transform: translate(0px,    0px)  scale(1);    }
  42%       { transform: translate(-78px, 58px) scale(1.07); }
  75%       { transform: translate(44px, -62px) scale(0.90); }
}
@keyframes lb-drift-c {
  0%, 100% { transform: translate(0px,  0px)  scale(1);    }
  52%       { transform: translate(58px, 46px) scale(1.12); }
}
@keyframes lb-drift-d {
  0%, 100% { transform: translate(0px,   0px)  scale(1);    }
  30%       { transform: translate(-58px,-36px) scale(0.90); }
  64%       { transform: translate(34px,  56px) scale(1.07); }
}
@media (prefers-reduced-motion: no-preference) {
  .lb-blob-a { animation: lb-drift-a 22s ease-in-out infinite; }
  .lb-blob-b { animation: lb-drift-b 28s ease-in-out infinite; }
  .lb-blob-c { animation: lb-drift-c 17s ease-in-out infinite; }
  .lb-blob-d { animation: lb-drift-d 24s ease-in-out infinite; }
}
`;

export default function AnimatedLoginBackground() {
  useEffect(() => {
    if (!document.getElementById(STYLE_ID)) {
      const el = document.createElement("style");
      el.id = STYLE_ID;
      el.textContent = KEYFRAME_CSS;
      document.head.appendChild(el);
    }
  }, []);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
      style={{
        background:
          "linear-gradient(135deg, #0B2A3C 0%, #0B5C6C 55%, #1A8A74 100%)",
      }}
    >
      {/* Blob A — teal, top-left */}
      <div
        className="lb-blob-a"
        style={{
          position: "absolute",
          top: "-10%",
          left: "-8%",
          width: "64%",
          height: "64%",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(26,138,116,0.55) 0%, rgba(11,92,108,0.22) 52%, transparent 72%)",
          filter: "blur(42px)",
        }}
      />
      {/* Blob B — seafoam, bottom-right */}
      <div
        className="lb-blob-b"
        style={{
          position: "absolute",
          bottom: "-14%",
          right: "-10%",
          width: "70%",
          height: "70%",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(116,192,162,0.42) 0%, rgba(26,138,116,0.16) 52%, transparent 72%)",
          filter: "blur(50px)",
        }}
      />
      {/* Blob C — deep teal, centre-right */}
      <div
        className="lb-blob-c"
        style={{
          position: "absolute",
          top: "16%",
          right: "2%",
          width: "50%",
          height: "54%",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(11,92,108,0.52) 0%, transparent 68%)",
          filter: "blur(36px)",
        }}
      />
      {/* Blob D — seafoam highlight, top-right */}
      <div
        className="lb-blob-d"
        style={{
          position: "absolute",
          top: "-6%",
          right: "12%",
          width: "42%",
          height: "46%",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(116,192,162,0.32) 0%, transparent 65%)",
          filter: "blur(30px)",
        }}
      />
      {/* Vignette — keeps edges dark so card text remains readable */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse 80% 80% at 50% 50%, transparent 28%, rgba(5,20,30,0.30) 76%, rgba(5,20,30,0.50) 100%)",
        }}
      />
    </div>
  );
}
