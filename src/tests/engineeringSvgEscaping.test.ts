import { describe, expect, it } from 'vitest';
import { generateEngineeringSvg } from '@/services/exportGeometryService';
import { createBand } from '@/domain/bands/bandRegistry';
import { defaultTypographyConfig, generateTypographyLayout } from '@/domain/generators/typographyEngine';
import type { DesignOverlay } from '@/renderer/types';

const overlay: DesignOverlay = {
  dialFace: { fill: '#c08a76', stroke: '#e2e8f0', opacity: 1, borderWidthMm: .16, centreHoleMm: 1.5 },
  markers: [], chapterRingMarkers: [], chapterRingTypography: [],
  typography: generateTypographyLayout(defaultTypographyConfig)
};
const request = (designOverlay: DesignOverlay | null = overlay) => ({
  target: 'entire-project' as const,
  bands: [createBand('band-dial', 'dial-face', { innerRadius: 0, outerRadius: 14.25 })],
  selectedBandId: null, context: { width: 900, height: 900, centerX: 450, centerY: 450, zoom: 1, panX: 0, panY: 0 },
  designOverlay, scalePreview: null
});

describe('engineering SVG XML escaping for browser/vector PDF parsing', () => {
  it('escapes the default quoted font family rather than producing an unterminated attribute', () => {
    const svg = generateEngineeringSvg(request());
    expect(svg).toContain('font-family="&quot;IBM Plex Mono&quot;, monospace"');
    expect(svg).not.toContain('font-family=""IBM Plex Mono"');
    expect(svg).toContain('width="90mm" height="90mm"');
  });
  it('retains text and attributes with XML special characters without creating extra elements', () => {
    const text = overlay.typography[0]!;
    const svg = generateEngineeringSvg(request({ ...overlay, typography: [{ ...text, text: 'A&B <label> "quoted"', fontFamily: '"Font & Co", sans-serif', color: '#abc" onload="bad' }] }));
    expect(svg).toContain('A&amp;B &lt;label&gt; &quot;quoted&quot;');
    expect(svg).toContain('font-family="&quot;Font &amp; Co&quot;, sans-serif"');
    expect(svg).toContain('fill="#abc&quot; onload=&quot;bad"');
    expect(svg).not.toContain('<label>');
    expect(svg).not.toContain('onload="bad"');
  });
  it('escapes band identity/style and stores arbitrary notes as metadata, not unsafe XML comments', () => {
    const input = request(null);
    input.bands[0]!.id = 'dial" & <new>';
    input.bands[0]!.svgGroupId = 'group" & <new>';
    input.bands[0]!.style.fill = 'url("#colour")';
    const svg = generateEngineeringSvg({ ...input, metadata: { projectName: 'A & B <project>', manufacturingNotes: '-- keep --> <script/>' } });
    expect(svg).toContain('data-band-id="dial&quot; &amp; &lt;new&gt;"');
    expect(svg).toContain('fill="url(&quot;#colour&quot;)"');
    expect(svg).toContain('<metadata>');
    expect(svg).toContain('-- keep --&gt; &lt;script/&gt;');
    expect(svg).not.toContain('<!-- metadata:');
    expect(svg).not.toContain('<script/>');
  });
});
