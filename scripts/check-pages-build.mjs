#!/usr/bin/env node
/** Confirm that the actual production artifact can serve the play URL. */
import { strict as assert } from "node:assert";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const dist = process.argv[2] ?? "dist";
const expectedBase = process.argv[3] ?? "/BrowserGame/";
const read = relative => {
  const full = join(dist, relative);
  assert.ok(existsSync(full), "Missing deploy file: "+relative);
  return readFileSync(full, "utf8");
};
assert.ok(expectedBase.startsWith("/") && expectedBase.endsWith("/"));
const home = read("index.html");
const play = read("tests/terrain-preview.html");
assert.match(home,/BASTIONFALL|Bastionfall/);
assert.match(play,/canvas id="terrain"/);
assert.ok(home.includes(expectedBase+"assets/"), "Landing bundle must use hosted base");
assert.ok(!home.includes('src="/src/main.ts"'), "Raw dev entry must not reach production");
assert.ok(!play.includes('from "/src/'), "Raw TS imports must not reach production");
assert.ok(!play.includes('import("/src/'), "Raw TS dynamic imports must be bundled");
for (const f of ["assets/lantern-cc0.glb",
  "assets/characters/warden-kaykit.glb",
  "assets/characters/scrapper-kaykit.glb",
  "assets/characters/runner-kaykit.glb"]) {
  const path=join(dist,f);
  assert.ok(existsSync(path) && statSync(path).size>100_000,
    "Published game lost required bundled authored 3D asset "+f);
}
const bundles = readdirSync(join(dist,"assets")).filter(f=>f.endsWith(".js"));
assert.ok(bundles.length>0, "Missing production JS bundles");
const scripts = bundles.map(f=>readFileSync(join(dist,"assets",f),"utf8")).join("\n");
for (const asset of ["assets/lantern-cc0.glb","assets/characters/warden-kaykit.glb",
    "assets/characters/scrapper-kaykit.glb","assets/characters/runner-kaykit.glb"]) {
  assert.ok(scripts.includes(expectedBase+asset),
    "Bundled Three model URL ignores base path: "+asset);
}
assert.ok(home.includes(expectedBase+"tests/terrain-preview.html"),
  "Landing Play button is not built with the site base");
console.log("PASS: deploy output serves the actual playable page, all 4 GLBs, built JS, correct "+expectedBase+" prefix");
