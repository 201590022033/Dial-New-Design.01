import { create } from 'zustand';

export interface GlobalSettingsState {
  caseDiameterMm: number;
  units: 'mm';
  setCaseDiameter: (diameterMm: number) => void;
}

export const useGlobalSettingsStore = create<GlobalSettingsState>((set) => ({
  caseDiameterMm: 40,
  units: 'mm',
  setCaseDiameter: (caseDiameterMm) => set({ caseDiameterMm: Math.max(10, caseDiameterMm) })
}));
