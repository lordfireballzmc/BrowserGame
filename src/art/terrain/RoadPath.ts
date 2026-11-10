/**
 * F2.02 — Fenwall Crossing's fixed, deliberately authored cubic route.
 *
 * X east / Z north (meters), west entrance (-34,-5), keep (+31,+2).
 * This path is independent of art seed so identical runs retain fair lanes.
 * Catmull-style Hermite tangents provide C1 continuity; dense evaluation is
 * reparameterized by cumulative arc distance with <=0.55m output intervals.
 *
 * No DOM, WebGL or terrain dependency; Island.ts may safely import this module
 * to flatten the landscape beneath the 4.5m unobstructed collision corridor.
 */
export type RoadXZ = readonly [number, number];

export const ROAD_SPEC = {
  widthMeters: 4.5,
  halfWidthMeters: 2.25,
  maxSampleStepMeters: 0.55,
  heightAboveSurfaceMeters: 0.02,
  miterLimit: 1.35,
  flatTerrainHalfWidthMeters: 3.75,
  terrainFeatherMeters: 1.6,
  entrance: [-34, -5] as RoadXZ,
  destination: [31, 2] as RoadXZ,
} as const;

/** Human-authored winding waypoints, not unseeded random control points. */
export const ROAD_WAYPOINTS: readonly RoadXZ[] = Object.freeze([
  [-34, -5], [-25, -7], [-14, 4], [-3, 7],
  [8, -4], [19, -7], [27, -2], [31, 2],
].map(p => Object.freeze(p) as RoadXZ));

export interface RoadPoint {
  readonly x: number;
  readonly z: number;
  readonly distance: number;
  /** Horizontal unit tangent towards the keep. */
  readonly tangent: RoadXZ;
}

export interface RoadClosest {
  readonly x: number;
  readonly z: number;
  readonly distance: number;
  /** Nonnegative horizontal distance to the path centerline. */
  readonly lateralDistance: number;
  /** Left side of forward motion is positive. */
  readonly signedLateralMeters: number;
  readonly withinLane: boolean;
  readonly tangent: RoadXZ;
}

const STEPS_PER_SPAN = 64;
const MAX_POINTS = 4096;

function valid(value: number, name: string): void {
  if (!Number.isFinite(value)) throw new RangeError(name + " must be finite");
}

function hermite(span: number, t: number): RoadXZ {
  const a = ROAD_WAYPOINTS[span]!, b = ROAD_WAYPOINTS[span + 1]!;
  const prev = ROAD_WAYPOINTS[Math.max(0, span - 1)]!;
  const next = ROAD_WAYPOINTS[Math.min(ROAD_WAYPOINTS.length - 1, span + 2)]!;
  const h00 = (2 * t - 3) * t * t + 1;
  const h10 = ((t - 2) * t + 1) * t;
  const h01 = (-2 * t + 3) * t * t;
  const h11 = (t - 1) * t * t;
  const slopeA: RoadXZ = [(b[0] - prev[0]) * 0.5, (b[1] - prev[1]) * 0.5];
  const slopeB: RoadXZ = [(next[0] - a[0]) * 0.5, (next[1] - a[1]) * 0.5];
  return [
    h00 * a[0] + h10 * slopeA[0] + h01 * b[0] + h11 * slopeB[0],
    h00 * a[1] + h10 * slopeA[1] + h01 * b[1] + h11 * slopeB[1],
  ];
}

function unit(dx: number, dz: number): RoadXZ {
  const d = Math.hypot(dx, dz);
  if (d < 1e-9) throw new Error("Authored road contains a stationary cubic segment");
  return [dx / d, dz / d];
}

