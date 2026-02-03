"use client";

import { useEffect, useRef } from "react";
import {
  Scene,
  OrthographicCamera,
  WebGLRenderer,
  PlaneGeometry,
  Mesh,
  ShaderMaterial,
  Vector3,
  Vector2,
  Clock,
} from "three";

const vertexShader = `
precision highp float;

void main() {
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const fragmentShader = `
precision highp float;

uniform float iTime;
uniform vec3  iResolution;
uniform float animationSpeed;

uniform bool enableTop;
uniform bool enableMiddle;
uniform bool enableBottom;

uniform int topLineCount;
uniform int middleLineCount;
uniform int bottomLineCount;

uniform float topLineDistance;
uniform float middleLineDistance;
uniform float bottomLineDistance;

uniform vec3 topWavePosition;
uniform vec3 middleWavePosition;
uniform vec3 bottomWavePosition;

uniform vec2 iMouse;
uniform bool interactive;
uniform float bendRadius;
uniform float bendStrength;
uniform float bendInfluence;

uniform bool parallax;
uniform float parallaxStrength;
uniform vec2 parallaxOffset;

uniform vec3 lineGradient[8];
uniform int lineGradientCount;

const vec3 BLACK = vec3(0.0);
const vec3 PINK  = vec3(233.0, 71.0, 245.0) / 255.0;
const vec3 BLUE  = vec3(47.0,  75.0, 162.0) / 255.0;

mat2 rotate(float r) {
  return mat2(cos(r), sin(r), -sin(r), cos(r));
}

vec3 background_color(vec2 uv) {
  vec3 col = vec3(0.0);

  float y = sin(uv.x - 0.2) * 0.3 - 0.1;
  float m = uv.y - y;

  col += mix(BLUE, BLACK, smoothstep(0.0, 1.0, abs(m)));
  col += mix(PINK, BLACK, smoothstep(0.0, 1.0, abs(m - 0.8)));
  return col * 0.5;
}

vec3 getLineColor(float t, vec3 baseColor) {
  if (lineGradientCount <= 0) {
    return baseColor;
  }

  vec3 gradientColor;
  
  if (lineGradientCount == 1) {
    gradientColor = lineGradient[0];
  } else {
    float clampedT = clamp(t, 0.0, 0.9999);
    float scaled = clampedT * float(lineGradientCount - 1);
    int idx = int(floor(scaled));
    float f = fract(scaled);
    int idx2 = min(idx + 1, lineGradientCount - 1);

    vec3 c1 = lineGradient[idx];
    vec3 c2 = lineGradient[idx2];
    
    gradientColor = mix(c1, c2, f);
  }
  
  return gradientColor * 0.5;
}

  float wave(vec2 uv, float offset, vec2 screenUv, vec2 mouseUv, bool shouldBend) {
  float time = iTime * animationSpeed;

  float x_offset   = offset;
  float x_movement = time * 0.1;
  float amp        = sin(offset + time * 0.2) * 0.3;
  float y          = sin(uv.x + x_offset + x_movement) * amp;

  if (shouldBend) {
    vec2 d = screenUv - mouseUv;
    float influence = exp(-dot(d, d) * bendRadius); // radial falloff around cursor
    float bendOffset = (mouseUv.y - screenUv.y) * influence * bendStrength * bendInfluence;
    y += bendOffset;
  }

  float m = uv.y - y;
  return 0.0175 / max(abs(m) + 0.01, 1e-3) + 0.01;
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 baseUv = (2.0 * fragCoord - iResolution.xy) / iResolution.y;
  baseUv.y *= -1.0;
  
  if (parallax) {
    baseUv += parallaxOffset;
  }

  vec3 col = vec3(0.0);

  vec3 b = lineGradientCount > 0 ? vec3(0.0) : background_color(baseUv);

  vec2 mouseUv = vec2(0.0);
  if (interactive) {
    mouseUv = (2.0 * iMouse - iResolution.xy) / iResolution.y;
    mouseUv.y *= -1.0;
  }
  
  if (enableBottom) {
    for (int i = 0; i < bottomLineCount; ++i) {
      float fi = float(i);
      float t = fi / max(float(bottomLineCount - 1), 1.0);
      vec3 lineCol = getLineColor(t, b);
      
      float angle = bottomWavePosition.z * log(length(baseUv) + 1.0);
      vec2 ruv = baseUv * rotate(angle);
      col += lineCol * wave(
        ruv + vec2(bottomLineDistance * fi + bottomWavePosition.x, bottomWavePosition.y),
        1.5 + 0.2 * fi,
        baseUv,
        mouseUv,
        interactive
      ) * 0.2;
    }
  }

  if (enableMiddle) {
    for (int i = 0; i < middleLineCount; ++i) {
      float fi = float(i);
      float t = fi / max(float(middleLineCount - 1), 1.0);
      vec3 lineCol = getLineColor(t, b);
      
      float angle = middleWavePosition.z * log(length(baseUv) + 1.0);
      vec2 ruv = baseUv * rotate(angle);
      col += lineCol * wave(
        ruv + vec2(middleLineDistance * fi + middleWavePosition.x, middleWavePosition.y),
        2.0 + 0.15 * fi,
        baseUv,
        mouseUv,
        interactive
      );
    }
  }

  if (enableTop) {
    for (int i = 0; i < topLineCount; ++i) {
      float fi = float(i);
      float t = fi / max(float(topLineCount - 1), 1.0);
      vec3 lineCol = getLineColor(t, b);
      
      float angle = topWavePosition.z * log(length(baseUv) + 1.0);
      vec2 ruv = baseUv * rotate(angle);
      ruv.x *= -1.0;
      col += lineCol * wave(
        ruv + vec2(topLineDistance * fi + topWavePosition.x, topWavePosition.y),
        1.0 + 0.2 * fi,
        baseUv,
        mouseUv,
        interactive
      ) * 0.1;
    }
  }

  fragColor = vec4(col, 1.0);
}

