#!/usr/bin/env python3
"""Reproducible single-asset GLB ingest, using ONLY an audited pinned upstream.

This first pilot replaces an unbounded 9.6 MB source with downscaled texture
payloads for a mobile browser. It does not reauthor mesh vertices or UVs.
No runtime CDN, no source-code execution from asset provider, no API tokens.
"""
from __future__ import annotations

import hashlib
import io
import json
import pathlib
import struct
import urllib.request
from PIL import Image

BASE = pathlib.Path(__file__).resolve().parent.parent
DEST = BASE / "public" / "assets" / "lantern-cc0.glb"
SHA_OUT = DEST.with_suffix(".sha256")
SOURCE_COMMIT = "0b4f3a5862f3037c7092206e75c6f2a31a504ca5"
SOURCE_BLOB = "0c97893aee066b6fa36f7725443b7536c3510d09"
SOURCE_URL = (
    "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/"
    + SOURCE_COMMIT + "/Models/Lantern/glTF-Binary/Lantern.glb"
)
MAX_DIMENSION = 512
MAGIC, JSON_TAG, BIN_TAG = 0x46546C67, 0x4E4F534A, 0x004E4942


def align4(raw: bytes, pad: bytes = b"\x00") -> bytes:
    return raw + pad * ((-len(raw)) % 4)


def unpack_glb(raw: bytes) -> tuple[dict, bytes]:
    if len(raw) < 28:
        raise ValueError("GLB too short")
    magic, version, total = struct.unpack_from("<III", raw, 0)
    if magic != MAGIC or version != 2 or total != len(raw):
        raise ValueError("Invalid binary glTF 2.0 header")
    offset = 12
    chunks: list[tuple[int, bytes]] = []
    while offset < len(raw):
        if offset + 8 > len(raw):
            raise ValueError("Truncated GLB chunk")
        length, kind = struct.unpack_from("<II", raw, offset)
        offset += 8
        if offset + length > len(raw):
            raise ValueError("GLB chunk exceeds file length")
        chunks.append((kind, raw[offset: offset + length]))
        offset += length
    if len(chunks) != 2 or [kind for kind, _ in chunks] != [JSON_TAG, BIN_TAG]:
        raise ValueError("Expected one JSON and one binary GLB chunk")
    document = json.loads(chunks[0][1].decode("utf-8").rstrip(" \x00"))
    if document.get("asset", {}).get("version") != "2.0":
        raise ValueError("Expected glTF version 2.0")
    return document, chunks[1][1]


def encode_image(payload: bytes, mime: str) -> tuple[bytes, str]:
    with Image.open(io.BytesIO(payload)) as source:
        source.load()
        if source.width > MAX_DIMENSION or source.height > MAX_DIMENSION:
            source.thumbnail((MAX_DIMENSION, MAX_DIMENSION), Image.Resampling.LANCZOS)
        has_alpha = ("A" in source.getbands()
                     and source.getchannel("A").getextrema()[0] < 255)
        output = io.BytesIO()
        if has_alpha:
            source.convert("RGBA").save(output, format="PNG", optimize=True)
            return output.getvalue(), "image/png"
        source.convert("RGB").save(
            output, format="JPEG", quality=88, subsampling=0,
            optimize=True, progressive=False,
        )
        return output.getvalue(), "image/jpeg"


def ingest() -> None:
    request = urllib.request.Request(
        SOURCE_URL, headers={"User-Agent": "Bastionfall-Asset-Ingest/1.0"}
    )
    with urllib.request.urlopen(request, timeout=45) as response:
        original = response.read(16 * 1024 * 1024 + 1)
    if len(original) > 16 * 1024 * 1024:
        raise ValueError("Source exceeds fixed 16MB network cap")
    git_blob = hashlib.sha1(
        f"blob {len(original)}\0".encode() + original
    ).hexdigest()
    if git_blob != SOURCE_BLOB:
        raise ValueError(f"PINNED_SOURCE_HASH_MISMATCH: {git_blob}")
    doc, bin_chunk = unpack_glb(original)
    if len(doc.get("images", [])) < 2 or not doc.get("meshes"):
        raise ValueError("Selected GLB lacks textured mesh content")
    if len(doc.get("buffers", [])) != 1:
        raise ValueError("First-pilot supports only one embedded GLB buffer")
    image_views: dict[int, tuple[dict, bytes]] = {}
    for image in doc["images"]:
        idx = image.get("bufferView")
        if not isinstance(idx, int) or idx in image_views:
            raise ValueError("GLB image must own a unique embedded buffer view")
        view = doc["bufferViews"][idx]
        source_start = view.get("byteOffset", 0)
        source_bytes = bin_chunk[source_start: source_start + view["byteLength"]]
        result, mime = encode_image(source_bytes, image.get("mimeType", ""))
        image_views[idx] = (image, result)
        image["mimeType"] = mime

    # Retain original indices, normals, UVs, meshes, topology and materials.
    # BufferViews are repacked in original index order with four-byte alignment.
    rebuilt = bytearray()
    for idx, view in enumerate(doc["bufferViews"]):
        start = view.get("byteOffset", 0)
        original_payload = bin_chunk[start: start + view["byteLength"]]
        part = image_views[idx][1] if idx in image_views else original_payload
        rebuilt.extend(b"\0" * ((-len(rebuilt)) % 4))
        view["byteOffset"] = len(rebuilt)
        view["byteLength"] = len(part)
        rebuilt.extend(part)
    doc["buffers"][0]["byteLength"] = len(rebuilt)
    json_bytes = align4(json.dumps(doc, separators=(",", ":")).encode(), b" ")
    bin_bytes = align4(bytes(rebuilt))
    result = (
        struct.pack("<III", MAGIC, 2, 12 + 8 + len(json_bytes) + 8 + len(bin_bytes))
        + struct.pack("<II", len(json_bytes), JSON_TAG) + json_bytes
        + struct.pack("<II", len(bin_bytes), BIN_TAG) + bin_bytes
    )
    check, _ = unpack_glb(result)
    if len(check["images"]) != len(doc["images"]):
        raise ValueError("Converted GLB lost texture entries")
    if len(result) >= 2 * 1024 * 1024:
        raise ValueError("Pilot exceeds 2 MiB bundled/mobile asset cap")
    DEST.parent.mkdir(parents=True, exist_ok=True)
    DEST.write_bytes(result)
    sha256 = hashlib.sha256(result).hexdigest()
    SHA_OUT.write_text(sha256 + "  " + DEST.name + "\n")
    print(f"Original {len(original):,} B -> bundled {len(result):,} B "
          f"({len(doc['meshes'])} meshes, {len(doc['images'])} textures)")
    print(f"Source Git blob: {git_blob}")
    print(f"Bundled SHA256: {sha256}")


if __name__ == "__main__":
    ingest()
