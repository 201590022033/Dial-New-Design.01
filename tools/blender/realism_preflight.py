"""Read-only GLB inventory, verified backup and installed Blender capability probe.

Run in Blender, with arguments after --. Never exports or overwrites an input.
Generated fixtures and an optional tiny render stay under --output-dir.
"""
import argparse
from collections import Counter
import hashlib
import json
from pathlib import Path
import shutil
import struct
import sys
import time


def digest(data):
    return hashlib.sha256(data).hexdigest()


def write_json(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, indent=2, allow_nan=False) + "\n", encoding="utf-8")


def glb_document(data):
    magic, version, length = struct.unpack_from("<III", data)
    if magic != 0x46546C67 or version != 2 or length != len(data):
        raise ValueError("Not a complete GLB 2.0 file")
    size, kind = struct.unpack_from("<II", data, 12)
    if kind != 0x4E4F534A:
        raise ValueError("First chunk must be JSON")
    return json.loads(data[20:20 + size])


def role(name):
    """Report conservative semantic candidates, never a modelling instruction."""
    name = name.upper()
    for keyword, candidate in [
        ("SPRING_BAR", "spring-bar"), ("BUCKLE", "buckle"),
        ("KEEPER", "strap-keeper"), ("STRAP", "strap-side-unconfirmed"),
        ("RACING", "strap-side-unconfirmed"), ("CRYSTAL", "crystal"),
        ("SAPPHIRE", "crystal"), ("DIAMOND", "gem"),
        ("HAND_HOUR", "hour-hand"), ("HAND_MINUTE", "minute-hand"),
        ("HAND_SECONDS", "seconds-hand"), ("HAND_SECOND", "seconds-hand"),
        ("SUBDIAL", "subdial"), ("HAND", "hand-role-unconfirmed"),
        ("CROWN", "crown-or-interface"), ("PUSHER", "pusher-or-interface"),
        ("LUG", "lug"), ("CASEBACK", "caseback"), ("GASKET", "gasket"),
        ("CHAPTER", "chapter-ring"), ("REHAUT", "rehaut"),
        ("PILOT_SCALE", "scale-artwork"), ("SCALE_SURFACE", "live-scale-surface"),
        ("BEZEL", "bezel"), ("DIAL", "dial-or-artwork"),
        ("MINUTE", "minute-artwork"), ("INDEX", "index"),
        ("NUMERAL", "numeral"), ("DATE", "date-detail"),
        ("MIDCASE", "case"), ("CASE", "case"),
    ]:
        if keyword in name:
            return candidate
    return "unidentified"


def inspect_file(source, root, backup):
    import bpy
    from mathutils import Vector
    data = source.read_bytes()
    document = glb_document(data)
    relative = source.relative_to(root).as_posix()
    destination = backup / relative
    destination.parent.mkdir(parents=True, exist_ok=True)
    if destination.exists():
        if digest(destination.read_bytes()) != digest(data):
            raise ValueError(f"Refusing to replace different backup: {relative}")
    else:
        shutil.copy2(source, destination)
    if digest(destination.read_bytes()) != digest(data):
        raise ValueError(f"Backup hash mismatch: {relative}")
    bpy.ops.wm.read_factory_settings(use_empty=True)
    if bpy.ops.import_scene.gltf(filepath=str(source)) != {"FINISHED"}:
        raise ValueError(f"Blender import failed: {relative}")
    bpy.context.view_layer.update()
    objects = []
    for obj in sorted(bpy.context.scene.objects, key=lambda item: item.name):
        item = {
            "name": obj.name, "type": obj.type,
            "parent": obj.parent.name if obj.parent else None,
            "role_candidate": role(obj.name),
            "matrix_local": [list(row) for row in obj.matrix_local],
            "matrix_world": [list(row) for row in obj.matrix_world],
            "location": list(obj.location), "scale": list(obj.scale),
            "dimensions": list(obj.dimensions),
        }
        if obj.type == "MESH":
            mesh = obj.data
            mesh.calc_loop_triangles()
            corners = [obj.matrix_world @ Vector(corner) for corner in obj.bound_box]
            item.update({
                "mesh_name": mesh.name, "vertices": len(mesh.vertices),
                "triangles": len(mesh.loop_triangles),
                "vertex_coordinates_sha256": digest(b"".join(struct.pack("<fff", *v.co) for v in mesh.vertices)),
                "triangle_indices_sha256": digest(b"".join(struct.pack("<III", *t.vertices) for t in mesh.loop_triangles)),
                "bounds_min": [min(p[i] for p in corners) for i in range(3)],
                "bounds_max": [max(p[i] for p in corners) for i in range(3)],
                "materials": [m.name if m else None for m in mesh.materials],
                "uv_layers": [{"name": uv.name, "loops": len(uv.data),
                    "loop_uv_sha256": digest(b"".join(struct.pack("<ff", *entry.uv) for entry in uv.data))}
                    for uv in mesh.uv_layers],
            })
        objects.append(item)
    images = [{"name": img.name, "size": list(img.size), "channels": img.channels}
              for img in bpy.data.images if img.type == "IMAGE"]
    return {
        "path": relative, "bytes": len(data), "sha256": digest(data),
        "backup_path": str(destination),
        "gltf_asset": document.get("asset"),
        "extensions_used": document.get("extensionsUsed", []),
        "extensions_required": document.get("extensionsRequired", []),
        "gltf_nodes": document.get("nodes", []),
        "gltf_mesh_names": [m.get("name") for m in document.get("meshes", [])],
        "gltf_meshes": document.get("meshes", []),
        "gltf_accessors": document.get("accessors", []),
        "gltf_materials": document.get("materials", []),
        "gltf_animations": document.get("animations", []),
        "gltf_images": document.get("images", []),
        "blender_unit_system": bpy.context.scene.unit_settings.system,
        "blender_unit_scale": bpy.context.scene.unit_settings.scale_length,
        "objects": objects, "images": images,
        "triangles": sum(obj.get("triangles", 0) for obj in objects),
        "role_counts": dict(Counter(obj["role_candidate"] for obj in objects)),
    }


