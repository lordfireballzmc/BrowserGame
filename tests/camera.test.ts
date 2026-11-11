import { describe, expect, it } from "vitest";
import { vec3 } from "gl-matrix";
import { CAMERA_SPEC, COMBAT_CAMERA_SPEC, OrthoCamera, combatCameraLead,
  type WorldPoint } from "../src/engine/Camera";

const deg = (degrees: number) => degrees * Math.PI / 180;

function expectWorldNear(actual: WorldPoint | null, expected: WorldPoint, tolerance = 0.0002): void {
  expect(actual).not.toBeNull();
  if (actual === null) return;
  for (let axis = 0; axis < 3; axis++) {
    expect(Math.abs(actual[axis]! - expected[axis]!)).toBeLessThan(tolerance);
  }
}

describe("F1.02: orthographic camera geometry", () => {
  it("projects the world origin to the center at desktop and portrait resolutions", () => {
    for (const [width, height] of [[1600, 900], [900, 1600], [1920, 1080]]) {
      const camera = new OrthoCamera(width!, height!);
      const center = camera.project([0, 0, 0]);
      expect(center.x).toBeCloseTo(width! / 2, 3);
      expect(center.y).toBeCloseTo(height! / 2, 3);
      expect(center.visible).toBe(true);
      expectWorldNear(camera.screenToGround(width! / 2, height! / 2), [0, 0, 0]);
    }
  });

  it("maintains exact viewport aspect ratio and 31m vertical visible span", () => {
    const camera = new OrthoCamera(1600, 900);
    expect(camera.visibleWorldHeight).toBe(31);
    expect(camera.visibleWorldWidth).toBeCloseTo(31 * 16 / 9, 9);
    camera.resize(900, 1600);
    expect(camera.visibleWorldWidth).toBeCloseTo(31 * 9 / 16, 9);
    expect(camera.project([0, 0, 0]).x).toBeCloseTo(450, 3);
    expect(camera.project([0, 0, 0]).y).toBeCloseTo(800, 3);
  });

  it("maps the four corners of the oriented camera plane to viewport corners", () => {
    const azimuth = deg(CAMERA_SPEC.azimuthDegrees);
    const tilt = deg(CAMERA_SPEC.tiltFromHorizonDegrees);
    const right: WorldPoint = [Math.sin(azimuth), 0, -Math.cos(azimuth)];
    const up: WorldPoint = [
      -Math.sin(tilt) * Math.cos(azimuth),
      Math.cos(tilt),
      -Math.sin(tilt) * Math.sin(azimuth),
    ];
    for (const [width, height] of [[1600, 900], [900, 1600]]) {
      const camera = new OrthoCamera(width!, height!);
      const halfWidth = camera.visibleWorldWidth / 2;
      const halfHeight = camera.visibleWorldHeight / 2;
      for (const signX of [-1, 1]) for (const signY of [-1, 1]) {
        const world: WorldPoint = [
          signX * halfWidth * right[0] + signY * halfHeight * up[0],
          signX * halfWidth * right[1] + signY * halfHeight * up[1],
          signX * halfWidth * right[2] + signY * halfHeight * up[2],
        ];
        const point = camera.project(world);
        expect(point.x).toBeCloseTo(signX === -1 ? 0 : width!, 2);
        expect(point.y).toBeCloseTo(signY === 1 ? 0 : height!, 2);
      }
    }
  });

  it("round-trips ground points across desktop and portrait viewports", () => {
    for (const [width, height] of [[1600, 900], [900, 1600]]) {
      const camera = new OrthoCamera(width!, height!);
      camera.snapTo([3, 0, 7]);
      for (const world of [
        [3, 0, 7], [6, 0, 9], [0, 0, 5], [7, 0, 2],
      ] as WorldPoint[]) {
        const projected = camera.project(world);
        expectWorldNear(camera.screenToGround(projected.x, projected.y), world);
      }
    }
  });

  it("returns null if a ground ray crosses the plane beyond near/far clip bounds", () => {
    const camera = new OrthoCamera(1600, 900);
    expect(camera.screenToGround(800, 450, 1000)).toBeNull();
  });

  it("provides depth and correctly rejects points outside the view", () => {
    const camera = new OrthoCamera(1600, 900);
    const center = camera.project([0, 0, 0]);
    expect(center.depth).toBeGreaterThan(0);
    expect(center.depth).toBeLessThan(1);
    expect(camera.project([200, 0, 0]).visible).toBe(false);
    expect(camera.project([0, 200, 0]).visible).toBe(false);
  });

  it("respects zoom clamping and adjusts visible world area without moving focus", () => {
    const camera = new OrthoCamera(1600, 900, [5, 0, -2]);
    camera.setZoom(2);
    expect(camera.zoomFactor).toBe(1.12);
    expect(camera.visibleWorldHeight).toBeCloseTo(31 / 1.12, 8);
    camera.setZoom(0.01);
    expect(camera.zoomFactor).toBe(0.88);
    expect(camera.visibleWorldHeight).toBeCloseTo(31 / 0.88, 8);
    expect(camera.focusWorld).toEqual([5, 0, -2]);
    expectWorldNear(camera.screenToGround(800, 450), [5, 0, -2]);
  });

  it("protects its matrices against caller mutations", () => {
    const camera = new OrthoCamera(800, 600);
    const original = camera.project([4, 0, 7]);
    const matrices = camera.matrices;
    matrices.projection[0] = 999999;
    matrices.viewProjection[12] = 999999;
    expect(camera.project([4, 0, 7])).toEqual(original);
    const test = vec3.transformMat4(vec3.create(), [0, 0, 0], camera.matrices.viewProjection);
    expect(Math.abs(test[0])).toBeLessThan(0.00001);
    expect(Math.abs(test[1])).toBeLessThan(0.00001);
  });
});

