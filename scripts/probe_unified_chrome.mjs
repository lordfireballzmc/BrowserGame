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
  const deadline=Date.now()+14000;
  while(!existsSync(file)) {
    if (child.exitCode!==null)throw new Error("Chrome exited before DevTools startup");
    if (Date.now()>deadline)throw new Error("Timed out starting Chrome DevTools");
    await pause(120);
  }
  const port=Number(readFileSync(file,"utf8").split("\n")[0]);
  if(!Number.isInteger(port) || port<=0)throw new Error("Invalid Chrome DevTools port");
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
        sceneMode:d.sceneMode, padClickProbe:d.padClickProbe,
        selectedPad:d.selectedPad, padCount:d.padCount,
        sceneryCount:d.sceneryCount, composition:d.composition,
        shadows:d.shadows,
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
    if(lastState.result==="fail" || lastState.assetPilot==="error") {
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
      Number(lastState.padCount)===10;
    const trace = (()=>{ try {return JSON.parse(lastState.trace??"{}");} catch {return {};} })();
    if (mode==="movement") {
      ready=common &&
        lastState.sceneMode==="combat" &&
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
    await pause(350);
    const final=await evaluate(`(() => {
      const c=document.querySelector("#terrain");
      return {width:c.width,height:c.height,
        tier:document.body.dataset.graphicsTier,result:document.body.dataset.result,
        buffer:document.body.dataset.graphicsBuffer,
        hero:document.body.dataset.heroVisible,
        combat:document.body.dataset.combatProbe};
    })()`);
    if(final.result!=="pass" || final.tier!=="sharp" ||
       final.width*final.height!==restored.pixels || final.hero!=="true" ||
       final.combat!=="pass") {
      throw new Error("VQ.01 restore/playability gate failed: "+JSON.stringify(final));
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
  const suffix=mode==="movement" ? orientation+(requestedDpr===null?"":"-dpr"+requestedDpr)
    : mode==="map" ? "map-"+(scene.searchParams.get("probePadClick")??"unknown")
    : "cinematic-"+orientation;
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
