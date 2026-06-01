export interface SampleOutput {
  id: string;
  title: string;
  clinicalScenario: string;
  output: string;
  contributions: string[];
  workflowId?: string;
  contentStatus: string;
}

export const sampleOutputs: SampleOutput[] = [
  {
    id: 'gp-before-after',
    title: 'Imaging requisition before/after',
    clinicalScenario: 'Vague abdominal pain request converted into radiology-useful clinical information.',
    output:
      'Before: “Abdo pain, please assess.”\n\nAfter: “34M, known for Crohn’s disease, presenting with 3 days of right lower quadrant abdominal pain and fever. Please assess for active ileitis, abscess, obstruction, appendicitis, or alternative acute intra-abdominal pathology. Thank you.”',
    contributions: ['Better requisition', 'Specific clinical question', 'Relevant PMHx', 'Duration'],
    workflowId: 'appendicitis',
    contentStatus: 'Draft / needs radiology review',
  },
  {
    id: 'ctpa-no-pe',
    title: 'CTPA no PE',
    clinicalScenario: 'Pulmonary embolism excluded with key negatives and strain language.',
    output:
      'No pulmonary embolism identified to the segmental level. No CT evidence of right heart strain. No acute cardiopulmonary abnormality identified on this exam.',
    contributions: ['Key negatives', 'Structured impression', 'Report-ready wording'],
    workflowId: 'ctpa',
    contentStatus: 'Draft / needs radiology review',
  },
  {
    id: 'ctpa-pe-strain',
    title: 'CTPA PE with right heart strain',
    clinicalScenario: 'Positive PE workflow with RV/LV ratio helper language.',
    output:
      'Acute bilateral segmental pulmonary emboli. RV/LV ratio is 1.33, supporting CT evidence of right heart strain in the appropriate clinical context.',
    contributions: ['Calculator', 'Severity language', 'Clinically actionable impression'],
    workflowId: 'ctpa',
    contentStatus: 'Draft / needs radiology review',
  },
  {
    id: 'ct-appendicitis',
    title: 'CT appendicitis',
    clinicalScenario: 'Acute right lower quadrant pain with uncomplicated appendicitis pattern.',
    output: 'Acute uncomplicated appendicitis. No periappendiceal abscess or free intraperitoneal air.',
    contributions: ['Checklist', 'Complication exclusions', 'Key negatives'],
    workflowId: 'appendicitis',
    contentStatus: 'Draft / needs radiology review',
  },
  {
    id: 'ct-bowel-obstruction',
    title: 'CT bowel obstruction',
    clinicalScenario: 'Small bowel obstruction with transition point and ischemia/perforation exclusions.',
    output:
      'High-grade small bowel obstruction with transition point in the right lower quadrant, likely secondary to adhesions. No CT evidence of ischemia or perforation.',
    contributions: ['Checklist', 'Transition point', 'Complication exclusions'],
    workflowId: 'bowelObstruction',
    contentStatus: 'Draft / needs radiology review',
  },
  {
    id: 'pulmonary-nodule-follow-up',
    title: 'Pulmonary nodule follow-up',
    clinicalScenario: 'Incidental solid pulmonary nodule requiring cautious follow-up language.',
    output:
      'Solitary solid right upper lobe pulmonary nodule measuring 7 mm. Follow-up CT chest in 6-12 months may be considered, with additional follow-up at 18-24 months depending on risk factors and guideline applicability.',
    contributions: ['Incidental follow-up', 'Modality/interval', 'Applicability warning'],
    workflowId: 'nodule',
    contentStatus: 'Draft / needs radiology review',
  },
  {
    id: 'ct-head-aspects',
    title: 'CT head ASPECTS',
    clinicalScenario: 'Stroke workflow with ASPECTS score in the impression.',
    output: 'Early ischemic changes involving the right insula and M2 region. ASPECTS score is 8. No acute intracranial hemorrhage.',
    contributions: ['Calculator', 'Key negative', 'Structured impression'],
    workflowId: 'stroke',
    contentStatus: 'Draft / needs radiology review',
  },
];
