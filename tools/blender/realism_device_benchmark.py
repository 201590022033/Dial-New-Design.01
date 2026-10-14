"""Compare local CPU/CUDA/hybrid throughput on an unchanged packed source scene."""
import argparse
import json
from pathlib import Path
import sys
import time
import bpy


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--run', type=Path, required=True)
    parser.add_argument('--style', default='archetype-field')
    args = parser.parse_args(sys.argv[sys.argv.index('--') + 1:])
    run = args.run.resolve()
    bpy.ops.wm.open_mainfile(filepath=str(run / 'styles' / args.style / 'source.blend'))
    scene = bpy.context.scene
    scene.render.resolution_percentage = 25
    scene.cycles.samples = 64
    scene.cycles.adaptive_min_samples = 64
    prefs = bpy.context.preferences.addons['cycles'].preferences
    prefs.compute_device_type = 'CUDA'
    prefs.get_devices()
    destination = run / 'reports' / 'device-benchmark'
    destination.mkdir(exist_ok=True)
    results = []
    for mode in ('CPU', 'CUDA', 'HYBRID', 'CUDA-WARM'):
        for device in prefs.devices:
            device.use = device.type == 'CPU' if mode == 'CPU' else device.type in ('CPU', 'CUDA') if mode == 'HYBRID' else device.type == 'CUDA'
        scene.cycles.device = 'CPU' if mode == 'CPU' else 'GPU'
        scene.render.filepath = str(destination / (mode.lower() + '.png'))
        start = time.time()
        bpy.ops.render.render(write_still=True)
        result = {'mode': mode, 'seconds': time.time() - start,
                  'devices': [{'name': device.name, 'type': device.type} for device in prefs.devices if device.use],
                  'resolution': [round(scene.render.resolution_x * .25), round(scene.render.resolution_y * .25)], 'samples': 64}
        results.append(result)
        (destination / 'results.json').write_text(json.dumps(results, indent=2) + '\n')
        print('DD_DEVICE_BENCHMARK ' + json.dumps(result), flush=True)


if __name__ == '__main__':
    main()
