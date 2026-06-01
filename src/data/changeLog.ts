export interface ChangeLogEntry {
  version: string;
  title: string;
  summary: string;
  category: 'UX' | 'Clinical Content' | 'Calculator' | 'Safety' | 'Reporting' | 'Primary Care' | 'Branding';
}

export const changeLog: ChangeLogEntry[] = [
  {
    version: 'Prototype v0.4',
    title: 'Added branching modality/body-system navigation',
    summary: 'Radiology workflows now open through a compact modality -> body system -> workflow path instead of a long module wall.',
    category: 'UX',
  },
  {
    version: 'Prototype v0.4',
    title: 'Added optional clinical context in radiology workflows',
    summary: 'Clinical context is collapsed by default so radiologists see imaging findings and quick-fill templates first.',
    category: 'Reporting',
  },
  {
    version: 'Prototype v0.4',
    title: 'Added context-aware incidental findings and follow-up recommendations',
    summary: 'Workflow incidental mini-forms now draft follow-up language with modality, interval, and verification caveats when reasonable.',
    category: 'Clinical Content',
  },
  {
    version: 'Prototype v0.4',
    title: 'Added direct helper links from workflows',
    summary: 'Workflows and incidental findings can jump to associated helpers such as RV/LV, ASPECTS, Bosniak, LI-RADS, or TI-RADS.',
    category: 'Calculator',
  },
  {
    version: 'Prototype v0.4',
    title: 'Added interactive calculator/helper previews',
    summary: 'RADS helpers including BI-RADS, O-RADS, PI-RADS, LI-RADS, Bone-RADS, CAD-RADS, and Lung-RADS are now clickable prototype helpers.',
    category: 'Calculator',
  },
  {
    version: 'Prototype v0.4',
    title: 'Added imaging requisition builder with age/sex/PMHx format',
    summary: 'Imaging requisitions now default to concise clinical communication rather than long progress-note style text.',
    category: 'Primary Care',
  },
  {
    version: 'Prototype v0.4',
    title: 'Added ACR Appropriateness Criteria prototype support',
    summary: 'Referrer workflows now show curated ACR topic placeholders and official verification links without reproducing full criteria.',
    category: 'Safety',
  },
  {
    version: 'Prototype v0.4',
    title: 'Added interactive anatomy navigator',
    summary: 'Dashboard region navigation surfaces related reporting workflows, calculators, and incidental follow-up helpers.',
    category: 'UX',
  },
  {
    version: 'Prototype v0.4',
    title: 'Added RadRepPilot logo/brand mark',
    summary: 'A professional screen/report/navigation mark now appears in the sidebar and dashboard hero.',
    category: 'Branding',
  },
];
