import { Ruler } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Panel } from '../../../shared/ui/Panel'
import { useEditorStore } from '../../../store/editorStore'

const inspectorSchema = z.object({
  diameter: z.number().min(20).max(60),
  markers: z.number().int().min(12).max(300),
  label: z.string().min(1).max(32),
})

type InspectorFormValues = z.infer<typeof inspectorSchema>

export function InspectorPanel() {
  const selectedLayerId = useEditorStore((state) => state.selectedLayerId)
  const inspectorDraft = useEditorStore((state) => state.inspectorDraft)
  const updateInspectorDraft = useEditorStore(
    (state) => state.updateInspectorDraft,
  )

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<InspectorFormValues>({
    defaultValues: inspectorDraft,
  })

  const onSubmit = (values: InspectorFormValues) => {
    const parsed = inspectorSchema.safeParse(values)
    if (parsed.success) {
      updateInspectorDraft(parsed.data)
    }
  }

  return (
    <Panel title="Properties" icon={<Ruler className="h-3.5 w-3.5" />}>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-4 overflow-y-auto p-4"
      >
        <div className="rounded-md border border-slate-800 bg-slate-950/60 px-3 py-2 text-xs text-slate-400">
          Active Layer: <span className="text-teal-300">{selectedLayerId}</span>
        </div>

        <label className="block text-xs text-slate-300">
          Diameter (mm)
          <input
            type="number"
            className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-2 py-1.5 text-sm outline-none focus:border-teal-400"
            {...register('diameter', { valueAsNumber: true })}
          />
          {errors.diameter ? (
            <span className="mt-1 block text-amber-300">20 - 60 only</span>
          ) : null}
        </label>

        <label className="block text-xs text-slate-300">
          Marker Count
          <input
            type="number"
            className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-2 py-1.5 text-sm outline-none focus:border-teal-400"
            {...register('markers', { valueAsNumber: true })}
          />
          {errors.markers ? (
            <span className="mt-1 block text-amber-300">12 - 300 only</span>
          ) : null}
        </label>

        <label className="block text-xs text-slate-300">
          Label
          <input
            type="text"
            className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-2 py-1.5 text-sm outline-none focus:border-teal-400"
            {...register('label')}
          />
          {errors.label ? (
            <span className="mt-1 block text-amber-300">Label is required</span>
          ) : null}
        </label>

        <button
          type="submit"
          className="w-full rounded-md border border-teal-400/50 bg-teal-500/10 px-3 py-2 text-sm font-medium text-teal-200 transition hover:bg-teal-500/20"
        >
          Apply Placeholder Settings
        </button>
      </form>
    </Panel>
  )
}
