"""Shared, explicitly estimated presentation datums. Never manufacturing evidence."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SPEC = json.loads((ROOT / 'attachment_preview.json').read_text(encoding='utf-8'))
FIXTURE = json.loads((ROOT / 'test_case_42.json').read_text(encoding='utf-8'))


def attachment(p=FIXTURE):
    y = p['lugToLug'] / 2 - p['springBarHoleFromLugTip']
    z = -p['lugTipDrop'] / 2 - p['lugThickness'] / 2 + p['springBarHoleFromLowerLugEdge']
    return dict(y=y, z=z, gap=p['lugPairGap'],
                notch_y=y - SPEC['strapThicknessMm'] / 2 - SPEC['caseClearanceMm'],
                notch_top=z + SPEC['strapThicknessMm'] / 2 + SPEC['caseClearanceMm'])
