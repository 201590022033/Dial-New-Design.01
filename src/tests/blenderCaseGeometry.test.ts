import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const pyPath = resolve(process.cwd(), 'tools/blender/parametric_case_v1.py');
const caseFixturePath = resolve(process.cwd(), 'tools/blender/test_case_42.json');

describe('Blender parametric case generator', () => {
  const py = readFileSync(pyPath, 'utf8');
  const fixture = JSON.parse(readFileSync(caseFixturePath, 'utf8')) as Record<string, unknown>;

  it('overlaps lug roots with the case shoulder instead of burying them', () => {
    expect(py).toContain("root_radius=r-number(p,'lugCaseOverlap')");
    expect(py).not.toContain("root=r+number(p,'lugCaseOverlap')");
  });

  it('generates chronograph pusher bosses and tubes at 2h and 4h', () => {
    expect(py).toContain("ob.name=f'DD_CASE_PUSHER_TUBE_{name_suffix}'");
    expect(py).toContain("ob.name=f'DD_CASE_PUSHER_BOSS_{name_suffix}'");
    expect(py).toContain("p.get('pusherLayout') in ('2h-4h','custom')");
  });

  it('includes pusher fields in the 42 mm fixture', () => {
    expect(fixture.pusherCount).toBe(0);
    expect(fixture.pusherLayout).toBe('none');
    expect(typeof fixture.pusherTubeRadius).toBe('number');
    expect(typeof fixture.pusherBossRadius).toBe('number');
  });

  it('includes estimated nominal interface parameters for the controlled preview', () => {
    expect(fixture.springBarHoleDiameter).toBe(2);
    expect(fixture.springBarHoleFromLugTip).toBe(2.8);
    expect(fixture.springBarHoleFromLowerLugEdge).toBe(1.2);
    expect(fixture.dialSeatDepth).toBe(1.2);
    expect(fixture.chapterRingSeatDepth).toBe(1.5);
    expect(fixture.crownTubeThreadOuterDiameter).toBe(3.5);
    expect(fixture.crownTubeBoreDiameter).toBe(2.1);
    expect(fixture.estimatedInterfaceProvenance).toMatchObject({ status: 'ESTIMATED_NOMINAL' });
    expect(py).toContain("cut_spring_bar_hole");
    expect(py).toContain("number(p,'crownTubeBoreDiameter')");
  });

  it('supports every catalogued lug geometry family', () => {
    expect(fixture.lugStyle).toBe('straight');
    for (const style of ['straight','curved','twisted','hooded','integrated','drilled','wire','teardrop','faceted','skeleton']) {
      expect(py).toContain(`'${style}'`);
    }
    expect(py).toContain("ob['DD_LUG_STYLE']=style");
    expect(py).toContain("ob['DD_STRAP_INTERFACE']='integrated'");
    expect(py).toContain("ob['DD_STRAP_INTERFACE']='fixed-wire'");
  });
});
