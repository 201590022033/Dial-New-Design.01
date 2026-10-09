import { create } from 'zustand';
/** View-only illumination is deliberately absent from saved manufacturing documents. */
export const useAppearancePreviewStore = create<{ night: boolean; setNight: (night: boolean) => void }>((set) => ({
  night: false,
  setNight: (night) => set({ night })
}));
