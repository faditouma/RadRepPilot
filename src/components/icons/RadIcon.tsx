export type RadIconName =
  | 'xray'
  | 'ultrasound'
  | 'ct'
  | 'mri'
  | 'mammography'
  | 'nuclear'
  | 'ir'
  | 'oncology'
  | 'neuro'
  | 'headNeck'
  | 'chest'
  | 'cardiacVascular'
  | 'abdomen'
  | 'liver'
  | 'pelvisGu'
  | 'spine'
  | 'msk'
  | 'vascular'
  | 'thyroid'
  | 'infection'
  | 'report'
  | 'calculator'
  | 'followUp'
  | 'warning'
  | 'normal'
  | 'urgent'
  | 'helper'
  | 'dashboard'
  | 'primaryCare'
  | 'savedDrafts'
  | 'safety'
  | 'logoMark';

interface RadIconProps {
  name?: RadIconName | string;
  size?: number;
  className?: string;
  strokeWidth?: number;
}

const iconAssets: Record<RadIconName, string> = {
  xray: 'xray',
  ultrasound: 'ultrasound',
  ct: 'radiology',
  mri: 'radiology',
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
};

function appPublicBase() {
  if (typeof window === 'undefined') return '/';
  return window.location.pathname.startsWith('/RadRepPilot') ? '/RadRepPilot/' : '/';
}

function assetFor(name: string) {
  return iconAssets[name as RadIconName] ?? iconAssets.report;
}

export function RadIcon({ name = 'report', size = 24, className = '' }: RadIconProps) {
  const assetName = assetFor(name);
  const iconUrl = `${appPublicBase()}rad-icons/${assetName}.svg`;

  return (
    <span
      aria-hidden="true"
      className={`rad-icon rad-icon-asset ${className}`}
      style={{
        width: size,
        height: size,
        WebkitMaskImage: `url("${iconUrl}")`,
        maskImage: `url("${iconUrl}")`,
      }}
    />
  );
}
