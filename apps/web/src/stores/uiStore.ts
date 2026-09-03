// ============================================================
// OneFlesh — UI Zustand Store
// ============================================================

import { create } from 'zustand';

interface UiState {
  sidebarOpen: boolean;
  profileModalId: string | null;
  aiPanelOpen: boolean;

  openSidebar: () => void;
  closeSidebar: () => void;
  toggleSidebar: () => void;
  openProfileModal: (id: string) => void;
  closeProfileModal: () => void;
  toggleAiPanel: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  sidebarOpen: false,
  profileModalId: null,
  aiPanelOpen: false,

  openSidebar: () => set({ sidebarOpen: true }),
  closeSidebar: () => set({ sidebarOpen: false }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  openProfileModal: (id) => set({ profileModalId: id }),
  closeProfileModal: () => set({ profileModalId: null }),
  toggleAiPanel: () => set((s) => ({ aiPanelOpen: !s.aiPanelOpen })),
}));
