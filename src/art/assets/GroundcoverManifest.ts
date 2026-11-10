/**
 * VQ.02d — source-cited original, NON-exclusive CC0 author-modeled undergrowth.
 * Bushes and grass reuse the already shipped KayKit Forest Nature GLB/atlas,
 * not seven duplicated HTTP/texture imports. New 3D wildflowers are exact
 * third-party Kenney free Nature Kit source binaries (untextured PBR color
 * materials, NOT fake painted texture atlases).
 */
export const GROUNDCOVER_FOREST_NODES = [
  { id:"grass",sourceNode:"Grass_2_D_Color1",targetHeight:0.48 },
  { id:"shrub-round",sourceNode:"Bush_3_B_Color1",targetHeight:0.65 },
  { id:"shrub-branch",sourceNode:"Bush_1_E_Color1",targetHeight:0.67 },
] as const;
export const GROUNDCOVER_FLOWERS = [
  {
    id:"flower-gold",file:"kenney-wildflower-gold.glb",
    sourcePath:"packs/nature-kit/flower-yellowa.glb",
    sourceGitBlob:"26adf12842ac3cabfc8475e135ae00fbbde49f78",
    bytes:7120,targetHeight:0.48,
  },
  {
    id:"flower-lilac",file:"kenney-wildflower-lilac.glb",
    sourcePath:"packs/nature-kit/flower-purplea.glb",
    sourceGitBlob:"9a102fdd587ba2c4c345e20ae1721e4753b556eb",
    bytes:7112,targetHeight:0.52,
  },
] as const;
export const GROUNDCOVER_SOURCE_INFO = {
  flowerArtist:"Kenney",flowerLicense:"CC0-1.0",
  originalFlowerPack:"https://kenney.nl/assets/nature-kit",
  mirrorRepository:"Hidencod/tge-assets",
  mirrorCommit:"3ddcc695adbba9fb918cf31b7c139b3f95b76910",
  forestArtist:"Kay Lousberg (KayKit)",forestLicense:"CC0-1.0",
  forestSourceFile:"kaykit-forest-cc0.glb",
  forestSourceNodeNames:["Grass_2_D_Color1","Bush_3_B_Color1","Bush_1_E_Color1"],
} as const;
export function groundcoverFlowerUrl(file:string):string {
  return `${import.meta.env.BASE_URL}assets/scenery/${file}`;
}
export type GroundcoverAssetId =
  |(typeof GROUNDCOVER_FOREST_NODES)[number]["id"]
  |(typeof GROUNDCOVER_FLOWERS)[number]["id"];
