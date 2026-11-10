/** Fixed-step scheduling independent of rendering and game state. */
export const FIXED_STEP_SECONDS = 1 / 60;
export const MAX_WALL_DELTA_MS = 100;
export const MAX_STEPS_PER_FRAME = 5;
const STEP_MS = FIXED_STEP_SECONDS * 1000;
const STEP_EPSILON_MS = 1e-7;

/** Injected for deterministic tests; browser adapter uses requestAnimationFrame. */
export interface FrameClock {
  now(): number;
  request(callback: (nowMs: number) => void): number;
  cancel(handle: number): void;
}

export interface VisibilitySource {
  readonly hidden: boolean;
  addEventListener(type: "visibilitychange", callback: () => void): void;
  removeEventListener(type: "visibilitychange", callback: () => void): void;
}

export interface LoopCallbacks {
  /** Called with an invariant fixed delta; tick starts at 1. */
  fixedUpdate(dtSeconds: number, tick: number): void;
  /** Called once per visible frame; alpha is between 0 (inclusive) and 1 (exclusive). */
  render(alpha: number, tick: number): void;
}

/**
 * Owns the wall-clock accumulator, not the simulation state.
 * No pending rAF, simulation debt, or game time is retained through pause/visibility loss.
 */
export class EngineLoop {
  private running = false;
  private manualPause = false;
  private pendingFrame: number | null = null;
  private epoch = 0;
  private executingFrame = false;
  private previousMs = 0;
  private accumulatorMs = 0;
  private ticks = 0;

  constructor(
    private readonly clock: FrameClock,
    private readonly callbacks: LoopCallbacks,
    private readonly visibility?: VisibilitySource,
  ) {}

  get isRunning(): boolean { return this.running; }
  get isPaused(): boolean { return this.manualPause || !!this.visibility?.hidden; }
  get tickCount(): number { return this.ticks; }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.manualPause = false;
    this.ticks = 0;
    this.epoch += 1;
    this.resetClock();
    this.visibility?.addEventListener("visibilitychange", this.onVisibilityChange);
    this.reconcileFrame();
  }

  stop(): void {
    if (!this.running) return;
    this.running = false;
    this.epoch += 1;
    this.visibility?.removeEventListener("visibilitychange", this.onVisibilityChange);
    this.cancelFrame();
    this.accumulatorMs = 0;
    this.manualPause = false;
  }

  pause(): void { this.setPaused(true); }
  resume(): void { this.setPaused(false); }

  setPaused(paused: boolean): void {
    if (this.manualPause === paused) return;
    this.manualPause = paused;
    this.resetClock();
    this.reconcileFrame();
  }

  private readonly onVisibilityChange = (): void => {
    this.resetClock();
    this.reconcileFrame();
  };

  private resetClock(): void {
    this.previousMs = this.clock.now();
    this.accumulatorMs = 0;
  }

  private cancelFrame(): void {
    if (this.pendingFrame !== null) {
      this.clock.cancel(this.pendingFrame);
      this.pendingFrame = null;
    }
  }

  private reconcileFrame(): void {
    if (!this.running || this.isPaused) {
      this.cancelFrame();
      return;
    }
    if (this.pendingFrame !== null || this.executingFrame) return;

    const generation = this.epoch;
    // FrameClock.request is asynchronous, like requestAnimationFrame.
    const handle = this.clock.request((nowMs) => {
      if (generation !== this.epoch || this.pendingFrame !== handle) return;
      this.pendingFrame = null;
      this.onFrame(nowMs, generation);
    });
    this.pendingFrame = handle;
  }

  private onFrame(nowMs: number, generation: number): void {
    if (!this.running || this.isPaused || this.executingFrame) return;
    this.executingFrame = true;
    try {
      const elapsed = Math.max(0, Math.min(MAX_WALL_DELTA_MS, nowMs - this.previousMs));
      this.previousMs = nowMs;
      this.accumulatorMs += elapsed;

      let steps = 0;
      while (this.running && !this.isPaused && generation === this.epoch
        && this.accumulatorMs + STEP_EPSILON_MS >= STEP_MS
        && steps < MAX_STEPS_PER_FRAME) {
        this.accumulatorMs = Math.max(0, this.accumulatorMs - STEP_MS);
        this.ticks += 1;
        steps += 1;
        this.callbacks.fixedUpdate(FIXED_STEP_SECONDS, this.ticks);
      }
      // Discard excess whole ticks after the catch-up cap; never carry a spiral of death.
      if (steps === MAX_STEPS_PER_FRAME && this.accumulatorMs + STEP_EPSILON_MS >= STEP_MS) {
        const skipped = Math.floor((this.accumulatorMs + STEP_EPSILON_MS) / STEP_MS);
        this.accumulatorMs = Math.max(0, this.accumulatorMs - skipped * STEP_MS);
      }
      if (this.running && !this.isPaused && generation === this.epoch) {
        this.callbacks.render(Math.min(1 - Number.EPSILON, this.accumulatorMs / STEP_MS), this.ticks);
      }
    } catch (error) {
      this.stop();
      throw error;
    } finally {
      this.executingFrame = false;
      this.reconcileFrame();
    }
  }
}

/** Browser-only adapter. Tests use an injected fake FrameClock and VisibilitySource. */
export function createBrowserLoop(callbacks: LoopCallbacks, visibility: VisibilitySource = document): EngineLoop {
  return new EngineLoop({
    now: () => performance.now(),
    request: (callback) => requestAnimationFrame(callback),
    cancel: (handle) => cancelAnimationFrame(handle),
  }, callbacks, visibility);
}
