import { afterEach, describe, expect, it, vi } from 'vitest';
import { downloadProjectText, downloadWatchAssemblyFile } from '@/services/projectFileService';

afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });
describe('project download lifecycle', () => {
  it.each([false, true])('attaches the anchor and defers URL cleanup, including click failure %s', fails => {
    vi.useFakeTimers();
    const appendChild = vi.fn();
    const remove = vi.fn();
    const anchor = { href: '', download: '', style: { display: '' }, remove,
      click: vi.fn(() => { expect(appendChild).toHaveBeenCalledWith(anchor); if (fails) throw new Error('click failed'); }) };
    const revokeObjectURL = vi.fn();
    vi.stubGlobal('document', { createElement: () => anchor, body: { appendChild } });
    vi.stubGlobal('URL', { createObjectURL: () => 'blob:project-qa', revokeObjectURL });
    if (fails) expect(() => downloadProjectText('{}', 'watch.json')).toThrow('click failed');
    else downloadProjectText('{}', 'watch.json');
    expect(anchor.href).toBe('blob:project-qa'); expect(anchor.download).toBe('watch.json');
    expect(remove).toHaveBeenCalledOnce(); expect(revokeObjectURL).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1000);
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:project-qa');
  });
  it('retains the assembly file extension and safe fallback name', () => {
    vi.useFakeTimers();
    const anchor = { href: '', download: '', style: {}, click: vi.fn(), remove: vi.fn() };
    vi.stubGlobal('document', { createElement: () => anchor, body: { appendChild: vi.fn() } });
    vi.stubGlobal('URL', { createObjectURL: () => 'blob:qa', revokeObjectURL: vi.fn() });
    downloadWatchAssemblyFile('{}', ' ');
    expect(anchor.download).toBe('watch-design.watch');
    vi.runAllTimers();
  });
});
