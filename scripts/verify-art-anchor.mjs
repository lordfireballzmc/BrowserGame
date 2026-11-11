#!/usr/bin/env node
/**
 * ART.LOCK — original user-reference binary integrity gate.
 *
 * Plain docs/engineering commits use default mode: verify all present files,
 * report missing originals as PENDING. Visual code PRs use --strict so the
 * original approved PNGs MUST be in Git and must match the uploaded originals
 * byte-for-byte; a fake 1x1 placeholder or converted JPG cannot pass.
 */
import {readFileSync,existsSync} from "node:fs";
import {createHash} from "node:crypto";
import {fileURLToPath} from "node:url";
import {resolve,dirname} from "node:path";
const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const strict=process.argv.includes("--strict");
const assets=[
  ["docs/art-direction/visual-anchor-handpainted-runtime-target.png","00aa1639f672795f54a7c8f077aa3f588251501e99da7bd3d7ca7516cdb405cc",1672,941],
  ["docs/art-direction/slices/tree-twisted-canopy-reference.png","856be5be22a1cd413f7550955814840afe070ae458efb45b1d64cef429e745c7",580,539],
  ["docs/art-direction/slices/enemy-raider-reference.png","198de0cd3f58ee27a20cd05fa99903108f42e48fb1fad65f854c6b5ea3bb1e28",550,620],
  ["docs/art-direction/slices/hero-blue-knight-reference.png","919d4afdef8668e3c814e05b30954d92f86fe63bbde58be175eb3b642ad091f1",540,502],
  ["docs/art-direction/slices/asset-family-reference-sheet.png","b09b4c24e1db83078a7c634c41489963fcb33d6d16df9fb941735ab2287932c3",1536,1024],
  ["docs/art-direction/rejection-current-runtime-example.png","0d7ebec3cb9fde4ad5d3995b87968a59ad1cfb7f368839835b5afa9e88ab0fc1",2048,1167],
  ["docs/art-direction/rejection-old-repository-anchor.png","805f4d435f2bf184afe98e2c62605c0704fc2f27ff69f4008f95948da0b7ffdd",2048,1488],
];
const errors=[];
let pending=0,verified=0;
for(const [name,hash,width,height] of assets){
 const local=resolve(root,name);
 if(!existsSync(local)){
   pending++;
   if(strict)errors.push("MISSING original user-supplied PNG: "+name);
   else console.warn("ART.LOCK PENDING ORIGINAL BINARY: "+name);
   continue;
 }
 const bytes=readFileSync(local);
 const pngSignature=Buffer.from([137,80,78,71,13,10,26,10]);
 if(!bytes.subarray(0,8).equals(pngSignature)){
   errors.push("Not an actual PNG: "+name);continue;
 }
 if(bytes.readUInt32BE(16)!==width||bytes.readUInt32BE(20)!==height){
   errors.push("Original dimension mismatch: "+name);continue;
 }
 if(createHash("sha256").update(bytes).digest("hex")!==hash){
   errors.push("Original SHA256 mismatch: "+name);continue;
 }
 console.log("ART.LOCK ORIGINAL VERIFIED: "+name);
 verified++;
}
for(const old of [
 "docs/visual-references/target-illustrated-3d-composition.svg",
 "docs/visual-references/GENERATIVE_MOCKUP_PROMPTS.md",
]){
 if(existsSync(resolve(root,old)))errors.push("Rejected visual source restored: "+old);
}
for(const file of [
 "docs/art-direction/README.md",
 "docs/art-direction/HARD_REQUIREMENTS.md",
 "docs/art-direction/FENWALL_VISUAL_RECONSTRUCTION_SPEC.md",
 "docs/art-direction/REFERENCE_ASSET_MANIFEST.md",
 "docs/art-direction/STYLE_GUARDRAILS.md",
]){
 if(!existsSync(resolve(root,file)))errors.push("Missing mandatory art direction file: "+file);
}
const summary={strict,verified,originals:assets.length,pending,errors:errors.length};
console.log("ART.LOCK source-integrity:",JSON.stringify(summary));
if(errors.length) {
 for(const error of errors)console.error("ART.LOCK FAILURE:",error);
 process.exitCode=1;
}else if(pending)console.warn("ART.LOCK DOCUMENTS READY; reference PNG archive NOT COMPLETE. Never claim art approval.");