describe("VQ.02f: 3/4-isometric cinematic gameplay framing", () => {
  it("uses 35-degree isometric 3D elevation only for gameplay, not the map overview",()=>{
    expect(CAMERA_SPEC.tiltFromHorizonDegrees).toBe(53);
    expect(COMBAT_CAMERA_SPEC.tiltFromHorizonDegrees).toBeCloseTo(35.26438968,7);
    expect(COMBAT_CAMERA_SPEC.tiltFromHorizonDegrees).toBeLessThan(40);
    expect(COMBAT_CAMERA_SPEC.azimuthDegrees).toBe(CAMERA_SPEC.azimuthDegrees);
    const overview=new OrthoCamera(1600,900);
    const combat=new OrthoCamera(1600,900,[0,0,0],"combat");
    expect(overview.profile).toBe("overview");
    expect(combat.profile).toBe("combat");
    expect(overview.visibleWorldHeight).toBe(31);
    expect(combat.visibleWorldHeight).toBe(28);
    const apparentHeight=(camera:OrthoCamera)=>{
      const ground=camera.project([0,0,0]), head=camera.project([0,2.2,0]);
      return ground.y-head.y;
    };
    // Articulated faces/torsos are materially larger at battle zoom.
    expect(apparentHeight(combat)).toBeGreaterThan(apparentHeight(overview)*1.3);
    expect(()=>new OrthoCamera(1600,900,[0,0,0],"invalid" as "combat")).toThrow(RangeError);
  });

  it("preserves ground-pad raycasting and projection on 16:9 and 9:16 3D battle views",()=>{
    for(const [width,height] of [[1600,900],[900,1600]]){
      const camera=new OrthoCamera(width!,height!,[19,0,-3],"combat");
      camera.setZoom(1.06);
      for(const point of [[19,0,-3],[21,0,0],[17,0,-5],[25,0,2]] as WorldPoint[]){
        const onScreen=camera.project(point);
        expectWorldNear(camera.screenToGround(onScreen.x,onScreen.y),point,0.0007);
      }
      const before=camera.project([20,1.2,0]);
      camera.resize(width!/2,height!/2);
      const after=camera.project([20,1.2,0]);
      expect(after.x).toBeCloseTo(before.x/2,3);
      expect(after.y).toBeCloseTo(before.y/2,3);
    }
  });

  it("keeps the Warden central and previews only genuine nearby living threats",()=>{
    const hero={x:0,z:0,vx:0,vz:0};
    expect(combatCameraLead(hero,[])).toEqual([0,0]);
    expect(combatCameraLead(hero,[{x:50,z:0,hp:30}])).toEqual([0,0]);
    expect(combatCameraLead(hero,[{x:2,z:0,hp:0}])).toEqual([0,0]);
    const lead=combatCameraLead(hero,[{x:9,z:0,hp:30},{x:-3,z:2,hp:20}]);
    expect(lead[0]).toBeLessThan(0);
    expect(lead[1]).toBeGreaterThan(0);
    expect(Math.hypot(...lead)).toBeLessThanOrEqual(3.25);
    expect(combatCameraLead({x:0,z:0,vx:100,vz:100},[]).reduce((a,b)=>a+b*b,0))
      .toBeLessThanOrEqual(3.25*3.25+1e-8);
    expect(()=>combatCameraLead(hero,[{x:NaN,z:0,hp:5}])).toThrow(RangeError);
    expect(()=>combatCameraLead({x:NaN,z:0,vx:0,vz:0},[])).toThrow(RangeError);
  });
});

