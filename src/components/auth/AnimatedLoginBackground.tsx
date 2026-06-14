"use client";

import { useEffect, useRef, useState } from "react";

const STATIC_BACKGROUND =
  "linear-gradient(160deg, #0B2A3C 0%, #0B5C6C 58%, #0d6e7e 100%)";

const VERTEX_SHADER_SOURCE = `
attribute vec4 p;
void main() {
  gl_Position = p;
}
`;

const FRAGMENT_SHADER_SOURCE = `
precision mediump float;

uniform vec2 R;
uniform float T;
uniform vec2 M;

void main() {
  vec2 uv = gl_FragCoord.xy / R;
  vec2 c = (2.0 * gl_FragCoord.xy - R) / min(R.x, R.y);
  float t = T * 0.32;
  vec2 m = 2.0 * (M / R) - 1.0;
  vec2 d = c;

  for (float i = 1.0; i < 7.0; i++) {
    d.x += 0.38 / i * cos(i * 2.1 * d.y + t + m.x * 3.14159);
    d.y += 0.38 / i * cos(i * 2.1 * d.x + t + m.y * 3.14159);
  }

  float w = abs(sin(d.x + d.y + t));
  float g = smoothstep(0.88, 0.06, w);

  vec3 navy = vec3(0.043, 0.165, 0.235);
  vec3 teal = vec3(0.043, 0.361, 0.424);
  vec3 seafoam = vec3(0.455, 0.753, 0.635);
  vec3 lteal = vec3(0.051, 0.431, 0.494);

  vec3 base = mix(navy, teal, clamp(uv.x * 0.4 + uv.y * 0.7, 0.0, 1.0));
  vec3 glow = mix(lteal, seafoam, 0.5);
  vec3 col = mix(base, glow, g * 0.42);

  gl_FragColor = vec4(col, 1.0);
}
`;

function createShader(
  gl: WebGLRenderingContext,
  type: number,
  source: string,
) {
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
  const [isWebGlActive, setIsWebGlActive] = useState(false);

  useEffect(() => {
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (motionQuery.matches) {
      setIsWebGlActive(false);
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl", {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      preserveDrawingBuffer: false,
    });

    if (!gl) {
      setIsWebGlActive(false);
      return;
    }

    const vertexShader = createShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER_SOURCE);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER_SOURCE);
    const program = gl.createProgram();

    if (!vertexShader || !fragmentShader || !program) {
      if (vertexShader) gl.deleteShader(vertexShader);
      if (fragmentShader) gl.deleteShader(fragmentShader);
      setIsWebGlActive(false);
      return;
    }

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      gl.deleteProgram(program);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
      setIsWebGlActive(false);
      return;
    }

    const buffer = gl.createBuffer();
    const positionLocation = gl.getAttribLocation(program, "p");
    const resolutionLocation = gl.getUniformLocation(program, "R");
    const timeLocation = gl.getUniformLocation(program, "T");
    const mouseLocation = gl.getUniformLocation(program, "M");

    if (
      !buffer ||
      positionLocation < 0 ||
      !resolutionLocation ||
      !timeLocation ||
      !mouseLocation
    ) {
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
      setIsWebGlActive(false);
      return;
    }

    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW,
    );
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    let animationFrame = 0;
    let pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    let pointerX = window.innerWidth * 0.5;
    let pointerY = window.innerHeight * 0.5;
    let startTime = performance.now();

    const resize = () => {
      pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      const width = Math.max(1, Math.floor(window.innerWidth * pixelRatio));
      const height = Math.max(1, Math.floor(window.innerHeight * pixelRatio));

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
      gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
      gl.uniform1f(timeLocation, (now - startTime) / 1000);
      gl.uniform2f(
        mouseLocation,
        pointerX * pixelRatio,
        (window.innerHeight - pointerY) * pixelRatio,
      );
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      animationFrame = window.requestAnimationFrame(render);
    };

    const handlePointerMove = (event: PointerEvent) => {
      pointerX = event.clientX;
      pointerY = event.clientY;
    };

    const handleTouchMove = (event: TouchEvent) => {
      const touch = event.touches[0];
      if (!touch) return;
      pointerX = touch.clientX;
      pointerY = touch.clientY;
    };

    const handleMotionChange = (event: MediaQueryListEvent) => {
      if (event.matches) {
        window.cancelAnimationFrame(animationFrame);
        setIsWebGlActive(false);
        return;
      }

      startTime = performance.now();
      setIsWebGlActive(true);
      animationFrame = window.requestAnimationFrame(render);
    };

    resize();
    setIsWebGlActive(true);
    animationFrame = window.requestAnimationFrame(render);

    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    motionQuery.addEventListener("change", handleMotionChange);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("touchmove", handleTouchMove);
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
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      style={{ background: STATIC_BACKGROUND }}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full"
        style={{
          opacity: isWebGlActive ? 1 : 0,
          transition: "opacity 500ms ease",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 38%, rgba(7,22,32,0.55) 100%)",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(3,24,38,0.12) 0%, transparent 42%, rgba(3,24,38,0.20) 100%)",
        }}
      />
    </div>
  );
}
