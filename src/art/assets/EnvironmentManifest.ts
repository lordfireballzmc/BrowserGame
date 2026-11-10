/**
 * VQ.02 — exact pinned, locally bundled artist-authored CC0 castle modules.
 *
 * The composition, placement, proportions and player-facing color hierarchy are
 * Bastionfall-specific; the underlying textured geometry is Kenney art, NOT
 * exclusive Bastionfall sculpting. Never load it from a live external CDN.
 */
export const ENVIRONMENT_SOURCE = {
  artist: "Kenney",
  sourceRepository: "Hidencod/tge-assets",
  sourceCommit: "3ddcc695adbba9fb918cf31b7c139b3f95b76910",
  originalCastlePack: "https://kenney.nl/assets/castle-kit",
  originalTowerDefensePack: "https://kenney.nl/assets/tower-defense-kit",
  license: "CC0-1.0",
} as const;

export const ENVIRONMENT_MODELS = [
  {
    id: "keep-main", file: "kenney-keep-main.glb",
    sourcePath: "packs/castle-kit/tower-slant-roof.glb",
    sourceGitBlob: "19a2cb914f1d202faf9880faf64b006287dbc4db",
    bytes: 55056,
  },
  {
    id: "turret-body", file: "kenney-turret-body.glb",
    sourcePath: "packs/castle-kit/tower-square-mid-windows.glb",
    sourceGitBlob: "17bfeea94217ec38f6e7cc51908a7dc266acff4c",
    bytes: 38400,
  },
  {
    id: "turret-roof", file: "kenney-turret-roof.glb",
    sourcePath: "packs/castle-kit/tower-square-top-roof-high-windows.glb",
    sourceGitBlob: "55d7b589a02c40731aa25448250d2211a5e7757f",
    bytes: 30340,
  },
  {
    id: "pad-border", file: "kenney-pad-border.glb",
    sourcePath: "packs/castle-kit/tower-square-base-border.glb",
    sourceGitBlob: "556f91c3a33588d8dd7a7a97179fa5b0f54f0b06",
    bytes: 11236,
  },
  {
    id: "pad-inlay", file: "kenney-pad-inlay.glb",
    sourcePath: "packs/castle-kit/tower-square-base-color.glb",
    sourceGitBlob: "07d7e7aed0748f59fe55d18c15deb123b76c8163",
    bytes: 14460,
  },
  {
    id: "pad-glyph", file: "kenney-pad-glyph.glb",
    sourcePath: "packs/tower-defense-kit/selection-a.glb",
    sourceGitBlob: "0a9983785b128e5182b8998bf4ea3b0a27f8420a",
    bytes: 30872,
  },
] as const;

export type EnvironmentModelId = (typeof ENVIRONMENT_MODELS)[number]["id"];
export function environmentModelUrl(file: string): string {
  // Vite injects the correct base for local dev AND private-repo Pages builds.
  return `${import.meta.env.BASE_URL}assets/environment/${file}`;
}
