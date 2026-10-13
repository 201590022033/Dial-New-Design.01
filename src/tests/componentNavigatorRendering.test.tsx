import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { ComponentNavigator } from '@/components/configurator/ComponentNavigator';
import { useWatchAssemblyStore } from '@/stores/watchAssemblyStore';
import { buildComponentNavigatorItems } from '@/domain/configurator/componentNavigator';

describe('component navigator disclosure markup', () => {
  it('starts with design open and case hardware collapsed in labelled regions', () => {
    const html = renderToStaticMarkup(<ComponentNavigator />);
    expect(html).toMatch(/<button id="[^"]+-design-heading" type="button" aria-expanded="true"/);
    expect(html).toMatch(/<button id="[^"]+-case-hardware-heading" type="button" aria-expanded="false"/);
    expect(html).toMatch(/id="[^"]+-case-hardware" role="region" aria-labelledby="[^"]+" hidden=""/);
    expect(html).toContain('Assembly component navigator');
  });
  it('retains exactly one labelled selector for every real assembly instance', () => {
    const html = renderToStaticMarkup(<ComponentNavigator />);
    const items = buildComponentNavigatorItems(useWatchAssemblyStore.getInitialState().assembly);
    const encode = (name: string) => name.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll("'", '&#x27;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
    for (const item of items) {
      const selector = `aria-label="Select ${encode(item.name)}"`;
      expect(html.split(selector).length - 1, item.id).toBe(1);
    }
  });
  it('connects every native disclosure button to an existing controlled element', () => {
    const html = renderToStaticMarkup(<ComponentNavigator />);
    const controls = [...html.matchAll(/aria-controls="([^"]+)"/g)].map(match => match[1]!);
    expect(controls.length).toBeGreaterThan(3);
    for (const id of controls) expect(html).toContain(`id="${id}"`);
    expect(html).not.toContain('role="tree"');
    expect(html).not.toContain('role="menu"');
  });
});
