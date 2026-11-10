import { describe, expect, it } from "vitest";
import {
  computeCanvasResolution, resizeCanvas, RenderMetricWindow, type CanvasResolution,
} from "../src/engine/render/CanvasRuntime";
import type { RenderStats } from "../src/engine/render/InstancedRenderer";

const draw: RenderStats = {
  submitted: 1, instances: 1, drawCalls: 1, opaqueDrawCalls: 1,
  transparentDrawCalls: 0, triangles: 44, cpuMilliseconds: 2,
  instanceCapacity: 8, culled: 0, shadowDrawCalls: 0, shadowInstances: 0,
  shadowTriangles: 0, estimatedGpuBytes: 8192,
};

describe("F1.05 adaptive canvas resolution", () => {
  it("resolves landscape CSS at 1x and portrait CSS at 2x", () => {
    expect(computeCanvasResolution(960, 540, 1, "balanced")).toMatchObject({
      width: 960, height: 540, portrait: false, aspect: 960 / 540,
      limited: false,
    });
    expect(computeCanvasResolution(360, 640, 2, "balanced")).toMatchObject({
      width: 720, height: 1280, portrait: true, aspect: 360 / 640,
      limited: false,
    });
  });

  it("honors economy, balanced, and sharp presets", () => {
    expect(computeCanvasResolution(400, 600, 2, "economy")).toMatchObject({
      width: 600, height: 900,
    });
    expect(computeCanvasResolution(400, 600, 2, "balanced")).toMatchObject({
      width: 800, height: 1200,
    });
    expect(computeCanvasResolution(400, 600, 2, "sharp")).toMatchObject({
      width: 1000, height: 1500,
    });
  });

  it("clamps DPR, max dimension and maximum total pixels without stretching", () => {
    const r = computeCanvasResolution(6000, 2000, 10, "sharp", {
      maxDimension: 2048, maxPixels: 2_000_000,
    });
    expect(r).not.toBeNull();
    expect(r!.width).toBeLessThanOrEqual(2048);
    expect(r!.height).toBeLessThanOrEqual(2048);
    expect(r!.width * r!.height).toBeLessThanOrEqual(2_000_000);
    expect(r!.width / r!.height).toBeCloseTo(3, 1);
    expect(r!.limited).toBe(true);
  });

  it("returns null for hidden canvases and rejects invalid inputs", () => {
    expect(computeCanvasResolution(0, 400, 1)).toBeNull();
    expect(computeCanvasResolution(400, 0, 1)).toBeNull();
    expect(() => computeCanvasResolution(-1, 400, 1)).toThrow(RangeError);
    expect(() => computeCanvasResolution(400, 400, NaN)).toThrow(RangeError);
    expect(() => computeCanvasResolution(400, 400, 0)).toThrow(RangeError);
    expect(() => computeCanvasResolution(400, 400, 1, "balanced", {
      maxDimension: 0, maxPixels: 100,
    })).toThrow(RangeError);
  });

  it("never changes a backing buffer when its pixel size is unchanged", () => {
    const canvas = { width: 800, height: 450 };
    const r = computeCanvasResolution(800, 450, 1) as CanvasResolution;
    expect(resizeCanvas(canvas, r)).toBe(false);
    expect(resizeCanvas(canvas, { ...r, width: 600, height: 300 })).toBe(true);
    expect(canvas).toEqual({ width: 600, height: 300 });
    expect(resizeCanvas(canvas, { ...r, width: 600, height: 300 })).toBe(false);
  });
});

describe("F1.05 rolling CPU and frame-interval metrics", () => {
  it("reports accurate p50/p95 and keeps bounded history", () => {
    const metrics = new RenderMetricWindow(4);
    for (const [frame, cpu] of [[8, 1], [12, 2], [20, 3], [50, 5], [60, 8]]) {
      metrics.push(frame!, { ...draw, cpuMilliseconds: cpu! });
    }
    expect(metrics.snapshot()).toEqual({
      samples: 4, frameP50Ms: 20, frameP95Ms: 60,
      cpuSubmitP50Ms: 3, cpuSubmitP95Ms: 8,
      drawCalls: 1, triangles: 44, instances: 1,
    });
  });

  it("removes all previous readings on reset", () => {
    const metrics = new RenderMetricWindow();
    expect(metrics.snapshot().samples).toBe(0);
    metrics.push(16, draw);
    metrics.reset();
    expect(metrics.snapshot()).toMatchObject({
      samples: 0, drawCalls: 0, triangles: 0,
      cpuSubmitP50Ms: 0, frameP95Ms: 0,
    });
  });

  it("rejects missing, negative, or nonfinite timing samples", () => {
    expect(() => new RenderMetricWindow(0)).toThrow(RangeError);
    expect(() => new RenderMetricWindow(1.5)).toThrow(RangeError);
    const metrics = new RenderMetricWindow();
    expect(() => metrics.push(-1, draw)).toThrow(RangeError);
    expect(() => metrics.push(16, { ...draw, cpuMilliseconds: NaN })).toThrow(RangeError);
  });
});