def probe(output, smoke_render, render_device="CPU"):
    import bpy
    from mathutils import Vector
    bpy.ops.wm.read_factory_settings(use_empty=True)
    material = bpy.data.materials.new("VR0 Exporter Probe")
    material["DD_REALISM_SCHEMA"] = "dial-designer/realism-material/v1"
    material["DD_REALISM_ROLE"] = "crystal"
    bsdf = material.node_tree.nodes.get("Principled BSDF")
    sockets = {socket.name: socket for socket in bsdf.inputs}
    for name, value in {"Base Color": (1, 1, 1, 1), "Metallic": 0.0,
                        "Roughness": 0.04, "Transmission Weight": 1.0,
                        "IOR": 1.55, "Coat Weight": 0.2,
                        "Sheen Weight": 0.2,
                        "Anisotropic": 0.5,
                        "Thin Film Thickness": 350.0, "Thin Film IOR": 1.38}.items():
        if name in sockets:
            sockets[name].default_value = value
    # The installed exporter requires these additional glTF sockets; Principled
    # thin-film values alone do not emit KHR_materials_iridescence.
    from io_scene_gltf2.blender.com.material_helpers import create_settings_group
    settings = material.node_tree.nodes.new("ShaderNodeGroup")
    settings.node_tree = create_settings_group("glTF Material Output")
    settings.inputs["Iridescence Factor"].default_value = 0.06
    settings.inputs["Iridescence Thickness Minimum"].default_value = 250.0
    bpy.ops.mesh.primitive_uv_sphere_add(segments=24, ring_count=12)
    sphere = bpy.context.object
    sphere.name = "VR0_TEST_ONLY"
    sphere.data.materials.append(material)
    exporter = bpy.ops.export_scene.gltf.get_rna_type()
    properties = {p.identifier: {"type": p.type, "description": p.description}
                  for p in exporter.properties if p.identifier != "rna_type"}
    fixture = output / "capability-fixture.glb"
    bpy.ops.export_scene.gltf(filepath=str(fixture), export_format="GLB",
                              use_selection=True, export_yup=True, export_extras=True)
    document = glb_document(fixture.read_bytes())
    devices = {}
    prefs = bpy.context.preferences.addons.get("cycles")
    if prefs:
        prefs = prefs.preferences
        for backend in ["CUDA", "OPTIX"]:
            try:
                devices[backend] = [{"name": dev.name, "type": dev.type, "id": dev.id}
                                    for dev in prefs.get_devices_for_type(backend)]
            except Exception as exc:
                devices[backend] = {"error": str(exc)}
    report = {"blender_version": bpy.app.version_string,
              "blender_build_hash": bpy.app.build_hash.decode(),
              "python_version": sys.version, "binary": bpy.app.binary_path,
              "principled_inputs": list(sockets), "export_properties": properties,
              "test_fixture_extensions": document.get("extensionsUsed", []),
              "test_fixture_materials": document.get("materials", []),
              "cycles_devices": devices,
              "probe_fixture_is_not_a_product_asset": True}
    if smoke_render:
        scene = bpy.context.scene
        scene.render.engine = "CYCLES"
        if render_device != "CPU":
            prefs.compute_device_type = render_device
            prefs.get_devices_for_type(render_device)
            for device in prefs.devices:
                device.use = device.type == render_device
        scene.cycles.device = "CPU" if render_device == "CPU" else "GPU"
        scene.cycles.samples = 16
        scene.cycles.use_denoising = True
        scene.render.threads_mode = "FIXED"
        scene.render.threads = 4
        scene.render.resolution_x = scene.render.resolution_y = 192
        scene.render.resolution_percentage = 100
        scene.render.image_settings.file_format = "PNG"
        scene.view_settings.view_transform = "AgX"
        world = bpy.data.worlds.new("VR0 neutral probe world")
        scene.world = world
        world.node_tree.nodes.get("Background").inputs["Strength"].default_value = 0.35
        light_data = bpy.data.lights.new("VR0 probe softbox", "AREA")
        light_data.energy, light_data.size = 400, 4
        light = bpy.data.objects.new(light_data.name, light_data)
        scene.collection.objects.link(light)
        light.location = (0, -2, 4)
        light.rotation_euler = (-light.location).to_track_quat("-Z", "Y").to_euler()
        camera_data = bpy.data.cameras.new("VR0 probe camera")
        camera = bpy.data.objects.new(camera_data.name, camera_data)
        scene.collection.objects.link(camera)
        camera.location = (3, -4, 2)
        camera.rotation_euler = (-camera.location).to_track_quat("-Z", "Y").to_euler()
        scene.camera = camera
        scene.render.filepath = str(output / "cycles-capability-smoke.png")
        start = time.monotonic()
        try:
            result = bpy.ops.render.render(write_still=True)
            status = {"result": list(result)}
        except Exception as exc:
            status = {"result": "FAILED", "error": str(exc)}
        report["smoke_render"] = {**status, "requested_device": render_device,
                                  "seconds": time.monotonic() - start,
                                  "resolution": [192, 192], "samples": 16,
                                  "note": "Capability only; not an image-quality or hero timing benchmark"}
    write_json(output / "capabilities.json", report)
    return report


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--repo", required=True)
    parser.add_argument("--output-dir", required=True)
    parser.add_argument("--smoke-render", action="store_true")
    parser.add_argument("--probe-only", action="store_true")
    parser.add_argument("--render-device", choices=["CPU", "CUDA", "OPTIX"], default="CPU")
    args = parser.parse_args(sys.argv[sys.argv.index("--") + 1:])
    root, output = Path(args.repo).resolve(), Path(args.output_dir).resolve()
    asset_root = root / "public/assets/3d"
    if output == asset_root or asset_root in output.parents or output in asset_root.parents:
        raise ValueError("Output must be separate from the source asset tree")
    output.mkdir(parents=True, exist_ok=True)
    if args.probe_only:
        probe(output, args.smoke_render, args.render_device)
        return
    start = time.monotonic()
    inventory, failures = [], []
    for path in sorted(asset_root.rglob("*.glb")):
        try:
            inventory.append(inspect_file(path, root, output / "backup"))
            print("VR0 inventoried: " + path.relative_to(root).as_posix(), flush=True)
        except Exception as exc:
            failures.append({"path": str(path), "error": str(exc)})
    report = {"schema": "watch-realism-preflight/v1", "repo": str(root),
              "scope": "All existing public/assets/3d/**/*.glb; modelling eligibility is separate",
              "source_assets_modified": False,
              "units_note": "Runtime descriptors declare numeric millimetres in Y-up GLB. Blender import alone does not encode that contract.",
              "role_note": "Candidates from names only. Strap long/short identity is intentionally unconfirmed.",
              "files": inventory, "failures": failures,
              "count": len(inventory), "total_bytes": sum(f["bytes"] for f in inventory),
              "total_triangles": sum(f["triangles"] for f in inventory),
              "seconds": time.monotonic() - start}
    write_json(output / "inventory.json", report)
    write_json(output / "backup-manifest.json", {"schema": "watch-realism-backup/v1", "files": [
        {key: file[key] for key in ("path", "bytes", "sha256")} for file in inventory]})
    probe(output, args.smoke_render, args.render_device)
    print("VR0 COMPLETE " + json.dumps({key: report[key] for key in
          ("count", "total_bytes", "total_triangles", "failures", "seconds")}), flush=True)
    if failures:
        raise RuntimeError("Inventory has failures; inspect inventory.json before proceeding")


if __name__ == "__main__":
    main()
