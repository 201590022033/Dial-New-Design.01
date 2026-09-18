"""Blender-only integration checks; run with --background --factory-startup --python-exit-code 1.
No review assets are written here. Standard-library helpers live in test_*helpers.py.
"""
import json
from pathlib import Path
import sys
sys.dont_write_bytecode = True


def main():
    import bpy
    from mathutils import Vector
    root = Path(__file__).resolve().parent
    sys.path.insert(0, str(root))
    import parametric_case_v1 as case
    import parametric_crown_v1 as crown
    case_params = json.loads((root / "test_case_42.json").read_text(encoding="utf-8"))
    crown_params = json.loads((root / "test_crown_v1.json").read_text(encoding="utf-8"))
    case_collection = case.build(case_params)
    original_case = {o.name: o.as_pointer() for o in case_collection.objects}
    assert len(original_case) == 7
    assert "DD_CASE_CROWN_BOSS" in original_case and "DD_CASE_CROWN_TUBE" in original_case
    crown.build(crown_params)
    head_collection = crown.build(crown_params)  # Idempotent rebuild; case stays untouched.
    assert {o.name: o.as_pointer() for o in case_collection.objects} == original_case
    assert [o.name for o in head_collection.objects] == ["DD_CROWN_HEAD"]
    assert bpy.data.objects.get("DD_CROWN_HEAD.001") is None
    head = head_collection.objects[0]
    assert min(v.co.x for v in head.data.vertices) == 0
    tube_end = case_params["caseDiameter"] / 2 - case_params["crownTubeEmbed"] + case_params["crownTubeLength"]
    head.location = (tube_end + crown_params["attachment"]["axialGapMm"], 0, 0)
    bpy.context.view_layer.update()
    tube = case_collection.objects["DD_CASE_CROWN_TUBE"]
    actual_tube_end = max((tube.matrix_world @ Vector(corner)).x for corner in tube.bound_box)
    head_rear = min((head.matrix_world @ v.co).x for v in head.data.vertices)
    assert abs(head_rear - actual_tube_end) < 1e-5, (head_rear, actual_tube_end)
    head.hide_render = True
    assert not tube.hide_render
    assert not case_collection.objects["DD_CASE_CROWN_BOSS"].hide_render
    print("P4 Blender integration PASS: 7 unchanged case meshes; independent/idempotent crown; rear socket aligned at tube endpoint", tube_end)


if __name__ == "__main__":
    main()
