"use client";

import { useEffect, useRef, useState } from "react";

const vertexShaderSource = `
attribute vec2 a_position;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

const fragmentShaderSource = `
precision mediump float;

uniform vec2 u_resolution;
uniform float u_time;

float softCircle(vec2 uv, vec2 center, float radius) {
  float dist = length(uv - center);
  return smoothstep(radius, radius * 0.18, dist);
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution.xy;
  vec2 p = uv;
  p.x *= u_resolution.x / u_resolution.y;

  vec3 navy = vec3(0.043, 0.165, 0.235);
  vec3 deepTeal = vec3(0.043, 0.361, 0.424);
  vec3 teal = vec3(0.102, 0.541, 0.455);
  vec3 seafoam = vec3(0.455, 0.753, 0.635);

  float t = u_time * 0.055;
  vec3 color = mix(navy, deepTeal, smoothstep(0.05, 1.05, uv.y + uv.x * 0.45));

  vec2 c1 = vec2(0.18 + 0.10 * sin(t * 1.3), 0.20 + 0.06 * cos(t * 1.1));
  vec2 c2 = vec2(1.10 + 0.12 * cos(t * 0.9), 0.80 + 0.08 * sin(t * 1.2));
  vec2 c3 = vec2(0.76 + 0.08 * sin(t * 0.7), 0.42 + 0.07 * cos(t * 1.5));

  float glow1 = softCircle(p, c1, 0.70);
  float glow2 = softCircle(p, c2, 0.82);
  float glow3 = softCircle(p, c3, 0.48);
  float ribbon = 0.5 + 0.5 * sin((p.x * 2.1 - p.y * 1.35) + t * 1.35);

  color = mix(color, teal, glow1 * 0.30);
  color = mix(color, seafoam, glow2 * 0.20);
  color = mix(color, deepTeal, glow3 * 0.25);
  color += seafoam * ribbon * 0.025;

  float vignette = smoothstep(0.92, 0.20, length(uv - vec2(0.50, 0.52)));
  color *= 0.72 + vignette * 0.42;

  gl_FragColor = vec4(color, 1.0);
}
`;

function createShader(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}

export default function AnimatedLoginBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [useStaticFallback, setUseStaticFallback] = useState(false);

  useEffect(() => {
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (motionQuery.matches) {
      setUseStaticFallback(true);
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl", {
      alpha: true,
      antialias: false,
      depth: false,
      stencil: false,
      preserveDrawingBuffer: false,
    });

    if (!gl) {
      setUseStaticFallback(true);
      return;
    }

    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
    const program = gl.createProgram();

    if (!vertexShader || !fragmentShader || !program) {
      setUseStaticFallback(true);
      return;
    }

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      gl.deleteProgram(program);
      setUseStaticFallback(true);
      return;
    }

    const positionLocation = gl.getAttribLocation(program, "a_position");
    const resolutionLocation = gl.getUniformLocation(program, "u_resolution");
    const timeLocation = gl.getUniformLocation(program, "u_time");
    const buffer = gl.createBuffer();

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 3, -1, -1, 3]),
      gl.STATIC_DRAW,
    );

    let animationFrame = 0;
    let start = performance.now();

    const resize = () => {
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
      const width = Math.floor(window.innerWidth * pixelRatio);
      const height = Math.floor(window.innerHeight * pixelRatio);

      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }

      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      gl.viewport(0, 0, width, height);
    };

    const render = (now: number) => {
      resize();
      gl.useProgram(program);
      gl.enableVertexAttribArray(positionLocation);
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
      gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
      gl.uniform1f(timeLocation, (now - start) / 1000);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      animationFrame = window.requestAnimationFrame(render);
    };

    const handleMotionChange = (event: MediaQueryListEvent) => {
      if (event.matches) {
        window.cancelAnimationFrame(animationFrame);
        setUseStaticFallback(true);
      } else {
        start = performance.now();
        setUseStaticFallback(false);
        animationFrame = window.requestAnimationFrame(render);
      }
    };

    resize();
    animationFrame = window.requestAnimationFrame(render);
    window.addEventListener("resize", resize);
    motionQuery.addEventListener("change", handleMotionChange);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", resize);
      motionQuery.removeEventListener("change", handleMotionChange);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
      style={{
        background:
          "radial-gradient(circle at 16% 24%, rgba(116,192,162,0.22), transparent 34%), radial-gradient(circle at 86% 18%, rgba(26,138,116,0.28), transparent 36%), linear-gradient(135deg, #0B2A3C 0%, #0B5C6C 55%, #1A8A74 100%)",
      }}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full"
        style={{
          opacity: useStaticFallback ? 0 : 1,
          transition: "opacity 500ms ease",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at center, transparent 0%, transparent 46%, rgba(5,20,30,0.28) 72%, rgba(5,20,30,0.50) 100%)",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(5,20,30,0.10) 0%, transparent 42%, rgba(5,20,30,0.20) 100%)",
        }}
      />
    </div>
  );
}
