#!/usr/bin/env python3
"""ART.03a: reproducible, licensed, animation-preserving KayKit -> mobile GLB.

The original three ~3.6MB CC0 files ship 75 clips each, many of which are
irrelevant to Bastionfall. Preserve the authored skin, vertices, UV atlas,
skeleton and only a curated in-place idle/walk/run/attack/death clip set;
compact *unreferenced* accessor and bufferView data without changing source
vertices or reauthoring the artist's work. No runtime CDN or paid source.
"""
from __future__ import annotations

import copy
import hashlib
import json
import pathlib
import re
import struct
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUTPUT = ROOT / "public" / "assets" / "characters"
SOURCE_REPO = "KayKit-Game-Assets/KayKit-Character-Pack-Adventures-1.0"
SOURCE_COMMIT = "672074b73ba276876a19e8816ecdc5241817ab47"
PATH = "addons/kaykit_character_pack_adventures/Characters/gltf/"
# Blob SHA computed by Git from original source bytes, independently checked.
ACTORS = (
    ("warden", "Knight", "717b56ca2b5ff5392679774725201ba03a3eefab"),
    ("scrapper", "Barbarian", "66d312ab6dc02b35fb648e7585bfdddb4e02eeef"),
    ("runner", "Rogue_Hooded", "e5769ed9da59a51dbc2f70f1b18b3e2c017572038eca2a8"),
)
MAGIC, JSON_TAG, BIN_TAG = 0x46546c67, 0x4e4f534a, 0x004e4942

def aligned(data: bytes, pad=b"\x00") -> bytes:
    return data + pad * ((-len(data)) % 4)

def read_glb(raw: bytes) -> tuple[dict, bytes]:
    if len(raw) < 28:
        raise ValueError("Truncated GLB")
    magic, version, total = struct.unpack_from("<III", raw)
    if (magic,version,total)!=(MAGIC,2,len(raw)):
        raise ValueError("Source is not valid binary glTF v2")
    position=12
    chunks=[]
    while position<len(raw):
        size,typ=struct.unpack_from("<II",raw,position)
        position+=8
        if position+size>len(raw):raise ValueError("Invalid chunk length")
        chunks.append((typ,raw[position:position+size]))
        position+=size
    if len(chunks)!=2 or [c[0] for c in chunks]!=[JSON_TAG,BIN_TAG]:
        raise ValueError("Expected one JSON and one embedded BIN chunk")
    doc=json.loads(chunks[0][1].decode("utf-8").rstrip("\0 "))
    if doc.get("asset",{}).get("version")!="2.0":
        raise ValueError("Unsupported glTF version")
    if len(doc.get("buffers",[]))!=1 or doc["buffers"][0].get("uri"):
        raise ValueError("Requires one self-contained embedded binary buffer")
    if doc.get("extensionsRequired"):
        raise ValueError("Source requires unreviewed extensions: "+repr(doc["extensionsRequired"]))
    return doc,chunks[1][1]

def choose_animations(animations: list[dict]) -> list[dict]:
    print("Source clips:", [a.get("name") for a in animations][:95], flush=True)
    names=[str(a.get("name","")).lower() for a in animations]
    preferences={
        "Idle":("idle_a","idle","idle_"),
        "Walk":("walking_a","walking","walk"),
        "Run":("running_a","running","run"),
        "Attack":("1h_melee_attack_slice_diagonal","1h_melee_attack",
                  "melee_attack","attack"),
        "Death":("death_a","death"),
    }
    chosen=[]
    already=set()
    for semantic,tokens in preferences.items():
        candidates=[i for i,n in enumerate(names) if i not in already
            and any(token in n for token in tokens)]
        if not candidates:
            if semantic in ("Idle","Walk","Run"):
                raise ValueError("Missing essential animated character clip: "+semantic)
            continue
        # Stable preference for canonical A/base cycles.
        def rank(i: int) -> tuple[int,int]:
            name=names[i]
            return (min((j for j,t in enumerate(tokens) if t in name),default=99),len(name))
        index=min(candidates,key=rank)
        already.add(index)
        original=copy.deepcopy(animations[index])
        original["name"]=semantic
        chosen.append(original)
    if len(chosen)<3:raise ValueError("Cannot produce authentic locomotion with <3 clips")
    return chosen

