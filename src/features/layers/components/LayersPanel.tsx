import { motion } from 'framer-motion'
import { Eye, EyeOff, Layers, Lock, Unlock } from 'lucide-react'
import { useDrag, useDrop } from 'react-dnd'
import type { LayerModel } from '../../../store/editorStore'
import { useEditorStore } from '../../../store/editorStore'
import { Panel } from '../../../shared/ui/Panel'

const DRAG_TYPE = 'LAYER_ITEM'

interface DragPayload {
  id: string
  index: number
}

interface LayerRowProps {
  layer: LayerModel
  index: number
  selected: boolean
  onSelect: () => void
  onMove: (fromIndex: number, toIndex: number) => void
}

function LayerRow({ layer, index, selected, onSelect, onMove }: LayerRowProps) {
  const [{ isDragging }, dragRef] = useDrag<
    DragPayload,
    void,
    { isDragging: boolean }
  >(() => ({
    type: DRAG_TYPE,
    item: { id: layer.id, index },
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
  }))

  const [, dropRef] = useDrop<DragPayload>(() => ({
    accept: DRAG_TYPE,
    hover: (item) => {
      if (item.index === index) {
        return
      }

      onMove(item.index, index)
      item.index = index
    },
  }))

  return (
    <motion.button
      ref={(node) => {
        dragRef(dropRef(node))
      }}
      layout
      type="button"
      onClick={onSelect}
      className={`flex w-full items-center justify-between rounded-md border px-3 py-2 text-left text-sm transition ${
        selected
          ? 'border-teal-400/60 bg-teal-500/10 text-teal-100'
          : 'border-slate-800 bg-slate-950/50 text-slate-300 hover:border-slate-700'
      }`}
      style={{ opacity: isDragging ? 0.5 : 1 }}
    >
      <span className="flex items-center gap-2">
        <Layers className="h-3.5 w-3.5" />
        {layer.name}
      </span>
      <span className="flex items-center gap-2 text-slate-500">
        {layer.visible ? (
          <Eye className="h-3.5 w-3.5" />
        ) : (
          <EyeOff className="h-3.5 w-3.5" />
        )}
        {layer.locked ? (
          <Lock className="h-3.5 w-3.5" />
        ) : (
          <Unlock className="h-3.5 w-3.5" />
        )}
      </span>
    </motion.button>
  )
}

export function LayersPanel() {
  const layers = useEditorStore((state) => state.layers)
  const selectedLayerId = useEditorStore((state) => state.selectedLayerId)
  const setSelectedLayerId = useEditorStore((state) => state.setSelectedLayerId)
  const reorderLayers = useEditorStore((state) => state.reorderLayers)

  return (
    <Panel title="Layers / Bands" icon={<Layers className="h-3.5 w-3.5" />}>
      <div className="space-y-2 overflow-y-auto p-3">
        {layers.map((layer, index) => (
          <LayerRow
            key={layer.id}
            layer={layer}
            index={index}
            selected={layer.id === selectedLayerId}
            onSelect={() => setSelectedLayerId(layer.id)}
            onMove={reorderLayers}
          />
        ))}
      </div>
    </Panel>
  )
}
