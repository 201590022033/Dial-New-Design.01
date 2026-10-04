import { useEffect, useMemo, useState } from 'react';
import { CircleHelp, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { helpDocPages } from '@/domain/extensions/helpDocs';
import { engineeringHelpIndex } from '@/domain/extensions/engineeringHelpIndex';

export const HelpCenter = () => {
  const [open, setOpen] = useState(false);
  const [selectedDocId, setSelectedDocId] = useState(helpDocPages[0]?.id ?? '');

  useEffect(() => {
    const handleOpen = (event: Event) => {
      const detail = (event as CustomEvent<{ docId?: string }>).detail;
      if (detail?.docId) {
        setSelectedDocId(detail.docId);
      }
      setOpen(true);
    };

    window.addEventListener('dial-help:open', handleOpen);
    return () => {
      window.removeEventListener('dial-help:open', handleOpen);
    };
  }, []);

  const selectedDoc = useMemo(
    () => helpDocPages.find((doc) => doc.id === selectedDocId) ?? helpDocPages[0],
    [selectedDocId]
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="ds-focus-ring fixed right-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-full border border-engineering-teal/45 bg-engineering-panel/95 text-engineering-teal shadow-glowTeal ds-transition hover:scale-105"
        aria-label="Open Engineering Help"
      >
        <CircleHelp className="ds-icon-md" />
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 grid grid-cols-1 bg-slate-950/55 backdrop-blur-[2px] xl:grid-cols-[330px_1fr]">
          <aside className="flex min-h-0 flex-col border-r border-engineering-border bg-engineering-bg p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-engineering-muted">
                Engineering Help
              </h2>
              <Button variant="icon" size="sm" aria-label="Close Engineering Help" onClick={() => setOpen(false)}>
                <X className="ds-icon-sm" />
              </Button>
            </div>
            <div className="space-y-2 overflow-auto pr-1">
              {helpDocPages.map((page) => (
                <button
                  key={page.id}
                  type="button"
                  onClick={() => setSelectedDocId(page.id)}
                  className={`ds-focus-ring ds-transition block w-full rounded-md border px-3 py-2 text-left ${
                    selectedDocId === page.id
                      ? 'border-engineering-teal/65 bg-engineering-teal/12 text-engineering-text'
                      : 'border-engineering-border bg-engineering-panel/35 text-engineering-muted hover:border-engineering-amber/55 hover:text-engineering-text'
                  }`}
                >
                  <p className="text-xs font-semibold">{page.title}</p>
                  <p className="text-[10px] uppercase tracking-[0.1em] text-engineering-muted">{page.category}</p>
                </button>
              ))}
            </div>
          </aside>

          <section className="min-h-0 overflow-y-auto p-5 xl:p-8">
            {selectedDoc ? (
              <article className="mx-auto max-w-4xl rounded-panel border border-engineering-border bg-engineering-panel/80 p-6 shadow-panel">
                <p className="ds-label-inspector">{selectedDoc.category}</p>
                <h3 className="mt-2 text-2xl font-semibold text-engineering-text">{selectedDoc.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-engineering-muted">{selectedDoc.summary}</p>
                <div className="ds-divider my-5" />
                <h4 className="text-sm font-semibold text-engineering-text">How to use and check</h4>
                <ol className="mt-3 list-decimal space-y-3 pl-5 text-sm text-engineering-muted">
                  {selectedDoc.steps.map((step) => <li key={step}>{step}</li>)}
                </ol>
                <p className="mt-5 rounded-md border border-engineering-amber/40 p-3 text-sm text-engineering-muted">
                  <strong>Limits: </strong>{selectedDoc.limitation}
                </p>
                <div className="mt-4 rounded-md border border-engineering-border bg-engineering-bg/35 p-3">
                  <p className="ds-label-inspector">Linked Engineering Features</p>
                  <ul className="mt-2 space-y-1 text-xs text-engineering-muted">
                    {engineeringHelpIndex
                      .filter((entry) => entry.helpDocIds.includes(selectedDoc.id))
                      .map((entry) => (
                        <li key={entry.featureId} className="font-mono text-engineering-text">
                          {entry.featureId}
                        </li>
                      ))}
                  </ul>
                </div>
              </article>
            ) : null}
          </section>
        </div>
      ) : null}
    </>
  );
};
