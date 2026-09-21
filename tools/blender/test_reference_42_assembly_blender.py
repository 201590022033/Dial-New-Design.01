"""Blender-side check of the fixed visual reference's component ownership/frames."""
import json
import os
import sys

def main():
    here = os.path.dirname(os.path.abspath(__file__))
    sys.path.insert(0, here)
    from reference_42_assembly import build
    with open(os.path.join(here, "reference_42_assembly.json"), encoding="utf-8") as source:
        manifest = json.load(source)
    for key in ("case", "crown", "hands", "supplemental"):
        manifest[key] = os.path.join(here, manifest[key])
    objects = build(manifest)
    case = [obj for obj in objects if obj.name.startswith("DD_CASE_")]
    crown = [obj for obj in objects if obj.name == "DD_CROWN_HEAD"]
    hands = [obj for obj in objects if obj.name.startswith("DD_HAND_")]
    supplemental = [obj for obj in objects if obj.name.startswith("DD_REF42_")]
    assert len(case) == 7, len(case)
    assert len(crown) == 1, len(crown)
    assert len(hands) == 15, len(hands)
    assert len(supplemental) == 162, len(supplemental)
    assert abs(crown[0].location.x - 21.8) < 1e-6
    assert abs(next(obj for obj in hands if obj.name == "DD_HAND_HOUR_HUB").location.z - 3.85) < 1e-6
    assert abs(next(obj for obj in hands if obj.name == "DD_HAND_MINUTE_HUB").location.z - 4.30) < 1e-6
    assert abs(next(obj for obj in hands if obj.name == "DD_HAND_SECONDS_HUB").location.z - 4.75) < 1e-6
    assert "DD_CASE_CROWN_BOSS" in {obj.name for obj in case}
    assert "DD_CASE_CROWN_TUBE" in {obj.name for obj in case}
    assert {obj.name for obj in case if obj.name.startswith("DD_CASE_LUG_")} == {
        "DD_CASE_LUG_12_L", "DD_CASE_LUG_12_R", "DD_CASE_LUG_6_L", "DD_CASE_LUG_6_R"
    }
    assert abs(next(obj for obj in supplemental if obj.name == "DD_REF42_DIAL").location.z - 3.7) < 1e-6
    supplemental_names = {obj.name for obj in supplemental}
    assert {"DD_REF42_DATE_FRAME", "DD_REF42_DATE_RECESS", "DD_REF42_DATE_CARD",
            "DD_REF42_DATE_NUMERAL", "DD_REF42_DIAL_TEXT_AUTOMATIC",
            "DD_REF42_BEZEL_PIP_FRAME", "DD_REF42_BEZEL_PIP_LUME",
            "DD_REF42_BUCKLE_FRAME", "DD_REF42_BUCKLE_PIN", "DD_REF42_BUCKLE_TANG",
            "DD_REF42_STRAP_KEEPER_1", "DD_REF42_STRAP_KEEPER_2"} <= supplemental_names
    assert abs(next(obj for obj in supplemental if obj.name == "DD_REF42_CRYSTAL").location.z - 6.25) < 1e-6
    assert abs(next(obj for obj in supplemental if obj.name == "DD_REF42_CASEBACK").location.z + 5.65) < 1e-6
    print("P8 Blender assembly PASS: case, crown, hands and 6 supplemental component groups have independent frames")


if __name__ == "__main__":
    main()
