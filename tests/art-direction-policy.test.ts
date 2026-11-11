import {describe,it,expect} from "vitest";
import {readFileSync,existsSync} from "node:fs";
import {resolve} from "node:path";
import {spawnSync} from "node:child_process";

const root=process.cwd();
const file=(path:string)=>readFileSync(resolve(root,path),"utf8");

describe("ART.LOCK — mandatory user hand-painted direction in version control",()=>{
  it("stores the complete original eleven-section user specification rather than replacing it with a short summary",()=>{
    const user=file("docs/art-direction/FENWALL_VISUAL_RECONSTRUCTION_SPEC.md");
    for(let i=1;i<=11;i++) {
      expect(user).toContain("## "+i+".");
    }
    expect(user).toContain("hand-painted");
    expect(user).toContain("directional brushstrokes");
    expect(user).toContain("FENWALL DEFENDED");
    expect(user).toContain("TWO WAVES CLEARED");
    expect(user).toContain("No excessive bloom");
    expect(user.length).toBeGreaterThan(16000);
  });
  it("rejects the old graphic SVG anchor, stale generated mockup recipes, and competing primary art references",()=>{
    for(const p of [
      "docs/visual-references/target-illustrated-3d-composition.svg",
      "docs/visual-references/GENERATIVE_MOCKUP_PROMPTS.md",
    ])expect(existsSync(resolve(root,p))).toBe(false);
    for(const p of [
      "README.md","AGENTS.md","docs/20_VISUAL_NORTH_STAR.md",
      "docs/visual-references/README.md","docs/06_EXECUTION_BACKLOG.md",
      "docs/07_SESSION_STATE.md",
    ]) {
      expect(file(p)).toContain("art-direction/");
      expect(file(p)).toMatch(/hand.paint|ART.LOCK/i);
    }
    expect(file("docs/art-direction/README.md")).toContain("NOT ACCEPTED");
  });
  it("records every original exact-upload PNG by checksum and bans fake binary claims",()=>{
    const m=file("docs/art-direction/REFERENCE_ASSET_MANIFEST.md");
    for(const [path,sha] of [
      ["visual-anchor-handpainted-runtime-target.png","00aa1639f672795f54a7c8f077aa3f588251501e99da7bd3d7ca7516cdb405cc"],
      ["tree-twisted-canopy-reference.png","856be5be22a1cd413f7550955814840afe070ae458efb45b1d64cef429e745c7"],
      ["enemy-raider-reference.png","198de0cd3f58ee27a20cd05fa99903108f42e48fb1fad65f854c6b5ea3bb1e28"],
      ["hero-blue-knight-reference.png","919d4afdef8668e3c814e05b30954d92f86fe63bbde58be175eb3b642ad091f1"],
      ["asset-family-reference-sheet.png","b09b4c24e1db83078a7c634c41489963fcb33d6d16df9fb941735ab2287932c3"],
      ["rejection-current-runtime-example.png","0d7ebec3cb9fde4ad5d3995b87968a59ad1cfb7f368839835b5afa9e88ab0fc1"],
      ["rejection-old-repository-anchor.png","805f4d435f2bf184afe98e2c62605c0704fc2f27ff69f4008f95948da0b7ffdd"],
    ]){
      expect(m).toContain(path);
      expect(m).toContain(sha);
    }
    const result=spawnSync(process.execPath,
      ["scripts/verify-art-anchor.mjs"],{encoding:"utf8",cwd:root});
    expect(result.status).toBe(0);
    expect(result.stdout).toContain("ART.LOCK source-integrity:");
    // This is the non-strict documentation gate. ART-changing PRs run the
    // separate --strict workflow which REQUIRES all original Git PNG blobs.
  });
  it("requires a declared image acceptance classification on future visual pull requests",()=>{
    const template=file(".github/pull_request_template.md");
    for(const token of ["NONCOMPLIANT","PARTIAL","ACCEPTED","SHA-256",
      "16:9","9:16","HARD_REQUIREMENTS.md"]){
      expect(template).toContain(token);
    }
    expect(template).toContain("Never mark this PR visually accepted");
    const workflow=file(".github/workflows/handpainted-art-gate.yml");
    expect(workflow).toContain("node scripts/verify-art-anchor.mjs --strict");
    expect(workflow).toContain("src/art/**");
    expect(workflow).toContain("src/engine/render/**");
  });
});
