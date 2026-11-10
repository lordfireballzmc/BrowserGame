/** Authoritative, provenance-tracked bundled GLB registry. No runtime CDN dependencies. */
export const TERRAIN_ASSETS = {
  pilotLantern: {
    id: "khronos-lantern-cc0-pilot",
    url: "/assets/lantern-cc0.glb",
    // Original model is a CC0 3D PBR-textured old wooden lamp; production
    // selection will undergo coherence review against Bastionfall's 3D style.
    sourceRepository: "KhronosGroup/glTF-Sample-Assets",
    sourcePath: "Models/Lantern/glTF-Binary/Lantern.glb",
    sourceCommit: "0b4f3a5862f3037c7092206e75c6f2a31a504ca5",
    sourceGitBlob: "0c97893aee066b6fa36f7725443b7536c3510d09",
    license: "CC0-1.0",
    displayHeightMeters: 2.9,
    position: [21.2, 0.0, -1.5] as const,
  },
} as const;
