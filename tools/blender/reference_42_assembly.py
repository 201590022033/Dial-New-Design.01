"""Review-only assembly of the independent 42 mm fixture assets.

The case, removable crown and hand set retain distinct mesh names. The fixture
frames are visual placement values, not measured movement or sealing data.
"""
import argparse
import json
import os
import sys

import bpy

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import parametric_case_v1
import parametric_crown_v1
import parametric_hand_v1
import reference_42_supplemental


def build(manifest, quality="normal"):
    with open(manifest["case"], encoding="utf-8") as source:
        case_parameters = json.load(source)
    with open(manifest["crown"], encoding="utf-8") as source:
        crown_parameters = json.load(source)
    with open(manifest["hands"], encoding="utf-8") as source:
        hand_parameters = json.load(source)
    with open(manifest["supplemental"], encoding="utf-8") as source:
        supplemental_parameters = json.load(source)
    case = parametric_case_v1.build(case_parameters, quality)
    crown = parametric_crown_v1.build(crown_parameters, quality)
    hands = parametric_hand_v1.build(hand_parameters, quality)
    tube_end = (case_parameters["caseDiameter"] / 2
                - case_parameters["crownTubeEmbed"]
                + case_parameters["crownTubeLength"])
    gap = crown_parameters["attachment"]["axialGapMm"]
    if not isinstance(gap, (int, float)):
        raise ValueError("Review placement requires a known axialGapMm")
    for obj in crown.objects:
        obj.location.x += tube_end + gap
    for obj in hands.objects:
        obj.location.z += manifest["handStackZMm"]
    supplemental = []
    placement = supplemental_parameters["placement"]
    placements = {
        "dial": placement["dialCenterZMm"],
        "chapter-ring": placement["chapterRingCenterZMm"],
        "bezel": placement["bezelCenterZMm"],
        "crystal": placement["crystalCenterZMm"],
        "caseback": placement["casebackCenterZMm"],
        "strap": 0.0,
    }
    for asset, z in placements.items():
        objects = reference_42_supplemental.build(asset, supplemental_parameters, quality)
        for obj in objects:
            obj.location.z += z
        supplemental.extend(objects)
    return [*case.objects, *crown.objects, *hands.objects, *supplemental]


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--params", required=True)
    parser.add_argument("--output", required=True)
    parser.add_argument("--quality", choices=parametric_case_v1.QUALITY, default="normal")
    args = parser.parse_args(sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else [])
    with open(args.params, encoding="utf-8") as source:
        manifest = json.load(source)
    directory = os.path.dirname(os.path.abspath(args.params))
    for key in ("case", "crown", "hands", "supplemental"):
        manifest[key] = os.path.join(directory, manifest[key])
    objects = build(manifest, args.quality)
    bpy.ops.object.select_all(action="DESELECT")
    for obj in objects:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = objects[0]
    os.makedirs(os.path.dirname(os.path.abspath(args.output)), exist_ok=True)
    bpy.ops.export_scene.gltf(filepath=os.path.abspath(args.output), export_format="GLB",
                              use_selection=True, export_yup=True, export_extras=True)


if __name__ == "__main__":
    main()