function createRoadSamples(): readonly RoadPoint[] {
  const fine: { x: number; z: number; distance: number }[] = [{
    x: ROAD_WAYPOINTS[0]![0], z: ROAD_WAYPOINTS[0]![1], distance: 0,
  }];
  for (let span = 0; span < ROAD_WAYPOINTS.length - 1; span++) {
    for (let i = 1; i <= STEPS_PER_SPAN; i++) {
      const [x, z] = hermite(span, i / STEPS_PER_SPAN);
      const old = fine[fine.length - 1]!;
      const segment = Math.hypot(x - old.x, z - old.z);
      if (segment <= 1e-8) continue;
      fine.push({ x, z, distance: old.distance + segment });
    }
  }

  const total = fine[fine.length - 1]!.distance;
  const segments = Math.ceil(total / ROAD_SPEC.maxSampleStepMeters);
  if (segments > MAX_POINTS) throw new Error("Road samples exceed geometry budget");
  const simple: { x: number; z: number; distance: number }[] = [];
  let high = 1;
  for (let i = 0; i <= segments; i++) {
    const distance = i === segments ? total : i * total / segments;
    while (high < fine.length - 1 && fine[high]!.distance < distance) high++;
    const a = fine[high - 1]!, b = fine[high]!;
    const t = Math.max(0, Math.min(1, (distance - a.distance) / (b.distance - a.distance)));
    simple.push({
      x: a.x + (b.x - a.x) * t,
      z: a.z + (b.z - a.z) * t,
      distance,
    });
  }

  const output = simple.map((p, i): RoadPoint => {
    const prev = simple[Math.max(0, i - 1)]!, next = simple[Math.min(segments, i + 1)]!;
    return Object.freeze({
      x: p.x, z: p.z, distance: p.distance,
      tangent: Object.freeze(unit(next.x - prev.x, next.z - prev.z)),
    });
  });
  return Object.freeze(output);
}

export const ROAD_SAMPLES = createRoadSamples();
export const ROAD_LENGTH_METERS = ROAD_SAMPLES[ROAD_SAMPLES.length - 1]!.distance;

export function roadPointAtDistance(distanceMeters: number): RoadPoint {
  valid(distanceMeters, "Route distance");
  const d = Math.min(ROAD_LENGTH_METERS, Math.max(0, distanceMeters));
  if (d === ROAD_LENGTH_METERS) return ROAD_SAMPLES[ROAD_SAMPLES.length - 1]!;
  // Every sample spacing is fixed in cumulative arc-distance.
  const step = ROAD_LENGTH_METERS / (ROAD_SAMPLES.length - 1);
  const i = Math.min(ROAD_SAMPLES.length - 2, Math.floor(d / step));
  const a = ROAD_SAMPLES[i]!, b = ROAD_SAMPLES[i + 1]!;
  const t = (d - a.distance) / (b.distance - a.distance);
  const tangent = unit(
    a.tangent[0] * (1 - t) + b.tangent[0] * t,
    a.tangent[1] * (1 - t) + b.tangent[1] * t,
  );
  return {
    x: a.x + (b.x - a.x) * t,
    z: a.z + (b.z - a.z) * t,
    distance: d, tangent,
  };
}

export function nearestRoadPoint(x: number, z: number): RoadClosest {
  valid(x, "Road query X"); valid(z, "Road query Z");
  let best = Infinity;
  let result: RoadClosest | null = null;
  for (let i = 0; i < ROAD_SAMPLES.length - 1; i++) {
    const a = ROAD_SAMPLES[i]!, b = ROAD_SAMPLES[i + 1]!;
    const dx = b.x - a.x, dz = b.z - a.z;
    const squared = dx * dx + dz * dz;
    const t = Math.max(0, Math.min(1, ((x - a.x) * dx + (z - a.z) * dz) / squared));
    const px = a.x + dx * t, pz = a.z + dz * t;
    const signed = (z - pz) * (dx / Math.sqrt(squared))
      - (x - px) * (dz / Math.sqrt(squared));
    const d2 = (x - px) ** 2 + (z - pz) ** 2;
    if (d2 < best) {
      best = d2;
      const lateralDistance = Math.sqrt(d2);
      result = {
        x: px, z: pz,
        distance: a.distance + (b.distance - a.distance) * t,
        lateralDistance, signedLateralMeters: signed,
        withinLane: lateralDistance <= ROAD_SPEC.halfWidthMeters + 1e-8,
        tangent: unit(dx, dz),
      };
    }
  }
  if (!result) throw new Error("Road geometry is empty");
  return result;
}

/** Side-effect-free distance used by globally sampled terrain carving. */
export function distanceToRoadXZ(x: number, z: number): number {
  return nearestRoadPoint(x, z).lateralDistance;
}
