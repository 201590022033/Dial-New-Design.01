import { Compass, Download, Gauge, Settings, Target } from 'lucide-react';
import { motion } from 'framer-motion';
import { ToolbarButton } from '@/components/ui/ToolbarButton';

export const TopToolbar = () => {
  return (
    <motion.header
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-between gap-3 rounded-panel border border-engineering-border bg-engineering-panel/80 p-3 shadow-panel"
    >
      <div className="flex items-center gap-2">
        <ToolbarButton active>
          <Target className="mr-1 inline h-4 w-4" /> Select
        </ToolbarButton>
        <ToolbarButton>
          <Gauge className="mr-1 inline h-4 w-4" /> Scale
        </ToolbarButton>
        <ToolbarButton>
          <Compass className="mr-1 inline h-4 w-4" /> Guides
        </ToolbarButton>
      </div>
      <div className="flex items-center gap-2">
        <ToolbarButton>
          <Download className="mr-1 inline h-4 w-4" /> Export
        </ToolbarButton>
        <ToolbarButton>
          <Settings className="mr-1 inline h-4 w-4" /> Preferences
        </ToolbarButton>
      </div>
    </motion.header>
  );
};
