import { create } from 'zustand';
import type { FocusTarget, MapFocus, PageId, Session } from '../types';
import type { Session as AuthSession } from '../lib/auth';

interface UIState {
  page: PageId;
  selectedSiteId: string | null;
  focus: MapFocus | null;
  legalFocus: { entityId: string; nonce: number } | null;
  session: AuthSession | null;
  setPage: (page: PageId) => void;
  selectSite: (id: string | null) => void;
  openMapAt: (target: FocusTarget) => void;
  openLegalEntity: (entityId: string) => void;
  setSession: (session: AuthSession | null) => void;
}

export const useUIStore = create<UIState>((set, get) => ({
  page: (window.location.hash.replace('#/', '') as PageId) || 'overview',
  selectedSiteId: null,
  focus: null,
  legalFocus: null,
  session: null,

  setPage: (page) => {
    if (window.location.hash !== `#/${page}`) window.location.hash = `#/${page}`;
    set({ page, selectedSiteId: null, focus: null });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  selectSite: (selectedSiteId) => set({ selectedSiteId }),

  openMapAt: (target) => {
    if (window.location.hash !== '#/map') window.location.hash = '#/map';
    set((state) => {
      const hasCoordinate = target.lat !== null && target.lat !== undefined && target.lon !== null && target.lon !== undefined;
      return {
        page: 'map' as PageId,
        selectedSiteId: null,
        focus: hasCoordinate
          ? {
              lat: target.lat as number,
              lon: target.lon as number,
              label: target.label,
              siteId: target.siteId ?? null,
              nonce: (state.focus?.nonce ?? 0) + 1,
            }
          : null,
      };
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  openLegalEntity: (entityId) => {
    if (window.location.hash !== '#/legal') window.location.hash = '#/legal';
    set((state) => ({
      page: 'legal' as PageId,
      selectedSiteId: null,
      focus: null,
      legalFocus: { entityId, nonce: (state.legalFocus?.nonce ?? 0) + 1 },
    }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  setSession: (session) => set({ session }),
}));

export const selectPage = (state: UIState) => state.page;
export const selectSelectedSiteId = (state: UIState) => state.selectedSiteId;
export const selectFocus = (state: UIState) => state.focus;
export const selectLegalFocus = (state: UIState) => state.legalFocus;
export const selectSession = (state: UIState) => state.session;