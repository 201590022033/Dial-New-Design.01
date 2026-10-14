"""Durable serial completion of the authorized realism delivery.

Run as a hidden local process so ongoing renders survive chat interruptions.
Every dependent step must pass before file integrity/package completion.
"""
import argparse
import ctypes
from ctypes import wintypes
import json
import os
from pathlib import Path
import subprocess
import sys
import time


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--repo', type=Path, required=True)
    parser.add_argument('--run', type=Path, required=True)
    parser.add_argument('--wait-pid', type=int)
    args = parser.parse_args()
    repo, run = args.repo.resolve(), args.run.resolve()
    reports = run / 'reports'
    blender = Path('C:/Program Files/Blender Foundation/Blender 5.2/blender.exe')
    state_path = reports / 'completion-progress.json'
    state = {'state': 'running', 'phase': 'starting', 'completedSteps': [],
             'backend': 'CUDA + CPU in one serial Blender process', 'startedAt': time.time()}

    def status(phase, **values):
        state.update(phase=phase, **values, updatedAt=time.time())
        temporary = state_path.with_suffix('.part.json')
        temporary.write_text(json.dumps(state, indent=2) + '\n', encoding='utf-8')
        temporary.replace(state_path)
        print(json.dumps({'phase': phase, 'state': state['state']}), flush=True)

    def step(name, command):
        status(name)
        with (reports / ('completion-' + name + '.log')).open('w', encoding='utf-8') as log:
            result = subprocess.run([str(value) for value in command], cwd=str(repo),
                                    stdout=log, stderr=subprocess.STDOUT)
        if result.returncode:
            raise RuntimeError(name + ' failed with exit code ' + str(result.returncode))
        state['completedSteps'].append(name)
        status(name + '-passed')

    try:
        if args.wait_pid:
            status('waiting-for-current-field-render', waitingPid=args.wait_pid)
            if os.name == 'nt':
                kernel = ctypes.WinDLL('kernel32', use_last_error=True)
                kernel.OpenProcess.argtypes = (wintypes.DWORD, wintypes.BOOL, wintypes.DWORD)
                kernel.OpenProcess.restype = wintypes.HANDLE
                kernel.WaitForSingleObject.argtypes = (wintypes.HANDLE, wintypes.DWORD)
                kernel.CloseHandle.argtypes = (wintypes.HANDLE,)
                handle = kernel.OpenProcess(0x00100000, False, args.wait_pid)
                if handle:
                    while kernel.WaitForSingleObject(handle, 1000) == 258:
                        pass
                    kernel.CloseHandle(handle)
            else:
                while True:
                    try:
                        os.kill(args.wait_pid, 0)
                    except ProcessLookupError:
                        break
                    time.sleep(1)
        common = [blender, '--background', '--factory-startup', '--python-exit-code', '1']
        hero = common + ['--python', 'tools/blender/realism_hero.py', '--', '--repo', repo,
                         '--run', run, '--render', '--device', 'HYBRID', '--resume']
        # The currently running Field job can finish normally; resume verifies its
        # two outstanding shots rather than rerendering its accepted quarter view.
        step('field', hero + ['--style', 'archetype-field', '--shots', 'hero-front,hero-strap-macro'])
        for style in ('archetype-dive', 'archetype-pilot', 'archetype-chronograph'):
            step(style, hero + ['--style', style])
        step('hardware-provenance', [sys.executable, 'tools/blender/realism_migrate_hardware.py',
                                    '--repo', repo, '--run', run])
        step('crystal-export', [sys.executable, 'tools/blender/realism_finalize_export.py', '--run', run])
        step('editable-scenes', common + ['--python', 'tools/blender/realism_finalize_scenes.py', '--', '--run', run])
        step('style-validator', ['node', 'tools/blender/realism_validate.mjs', '--input-root', run / 'styles',
                                '--output-dir', reports / 'style-validator-final', '--toolchain', 'tools/blender/realism-toolchain'])
        step('strict-delivery', [sys.executable, 'tools/blender/realism_delivery_report.py', '--repo', repo, '--run', run])
        step('package', [sys.executable, 'tools/blender/realism_package.py', '--repo', repo, '--run', run])
        status('file-delivery-complete', state='complete', completedAt=time.time(),
               package=str(run / 'delivery' / 'watch-realism-2026-10-14.zip'),
               coordinatorVisualReview='Remaining full images and final browser review still require coordinator inspection before final user sign-off.')
    except Exception as error:
        status(state['phase'], state='failed', error=str(error))
        raise


if __name__ == '__main__':
    main()
