import {describe,it,expect} from "vitest";
import {HeroMovementWorld} from "../src/game/HeroMovement";
import {FIXED_STEP_SECONDS} from "../src/engine/Loop";
import {
  TOUCH_JOYSTICK,analogMovement,mergeAnalogWithKeyboard,
} from "../src/game/TouchAnalog";

describe("F3.04c2 playable touch analog control",()=>{
  it("uses CSS pixel space, correct screen-to-camera axes and smooth dead zone",()=>{
    const r=TOUCH_JOYSTICK.radiusCssPixels;
    expect(analogMovement(0,0)).toEqual({right:0,forward:0});
    expect(analogMovement(r*0.09,0)).toEqual({right:0,forward:0});
    expect(analogMovement(r,0).right).toBeCloseTo(1,12);
    expect(analogMovement(r,0).forward).toBe(0);
    expect(analogMovement(0,-r).forward).toBeCloseTo(1,12);
    expect(analogMovement(0,r).forward).toBeCloseTo(-1,12);
    expect(analogMovement(-r,0).right).toBeCloseTo(-1,12);
    expect(analogMovement(r*0.55,0).right).toBeCloseTo(0.5,12);
    expect(analogMovement(999,999).right).toBeCloseTo(Math.SQRT1_2,10);
    expect(analogMovement(999,999).forward).toBeCloseTo(-Math.SQRT1_2,10);
    expect(analogMovement(0,0)).toEqual({right:0,forward:0});
  });
  it("rejects invalid gesture and safely combines keyboard/touch direction",()=>{
    for(const args of [[NaN,0],[Infinity,0],[0,-Infinity],[0,0,0],[0,0,-1],
      [0,0,56,-0.1],[0,0,56,1]]){
      expect(()=>analogMovement(...(args as [number,number,number,number]))).toThrow(RangeError);
    }
    expect(mergeAnalogWithKeyboard({right:1,forward:0},{right:0.5,forward:-0.2}))
      .toEqual({right:1,forward:-0.2});
    expect(mergeAnalogWithKeyboard({right:0,forward:1},{right:0,forward:-1}))
      .toEqual({right:0,forward:0});
    expect(()=>mergeAnalogWithKeyboard({right:NaN,forward:1},{right:0,forward:0}))
      .toThrow(RangeError);
  });
  it("moves the real Warden through unchanged deterministic fixed-tick physics",()=>{
    const a=new HeroMovementWorld("fenwall-crossing-v1");
    const b=new HeroMovementWorld("fenwall-crossing-v1");
    const inputs=[
      analogMovement(0,-57),analogMovement(39,0),analogMovement(20,-15),
      analogMovement(0,0),analogMovement(-57,0),
    ];
    for(let tick=0;tick<120;tick++){
      const input=inputs[Math.floor(tick/24)]!;
      a.step(input,FIXED_STEP_SECONDS);
      b.step(mergeAnalogWithKeyboard({right:0,forward:0},input),FIXED_STEP_SECONDS);
    }
    expect(a.snapshot).toEqual(b.snapshot);
    expect(a.snapshot.tick).toBe(120);
    expect(a.snapshot.distanceMeters).toBeGreaterThan(0.4);
    expect(Object.isFrozen(a.snapshot)).toBe(true);
  });
});
