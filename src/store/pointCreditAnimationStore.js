import { create } from 'zustand';

export const usePointCreditAnimationStore = create((set) => ({
  pulseKey: 0,
  triggerPointCreditPulse: () =>
    set((state) => ({
      pulseKey: state.pulseKey + 1,
    })),
}));
