import { useState } from 'react';

export type DashboardPalette = 1 | 2 | 3;

const STORAGE_KEY = 'dashboardPalette';

export function useDashboardPalette(): [DashboardPalette, (p: DashboardPalette) => void] {
  const [palette, setPalette] = useState<DashboardPalette>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    const n = Number(stored);
    return (n === 1 || n === 2 || n === 3 ? n : 1) as DashboardPalette;
  });

  const updatePalette = (p: DashboardPalette) => {
    setPalette(p);
    localStorage.setItem(STORAGE_KEY, String(p));
  };

  return [palette, updatePalette];
}