def trim(doc: dict, binary: bytes) -> tuple[dict,bytes]:
    doc=copy.deepcopy(doc)
    doc["animations"]=choose_animations(doc["animations"])
    used_accessors:set[int]=set()
    for mesh in doc.get("meshes",[]):
        for prim in mesh["primitives"]:
            used_accessors.update(prim.get("attributes",{}).values())
            if "indices" in prim:used_accessors.add(prim["indices"])
            for morph in prim.get("targets",[]):used_accessors.update(morph.values())
    for skin in doc.get("skins",[]):
        if "inverseBindMatrices" in skin:used_accessors.add(skin["inverseBindMatrices"])
    for anim in doc["animations"]:
        for sampler in anim["samplers"]:
            used_accessors.update((sampler["input"],sampler["output"]))
    accessors=doc.get("accessors",[])
    if not used_accessors or max(used_accessors)>=len(accessors):
        raise ValueError("Out of bounds animation or mesh accessor")
    accessor_indices=sorted(used_accessors)
    accessor_remap={old:new for new,old in enumerate(accessor_indices)}
    doc["accessors"]=[accessors[i] for i in accessor_indices]
    for mesh in doc.get("meshes",[]):
        for prim in mesh["primitives"]:
            prim["attributes"]={k:accessor_remap[v] for k,v in prim.get("attributes",{}).items()}
            if "indices" in prim:prim["indices"]=accessor_remap[prim["indices"]]
            for target in prim.get("targets",[]):
                for k,v in tuple(target.items()):target[k]=accessor_remap[v]
    for skin in doc.get("skins",[]):
        if "inverseBindMatrices" in skin:
            skin["inverseBindMatrices"]=accessor_remap[skin["inverseBindMatrices"]]
    for anim in doc["animations"]:
        for sampler in anim["samplers"]:
            sampler["input"]=accessor_remap[sampler["input"]]
            sampler["output"]=accessor_remap[sampler["output"]]

    original_views=doc.get("bufferViews",[])
    used_views:set[int]=set()
    for accessor in doc["accessors"]:
        if "bufferView" in accessor:used_views.add(accessor["bufferView"])
        if "sparse" in accessor:
            used_views.add(accessor["sparse"]["indices"]["bufferView"])
            used_views.add(accessor["sparse"]["values"]["bufferView"])
    for image in doc.get("images",[]):
        if "bufferView" in image:used_views.add(image["bufferView"])
        elif image.get("uri"):
            raise ValueError("Non-embedded image breaks bundled offline model")
    if not used_views or max(used_views)>=len(original_views):
        raise ValueError("Referenced bufferView missing")
    indices=sorted(used_views)
    view_remap={old:new for new,old in enumerate(indices)}
    doc["bufferViews"]=[original_views[i] for i in indices]
    rebuilt=bytearray()
    for view in doc["bufferViews"]:
        begin=view.get("byteOffset",0)
        end=begin+view["byteLength"]
        if begin<0 or end>len(binary):raise ValueError("Invalid original bufferView bounds")
        rebuilt.extend(b"\0"*((-len(rebuilt))%4))
        data=binary[begin:end]
        view["byteOffset"]=len(rebuilt)
        rebuilt.extend(data)
    for acc in doc["accessors"]:
        if "bufferView" in acc:acc["bufferView"]=view_remap[acc["bufferView"]]
        if "sparse" in acc:
            for part in ("indices","values"):
                old=acc["sparse"][part]["bufferView"]
                acc["sparse"][part]["bufferView"]=view_remap[old]
    for img in doc.get("images",[]):
        if "bufferView" in img:img["bufferView"]=view_remap[img["bufferView"]]
    doc["buffers"][0]["byteLength"]=len(rebuilt)
    json_bytes=aligned(json.dumps(doc,separators=(",",":")).encode(),b" ")
    bin_bytes=aligned(bytes(rebuilt))
    output=(struct.pack("<III",MAGIC,2,12+8+len(json_bytes)+8+len(bin_bytes))
        +struct.pack("<II",len(json_bytes),JSON_TAG)+json_bytes
        +struct.pack("<II",len(bin_bytes),BIN_TAG)+bin_bytes)
    read_glb(output)
    return doc,output

def main() -> None:
    OUTPUT.mkdir(parents=True,exist_ok=True)
    manifest=[]
    for role,source,expected_git_sha in ACTORS:
        url=("https://raw.githubusercontent.com/"+SOURCE_REPO+"/"+SOURCE_COMMIT
             +"/"+PATH+source+".glb")
        req=urllib.request.Request(url,headers={"User-Agent":"Bastionfall-CC0-Art-Ingest/1.0"})
        with urllib.request.urlopen(req,timeout=60) as response:
            raw=response.read(6*1024*1024+1)
        if len(raw)>6*1024*1024:raise ValueError("Source character oversized")
        git_sha=hashlib.sha1(f"blob {len(raw)}\0".encode()+raw).hexdigest()
        if git_sha!=expected_git_sha:raise ValueError(
            role+" source bytes changed: expected "+expected_git_sha+" got "+git_sha)
        document,buffer=read_glb(raw)
        if not document.get("skins") or not document.get("animations"):
            raise ValueError("Not a real rigged animated model")
        trimmed,out=trim(document,buffer)
        if len(out)>=1_650_000:
            raise ValueError(f"{role} optimization failed: {len(out)} bytes")
        if not any("skin" in node for node in trimmed.get("nodes",[])):
            raise ValueError("Character skin binding missing")
        if not trimmed.get("images"):
            raise ValueError("Artist UV atlas/texture missing")
        p=OUTPUT/(role+"-kaykit.glb")
        p.write_bytes(out)
        checksum=hashlib.sha256(out).hexdigest()
        (OUTPUT/(role+"-kaykit.sha256")).write_text(checksum+"  "+p.name+"\n")
        manifest.append({
            "role":role,"artistModel":source,"sourceGitBlob":expected_git_sha,
            "sourceCommit":SOURCE_COMMIT,"license":"CC0-1.0",
            "bytes":len(out),"sha256":checksum,
            "clips":[a["name"] for a in trimmed["animations"]],
            "skins":len(trimmed["skins"]),"meshes":len(trimmed["meshes"]),
            "textures":len(trimmed["images"])
        })
        print(f"{role}: {len(raw):,}B => {len(out):,}B "
              f"{manifest[-1]['clips']} "
              f"skins={len(trimmed['skins'])}, textures={len(trimmed['images'])}",
              flush=True)
    (OUTPUT/"manifest.json").write_text(json.dumps({
        "title":"Bastionfall KayKit CC0 stylized-character integration ART.03a",
        "upstream":"https://github.com/"+SOURCE_REPO,
        "sourceCommit":SOURCE_COMMIT,"characters":manifest,
    },indent=2)+"\n")

if __name__=="__main__":
    main()
