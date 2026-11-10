/** F1.05: deterministic CSS-to-backbuffer sizing and truthful frame telemetry. */
import type { RenderStats } from "./InstancedRenderer";

export type ResolutionPreset = "economy" | "balanced" | "sharp";
export const RESOLUTION_PRESETS = {
  economy: 0.75,
  balanced: 1,
  sharp: 1.25,
} as const;

export interface CanvasLimits {
  readonly maxDimension: number;
  readonly maxPixels: number;
}

export interface CanvasResolution {
  readonly width: number;
  readonly height: number;
  readonly cssWidth: number;
  readonly cssHeight: number;
  readonly aspect: number;
  readonly portrait: boolean;
  readonly pixelRatio: number;
  readonly limited: boolean;
}

export const DEFAULT_CANVAS_LIMITS: CanvasLimits = {
  maxDimension: 4096,
  maxPixels: 4_194_304,
};

/**
 * Returns null when CSS box has no drawable size (including display:none).
 * Scales uniformly to keep aspect across high-DPI, portrait and wide screens.
 * Device pixel ratio is explicitly capped before applying the quality preset.
 */
export function computeCanvasResolution(
  cssWidth: number,
  cssHeight: number,
  dpr: number,
  preset: ResolutionPreset = "balanced",
  limits: CanvasLimits = DEFAULT_CANVAS_LIMITS,
): CanvasResolution | null {
  if (![cssWidth, cssHeight, dpr, limits.maxDimension, limits.maxPixels].every(Number.isFinite)
    || cssWidth < 0 || cssHeight < 0 || dpr <= 0 || limits.maxDimension < 1 || limits.maxPixels < 1) {
    throw new RangeError("Invalid canvas dimensions, pixel ratio, or graphics limits");
  }
  if (cssWidth === 0 || cssHeight === 0) return null;
  const factor = Math.min(2.5, Math.max(0.5, dpr)) * RESOLUTION_PRESETS[preset];
  const requestedWidth = cssWidth * factor;
  const requestedHeight = cssHeight * factor;
  const shrink = Math.min(
    1,
    limits.maxDimension / requestedWidth,
    limits.maxDimension / requestedHeight,
    Math.sqrt(limits.maxPixels / (requestedWidth * requestedHeight)),
  );
  const width = Math.max(1, Math.floor(requestedWidth * shrink));
  const height = Math.max(1, Math.floor(requestedHeight * shrink));
  return {
    width, height, cssWidth, cssHeight, aspect: cssWidth / cssHeight,
    portrait: cssHeight > cssWidth,
    pixelRatio: width / cssWidth,
    limited: shrink < 1,
  };
}

export function resizeCanvas(
  canvas: Pick<HTMLCanvasElement, "width" | "height">,
  resolution: CanvasResolution,
): boolean {
  if (canvas.width === resolution.width && canvas.height === resolution.height) return false;
  canvas.width = resolution.width;
  canvas.height = resolution.height;
  return true;
}

export interface RenderMetrics {
  readonly samples: number;
  readonly frameP50Ms: number;
  readonly frameP95Ms: number;
  readonly cpuSubmitP50Ms: number;
  readonly cpuSubmitP95Ms: number;
  readonly drawCalls: number;
  readonly triangles: number;
  readonly instances: number;
}

function percentile(values: readonly number[], proportion: number): number {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.ceil(sorted.length * proportion) - 1]!;
}

/**
 * Bounded rolling telemetry, independent from simulation and browser APIs.
 * Frame interval is a rAF wall-clock interval, not guaranteed GPU completion.
 * CPU submit is renderer JS time only; never label it "GPU frame time".
 */
export class RenderMetricWindow {
  private readonly frames: number[] = [];
  private readonly submits: number[] = [];
  private lastDraws = 0;
  private lastTriangles = 0;
  private lastInstances = 0;

  constructor(private readonly capacity = 120) {
    if (!Number.isSafeInteger(capacity) || capacity < 1 || capacity > 10_000) {
      throw new RangeError("Telemetry capacity must be in 1..10000");
    }
  }

  push(frameIntervalMs: number, stats: RenderStats): void {
    if (!Number.isFinite(frameIntervalMs) || frameIntervalMs < 0
      || !Number.isFinite(stats.cpuMilliseconds) || stats.cpuMilliseconds < 0) {
      throw new RangeError("Telemetry requires finite non-negative CPU/interval values");
    }
    this.frames.push(frameIntervalMs);
    this.submits.push(stats.cpuMilliseconds);
    if (this.frames.length > this.capacity) this.frames.shift();
    if (this.submits.length > this.capacity) this.submits.shift();
    this.lastDraws = stats.drawCalls;
    this.lastTriangles = stats.triangles;
    this.lastInstances = stats.instances;
  }

  snapshot(): RenderMetrics {
    return {
      samples: this.frames.length,
      frameP50Ms: percentile(this.frames, 0.5),
      frameP95Ms: percentile(this.frames, 0.95),
      cpuSubmitP50Ms: percentile(this.submits, 0.5),
      cpuSubmitP95Ms: percentile(this.submits, 0.95),
      drawCalls: this.lastDraws, triangles: this.lastTriangles,
      instances: this.lastInstances,
    };
  }

  reset(): void {
    this.frames.length = 0;
    this.submits.length = 0;
    this.lastDraws = 0;
    this.lastTriangles = 0;
    this.lastInstances = 0;
  }
}
