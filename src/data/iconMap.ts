import type { RadIconName } from '../components/icons/RadIcon';

// Replace emoji fallback with custom line icons before formal presentation if desired.
export const iconMap = {
  xray: 'xray',
  ultrasound: 'ultrasound',
  ct: 'ct',
  mri: 'mri',
  mammography: 'mammography',
  nuclear: 'nuclear',
  ir: 'ir',
  oncology: 'oncology',
  neuro: 'neuro',
  headNeck: 'headNeck',
  chest: 'chest',
  cardiacVascular: 'cardiacVascular',
  abdomen: 'abdomen',
  liver: 'liver',
  pelvisGu: 'pelvisGu',
  spine: 'spine',
  msk: 'msk',
  vascular: 'vascular',
  thyroid: 'thyroid',
  infection: 'infection',
  report: 'report',
  calculator: 'calculator',
  followUp: 'followUp',
  warning: 'warning',
  normal: 'normal',
  urgent: 'urgent',
  helper: 'helper',
  dashboard: 'dashboard',
  primaryCare: 'primaryCare',
  savedDrafts: 'savedDrafts',
  safety: 'safety',
  logoMark: 'logoMark',
} satisfies Record<string, RadIconName>;

export function bodySystemIconName(label: string): RadIconName {
  const name = label.toLowerCase();
  if (name.includes('neuro') || name.includes('brain')) return iconMap.neuro;
  if (name.includes('head') || name.includes('neck')) return iconMap.headNeck;
  if (name.includes('chest')) return iconMap.chest;
  if (name.includes('cardiac') || name.includes('vascular') || name.includes('aorta')) return iconMap.vascular;
  if (name.includes('trauma')) return iconMap.urgent;
  if (name.includes('spine')) return iconMap.spine;
  if (name.includes('msk') || name.includes('extremit')) return iconMap.msk;
  if (name.includes('pelvic') || name.includes('gu') || name.includes('renal') || name.includes('prostate')) return iconMap.pelvisGu;
  if (name.includes('abdomen')) return iconMap.abdomen;
  if (name.includes('liver')) return iconMap.liver;
  if (name.includes('thyroid')) return iconMap.thyroid;
  if (name.includes('oncology') || name.includes('recist') || name.includes('response')) return iconMap.oncology;
  return iconMap.report;
}