void main() {
  vec4 color = vec4(0.0);
  mainImage(color, gl_FragCoord.xy);
  gl_FragColor = color;
}
`;

const MAX_GRADIENT_STOPS = 8;

type WavePosition = {
  x: number;
  y: number;
  rotate: number;
};

type FloatingLinesProps = {
  linesGradient?: string[];
  enabledWaves?: Array<"top" | "middle" | "bottom">;
  lineCount?: number | number[];
  lineDistance?: number | number[];
  topWavePosition?: WavePosition;
  middleWavePosition?: WavePosition;
  bottomWavePosition?: WavePosition;
  animationSpeed?: number;
  interactive?: boolean;
  bendRadius?: number;
  bendStrength?: number;
  mouseDamping?: number;
  parallax?: boolean;
  parallaxStrength?: number;
  mixBlendMode?: React.CSSProperties["mixBlendMode"];
};

function hexToVec3(hex: string): Vector3 {
  let value = hex.trim();

  if (value.startsWith("#")) {
    value = value.slice(1);
  }

  let r = 255;
  let g = 255;
  let b = 255;

  if (value.length === 3) {
    r = parseInt(value[0] + value[0], 16);
    g = parseInt(value[1] + value[1], 16);
    b = parseInt(value[2] + value[2], 16);
  } else if (value.length === 6) {
    r = parseInt(value.slice(0, 2), 16);
    g = parseInt(value.slice(2, 4), 16);
    b = parseInt(value.slice(4, 6), 16);
  }

  return new Vector3(r / 255, g / 255, b / 255);
}

export default function FloatingLines({
  linesGradient,
  enabledWaves = ["top", "middle", "bottom"],
  lineCount = [6],
  lineDistance = [5],
  topWavePosition,
  middleWavePosition,
  bottomWavePosition = { x: 2.0, y: -0.7, rotate: -1 },
  animationSpeed = 1,
  interactive = true,
  bendRadius = 5.0,
  bendStrength = -0.5,
  mouseDamping = 0.05,
  parallax = true,
  parallaxStrength = 0.2,
  mixBlendMode = "screen",
}: FloatingLinesProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  const getLineCount = (waveType: "top" | "middle" | "bottom"): number => {
    if (typeof lineCount === "number") return lineCount;
    if (!enabledWaves.includes(waveType)) return 0;
    const index = enabledWaves.indexOf(waveType);
    return lineCount[index] ?? 6;
  };

  const getLineDistance = (waveType: "top" | "middle" | "bottom"): number => {
    if (typeof lineDistance === "number") return lineDistance;
    if (!enabledWaves.includes(waveType)) return 0.1;
    const index = enabledWaves.indexOf(waveType);
    return lineDistance[index] ?? 0.1;
  };

  const topLineCount = enabledWaves.includes("top") ? getLineCount("top") : 0;
  const middleLineCount = enabledWaves.includes("middle")
    ? getLineCount("middle")
    : 0;
  const bottomLineCount = enabledWaves.includes("bottom")
    ? getLineCount("bottom")
    : 0;

  const topLineDistance = enabledWaves.includes("top")
    ? getLineDistance("top") * 0.01
    : 0.01;
  const middleLineDistance = enabledWaves.includes("middle")
    ? getLineDistance("middle") * 0.01
    : 0.01;
  const bottomLineDistance = enabledWaves.includes("bottom")
    ? getLineDistance("bottom") * 0.01
    : 0.01;

  useEffect(() => {
    if (!containerRef.current) return;

    const enableInteraction = interactive;
    const enableParallax = parallax;
    const isDecorative = !enableInteraction && !enableParallax;

    let targetMouse: Vector2 | null = enableInteraction
      ? new Vector2(-1000, -1000)
      : null;
    let currentMouse: Vector2 | null = enableInteraction
      ? new Vector2(-1000, -1000)
      : null;
    let targetInfluence = 0;
    let currentInfluence = 0;

    let targetParallax: Vector2 | null = enableParallax
      ? new Vector2(0, 0)
      : null;
    let currentParallax: Vector2 | null = enableParallax
      ? new Vector2(0, 0)
      : null;

    const scene = new Scene();

    const camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
    camera.position.z = 1;

    const renderer = new WebGLRenderer({
      antialias: !isDecorative,
      alpha: false,
      powerPreference: "low-power",
    });
    const maxDpr = isDecorative ? 1.5 : 2;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, maxDpr));
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.pointerEvents = enableInteraction
      ? "auto"
      : "none";
    containerRef.current.appendChild(renderer.domElement);

    const uniforms = {
      iTime: { value: 0 },
      iResolution: { value: new Vector3(1, 1, 1) },
      animationSpeed: { value: animationSpeed },

      enableTop: { value: enabledWaves.includes("top") },
      enableMiddle: { value: enabledWaves.includes("middle") },
      enableBottom: { value: enabledWaves.includes("bottom") },

      topLineCount: { value: topLineCount },
      middleLineCount: { value: middleLineCount },
      bottomLineCount: { value: bottomLineCount },

      topLineDistance: { value: topLineDistance },
      middleLineDistance: { value: middleLineDistance },
      bottomLineDistance: { value: bottomLineDistance },

      topWavePosition: {
        value: new Vector3(
          topWavePosition?.x ?? 10.0,
          topWavePosition?.y ?? 0.5,
          topWavePosition?.rotate ?? -0.4,
        ),
      },
      middleWavePosition: {
        value: new Vector3(
          middleWavePosition?.x ?? 5.0,
          middleWavePosition?.y ?? 0.0,
          middleWavePosition?.rotate ?? 0.2,
        ),
      },
      bottomWavePosition: {
        value: new Vector3(
          bottomWavePosition?.x ?? 2.0,
          bottomWavePosition?.y ?? -0.7,
          bottomWavePosition?.rotate ?? 0.4,
        ),
      },

      iMouse: { value: new Vector2(-1000, -1000) },
      interactive: { value: enableInteraction },
      bendRadius: { value: bendRadius },
      bendStrength: { value: bendStrength },
      bendInfluence: { value: 0 },

      parallax: { value: enableParallax },
      parallaxStrength: { value: parallaxStrength },
      parallaxOffset: { value: new Vector2(0, 0) },

      lineGradient: {
        value: Array.from(
          { length: MAX_GRADIENT_STOPS },
          () => new Vector3(1, 1, 1),
        ),
      },
      lineGradientCount: { value: 0 },
    };

    if (linesGradient && linesGradient.length > 0) {
      const stops = linesGradient.slice(0, MAX_GRADIENT_STOPS);
      uniforms.lineGradientCount.value = stops.length;

      stops.forEach((hex, i) => {
        const color = hexToVec3(hex);
        uniforms.lineGradient.value[i].set(color.x, color.y, color.z);
      });
    }

    const material = new ShaderMaterial({
      uniforms,
      vertexShader,
      fragmentShader,
    });

    const geometry = new PlaneGeometry(2, 2);
    const mesh = new Mesh(geometry, material);
    scene.add(mesh);

    const clock = new Clock();
    const targetFps = isDecorative ? 30 : 60;
    const frameInterval = 1 / targetFps;
    let lastFrame = 0;
    let isVisible = true;
    let isInView = true;
    let running = false;

    const setSize = () => {
      const el = containerRef.current!;
      const width = el.clientWidth || 1;
      const height = el.clientHeight || 1;

      renderer.setSize(width, height, false);

      const canvasWidth = renderer.domElement.width;
      const canvasHeight = renderer.domElement.height;
      uniforms.iResolution.value.set(canvasWidth, canvasHeight, 1);
    };

    setSize();

    const ro =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(setSize)
        : null;

    if (ro && containerRef.current) {
      ro.observe(containerRef.current);
    }

    const handlePointerMove = (event: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const dpr = renderer.getPixelRatio();

      targetMouse?.set(x * dpr, (rect.height - y) * dpr);
      targetInfluence = 1.0;

      if (enableParallax && targetParallax) {
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const offsetX = (x - centerX) / rect.width;
        const offsetY = -(y - centerY) / rect.height;
        targetParallax.set(
          offsetX * parallaxStrength,
          offsetY * parallaxStrength,
        );
      }
    };

    const handlePointerLeave = () => {
      targetInfluence = 0.0;
    };

    if (enableInteraction) {
      renderer.domElement.addEventListener("pointermove", handlePointerMove);
      renderer.domElement.addEventListener("pointerleave", handlePointerLeave);
    }

    let raf = 0;
    const renderLoop = () => {
      if (!running) return;
      raf = requestAnimationFrame(renderLoop);

      if (!isVisible || !isInView) return;

      const elapsed = clock.getElapsedTime();
      const delta = elapsed - lastFrame;
      if (delta < frameInterval) return;
      lastFrame = elapsed;

      uniforms.iTime.value = elapsed;

      if (enableInteraction && currentMouse && targetMouse) {
        currentMouse.lerp(targetMouse, mouseDamping);
        uniforms.iMouse.value.copy(currentMouse);

        currentInfluence += (targetInfluence - currentInfluence) * mouseDamping;
        uniforms.bendInfluence.value = currentInfluence;
      }

      if (enableParallax && currentParallax && targetParallax) {
        currentParallax.lerp(targetParallax, mouseDamping);
        uniforms.parallaxOffset.value.copy(currentParallax);
      }

      renderer.render(scene, camera);
    };

    const startLoop = () => {
      if (running) return;
      running = true;
      lastFrame = clock.getElapsedTime();
      raf = requestAnimationFrame(renderLoop);
    };

    const stopLoop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };

    const handleVisibilityChange = () => {
      isVisible = document.visibilityState === "visible";
      if (isVisible) {
        startLoop();
      } else {
        stopLoop();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    const io =
      typeof IntersectionObserver !== "undefined"
        ? new IntersectionObserver(
            ([entry]) => {
              isInView = entry?.isIntersecting ?? true;
              if (isInView) {
                startLoop();
              } else {
                stopLoop();
              }
            },
            { root: null, threshold: 0.1 },
          )
        : null;

    if (io && containerRef.current) {
      io.observe(containerRef.current);
    }

    startLoop();

    return () => {
      stopLoop();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (io && containerRef.current) {
        io.disconnect();
      }
      if (ro && containerRef.current) {
        ro.disconnect();
      }

      if (enableInteraction) {
        renderer.domElement.removeEventListener(
          "pointermove",
          handlePointerMove,
        );
        renderer.domElement.removeEventListener(
          "pointerleave",
          handlePointerLeave,
        );
      }

      geometry.dispose();
      material.dispose();
      renderer.dispose();
      if (renderer.domElement.parentElement) {
        renderer.domElement.parentElement.removeChild(renderer.domElement);
      }
    };
  }, [
    linesGradient,
    enabledWaves,
    lineCount,
    lineDistance,
    topWavePosition,
    middleWavePosition,
    bottomWavePosition,
    animationSpeed,
    interactive,
    bendRadius,
    bendStrength,
    mouseDamping,
    parallax,
    parallaxStrength,
  ]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full relative overflow-hidden floating-lines-container"
      style={{
        mixBlendMode: mixBlendMode,
      }}
    />
  );
}
