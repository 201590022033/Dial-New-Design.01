import { useMemo, useState } from 'react';
import {
  CircleHelp,
  FileDown,
  FolderOpen,
  Gauge,
  History,
  Keyboard,
  MoonStar,
  Redo2,
  Save,
  Settings,
  Undo2,
  Watch
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { useGlobalSettingsStore, useViewportStore } from '@/stores';

const diameterPresets = [38, 40, 42, 44];
const quickModes = ['Classic', 'Pilot Slide Rule', 'Tachymeter', 'Diver'] as const;

export const TopToolbar = () => {
  const zoom = useViewportStore((state) => state.zoom);
  const caseDiameterMm = useGlobalSettingsStore((state) => state.caseDiameterMm);
  const setCaseDiameter = useGlobalSettingsStore((state) => state.setCaseDiameter);
  const [mode, setMode] = useState<(typeof quickModes)[number]>('Pilot Slide Rule');
  const zoomPercent = useMemo(() => `${Math.round(zoom * 100)}%`, [zoom]);

  return (
    <motion.header
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="ds-panel flex flex-col gap-3 px-4 py-3"
    >
      <div className="flex flex-wrap items-center gap-2">
        <div className="mr-2 flex items-center gap-3 pr-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-engineering-amber/35 bg-engineering-bg/70 text-engineering-amber shadow-glowAmber">
            <Watch className="ds-icon-lg" />
          </div>
          <div>
            <p className="text-base font-semibold text-engineering-text">Dial Designer</p>
            <p className="text-xs text-engineering-muted">Precision design workspace</p>
          </div>
        </div>

        <div className="ds-divider hidden h-8 border-l lg:block" />

        <Button variant="toolbar" size="sm">
          <Undo2 className="ds-icon-sm" /> Undo
        </Button>
        <Button variant="toolbar" size="sm">
          <Redo2 className="ds-icon-sm" /> Redo
        </Button>
        <Button variant="toolbar" size="sm">
          <FolderOpen className="ds-icon-sm" /> Open
        </Button>
        <Button variant="toolbar" size="sm">
          <Save className="ds-icon-sm" /> Save
        </Button>

        <div className="ds-divider hidden h-8 border-l xl:block" />

        <div className="rounded-md border border-engineering-border bg-engineering-bg/45 px-2 py-1.5 text-xs text-engineering-muted">
          <span className="mr-1.5">Zoom</span>
          <span className="ds-label-dimension">{zoomPercent}</span>
        </div>

        <div className="hidden min-w-[280px] items-center gap-2 rounded-md border border-engineering-border bg-engineering-bg/45 px-3 py-1.5 xl:flex">
          <label className="ds-label-inspector" htmlFor="toolbar-case-diameter">
            Case Diameter
          </label>
          <input
            id="toolbar-case-diameter"
            type="range"
            min={38}
            max={44}
            step={0.1}
            value={caseDiameterMm}
            onChange={(event) => setCaseDiameter(Number(event.target.value))}
            className="h-1.5 w-full accent-amber-400"
          />
          <span className="ds-label-dimension w-12 text-right">{caseDiameterMm.toFixed(1)}mm</span>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="ds-label-inspector">Common Presets</span>
          {diameterPresets.map((preset) => (
            <Button
              key={preset}
              variant="toolbar"
              size="sm"
              active={Math.round(caseDiameterMm) === preset}
              onClick={() => setCaseDiameter(preset)}
            >
              {preset}
            </Button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="ds-label-inspector">Quick Modes</span>
          {quickModes.map((quickMode) => (
            <Button
              key={quickMode}
              variant="toolbar"
              size="sm"
              active={mode === quickMode}
              onClick={() => setMode(quickMode)}
            >
              {quickMode}
            </Button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="toolbar" size="sm">
            <FileDown className="ds-icon-sm" /> SVG
          </Button>
          <Button variant="toolbar" size="sm">
            <FileDown className="ds-icon-sm" /> DXF
          </Button>
          <Button variant="toolbar" size="sm">
            <FileDown className="ds-icon-sm" /> PDF
          </Button>
          <Button variant="toolbar" size="sm">
            <FileDown className="ds-icon-sm" /> PNG
          </Button>
          <div className="ds-divider hidden h-7 border-l lg:block" />
          <Button variant="icon" size="sm" aria-label="Engineering Help">
            <CircleHelp className="ds-icon-sm" />
          </Button>
          <Button variant="icon" size="sm" aria-label="Settings">
            <Settings className="ds-icon-sm" />
          </Button>
          <label className="relative">
            <span className="sr-only">Theme selector</span>
            <MoonStar className="pointer-events-none absolute left-2 top-1.5 ds-icon-sm text-engineering-muted" />
            <select className="ds-focus-ring rounded-md border border-engineering-border bg-engineering-bg/60 py-1.5 pl-7 pr-2 text-xs text-engineering-muted">
              <option>Engineering Dark</option>
              <option>Deep Slate</option>
              <option>Night Workshop</option>
            </select>
          </label>
          <div className="hidden items-center gap-1 rounded-md border border-engineering-border bg-engineering-bg/45 px-2 py-1 text-[11px] text-engineering-muted xl:flex">
            <Keyboard className="ds-icon-sm" />
            <span>
              <span className="font-mono text-engineering-text">Shift</span>+Drag pan
            </span>
          </div>
          <div className="hidden items-center gap-1 rounded-md border border-engineering-border bg-engineering-bg/45 px-2 py-1 text-[11px] text-engineering-muted xl:flex">
            <Gauge className="ds-icon-sm" />
            Pro Workflow
          </div>
          <div className="hidden items-center gap-1 rounded-md border border-engineering-border bg-engineering-bg/45 px-2 py-1 text-[11px] text-engineering-muted 2xl:flex">
            <History className="ds-icon-sm" />
            Auto-Save Off
          </div>
        </div>
      </div>
    </motion.header>
  );
};