describe("F1.02: deterministic camera following", () => {
  it("uses 0.17-second exponential damping and an explicit look-ahead offset", () => {
    const camera = new OrthoCamera(1600, 900);
    camera.follow([10, 3, 2], 0.17, [2, 1]);
    const weight = 1 - Math.exp(-1);
    const focus = camera.focusWorld;
    expect(focus[0]).toBeCloseTo(12 * weight, 5);
    expect(focus[1]).toBe(0);
    expect(focus[2]).toBeCloseTo(3 * weight, 5);
  });

  it("produces approximately the same position for equal total elapsed time", () => {
    const once = new OrthoCamera(1600, 900);
    const twice = new OrthoCamera(1600, 900);
    once.follow([10, 0, -8], 0.17);
    twice.follow([10, 0, -8], 0.085);
    twice.follow([10, 0, -8], 0.085);
    expect(once.focusWorld[0]).toBeCloseTo(twice.focusWorld[0], 5);
    expect(once.focusWorld[2]).toBeCloseTo(twice.focusWorld[2], 5);
  });

  it("does not respond to hero elevation, or move during zero delta", () => {
    const camera = new OrthoCamera(1600, 900);
    camera.follow([12, 30, 4], 0);
    expect(camera.focusWorld).toEqual([0, 0, 0]);
    camera.follow([12, 30, 4], 1);
    expect(camera.focusWorld[1]).toBe(0);
    expect(camera.focusWorld[0]).toBeGreaterThan(11.9);
  });

  it("rejects invalid viewports, positions, zoom and elapsed time", () => {
    expect(() => new OrthoCamera(0, 900)).toThrow(RangeError);
    expect(() => new OrthoCamera(900, Number.NaN)).toThrow(RangeError);
    const camera = new OrthoCamera(1600, 900);
    expect(() => camera.resize(0, 500)).toThrow(RangeError);
    expect(() => camera.setZoom(-1)).toThrow(RangeError);
    expect(() => camera.setZoom(Infinity)).toThrow(RangeError);
    expect(() => camera.follow([0, 0, 0], -1)).toThrow(RangeError);
    expect(() => camera.follow([0, 0, 0], Infinity)).toThrow(RangeError);
    expect(() => camera.follow([0, 0, 0], 0.1, [Number.NaN, 0])).toThrow(RangeError);
    expect(() => camera.project([0, Infinity, 0])).toThrow(RangeError);
    expect(() => camera.screenToGround(NaN, 0)).toThrow(RangeError);
  });
});
