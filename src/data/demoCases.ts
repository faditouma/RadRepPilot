export interface GuidedDemoStep {
  title: string;
  eyebrow: string;
  body: string;
  bullets?: string[];
  output?: string;
  whyItMatters: string;
  workflowId?: string;
}

export interface GuidedDemoCase {
  id: string;
  title: string;
  scenario: string;
  workflowId?: string;
  copyText: string;
  steps: GuidedDemoStep[];
}

export const demoCases: GuidedDemoCase[] = [
  {
    id: 'gp-appendicitis',
    title: 'From vague requisition to focused CT report',
    scenario: 'Imaging requisition to CT abdomen/pelvis appendicitis workflow',
    workflowId: 'appendicitis',
    copyText:
      'Inflammatory changes in the right lower quadrant suspicious for active ileitis/appendicitis spectrum. No abscess or free intraperitoneal air. Incidental 1.8 cm left adrenal nodule; consider comparison with prior imaging or adrenal protocol characterization if clinically appropriate.',
    steps: [
      {
        eyebrow: 'Step 1',
        title: 'Vague requisition',
        body: 'The starting point is common: a short request with little clinical signal.',
        output: 'Abdo pain, please assess.',
        whyItMatters: 'Radiology quality begins before image interpretation; unclear questions can reduce the usefulness of the final report.',
      },
      {
        eyebrow: 'Step 2',
        title: 'Improved referrer language',
        body: 'RadRepPilot converts sparse context into concise, radiology-useful requisition wording.',
        output:
          '34M, known for Crohn’s disease, presenting with 3 days of right lower quadrant abdominal pain and fever. Please assess for active ileitis, abscess, obstruction, appendicitis, or alternative acute intra-abdominal pathology. Thank you.',
        whyItMatters: 'Better requisitions give radiologists a clearer clinical question and help frame the differential safely.',
      },
      {
        eyebrow: 'Step 3',
        title: 'Matching reporting workflow',
        body: 'The request maps naturally to CT Abdomen/Pelvis -> Appendicitis / RLQ pain.',
        bullets: [
          'Appendix visualized',
          'Diameter',
          'Periappendiceal inflammatory change',
          'Abscess/perforation',
          'Bowel obstruction',
          'Alternative diagnosis',
          'Incidental findings',
        ],
        workflowId: 'appendicitis',
        whyItMatters: 'A structured workflow prompts key findings, key negatives, and complications without claiming to interpret the image.',
      },
      {
        eyebrow: 'Step 4',
        title: 'Embedded incidental follow-up',
        body: 'Incidental finding support stays inside the reporting workflow.',
        output:
          'Incidental 1.8 cm left adrenal nodule, incompletely characterized on this exam. Consider comparison with prior imaging or adrenal protocol CT/MRI if clinically appropriate.',
        whyItMatters: 'Consistent follow-up wording can reduce variability and make incidental findings safer to communicate.',
      },
      {
        eyebrow: 'Step 5',
        title: 'Final report-ready output',
        body: 'The final language remains editable and requires radiologist verification.',
        output:
          'Inflammatory changes in the right lower quadrant suspicious for active ileitis/appendicitis spectrum. No abscess or free intraperitoneal air. Incidental 1.8 cm left adrenal nodule; consider comparison with prior imaging or adrenal protocol characterization if clinically appropriate.',
        workflowId: 'appendicitis',
        whyItMatters: 'The product demonstrates workflow reasoning: requisition quality, structured reporting, complications, and follow-up safety.',
      },
    ],
  },
  {
    id: 'ctpa-pe',
    title: 'CTPA with calculator-integrated severity language',
    scenario: 'Pulmonary embolism workflow with RV/LV ratio helper',
    workflowId: 'ctpa',
    copyText:
      'Acute bilateral segmental pulmonary emboli. RV/LV ratio is 1.33, supporting CT evidence of right heart strain. Small right pleural effusion.',
    steps: [
      {
        eyebrow: 'Step 1',
        title: 'Clinical question',
        body: 'The workflow starts with a focused imaging question.',
        output: 'Assess for PE.',
        whyItMatters: 'Focused questions help reports emphasize the clinically actionable elements.',
      },
      {
        eyebrow: 'Step 2',
        title: 'Structured PE findings',
        body: 'User-entered imaging findings are organized into clinically meaningful report elements.',
        bullets: [
          'Bilateral segmental pulmonary emboli',
          'RV 48 mm',
          'LV 36 mm',
          'RV/LV ratio 1.33',
          'No pulmonary infarct',
          'Small right pleural effusion',
        ],
        workflowId: 'ctpa',
        whyItMatters: 'Key positives, negatives, and associated findings are less likely to be omitted.',
      },
      {
        eyebrow: 'Step 3',
        title: 'Calculator/helper integration',
        body: 'The RV/LV helper standardizes severity wording from user-entered measurements.',
        output: 'RV/LV ratio is 1.33, supporting CT evidence of right heart strain in the appropriate clinical context.',
        whyItMatters: 'Calculator integration turns measurements into report-ready language while preserving verification responsibility.',
      },
      {
        eyebrow: 'Step 4',
        title: 'Final impression',
        body: 'The output is concise, editable, and clinically actionable.',
        output:
          'Acute bilateral segmental pulmonary emboli. RV/LV ratio is 1.33, supporting CT evidence of right heart strain. Small right pleural effusion.',
        workflowId: 'ctpa',
        whyItMatters: 'This shows radiology as communication and triage, not just image description.',
      },
    ],
  },
  {
    id: 'pulmonary-nodule',
    title: 'Pulmonary nodule follow-up language',
    scenario: 'Incidental pulmonary nodule on CT chest',
    workflowId: 'nodule',
    copyText:
      'Solitary solid right upper lobe pulmonary nodule measuring 7 mm. Follow-up CT chest in 6-12 months may be considered, with additional follow-up at 18-24 months depending on risk factors and guideline applicability.',
    steps: [
      {
        eyebrow: 'Step 1',
        title: 'Incidental finding context',
        body: 'The user enters the verified nodule descriptors.',
        bullets: [
          'Solitary solid pulmonary nodule',
          '7 mm',
          'Right upper lobe',
          'High-risk patient',
          'No known cancer',
          'Not immunocompromised',
        ],
        workflowId: 'nodule',
        whyItMatters: 'Incidental findings are a common source of communication variability and follow-up risk.',
      },
      {
        eyebrow: 'Step 2',
        title: 'Simplified helper support',
        body: 'The assistant generates cautious follow-up language with applicability warnings.',
        output:
          'Solitary solid right upper lobe pulmonary nodule measuring 7 mm. Follow-up CT chest in 6-12 months may be considered, with additional follow-up at 18-24 months depending on risk factors and guideline applicability.',
        whyItMatters: 'The language is consistent but does not copy proprietary guideline text or replace radiologist judgment.',
      },
      {
        eyebrow: 'Step 3',
        title: 'Safety framing',
        body: 'RadRepPilot keeps the clinician in control: user-entered findings only, prototype logic only, final verification required.',
        output:
          'Guideline applicability should be verified, especially in patients with known cancer, immunocompromise, or outside guideline age/risk assumptions.',
        workflowId: 'nodule',
        whyItMatters: 'Applicability warnings prevent guideline tools from sounding more certain than they are.',
      },
    ],
  },
];
