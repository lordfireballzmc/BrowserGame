/**
 * F3.04c2 — browser touch joystick maps physical CSS pointer displacement to
 * the exact same normalized 60Hz MovementInput as desktop WASD.
 *
 * Rendering/UI is not simulation: no Date.now, RNG, game clocks, or movement
 * snapshots are touched here. No dependency on third-party virtual joysticks.
 */
import type {MovementInput} from "./HeroMovement";

export const TOUCH_JOYSTICK={
  radiusCssPixels:57,
  deadZoneFraction:0.10,
} as const;

export function analogMovement(
  dxCssPixels:number,dyCssPixels:number,radiusCssPixels=TOUCH_JOYSTICK.radiusCssPixels,
  deadZoneFraction=TOUCH_JOYSTICK.deadZoneFraction,
):MovementInput {
  if(![dxCssPixels,dyCssPixels,radiusCssPixels,deadZoneFraction].every(Number.isFinite)||
    radiusCssPixels<=0||deadZoneFraction<0||deadZoneFraction>=1) {
    throw new RangeError("Touch joystick expects finite screen displacement and radius");
  }
  const length=Math.hypot(dxCssPixels,dyCssPixels);
  if(length<=radiusCssPixels*deadZoneFraction)
    return {right:0,forward:0};
  const strength=Math.min(1,Math.max(0,
    (length/radiusCssPixels-deadZoneFraction)/(1-deadZoneFraction)));
  const normalized=strength/length;
  return Object.freeze({
    right:dxCssPixels*normalized,
    forward:-dyCssPixels*normalized,
  });
}

/** Combine two independent control devices, never exceeding full axis input. */
export function mergeAnalogWithKeyboard(
  keyboard:MovementInput,touch:MovementInput,
):MovementInput {
  if(![keyboard.right,keyboard.forward,touch.right,touch.forward].every(Number.isFinite))
    throw new RangeError("Combined control input must be finite");
  return {
    right:Math.max(-1,Math.min(1,keyboard.right+touch.right)),
    forward:Math.max(-1,Math.min(1,keyboard.forward+touch.forward)),
  };
}
