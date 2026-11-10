import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { TERRAIN_ASSETS } from "../src/art/assets/AssetManifest";

const filename = "public/assets/lantern-cc0.glb";
const bin = readFileSync(filename);
function readGlb(): Record<string, unknown> {
  expect(bin.length).toBeGreaterThan(1000);
  expect(bin.length).toBeLessThan(2 * 1024 * 1024);
  expect(bin.readUInt32LE(0)).toBe(0x46546c67); // glTF
  expect(bin.readUInt32LE(4)).toBe(2);
  expect(bin.readUInt32LE(8)).toBe(bin.length);
  expect(bin.readUInt32LE(16)).toBe(0x4e4f534a); // JSON
  const jsonSize = bin.readUInt32LE(12);
  return JSON.parse(bin.subarray(20, 20 + jsonSize).toString("utf8"));
}
describe("Bastionfall externally-authored licensed PBR asset ingestion", () => {
  it("bundles a versioned, small, self-contained binary glTF 2.0", () => {
    const gltf = readGlb();
    expect((gltf.asset as {version: string}).version).toBe("2.0");
    const buffers = gltf.buffers as Array<{byteLength:number;uri?:string}>;
    expect(buffers).toHaveLength(1);
    expect(buffers[0]!.uri).toBeUndefined();
    const meshes = gltf.meshes as unknown[];
    const images = gltf.images as Array<{bufferView:number;mimeType:string;uri?:string}>;
    const materials = gltf.materials as unknown[];
    expect(meshes.length).toBeGreaterThan(0);
    expect(images.length).toBeGreaterThanOrEqual(2);
    expect(materials.length).toBeGreaterThan(0);
    expect(images.every(image =>
      Number.isInteger(image.bufferView) && image.uri===undefined &&
      ["image/png","image/jpeg"].includes(image.mimeType)
    )).toBe(true);
    expect(bin.readUInt32LE(20 + bin.readUInt32LE(12) + 4)).toBe(0x004e4942);
  });

  it("checks recorded output SHA256 against actual GLB bytes", () => {
    const actual = createHash("sha256").update(bin).digest("hex");
    const checksum = readFileSync("public/assets/lantern-cc0.sha256","utf8").trim();
    expect(checksum).toBe(actual + "  lantern-cc0.glb");
    expect(TERRAIN_ASSETS.pilotLantern.sourceGitBlob).toMatch(/^[a-f0-9]{40}$/);
    expect(TERRAIN_ASSETS.pilotLantern.license).toBe("CC0-1.0");
    expect(TERRAIN_ASSETS.pilotLantern.url).toBe("/assets/lantern-cc0.glb");
  });
});
