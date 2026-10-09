import { useEffect, useState } from 'react';
const validHexColour = (value: string) => /^#[0-9a-f]{6}$/i.test(value.trim());
export function HexColourField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  const [draft, setDraft] = useState(value), [message, setMessage] = useState('');
  useEffect(() => { setDraft(value); setMessage(''); }, [label, value]);
  const commit = () => { if (validHexColour(draft)) { onChange(draft.trim()); setMessage(''); } else { setDraft(value); setMessage('Use six hexadecimal digits, for example #E63946.'); } };
  return <div className="space-y-1"><div className="flex flex-wrap items-center gap-2 text-xs"><label className="min-w-0 flex-1">{label}<input type="color" aria-label={label} value={value} onChange={e => onChange(e.target.value)} className="ml-2 h-6 w-8 align-middle" /></label><input aria-label={`${label} hex`} title="Apply on Enter or leaving the field" className="ds-input w-24" value={draft} onChange={e => setDraft(e.target.value)} onBlur={commit} onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur(); }} /><button type="button" className="text-teal-300" aria-label={`Copy ${label} hex`} onClick={() => { void navigator.clipboard.writeText(value).then(() => setMessage('Copied')).catch(() => setMessage('Copy unavailable; select the hex field to copy manually.')); }}>Copy</button></div>{message && <p role="status" className="text-[10px] text-amber-200">{message}</p>}</div>;
}
