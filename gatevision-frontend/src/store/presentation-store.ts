import { create } from "zustand";

interface PresentationStore {
  isActive: boolean;
  currentSlide: number;
  autoAdvance: boolean;
  autoAdvanceInterval: number;
  toggle: () => void;
  nextSlide: () => void;
  prevSlide: () => void;
  setSlide: (index: number) => void;
  setAutoAdvance: (enabled: boolean) => void;
  exit: () => void;
}

const TOTAL_SLIDES = 9; // Dashboard, Recognition, Identity, Gate, Reports, Admin, System, Settings, Demo

export const usePresentationStore = create<PresentationStore>((set, get) => ({
  isActive: false,
  currentSlide: 0,
  autoAdvance: true,
  autoAdvanceInterval: 8000,

  toggle: () => set((s) => ({ isActive: !s.isActive, currentSlide: 0 })),
  nextSlide: () => {
    const { currentSlide } = get();
    set({ currentSlide: currentSlide < TOTAL_SLIDES - 1 ? currentSlide + 1 : 0 });
  },
  prevSlide: () => {
    const { currentSlide } = get();
    set({ currentSlide: currentSlide > 0 ? currentSlide - 1 : TOTAL_SLIDES - 1 });
  },
  setSlide: (index: number) => set({ currentSlide: index }),
  setAutoAdvance: (enabled: boolean) => set({ autoAdvance: enabled }),
  exit: () => set({ isActive: false, currentSlide: 0 }),
}));
