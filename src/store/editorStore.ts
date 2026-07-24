import { create } from 'zustand'

export interface LayerModel {
  id: string
  name: string
  visible: boolean
  locked: boolean
}

interface InspectorDraft {
  diameter: number
  markers: number
  label: string
}

interface EditorState {
  layers: LayerModel[]
  selectedLayerId: string
  zoomPercent: number
  inspectorDraft: InspectorDraft
  setSelectedLayerId: (layerId: string) => void
  reorderLayers: (fromIndex: number, toIndex: number) => void
  updateInspectorDraft: (draft: InspectorDraft) => void
  setZoomPercent: (zoomPercent: number) => void
}

const initialLayers: LayerModel[] = [
  { id: 'dial-base', name: 'Dial Base', visible: true, locked: false },
  { id: 'chapter-ring', name: 'Chapter Ring', visible: true, locked: false },
  { id: 'minute-track', name: 'Minute Track', visible: true, locked: true },
]

export const useEditorStore = create<EditorState>((set) => ({
  layers: initialLayers,
  selectedLayerId: initialLayers[0].id,
  zoomPercent: 100,
  inspectorDraft: {
    diameter: 38,
    markers: 60,
    label: 'DIAL-01',
  },
  setSelectedLayerId: (layerId) => set({ selectedLayerId: layerId }),
  reorderLayers: (fromIndex, toIndex) =>
    set((state) => {
      const layers = [...state.layers]
      const [moved] = layers.splice(fromIndex, 1)

      if (!moved) {
        return state
      }

      layers.splice(toIndex, 0, moved)
      return { layers }
    }),
  updateInspectorDraft: (inspectorDraft) => set({ inspectorDraft }),
  setZoomPercent: (zoomPercent) => set({ zoomPercent }),
}))
