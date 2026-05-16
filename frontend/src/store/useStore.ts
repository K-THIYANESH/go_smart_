import { create } from 'zustand';

interface RouteState {
  source: string;
  destination: string;
  safetyMode: boolean;
  routes: any[];
  selectedRoute: any | null;
  loading: boolean;
  setSource: (s: string) => void;
  setDestination: (d: string) => void;
  setSafetyMode: (m: boolean) => void;
  setRoutes: (r: any[]) => void;
  setSelectedRoute: (r: any) => void;
  setLoading: (l: boolean) => void;
}

export const useStore = create<RouteState>((set) => ({
  source: '',
  destination: '',
  safetyMode: false,
  routes: [],
  selectedRoute: null,
  loading: false,
  setSource: (source) => set({ source }),
  setDestination: (destination) => set({ destination }),
  setSafetyMode: (safetyMode) => set({ safetyMode }),
  setRoutes: (routes) => set({ routes }),
  setSelectedRoute: (selectedRoute) => set({ selectedRoute }),
  setLoading: (loading) => set({ loading }),
}));
