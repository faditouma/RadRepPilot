import type { SavedDraft } from '../radrep/types';

const DRAFT_STORAGE_KEY = 'radreppilot:drafts';

export type SavedReportSummary = {
  id: string;
  title: string;
  modality: string;
  bodyRegion: string;
  createdAt: string;
};

const moduleLabels: Record<string, { modality: string; bodyRegion: string }> = {
  ctpa: { modality: 'CT', bodyRegion: 'Chest' },
  stroke: { modality: 'CT', bodyRegion: 'Neuro/Head' },
  nodule: { modality: 'CT', bodyRegion: 'Chest' },
  appendicitis: { modality: 'CT', bodyRegion: 'Abdomen/Pelvis' },
  bowelObstruction: { modality: 'CT', bodyRegion: 'Abdomen/Pelvis' },
  renalColic: { modality: 'CT KUB', bodyRegion: 'GU/Renal' },
  ruqUltrasound: { modality: 'Ultrasound', bodyRegion: 'Abdomen/RUQ' },
  dvtUltrasound: { modality: 'Ultrasound', bodyRegion: 'Vascular/DVT' },
  referral: { modality: 'Request', bodyRegion: 'Primary care' },
  builder: { modality: 'Report', bodyRegion: 'General' },
  calculator: { modality: 'Helper', bodyRegion: 'Calculator' },
  incidental: { modality: 'Follow-up', bodyRegion: 'Incidental finding' },
  rads: { modality: 'RADS', bodyRegion: 'Classification' },
};

function toReportSummary(draft: SavedDraft): SavedReportSummary {
  const fallback = moduleLabels[draft.moduleType] ?? { modality: 'Report', bodyRegion: 'Practice draft' };

  return {
    id: draft.id,
    title: draft.title || 'Untitled report draft',
    modality: draft.category ?? fallback.modality,
    bodyRegion: fallback.bodyRegion,
    createdAt: draft.dateTime,
  };
}

export function loadSavedReportSummaries(limit?: number): SavedReportSummary[] {
  if (typeof window === 'undefined') return [];

  try {
    const raw = window.localStorage.getItem(DRAFT_STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((item) => toReportSummary(item as SavedDraft))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  } catch {
    return [];
  }
}

export function formatReportDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Date unavailable';

  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
}
