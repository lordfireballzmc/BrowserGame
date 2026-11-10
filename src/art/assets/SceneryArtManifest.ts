/**
 * VQ.02b final source: one CC0 KayKit Forest Nature artist atlas with five TREE
 * selected in-file tree models; VQ.02c rocks are separate CC0 Kenney GLBs. The free source pack is by Kay Lousberg; the GLB
 * below is a byte-perfect bundled derivative from bot-crossing at exact SHA.
 * No runtime CDN, no paid extras, no copyrighted Kingdom Rush assets.
 */
export const SCENERY_ART_SOURCE = {
  artist: "Kay Lousberg (KayKit)",
  license: "CC0-1.0",
  originalPack: "https://kaylousberg.itch.io/kaykit-forest",
  sourceRepository: "Station-Sciences/bot-crossing",
  sourceCommit: "9f7dc6536aacbce2203bb705e3f0cf1772ea3fb7",
  sourcePath: "public/assets/forest.glb",
  sourceGitBlob: "386f990dfc5580dd6c6063a1ee4838bdf4df6742",
  file: "kaykit-forest-cc0.glb",
  bytes: 396480,
} as const;

/** Distinct original artist-modeled GLB nodes, each UV mapped to the ONE
 * source gradient atlas, preserving the same stylized modeling family as
 * Bastionfall's other CC0 KayKit characters. Gameplay positions remain ours. */
export const SCENERY_ART_MODELS = [
  { id:"pine-tapered",kind:"pine",sourceNode:"Tree_4_A_Color1",targetHeight:4.75 },
  { id:"pine-crowned",kind:"pine",sourceNode:"Tree_4_C_Color1",targetHeight:4.80 },
  { id:"oak-crowned",kind:"broadleaf",sourceNode:"Tree_1_A_Color1",targetHeight:4.45 },
  { id:"oak-wide",kind:"broadleaf",sourceNode:"Tree_3_A_Color1",targetHeight:4.40 },
  { id:"oak-branched",kind:"broadleaf",sourceNode:"Tree_3_C_Color1",targetHeight:4.55 },
  { id:"mossy-boulders",kind:"rock",sourceNode:"rocks-large",targetHeight:0.86 },
  { id:"rounded-boulders",kind:"rock",sourceNode:"rocks-small",targetHeight:0.80 },
] as const;
export type SceneryArtModel = (typeof SCENERY_ART_MODELS)[number];
export type SceneryArtKind = SceneryArtModel["kind"];
export function sceneryArtUrl():string {
  return `${import.meta.env.BASE_URL}assets/scenery/${SCENERY_ART_SOURCE.file}`;
}

/** VQ.02c — genuinely rounded natural stone clusters. Source-pinned CC0
 * Kenney Castle Kit GLBs; no longer use the mechanically stacked KayKit
 * Rock_1_J / Rock_3_Q meshes. Preserve existing site IDs and instancing. */
export const SCENERY_ROCK_SOURCES = [
  {
    id:"mossy-boulders",file:"kenney-organic-rocks-large.glb",bytes:23764,
    sourceNode:"rocks-large",sourceGitBlob:"c55e671c6c82f75d49eb7c2488bb23c514fbdee2",
    sourcePath:"packs/castle-kit/rocks-large.glb",
  },
  {
    id:"rounded-boulders",file:"kenney-organic-rocks-small.glb",bytes:22752,
    sourceNode:"rocks-small",sourceGitBlob:"ab1336c3801232dccfee6fab6059bae43cbe633b",
    sourcePath:"packs/castle-kit/rocks-small.glb",
  },
] as const;
export const SCENERY_ROCK_SOURCE_INFO = {
  originalArtist:"Kenney",license:"CC0-1.0",
  originalPack:"https://kenney.nl/assets/castle-kit",
  sourceRepository:"Hidencod/tge-assets",
  sourceCommit:"3ddcc695adbba9fb918cf31b7c139b3f95b76910",
} as const;
export function sceneryRockUrl(file:string):string {
  return `${import.meta.env.BASE_URL}assets/scenery/${file}`;
}
