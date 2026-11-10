import { describe, expect, it } from "vitest";
import {
  EngineLoop, FIXED_STEP_SECONDS, MAX_STEPS_PER_FRAME,
  type FrameClock, type VisibilitySource,
} from "../src/engine/Loop";

class FakeClock implements FrameClock {
  nowMs = 0;
  nextId = 1;
  pending = new Map<number, (nowMs: number) => void>();
  now(): number { return this.nowMs; }
  request(callback: (nowMs: number) => void): number {
    const id = this.nextId++;
    this.pending.set(id, callback);
    return id;
  }
  cancel(id: number): void { this.pending.delete(id); }
  advance(milliseconds: number): void {
    this.nowMs += milliseconds;
    const callbacks = [...this.pending.values()];
    this.pending.clear();
    callbacks.forEach((callback) => callback(this.nowMs));
  }
}

class FakeVisibility implements VisibilitySource {
  hidden = false;
  listeners = new Set<() => void>();
  addEventListener(_type: "visibilitychange", callback: () => void): void { this.listeners.add(callback); }
  removeEventListener(_type: "visibilitychange", callback: () => void): void { this.listeners.delete(callback); }
  change(hidden: boolean): void {
    this.hidden = hidden;
    this.listeners.forEach((listener) => listener());
  }
}

const frameMs = FIXED_STEP_SECONDS * 1000;

function harness() {
  const clock = new FakeClock();
  const visibility = new FakeVisibility();
  const updates: Array<[number, number]> = [];
  const renders: Array<[number, number]> = [];
  const loop = new EngineLoop(clock, {
    fixedUpdate: (dt, tick) => updates.push([dt, tick]),
    render: (alpha, tick) => renders.push([alpha, tick]),
  }, visibility);
  return { clock, visibility, updates, renders, loop };
}

describe("60 Hz fixed-step loop", () => {
  it("executes exactly one fixed step per 60 Hz frame", () => {
    const { loop, clock, updates, renders } = harness();
    loop.start();
    for (let i = 0; i < 10; i += 1) clock.advance(frameMs);
    expect(updates).toEqual(Array.from({ length: 10 }, (_, i) => [FIXED_STEP_SECONDS, i + 1]));
    expect(renders).toHaveLength(10);
    expect(renders.every(([alpha]) => alpha >= 0 && alpha < 1)).toBe(true);
    expect(clock.pending.size).toBe(1);
  });

  it("produces the same ticks under different rendering intervals", () => {
    const regular = harness();
    const irregular = harness();
    regular.loop.start();
    irregular.loop.start();
    for (let i = 0; i < 6; i += 1) regular.clock.advance(frameMs);
    irregular.clock.advance(2 * frameMs);
    irregular.clock.advance(3 * frameMs);
    irregular.clock.advance(frameMs);
    expect(irregular.updates).toEqual(regular.updates);
    expect(irregular.renders).toHaveLength(3);
  });

  it("clamps a multi-second frame and never exceeds five catch-up updates", () => {
    const { loop, clock, updates, renders } = harness();
    loop.start();
    clock.advance(30_000);
    expect(updates).toHaveLength(MAX_STEPS_PER_FRAME);
    expect(renders).toHaveLength(1);
    clock.advance(frameMs);
    expect(updates).toHaveLength(MAX_STEPS_PER_FRAME + 1);
  });

  it("pauses without losing ticks or accumulating time", () => {
    const { loop, clock, updates, renders } = harness();
    loop.start();
    clock.advance(frameMs * 2);
    loop.pause();
    expect(clock.pending.size).toBe(0);
    clock.advance(20_000);
    expect(updates).toHaveLength(2);
    expect(renders).toHaveLength(1);
    loop.resume();
    clock.advance(frameMs);
    expect(updates).toHaveLength(3);
    expect(updates[2]?.[1]).toBe(3);
  });

  it("stops on hidden tab and resumes without catch-up", () => {
    const { loop, clock, visibility, updates } = harness();
    loop.start();
    clock.advance(frameMs);
    visibility.change(true);
    expect(loop.isPaused).toBe(true);
    expect(clock.pending.size).toBe(0);
    clock.advance(60_000);
    visibility.change(false);
    clock.advance(frameMs);
    expect(updates).toHaveLength(2);
    expect(updates[1]?.[1]).toBe(2);
  });

  it("is idempotent on start, cancels on stop and resets for new runs", () => {
    const { loop, clock, visibility, updates } = harness();
    loop.start();
    loop.start();
    expect(clock.pending.size).toBe(1);
    expect(visibility.listeners.size).toBe(1);
    clock.advance(frameMs);
    loop.stop();
    expect(clock.pending.size).toBe(0);
    expect(visibility.listeners.size).toBe(0);
    clock.advance(frameMs * 20);
    expect(updates).toHaveLength(1);
    loop.start();
    clock.advance(frameMs);
    expect(updates.at(-1)?.[1]).toBe(1);
  });

  it("does not execute further ticks or render after stop during an update", () => {
    const clock = new FakeClock();
    const renders: number[] = [];
    let steps = 0;
    let loop!: EngineLoop;
    loop = new EngineLoop(clock, {
      fixedUpdate: () => { steps += 1; loop.stop(); },
      render: () => { renders.push(1); },
    });
    loop.start();
    clock.advance(frameMs * 4);
    expect(steps).toBe(1);
    expect(renders).toEqual([]);
    expect(clock.pending.size).toBe(0);
  });

  it("does not schedule overlapping frames or reenter the update callback", () => {
    const clock = new FakeClock();
    let steps = 0;
    let loop!: EngineLoop;
    loop = new EngineLoop(clock, {
      fixedUpdate: () => { steps += 1; loop.start(); },
      render: () => {},
    });
    loop.start();
    clock.advance(frameMs);
    expect(steps).toBe(1);
    expect(clock.pending.size).toBe(1);
    clock.advance(frameMs);
    expect(steps).toBe(2);
  });

  it("stops when a callback throws, rather than scheduling an endless failing loop", () => {
    const clock = new FakeClock();
    const loop = new EngineLoop(clock, {
      fixedUpdate: () => { throw new Error("simulation failure"); },
      render: () => {},
    });
    loop.start();
    expect(() => clock.advance(frameMs)).toThrow("simulation failure");
    expect(loop.isRunning).toBe(false);
    expect(clock.pending.size).toBe(0);
  });
});
