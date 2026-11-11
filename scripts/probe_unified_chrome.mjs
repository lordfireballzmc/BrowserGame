#!/usr/bin/env node
/**
 * ART.02: dependency-free Chrome DevTools Protocol acceptance test.
 * Chrome's --virtual-time-budget can dump a page while GLB textures are
 * asynchronously decoding, falsely reporting a 'pending' failure. This
 * script waits for ACTUAL in-page readiness using Node 22's native WebSocket.
 * It verifies real gameplay and captures actual single-scene browser pixels.
 *
 * Usage: node scripts/probe_unified_chrome.mjs <chrome> <url> <width,height> <orientation> [movement|map|cinematic] [DPR]
 * Optional DPR enables exact live CSS/backbuffer/quality/resize verification.
 */
import { spawn } from "node:child_process";
import { mkdtempSync, readFileSync, existsSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const [browser, url, dimensions, orientation, requestedMode="movement", dprArg] = process.argv.slice(2);
const scene = new URL(url);
const mode = requestedMode;
const requestedDpr=dprArg === undefined ? null : Number(dprArg);
if (!browser || !url?.startsWith("http://127.0.0.1:") ||
    !/^\d+,\d+$/.test(dimensions??"") ||
    !["landscape","portrait"].includes(orientation) ||
    !["movement","map","cinematic"].includes(mode) ||
    (requestedDpr!==null && ![1,2,3].includes(requestedDpr))) {
  throw new Error("Usage: node scripts/probe_unified_chrome.mjs <browser> <loopback-url> <width,height> <landscape|portrait> [movement|map|cinematic] [1|2|3 DPR]");
}
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
const profile = mkdtempSync(join(tmpdir(), "bastionfall-cdp-"));
const browserLog = [];
const pageConsole = [];
const child = spawn(browser, [
  "--headless=new", "--no-sandbox", "--disable-dev-shm-usage",
  "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--enable-webgl",
  "--remote-debugging-port=0", "--remote-allow-origins=*",
  "--user-data-dir="+profile, "--window-size="+dimensions,
  "--no-first-run", "--no-default-browser-check", url,
], {stdio:["ignore","ignore","pipe"]});
child.stderr.setEncoding("utf8");
child.stderr.on("data", d => {
  browserLog.push(String(d));
  if (browserLog.length>80) browserLog.shift();
});
let socket = null;
let nextId=0;
const pending=new Map();
let lastState={};

async function send(method, params={}, timeoutMs=22000) {
  if (!socket || socket.readyState !== WebSocket.OPEN) {
    throw new Error("CDP socket is not open: "+method);
  }
  const id=++nextId;
  return new Promise((resolve,reject)=>{
    const alarm=setTimeout(()=>{
      pending.delete(id);
      reject(new Error("CDP "+method+" timed out"));
    },timeoutMs);
    pending.set(id,{
      resolve:value=>{clearTimeout(alarm);resolve(value);},
      reject:error=>{clearTimeout(alarm);reject(error);},
    });
    socket.send(JSON.stringify({id,method,params}));
  });
}
async function evaluate(expression) {
  const result=await send("Runtime.evaluate",{
    expression,returnByValue:true,awaitPromise:false,
  });
  if (result.exceptionDetails)throw new Error("Browser JS exception: "+
    JSON.stringify(result.exceptionDetails).slice(0,800));
  return result.result?.value;
}
async function openChromePage() {
  const file=join(profile,"DevToolsActivePort");
  const deadline=Date.now()+20000;
  let port=0;
  // Chrome creates DevToolsActivePort before both text lines are guaranteed
  // to be flushed. Merely checking file existence races with the first write
  // and occasionally parses an empty string as port 0. Never classify that
  // runner startup race as a failed gameplay frame.
  while(Date.now()<deadline) {
    if (child.exitCode!==null)throw new Error(
      "Chrome exited before DevTools startup: "+browserLog.join("").slice(-900));
    if(existsSync(file)){
      const raw=readFileSync(file,"utf8").split("\n")[0]?.trim()??"";
      const candidate=Number(raw);
      if(/^\d+$/.test(raw)&&Number.isInteger(candidate)&&
         candidate>0&&candidate<=65535){
        port=candidate;
        break;
      }
    }
    await pause(120);
  }
  if(!port)throw new Error(
    "Timed out waiting for valid Chrome DevTools port: "+
      browserLog.join("").slice(-900));
  let page;
  for(let i=0;i<30;i++) {
    try {
      const response=await fetch(`http://127.0.0.1:${port}/json/list`);
      if(response.ok) {
        const tabs=await response.json();
        page=tabs.find(tab=>tab.type==="page"&&tab.url.startsWith("http://127.0.0.1:"));
        if(page?.webSocketDebuggerUrl)break;
      }
    } catch { /* Browser JSON endpoint not ready yet. */ }
    await pause(150);
  }
  if(!page?.webSocketDebuggerUrl)throw new Error("Chrome game page absent");
  socket=new WebSocket(page.webSocketDebuggerUrl);
  socket.addEventListener("message",event=>{
    let response;
    try {response=JSON.parse(String(event.data));} catch {return;}
    if(response.method==="Runtime.consoleAPICalled"){
      const line=String(response.params?.type)+": "+
        (response.params?.args??[]).map(a=>a.value??a.description??"").join(" ");
      pageConsole.push(line);
      if(pageConsole.length>75)pageConsole.shift();
    }
    if(response.method==="Runtime.exceptionThrown"){
      pageConsole.push("EXCEPTION "+JSON.stringify(response.params?.exceptionDetails).slice(0,1200));
      if(pageConsole.length>75)pageConsole.shift();
    }
    if(!response.id)return;
    const waiter=pending.get(response.id);
    if(!waiter)return;
    pending.delete(response.id);
    if(response.error)waiter.reject(new Error(JSON.stringify(response.error)));
    else waiter.resolve(response.result);
  });
  await new Promise((resolve,reject)=>{
    const timeout=setTimeout(()=>reject(new Error("CDP WebSocket handshake timed out")),10000);
    socket.addEventListener("open",()=>{clearTimeout(timeout);resolve();},{once:true});
    socket.addEventListener("error",()=>{clearTimeout(timeout);reject(new Error("CDP socket handshake failed"));},{once:true});
  });
  await send("Page.enable");
  await send("Runtime.enable");
}

try {
  await openChromePage();
  // CDP sets the emulated CSS viewport and device scale BEFORE screenshot
  // acceptance; the page then reloads under the actual emulated DPR.
  if(requestedDpr!==null) {
    const [width,height]=dimensions.split(",").map(Number);
    await send("Emulation.setDeviceMetricsOverride",{
      width,height,deviceScaleFactor:requestedDpr,mobile:false,
    });
    await send("Page.reload",{ignoreCache:true});
    await pause(550);
  }
  const deadline=Date.now()+65000;
  let ready=false;
  while(Date.now()<deadline) {
    lastState=await evaluate(`(() => {
      const d=document.body?.dataset??{};
      return {
        result:d.result, assetPilot:d.assetPilot, assetSource:d.assetSource,
        assetTextured:d.assetTextured, unifiedRenderer:d.unifiedRenderer,
        sharedDepth:d.sharedDepth, unifiedCanvases:d.unifiedCanvases,
        movementProbe:d.movementProbe, enemyProbe:d.enemyProbe,
        combatProbe:d.combatProbe, hitTargets:d.hitTargets,
        heroVisible:d.heroVisible, enemyCount:d.enemyCount,
        riggedArt:d.riggedArt,riggedSources:d.riggedSources,
        riggedAnimations:d.riggedAnimations,riggedActors:d.riggedActors,
        boneCount:d.boneCount,activeWalkCycles:d.activeWalkCycles,
        sceneMode:d.sceneMode,
        cameraProfile:d.cameraProfile,cameraElevation:d.cameraElevation,
        rigFacingCorrection:d.rigFacingCorrection,
        padClickProbe:d.padClickProbe,
        selectedPad:d.selectedPad, padCount:d.padCount,
        sceneryCount:d.sceneryCount, composition:d.composition,
        sceneryArt:d.sceneryArt, sceneryArtSources:d.sceneryArtSources,
        sceneryArtAtlases:d.sceneryArtAtlases,
        sceneryArtTrees:d.sceneryArtTrees,sceneryArtRocks:d.sceneryArtRocks,
        sceneryArtBatches:d.sceneryArtBatches,
        sceneryArtInstances:d.sceneryArtInstances,
        sceneryArtError:d.sceneryArtError,
        groundcoverArt:d.groundcoverArt,
        groundcoverSources:d.groundcoverSources,
        groundcoverGrass:d.groundcoverGrass,
        groundcoverShrubs:d.groundcoverShrubs,
        groundcoverFlowers:d.groundcoverFlowers,
        groundcoverInstances:d.groundcoverInstances,
        groundcoverBatches:d.groundcoverBatches,
        groundcoverTriangles:d.groundcoverTriangles,
        groundArt:d.groundArt,groundPalette:d.groundPalette,
        economyState:d.economyState,crowns:d.crowns,towersBuilt:d.towersBuilt,
        towerShots:d.towerShots,towerHits:d.towerHits,enemyDefeats:d.enemyDefeats,
        crownDrops:d.crownDrops,crownsCollected:d.crownsCollected,
        pendingCoins:d.pendingCoins,crownRecoveryPot:d.crownRecoveryPot,
        towerPurchaseProbe:d.towerPurchaseProbe,lastBuildResult:d.lastBuildResult,
        waveProbe:d.waveProbe,waveProbeCoreHp:d.waveProbeCoreHp,
        wavePhase:d.wavePhase,waveNumber:d.waveNumber,uiMode:d.uiMode,
        dockCollapsed:document.querySelector("#tower-build-panel")
          ?.classList.contains("expanded")===false &&
          getComputedStyle(document.querySelector("#crowns-readout")).display==="none",
        diagnosticHidden:getComputedStyle(document.querySelector("#resolution-readout"))
          .display==="none",

        coreHp:d.coreHp,heroHp:d.heroHp,coreStrikes:d.coreStrikes,
        heroStrikes:d.heroStrikes,wavesCleared:d.wavesCleared,
        runResult:d.runResult,waveRemaining:d.waveRemaining,
        shadows:d.shadows,
        environmentArt:d.environmentArt,
        environmentSources:d.environmentSources,
        environmentTextured:d.environmentTextured,
        environmentKeepModules:d.environmentKeepModules,
        environmentPadModules:d.environmentPadModules,
        environmentInstances:d.environmentInstances,
        environmentVisuals:d.environmentVisuals,padArt:d.padArt,
        environmentError:d.environmentError,
        graphicsTier:d.graphicsTier,graphicsDpr:d.graphicsDpr,
        graphicsBuffer:d.graphicsBuffer,graphicsCss:d.graphicsCss,
        graphicsLimited:d.graphicsLimited,graphicsPixels:d.graphicsPixels,
        deviceDpr:window.devicePixelRatio,
        canvasWidth:document.querySelector("#terrain")?.width,
        canvasHeight:document.querySelector("#terrain")?.height,
        canvasCssWidth:document.querySelector("#terrain")?.getBoundingClientRect()?.width,
        canvasCssHeight:document.querySelector("#terrain")?.getBoundingClientRect()?.height,
        trace:document.querySelector("#trace")?.textContent?.slice(0,2500)
      };
    })()`);
    if(lastState.result==="fail" || lastState.assetPilot==="error" ||
       lastState.environmentArt==="error" ||
       lastState.sceneryArt==="error" ||
       lastState.groundcoverArt==="error") {
      throw new Error("Game reported an actual failure: "+JSON.stringify(lastState));
    }
    const common = lastState.result==="pass" &&
      lastState.assetPilot==="pass" &&
      lastState.assetSource==="khronos-lantern-cc0-pilot" &&
      Number(lastState.assetTextured)>0 &&
      lastState.unifiedRenderer==="three" &&
      lastState.sharedDepth==="true" &&
      lastState.unifiedCanvases==="1" &&
      lastState.shadows==="on" &&
      Number(lastState.padCount)===10 &&
      (scene.searchParams.get("understory")==="legacy" ||
       scene.searchParams.get("scenery")==="legacy"
        ? lastState.groundcoverArt==="disabled"
        : lastState.groundcoverArt==="pass" &&
          Number(lastState.groundcoverSources)===5 &&
          Number(lastState.groundcoverGrass)===736 &&
          Number(lastState.groundcoverShrubs)===48 &&
          Number(lastState.groundcoverFlowers)===120 &&
          Number(lastState.groundcoverInstances)===904 &&
          Number(lastState.groundcoverBatches)>=5 &&
          Number(lastState.groundcoverBatches)<=12 &&
          Number(lastState.groundcoverTriangles)<=650000) &&
      (scene.searchParams.get("ground")==="legacy"
        ? lastState.groundArt==="disabled"
        : lastState.groundArt==="pass" &&
          lastState.groundPalette==="fenwall-world-pigment-vq02c") &&
      (scene.searchParams.get("scenery")==="legacy"
        ? lastState.sceneryArt==="disabled"
        : lastState.sceneryArt==="pass" &&
          Number(lastState.sceneryArtSources)===7 &&
          Number(lastState.sceneryArtAtlases)===7 &&
          Number(lastState.sceneryArtTrees)===40 &&
          Number(lastState.sceneryArtRocks)===42 &&
          Number(lastState.sceneryArtInstances)===82 &&
          Number(lastState.sceneryArtBatches)>=7 &&
          Number(lastState.sceneryArtBatches)<=40) &&
      (scene.searchParams.get("environment")==="legacy"
        ? lastState.environmentArt==="disabled"
        : lastState.environmentArt==="pass" &&
          lastState.environmentVisuals==="kenney-castle-kit-vq02" &&
          Number(lastState.environmentSources)===6 &&
          Number(lastState.environmentTextured)===6 &&
          Number(lastState.environmentKeepModules)===9 &&
          Number(lastState.environmentPadModules)===30 &&
          Number(lastState.environmentInstances)===39);
    const trace = (()=>{ try {return JSON.parse(lastState.trace??"{}");} catch {return {};} })();
    if (mode==="movement"&&scene.searchParams.get("probeWaveDefense")==="gate"){
      ready=common &&
        lastState.sceneMode==="combat" &&
        lastState.economyState==="pass" &&
        lastState.waveProbe==="pass" &&
        lastState.wavePhase==="active" &&
        Number(lastState.waveNumber)===1 &&
        Number(lastState.coreStrikes)>=1 &&
        Number(lastState.coreHp)<300 &&
        Number(lastState.coreHp)>0 &&
        lastState.runResult==="active" &&
        Number(lastState.enemyCount)>=1 &&
        Number(lastState.crowns)===25 &&
        Number(lastState.towersBuilt)===0 &&
        lastState.heroVisible==="true" &&
        lastState.graphicsBuffer===lastState.canvasWidth+"x"+lastState.canvasHeight;
    } else if(mode==="movement" && scene.searchParams.get("probeHUD")==="play"){
      // Source-exact normal game session: no synthetic enemy pre-advance and
      // no debug screen. This verifies playable wave state and CSS dock.
      ready=common &&
        lastState.sceneMode==="combat" &&
        lastState.uiMode==="play" &&
        lastState.dockCollapsed===true &&
        lastState.diagnosticHidden===true &&
        ["preparation","active","recovery"].includes(lastState.wavePhase) &&
        lastState.heroVisible==="true" &&
        lastState.riggedArt==="ready" &&
        Number(lastState.riggedSources)===3 &&
        Number(lastState.riggedActors)>=1 &&
        Number(lastState.crowns)>=0 &&
        lastState.graphicsBuffer===lastState.canvasWidth+"x"+lastState.canvasHeight;
    } else if (mode==="movement") {
      ready=common &&
        lastState.sceneMode==="combat" &&
        lastState.economyState==="pass" &&
        Number.isSafeInteger(Number(lastState.crowns)) &&
        Number(lastState.crowns)>=0 &&
        (scene.searchParams.get("probeTowerBuild")==="P01"
          ? lastState.towerPurchaseProbe==="pass" &&
            lastState.lastBuildResult==="built" &&
            Number(lastState.towersBuilt)===1 &&
            Number(lastState.crowns)===5
          : Number(lastState.towersBuilt)>=0) &&
        lastState.movementProbe==="pass" &&
        lastState.enemyProbe==="pass" &&
        lastState.combatProbe==="pass" &&
        lastState.heroVisible==="true" &&
        Number(lastState.hitTargets)>0 &&
        Number(lastState.enemyCount)===19 &&
        lastState.graphicsTier===(scene.searchParams.get("quality")??"balanced") &&
        lastState.graphicsBuffer===lastState.canvasWidth+"x"+lastState.canvasHeight &&
        Number(lastState.graphicsPixels)===lastState.canvasWidth*lastState.canvasHeight &&
        Number(lastState.graphicsPixels)>0 &&
        Number(lastState.graphicsPixels)<=4_194_304 &&
        (requestedDpr===null || Math.abs(lastState.deviceDpr-requestedDpr)<0.01) &&
        (requestedDpr===null || lastState.canvasWidth>lastState.canvasCssWidth);
    } else if (mode==="map") {
      const target=scene.searchParams.get("probePadClick");
      ready=common &&
        lastState.sceneMode==="map" &&
        Number(lastState.sceneryCount)===258 &&
        trace.roadWidthMeters===4.5 &&
        trace.padCount===10 &&
        lastState.padClickProbe==="pass" &&
        lastState.selectedPad===(target==="P01"?"P01":"none");
    } else {
      ready=common &&
        lastState.sceneMode==="cinematic" &&
        Number(lastState.sceneryCount)===258 &&
        lastState.composition===(orientation==="portrait"?"9:16":"16:9") &&
        trace.stagedBoltSpires===2 &&
        trace.stagedActors===15;
    }
    if(ready && mode==="movement"){
      ready=lastState.cameraProfile==="combat" &&
        Math.abs(Number(lastState.cameraElevation)-35.264)<0.01 &&
        Math.abs(Number(lastState.rigFacingCorrection)-Math.PI)<1e-6;
    }
    if(ready&&lastState.environmentArt==="pass"){
      ready=lastState.padArt===(scene.searchParams.get("pads")==="legacy"
        ?"source-kit":"sculpted-stone");
    }
    if(ready && scene.searchParams.get("probeCharacters")==="rigged") {
      ready=lastState.riggedArt==="ready" &&
        Number(lastState.riggedSources)===3 &&
        Number(lastState.riggedAnimations)===15 &&
        Number(lastState.riggedActors)>=(mode==="movement"?20:13) &&
        Number(lastState.boneCount)>100 &&
        (mode!=="movement" || Number(lastState.activeWalkCycles)>0);
    }
    if(ready)break;
    await pause(300);
  }
  if(!ready) {
    throw new Error("Game did not become READY within 65s: "+JSON.stringify(lastState));
  }
  if(mode==="movement" && scene.searchParams.get("probeHUD")==="play"){
    const dock=await evaluate(`(() => {
      const panel=document.querySelector("#tower-build-panel");
      const button=document.querySelector("#toggle-build");
      const purchase=document.querySelector("#build-p01");
      const crown=document.querySelector("#crowns-readout");
      const initial=button.getAttribute("aria-expanded")==="false";
      button.click();
      const expanded=panel.classList.contains("expanded")&&
        button.getAttribute("aria-expanded")==="true"&&
        getComputedStyle(crown).display!=="none"&&
        purchase.getBoundingClientRect().height>=40;
      button.click();
      const collapsed=!panel.classList.contains("expanded")&&
        button.getAttribute("aria-expanded")==="false"&&
        getComputedStyle(crown).display==="none";
      return {initial,expanded,collapsed};
    })()`);
    if(!dock.initial||!dock.expanded||!dock.collapsed)
      throw new Error("VQ.05a interactive tower dock was not accessible: "+
        JSON.stringify(dock));
    lastState.dockInteraction="pass";
  }
  if(mode==="movement" && requestedDpr!==null) {
    // Exercise actual select event and live viewport resize, not just the
    // CanvasRuntime unit math. All operations use the same running Three scene.
    const beforePixels=lastState.canvasWidth*lastState.canvasHeight;
    const smaller=await evaluate(`(() => {
      const s=document.querySelector("#graphics-quality");
      s.value="economy";
      s.dispatchEvent(new Event("change",{bubbles:true}));
      const c=document.querySelector("#terrain");
      return {tier:document.body.dataset.graphicsTier,pixels:c.width*c.height,
        buffer:document.body.dataset.graphicsBuffer};
    })()`);
    if(smaller.tier!=="economy" || !(smaller.pixels<beforePixels)) {
      throw new Error("VQ.01 live economy selector failed: "+JSON.stringify({beforePixels,smaller}));
    }
    const restored=await evaluate(`(() => {
      const s=document.querySelector("#graphics-quality");
      s.value="sharp";
      s.dispatchEvent(new Event("change",{bubbles:true}));
      const c=document.querySelector("#terrain");
      return {tier:document.body.dataset.graphicsTier,pixels:c.width*c.height};
    })()`);
    if(restored.tier!=="sharp" || restored.pixels<=smaller.pixels) {
      throw new Error("VQ.01 live sharp selector failed: "+JSON.stringify({smaller,restored}));
    }
    const [originalWidth,originalHeight]=dimensions.split(",").map(Number);
    const newWidth=Math.round(originalWidth*0.77);
    const newHeight=Math.round(originalHeight*0.82);
    await send("Emulation.setDeviceMetricsOverride",{
      width:newWidth,height:newHeight,deviceScaleFactor:requestedDpr,mobile:false,
    });
    let resized=null;
    for(let i=0;i<24;i++) {
      resized=await evaluate(`(() => {
        const c=document.querySelector("#terrain");
        return {width:c.width,height:c.height,cssWidth:c.getBoundingClientRect().width,
          cssHeight:c.getBoundingClientRect().height,buffer:document.body.dataset.graphicsBuffer,
          tier:document.body.dataset.graphicsTier,result:document.body.dataset.result};
      })()`);
      if(resized.buffer!==lastState.graphicsBuffer && resized.result==="pass")break;
      await pause(150);
    }
    if(resized.result!=="pass" || resized.buffer===lastState.graphicsBuffer ||
       resized.width*resized.height>4_194_304) {
      throw new Error("VQ.01 same-WebGL-scene responsive resize failed: "+
        JSON.stringify({initial:lastState.graphicsBuffer,resized}));
    }
    await send("Emulation.setDeviceMetricsOverride",{
      width:originalWidth,height:originalHeight,
      deviceScaleFactor:requestedDpr,mobile:false,
    });
    // The browser may finish a heavy SwiftShader resize several frames
    // after CDP acknowledges Emulation.setDeviceMetricsOverride. Observe the
    // real WebGL buffer, never assume a fixed 350ms delay is sufficient.
    let final=null;
    for(let i=0;i<50;i++) {
      final=await evaluate(`(() => {
        const c=document.querySelector("#terrain");
        return {width:c.width,height:c.height,
          tier:document.body.dataset.graphicsTier,result:document.body.dataset.result,
          buffer:document.body.dataset.graphicsBuffer,
          hero:document.body.dataset.heroVisible,
          combat:document.body.dataset.combatProbe};
      })()`);
      if(final.result==="pass" && final.tier==="sharp" &&
         final.width*final.height===restored.pixels)break;
      await pause(150);
    }
    if(final.result!=="pass" || final.tier!=="sharp" ||
       final.width*final.height!==restored.pixels || final.hero!=="true" ||
       final.combat!=="pass") {
      throw new Error("VQ.01 restore/playability gate failed after readiness polling: "+
        JSON.stringify({restored,final}));
    }
    lastState.qualityRoundTrip="pass";
    lastState.resizeRoundTrip="pass";
    lastState.graphicsTier=final.tier;
    lastState.graphicsBuffer=final.buffer;
    lastState.canvasWidth=final.width;
    lastState.canvasHeight=final.height;
  }
  const image=await send("Page.captureScreenshot",{
    format:"png",captureBeyondViewport:false,fromSurface:true,
  },30000);
  if(!image.data || image.data.length<10000)throw new Error("Missing real Chrome screenshot");
  const suffixBase=mode==="movement" ? orientation+(requestedDpr===null?"":"-dpr"+requestedDpr)
    : mode==="map" ? "map-"+(scene.searchParams.get("probePadClick")??"unknown")
    : "cinematic-"+orientation;
  const suffix=suffixBase+
    (scene.searchParams.get("environment")==="legacy" ? "-env-legacy" : "")+
    (scene.searchParams.get("scenery")==="legacy" ? "-scenery-legacy" : "")+
    (scene.searchParams.get("ground")==="legacy" ? "-ground-legacy" : "")+
    (scene.searchParams.get("understory")==="legacy" ? "-understory-legacy" : "")+
    (scene.searchParams.get("pads")==="legacy" ? "-pads-legacy" : "")+
    (scene.searchParams.get("probeTowerBuild")==="P01" ? "-tower-purchase" : "")+
    (scene.searchParams.get("probeWaveDefense")==="gate" ? "-core-gate" : "")+
    (scene.searchParams.get("probeHUD")==="play" ? "-compact-hud" : "");
  const dest=`/tmp/bastionfall-unified-${suffix}.png`;
  writeFileSync(dest,Buffer.from(image.data,"base64"));
  writeFileSync(`/tmp/bastionfall-unified-${suffix}.json`,
    JSON.stringify(lastState,null,2)+"\n");
  console.log("PASS: ART.02 "+mode+" "+orientation+" single real Three.js game canvas, "+
    "actual GLB textures, hero+19 raiders+physical hits; image="+dest);
  console.log(JSON.stringify(lastState));
} catch(error) {
  console.error("FAIL ART.02 "+orientation+": "+String(error));
  console.error("Last browser state: "+JSON.stringify(lastState).slice(0,3000));
  console.error("Chrome JS/WebGL console (tail): "+pageConsole.join("\n").slice(-12000));
  console.error("Chrome stderr (tail): "+browserLog.join("").slice(-3200));
  process.exitCode=1;
} finally {
  for(const waiter of pending.values()) waiter.reject(new Error("Browser teardown"));
  pending.clear();
  socket?.close();
  // Chromium may still be writing Preferences/Cache several hundred
  // milliseconds after SIGTERM. Test SUCCESS must not be turned into a
  // false negative by an ephemeral profile teardown race (ENOTEMPTY).
  if (child.exitCode === null && !child.killed) child.kill("SIGTERM");
  await Promise.race([
    new Promise(resolve => {
      if (child.exitCode !== null) resolve();
      else child.once("exit",resolve);
    }),
    pause(2500),
  ]);
  for (let attempt=0; attempt<8; attempt++) {
    try {
      rmSync(profile,{force:true,recursive:true,maxRetries:2,retryDelay:100});
      break;
    } catch(error) {
      if (!["ENOTEMPTY","EBUSY","EPERM"].includes(error?.code)) {
        console.warn("Chrome cleanup warning:",String(error));
        break;
      }
      if (attempt===7) {
        console.warn("Chrome profile retained for ephemeral runner cleanup:",profile);
      } else await pause(200);
    }
  }
}
