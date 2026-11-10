/**
 * VQ.02b — seven source-pinned original Kenney CC0 sculpted 3D trees/rocks.
 * No runtime CDN, no copying Kingdom Rush art, no fake 'handmade' attribution.
 * Nature Kit variants are artist-modeled but use source-color materials;
 * Castle Kit variants carry embedded painted/PBR atlas textures.
 */
export const SCENERY_ART_SOURCE = {
  artist: "Kenney",
  license: "CC0-1.0",
  sourceRepository: "Hidencod/tge-assets",
  sourceCommit: "3ddcc695adbba9fb918cf31b7c139b3f95b76910",
  natureKit: "https://kenney.nl/assets/nature-kit",
  castleKit: "https://kenney.nl/assets/castle-kit",
} as const;

export const SCENERY_ART_MODELS = [
  { id:"pine-layered", kind:"pine", file:"kenney-pine-layered.glb",
    sourcePath:"packs/castle-kit/tree-large.glb", sourceGitBlob:"3a4b4defaba65f623e06be511c8d95e884b30e79",
    bytes:28804, hasAtlas:true, targetHeight:4.60 },
  { id:"pine-rounded", kind:"pine", file:"kenney-pine-rounded.glb",
    sourcePath:"packs/nature-kit/tree-pinerounda.glb", sourceGitBlob:"b6d121d0726ae204e184ae1280c4c415734fc91e",
    bytes:14488, hasAtlas:false, targetHeight:4.60 },
  { id:"oak-crowned", kind:"broadleaf", file:"kenney-canopy-oak.glb",
    sourcePath:"packs/nature-kit/tree-oak.glb", sourceGitBlob:"b136723ada4b5574b71f727120ab21fa579bf2fb",
    bytes:14644, hasAtlas:false, targetHeight:4.45 },
  { id:"plateau-crowned", kind:"broadleaf", file:"kenney-canopy-plateau.glb",
    sourcePath:"packs/nature-kit/tree-plateau.glb", sourceGitBlob:"627378f1f5e8de85d2168f4093c26e7e000be82b",
    bytes:16304, hasAtlas:false, targetHeight:4.50 },
  { id:"branch-crowned", kind:"broadleaf", file:"kenney-canopy-detailed.glb",
    sourcePath:"packs/nature-kit/tree-detailed.glb", sourceGitBlob:"8d59ea41e280a5ea9234ec1e503fb871c55021de",
    bytes:31412, hasAtlas:false, targetHeight:4.15 },
  { id:"mossy-boulders", kind:"rock", file:"kenney-rocks-mossy.glb",
    sourcePath:"packs/castle-kit/rocks-large.glb", sourceGitBlob:"c55e671c6c82f75d49eb7c2488bb23c514fbdee2",
    bytes:23764, hasAtlas:true, targetHeight:0.80 },
  { id:"lichen-boulders", kind:"rock", file:"kenney-rocks-lichen.glb",
    sourcePath:"packs/nature-kit/rock-largea.glb", sourceGitBlob:"40e1365a43b706bd78c2658b48b189c9a35f8923",
    bytes:7552, hasAtlas:false, targetHeight:0.79 },
] as const;
export type SceneryArtModel = (typeof SCENERY_ART_MODELS)[number];
export type SceneryArtKind = SceneryArtModel["kind"];
export function sceneryArtUrl(file:string):string {
  return `${import.meta.env.BASE_URL}assets/scenery/${file}`;
}
