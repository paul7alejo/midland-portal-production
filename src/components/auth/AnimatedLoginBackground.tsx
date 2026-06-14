"use client";

const loginBackgroundCss = `
@keyframes login-blob-one {
  0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
  24% { transform: translate3d(150px, -92px, 0) scale(1.12); }
  58% { transform: translate3d(-96px, 70px, 0) scale(0.96); }
}

@keyframes login-blob-two {
  0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
  22% { transform: translate3d(-135px, 98px, 0) scale(1.10); }
  62% { transform: translate3d(104px, -118px, 0) scale(0.94); }
}

@keyframes login-blob-three {
  0%, 100% { transform: translate3d(0, 0, 0) scale(1); opacity: 0.72; }
  26% { transform: translate3d(-118px, -84px, 0) scale(1.16); opacity: 0.95; }
  64% { transform: translate3d(92px, 116px, 0) scale(0.92); opacity: 0.68; }
}

@keyframes login-blob-four {
  0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
  28% { transform: translate3d(110px, 72px, 0) scale(1.08); }
  68% { transform: translate3d(-126px, -64px, 0) scale(0.90); }
}

@media (prefers-reduced-motion: no-preference) {
  .login-motion-blob-one { animation: login-blob-one 18s ease-in-out infinite; }
  .login-motion-blob-two { animation: login-blob-two 24s ease-in-out infinite; }
  .login-motion-blob-three { animation: login-blob-three 32s ease-in-out infinite; }
  .login-motion-blob-four { animation: login-blob-four 40s ease-in-out infinite; }
}

@media (prefers-reduced-motion: reduce) {
  .login-motion-blob-one,
  .login-motion-blob-two,
  .login-motion-blob-three,
  .login-motion-blob-four {
    animation: none !important;
  }
}
`;

export default function AnimatedLoginBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      style={{
        background:
          "linear-gradient(135deg, #0B2A3C 0%, #0B5C6C 42%, #0F766E 70%, #1A8A74 100%)",
      }}
    >
      <style>{loginBackgroundCss}</style>

      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 18% 18%, rgba(143,214,179,0.16), transparent 28%), radial-gradient(circle at 82% 8%, rgba(116,192,162,0.12), transparent 26%)",
        }}
      />

      <div
        className="login-motion-blob-one absolute rounded-full"
        style={{
          top: "-18%",
          left: "-14%",
          width: "70vw",
          height: "70vw",
          minWidth: "620px",
          minHeight: "620px",
          background:
            "radial-gradient(circle, rgba(116,192,162,0.48) 0%, rgba(26,138,116,0.34) 36%, rgba(11,92,108,0.12) 62%, transparent 74%)",
          filter: "blur(34px)",
          willChange: "transform",
        }}
      />

      <div
        className="login-motion-blob-two absolute rounded-full"
        style={{
          right: "-16%",
          bottom: "-20%",
          width: "76vw",
          height: "76vw",
          minWidth: "680px",
          minHeight: "680px",
          background:
            "radial-gradient(circle, rgba(143,214,179,0.38) 0%, rgba(26,138,116,0.26) 42%, rgba(3,24,38,0.18) 66%, transparent 76%)",
          filter: "blur(42px)",
          willChange: "transform",
        }}
      />

      <div
        className="login-motion-blob-three absolute rounded-full"
        style={{
          top: "20%",
          right: "8%",
          width: "46vw",
          height: "46vw",
          minWidth: "420px",
          minHeight: "420px",
          background:
            "radial-gradient(circle, rgba(143,214,179,0.34) 0%, rgba(116,192,162,0.24) 38%, transparent 70%)",
          filter: "blur(26px)",
          willChange: "transform, opacity",
        }}
      />

      <div
        className="login-motion-blob-four absolute rounded-full"
        style={{
          left: "18%",
          bottom: "-18%",
          width: "54vw",
          height: "54vw",
          minWidth: "500px",
          minHeight: "500px",
          background:
            "radial-gradient(circle, rgba(3,24,38,0.55) 0%, rgba(11,42,60,0.28) 42%, transparent 72%)",
          filter: "blur(38px)",
          willChange: "transform",
        }}
      />

      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 92% 88% at 50% 44%, transparent 24%, rgba(5,20,30,0.24) 72%, rgba(5,20,30,0.54) 100%)",
        }}
      />

      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(3,24,38,0.18) 0%, transparent 34%, rgba(3,24,38,0.22) 100%)",
        }}
      />
    </div>
  );
}
