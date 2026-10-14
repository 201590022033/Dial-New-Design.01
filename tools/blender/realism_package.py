"""Package verified realism deliverables, omitting drafts and intermediate logs."""
import argparse
import hashlib
import html
import json
from pathlib import Path
import zipfile

STYLE_NAMES = {
    'archetype-ladies-dress-nh05': 'Ladies Dress',
    'archetype-dress-formal': 'Dress',
    'archetype-field': 'Field',
    'archetype-dive': 'Diver',
    'archetype-pilot': 'Pilot',
    'archetype-chronograph': 'Chronograph',
}
SHOTS = ['hero-three-quarter', 'hero-front', 'hero-strap-macro']


def gallery(images, portable=False):
    cards = []
    for style, name in STYLE_NAMES.items():
        shots = SHOTS + (['crystal-ar-off', 'crystal-ar-on'] if style == 'archetype-dress-formal' else [])
        thumbnails = []
        for shot in shots:
            source = ('renders/' if portable else '../renders/') + style + '/' + shot + '.png'
            label = {'hero-three-quarter': 'Three-quarter', 'hero-front': 'Dial close-up',
                     'hero-strap-macro': 'Strap detail', 'crystal-ar-off': 'AR off',
                     'crystal-ar-on': 'AR on'}[shot]
            thumbnails.append('<a href="{0}"><img loading="lazy" src="{0}" alt="{1} — {2}"><span>{2}</span></a>'.format(source, html.escape(name), label))
        model = ('models/assembled/' if portable else '../styles/') + style + '/watch.glb'
        blend = ('blender/' if portable else '../styles/') + style + '/source.blend'
        cards.append('<section><h2>{}</h2><p><a href="{}" download>Assembled GLB</a> · <a href="{}">Editable Blender scene</a></p><div class="shots">{}</div></section>'.format(name, model, blend, ''.join(thumbnails)))
    return '''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Watch realism delivery</title><style>
body{background:#10151b;color:#e8edf2;font:16px/1.6 system-ui,sans-serif;margin:0;padding:clamp(20px,5vw,64px);max-width:1600px;margin:auto}h1{font-size:clamp(30px,4vw,52px);line-height:1.12;margin-bottom:12px}h2{font-size:26px;margin:0}a{color:#8bd8d0}header{max-width:860px;margin-bottom:48px}section{border-top:1px solid #35404c;padding:30px 0}.shots{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:18px}.shots a{background:#1b232d;border-radius:12px;overflow:hidden;text-decoration:none}.shots img{width:100%;height:250px;object-fit:cover;display:block}.shots span{display:block;padding:12px 16px}small{color:#bbc4ce}
</style></head><body><header><p>Dial Designer · 14 October 2026</p><h1>Watch realism collection</h1><p>Six editable assemblies, refined component models and 2400-pixel Cycles photography. Open any image to inspect it at full resolution.</p><small>Existing dimensions and design options are preserved. Presentation models do not establish physical fit. Leather detail uses the approved 6 o'clock tail.</small></header>''' + ''.join(cards) + '</body></html>'


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--repo', type=Path, required=True)
    parser.add_argument('--run', type=Path, required=True)
    args = parser.parse_args()
    repo, run = args.repo.resolve(), args.run.resolve()
    report = json.loads((run / 'reports' / 'delivery-manifest.json').read_text(encoding='utf-8'))
    if not report.get('complete', False):
        raise ValueError('Strict delivery verification must pass before packaging')
    output = run / 'delivery'
    output.mkdir(exist_ok=True)
    (output / 'gallery.html').write_text(gallery(None), encoding='utf-8')
    files = []

    def add(path, destination):
        if not path.is_file():
            raise FileNotFoundError(path)
        files.append((path, destination))

    for path in sorted((run / 'web' / 'public' / 'assets' / '3d').rglob('*.glb')):
        add(path, 'models/components/' + path.relative_to(run / 'web').as_posix())
    for style in STYLE_NAMES:
        for filename in ('source.blend', 'shots.json', 'tangent-repair.json'):
            add(run / 'styles' / style / filename, 'blender/' + style + '/' + filename)
        add(run / 'styles' / style / 'watch.glb', 'models/assembled/' + style + '/watch.glb')
        for shot in SHOTS + (['crystal-ar-off', 'crystal-ar-on'] if style == 'archetype-dress-formal' else []):
            add(run / 'renders' / style / (shot + '.png'), 'renders/' + style + '/' + shot + '.png')
    add(run / 'work' / 'public' / 'assets' / '3d' / 'archetypes' / 'strap-leather.blend', 'blender/leather-construction.blend')
    for path in sorted(set((repo / 'tools' / 'blender').glob('realism_*')) | set((repo / 'tools' / 'blender').glob('test_realism_*.py'))):
        if path.is_file():
            add(path, 'source/tools/blender/' + path.name)
    for filename in ('package.json', 'package-lock.json'):
        add(repo / 'tools' / 'blender' / 'realism-toolchain' / filename, 'source/tools/blender/realism-toolchain/' + filename)
    for path in sorted((run / 'bakes').rglob('*')):
        if path.is_file():
            add(path, 'source/bakes/' + path.relative_to(run / 'bakes').as_posix())
    for filename in ('assembly-manifest.json', 'registry-manifest.json'):
        add(run / filename, 'source/' + filename)
    for filename in ('VR0-INPUT-MANIFEST.json', 'VR0-ASSET-INVENTORY.md'):
        add(repo / 'docs' / 'realism' / filename, 'source/' + filename)
    for path in sorted((repo / '.artifacts' / 'blender-review' / 'realism' / 'vr0-2026-10-13' / 'backup').rglob('*.glb')):
        base = repo / '.artifacts' / 'blender-review' / 'realism' / 'vr0-2026-10-13' / 'backup'
        add(path, 'originals/' + path.relative_to(base).as_posix())
    add(repo / 'docs' / 'WATCH-REALISM-RELEASE-2026-10-14.md', 'reports/RELEASE.md')
    add(repo / 'docs' / 'WATCH-REALISM-WORK-PLAN-2026-10-14.md', 'source/docs/WORK-PLAN.md')
    add(repo / 'docs' / 'briefs' / 'WATCH-REALISM-USER-BRIEF-2026-10-12.txt', 'source/docs/USER-BRIEF.txt')
    for name in ('VR-APP-INTEGRATION-CONTRACT.md', 'VR-SURFACE-AND-RENDER-PLAN.md', 'VR-EXPORT-VALIDATION-PLAN.md'):
        add(repo / 'docs' / 'realism' / name, 'source/docs/' + name)
    for name in ('delivery-manifest.json', 'delivery-report.md', 'per-file-changes.md', 'per-file-changes.csv',
                 'asset-changes.json', 'asset-accounting.json', 'promotion-manifest.json', 'full-contract.json', 'asset-final-contract.json',
                 'surface-recipes.json', 'final-code-validation.json', 'final-tests.json',
                 'final-after-cache-revision.json', 'editable-scene-finalization.json',
                 'final-readonly-app-review.json', 'final-readonly-app-review-tests.json',
                 'coordinator-visual-review.json',
                 'final-realism-tool-tests.log',
                 'standalone-crystal-finalization.json', 'standalone-crystal-finalization-summary.md',
                 'render-fingerprint-migration.json', 'realism_hero-before-macro-fix.py',
                 'ar-reference-reuse.json',
                 'ar-image-comparison.json',
                 'hardware-fingerprint-migration.json', 'hardware-fingerprint-migration-summary.md',
                 'realism_hero-before-hybrid.py',
                 'standalone-tangent-repair-summary.md'):
        path = run / 'reports' / name
        if path.exists():
            add(path, 'reports/' + name)
    for directory in ('browser', 'validator', 'style-validator-final'):
        for path in sorted((run / 'reports' / directory).rglob('*')):
            if path.is_file():
                add(path, 'reports/' + directory + '/' + path.relative_to(run / 'reports' / directory).as_posix())
    for path in sorted((run / 'reports' / 'device-benchmark').glob('*.json')):
        add(path, 'reports/device-benchmark/' + path.name)
    archive = output / 'watch-realism-2026-10-14.zip'
    contents = []
    with zipfile.ZipFile(str(archive), 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=6) as zipped:
        zipped.writestr('gallery.html', gallery(None, portable=True))
        zipped.writestr('README.md', '''# Watch realism collection — 14 October 2026

Extract this archive and open **gallery.html** to browse the final photographs and download each assembled model or editable scene.

- **models/components/**: 101 refined component GLBs, with their original application paths under public/assets/3d. These retain the original numeric millimetres and dashboard material roles.
- **models/assembled/**: six standalone watch GLBs in standard metres, +Y up.
- **blender/**: six packed editable studio scenes, shot metadata and tangent repair records. leather-construction.blend retains the source Boolean/stitch construction.
- **renders/**: 18 final hero images and the Dress AR off/on pair, all 2400 pixels wide. Drafts are excluded.
- **originals/**: exact backed-up source GLBs, including the 13 deliberately unmodified face-review fixtures.
- **source/**: build/validation scripts, pinned tool-only dependency manifests, frozen assembly/input manifests and neutral bake/artwork sources. Rebuilding application-specific assemblies uses the original Dial Designer repository and its existing dependencies; the packed Blender scenes can be opened directly.
- **reports/**: delivery integrity, per-file changes/omissions, preserved-contract/validator/app results and browser evidence. RELEASE.md explains the deliberate geometry limits and remaining qualification.

Colours and physical dimensions are preserved. No new colour variants or manufacturing/fit approvals are implied. The images use 256 configured maximum Cycles samples with adaptive sampling, denoising and AgX.

The software changes are local and have not been committed or pushed. The final 20-switch HD check has stable same-style cycle endpoints. Real screen-reader, physical-fit/supplier and long-session/frame-time qualification remain separate checks.
''')
        for path, destination in files:
            zipped.write(str(path), destination)
            contents.append({'path': destination, 'bytes': path.stat().st_size,
                             'sha256': hashlib.sha256(path.read_bytes()).hexdigest()})
        zipped.writestr('package-contents.json', json.dumps(contents, indent=2))
    with zipfile.ZipFile(str(archive)) as zipped:
        if zipped.testzip() is not None:
            raise ValueError('Archive integrity check failed')
    result = {'path': str(archive), 'bytes': archive.stat().st_size,
              'sha256': hashlib.sha256(archive.read_bytes()).hexdigest(), 'files': len(contents) + 3,
              'integrity': 'pass'}
    (output / 'package.json').write_text(json.dumps(result, indent=2) + '\n', encoding='utf-8')
    print(json.dumps(result))


if __name__ == '__main__':
    main()
