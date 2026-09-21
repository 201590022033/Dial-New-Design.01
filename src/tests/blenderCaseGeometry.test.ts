import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const pyPath = resolve(process.cwd(), 'tools/blender/parametric_case_v1.py');
const caseFixturePath = resolve(process.cwd(), 'tools/blender/test_case_42.json');

describe('Blender parametric case generator', () => {
  const py = readFileSync(pyPath, 'utf8');
  const fixture = JSON.parse(readFileSync(caseFixturePath, 'utf8')) as Record<string, unknown>;

  it('overlaps lug roots with the case shoulder instead of burying them', () => {
    expect(py).toContain('root=r+number(p,\'lugCaseOverlap\')-root_width/2');
    expect(py).not.toContain('root=r-number(p,\'lugCaseOverlap\')-root_width/2');
  });

  it('generates chronograph pusher bosses and tubes at 2h and 4h', () => {
    expect(py).toContain("ob.name=f'DD_CASE_PUSHER_TUBE_{name_suffix}'");
    expect(py).toContain("ob.name=f'DD_CASE_PUSHER_BOSS_{name_suffix}'");
    expect(py).toContain("p.get('pusherLayout') in ('2h-4h','custom')");
  });

  it('includes pusher fields in the 42 mm fixture', () => {
    expect(fixture.pusherCount).toBe(2);
    expect(fixture.pusherLayout).toBe('2h-4h');
    expect(typeof fixture.pusherTubeRadius).toBe('number');
    expect(typeof fixture.pusherBossRadius).toBe('number');
  });
});
