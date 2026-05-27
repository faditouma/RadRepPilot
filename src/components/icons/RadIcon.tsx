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

function IconContent({ name }: { name: string }) {
  switch (name) {
    case 'xray':
      return (
        <>
          <rect x="5" y="4" width="14" height="16" rx="2" />
          <path d="M12 7v10M8.5 8.5c-1.8 2-2.2 5-.8 7.5M15.5 8.5c1.8 2 2.2 5 .8 7.5M8.2 13c2.3 1.2 5.3 1.2 7.6 0" />
        </>
      );
    case 'ultrasound':
      return (
        <>
          <path d="M8 5h6l2 4-5 9-5-3 5-9Z" />
          <path d="M15 7c2.2 1.1 3.8 3 4.4 5.4M18 5.5c2.2 1.5 3.8 3.7 4.4 6.5" />
        </>
      );
    case 'ct':
      return (
        <>
          <circle cx="12" cy="12" r="7.5" />
          <circle cx="12" cy="12" r="3.5" />
          <path d="M2.8 17h7.5M13.7 17h7.5" />
        </>
      );
    case 'mri':
      return (
        <>
          <path d="M5 19V9a7 7 0 0 1 14 0v10" />
          <path d="M8 19V9a4 4 0 0 1 8 0v10M9 14h6M3 21h18" />
        </>
      );
    case 'mammography':
      return (
        <>
          <path d="M6 5v14M6 7h8a4 4 0 0 1 0 8H6" />
          <path d="M13 8c-3.5 1.5-5.5 4.5-5 8" />
        </>
      );
    case 'nuclear':
      return (
        <>
          <circle cx="12" cy="12" r="2" />
          <path d="M12 4v5M12 15v5M5 8l4.5 2.5M14.5 13.5 19 16M19 8l-4.5 2.5M9.5 13.5 5 16" />
        </>
      );
    case 'ir':
      return (
        <>
          <path d="M4 18c5-8 8-10 16-12" />
          <path d="M7 15l3 3M12 10l3 3M17 7l2 2" />
        </>
      );
    case 'oncology':
      return (
        <>
          <circle cx="12" cy="12" r="7" />
          <circle cx="12" cy="12" r="3" />
          <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
        </>
      );
    case 'neuro':
      return (
        <>
          <path d="M9 5a4 4 0 0 0-3 6.7A4.4 4.4 0 0 0 10 19h4a4.4 4.4 0 0 0 4-7.3A4 4 0 0 0 15 5c-1.2 0-2.2.5-3 1.3A4.2 4.2 0 0 0 9 5Z" />
          <path d="M12 6.3V19M8 11h8M8.5 15H12M12 9h3.5" />
        </>
      );
    case 'headNeck':
      return (
        <>
          <path d="M12 4a6 6 0 0 0-4 10.5V19h8v-4.5A6 6 0 0 0 12 4Z" />
          <path d="M9 21h6M9 10h6" />
        </>
      );
    case 'chest':
      return (
        <>
          <path d="M12 4v15" />
          <path d="M10 8C7 7 5 9 5 13v6M14 8c3-1 5 1 5 5v6" />
          <path d="M7 12c1.5 1 3 1 5 0M17 12c-1.5 1-3 1-5 0M7 16c1.5 1 3 1 5 0M17 16c-1.5 1-3 1-5 0" />
        </>
      );
    case 'cardiacVascular':
      return (
        <>
          <path d="M12 20s-7-4.3-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.7-7 10-7 10Z" />
          <path d="M3 13h4l2-4 3 7 2-4h7" />
        </>
      );
    case 'abdomen':
      return (
        <>
          <path d="M8 4c-2 3-3 6-3 9a7 7 0 0 0 14 0c0-3-1-6-3-9" />
          <path d="M8 9h8M9 14c2 1.2 4 1.2 6 0" />
        </>
      );
    case 'liver':
      return <path d="M4 13c4-7 10-8 16-4v6c-5 2.5-10 2-16 0v-2Z" />;
    case 'pelvisGu':
      return (
        <>
          <path d="M7 5c0 6 2 10 5 14 3-4 5-8 5-14" />
          <path d="M7 12c2 0 4 1 5 3 1-2 3-3 5-3M12 15v6" />
        </>
      );
    case 'spine':
      return (
        <>
          <path d="M12 3v18" />
          <rect x="9" y="4" width="6" height="3" rx="1" />
          <rect x="8.5" y="9" width="7" height="3" rx="1" />
          <rect x="9" y="14" width="6" height="3" rx="1" />
          <path d="M7 7H4M20 7h-3M7 12H4M20 12h-3M7 17H4M20 17h-3" />
        </>
      );
    case 'msk':
      return (
        <>
          <path d="M7 7a3 3 0 1 1 3 3l4 4a3 3 0 1 1-2 2l-4-4a3 3 0 1 1-1-5Z" />
          <path d="M14 14l3 3" />
        </>
      );
    case 'vascular':
      return (
        <>
          <path d="M12 3v6c0 2-1.5 3-4 3H5M12 9c0 2 1.5 3 4 3h3M12 12v9" />
          <circle cx="12" cy="3" r="1.5" />
          <circle cx="5" cy="12" r="1.5" />
          <circle cx="19" cy="12" r="1.5" />
          <circle cx="12" cy="21" r="1.5" />
        </>
      );
    case 'thyroid':
      return (
        <>
          <path d="M12 9c-2-4-7-3.5-7 .5 0 4 3 6 7 4.5M12 9c2-4 7-3.5 7 .5 0 4-3 6-7 4.5" />
          <path d="M12 7v11" />
        </>
      );
    case 'infection':
      return (
        <>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1" />
        </>
      );
    case 'report':
      return (
        <>
          <path d="M7 3h7l4 4v14H7V3Z" />
          <path d="M14 3v5h4M10 12h5M10 16h5" />
        </>
      );
    case 'calculator':
      return (
        <>
          <rect x="5" y="3" width="14" height="18" rx="2" />
          <path d="M8 7h8M8 11h2M12 11h2M16 11h0M8 15h2M12 15h2M16 15h0" />
        </>
      );
    case 'followUp':
      return (
        <>
          <circle cx="12" cy="12" r="7" />
          <path d="M12 8v4l3 2M18 5v5h-5" />
        </>
      );
    case 'warning':
      return (
        <>
          <path d="M12 4 21 20H3L12 4Z" />
          <path d="M12 9v5M12 17h.01" />
        </>
      );
    case 'normal':
      return (
        <>
          <circle cx="12" cy="12" r="8" />
          <path d="m8 12 2.5 2.5L16 9" />
        </>
      );
    case 'urgent':
      return (
        <>
          <circle cx="12" cy="12" r="8" />
          <path d="m13 4-4 9h4l-2 7 5-10h-4l1-6Z" />
        </>
      );
    case 'helper':
      return (
        <>
          <circle cx="6" cy="12" r="2" />
          <circle cx="18" cy="7" r="2" />
          <circle cx="18" cy="17" r="2" />
          <path d="M8 11 16 8M8 13l8 3" />
        </>
      );
    case 'dashboard':
      return (
        <>
          <rect x="4" y="4" width="7" height="7" rx="1.5" />
          <rect x="13" y="4" width="7" height="7" rx="1.5" />
          <rect x="4" y="13" width="7" height="7" rx="1.5" />
          <rect x="13" y="13" width="7" height="7" rx="1.5" />
        </>
      );
    case 'primaryCare':
      return (
        <>
          <path d="M8 4v5a4 4 0 0 0 8 0V4M6 4h4M14 4h4" />
          <path d="M12 13v3a4 4 0 0 0 8 0v-1" />
          <circle cx="20" cy="13" r="1.5" />
        </>
      );
    case 'savedDrafts':
      return (
        <>
          <path d="M3 7h7l2 3h9v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" />
          <path d="M8 14h8" />
        </>
      );
    case 'safety':
      return (
        <>
          <path d="M12 3 20 6v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3Z" />
          <path d="m8.5 12 2.2 2.2L16 9" />
        </>
      );
    case 'logoMark':
      return (
        <>
          <rect x="3" y="4" width="13" height="12" rx="2" />
          <rect x="11" y="8" width="9" height="12" rx="1.5" />
          <path d="M7.5 7v6M5.5 9c1.5 1 2.8 1 4 0M5.5 12c1.5 1 2.8 1 4 0M14 12h3M14 15h3" />
          <path d="M5 20 15.5 13 13 23l-3-5-5 2Z" />
        </>
      );
    default:
      return <IconContent name="report" />;
  }
}

export function RadIcon({ name = 'report', size = 24, className = '', strokeWidth = 2 }: RadIconProps) {
  return (
    <svg
      aria-hidden="true"
      className={`rad-icon ${className}`}
      fill="none"
      height={size}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={strokeWidth}
      viewBox="0 0 24 24"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
    >
      <IconContent name={name} />
    </svg>
  );
}
