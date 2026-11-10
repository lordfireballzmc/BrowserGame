/**
 * VQ.02b final source: one CC0 KayKit Forest Nature artist atlas with seven
 * selected in-file models. The free source pack is by Kay Lousberg; the GLB
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
  { id:"mossy-boulders",kind:"rock",sourceNode:"Rock_1_J_Color1",targetHeight:0.83 },
  { id:"stacked-boulders",kind:"rock",sourceNode:"Rock_3_Q_Color1",targetHeight:0.82 },
] as const;
export type SceneryArtModel = (typeof SCENERY_ART_MODELS)[number];
export type SceneryArtKind = SceneryArtModel["kind"];
export function sceneryArtUrl():string {
  return `${import.meta.env.BASE_URL}assets/scenery/${SCENERY_ART_SOURCE.file}`;
}
