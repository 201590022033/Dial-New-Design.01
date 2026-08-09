import { motion } from 'framer-motion';

interface FeaturePlaceholderProps {
  title: string;
  description: string;
}

export const FeaturePlaceholder = ({ title, description }: FeaturePlaceholderProps) => {
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="rounded-panel border border-engineering-border bg-engineering-panel/70 p-4 shadow-panel"
    >
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold tracking-wide text-engineering-text">{title}</h3>
        <span className="rounded border border-engineering-border px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-engineering-muted">
          Placeholder
        </span>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-engineering-muted">{description}</p>
    </motion.section>
  );
};
