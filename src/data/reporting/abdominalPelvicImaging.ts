import type { ReferralOption } from '../../radrep/types';
import type { ReportingWorkflowSchema, WorkflowField, WorkflowValues } from '../reportingWorkflowSchemas';

const assessment: ReferralOption[] = [
  { value: '', label: 'Select assessment…' },
  { value: 'absent', label: 'Absent' },
  { value: 'present', label: 'Present' },
  { value: 'indeterminate', label: 'Indeterminate' },
  { value: 'not assessed', label: 'Not assessed' },
];
const quality: ReferralOption[] = [
  { value: '', label: 'Select quality…' },
  { value: 'diagnostic', label: 'Diagnostic' },
  { value: 'limited', label: 'Limited' },
  { value: 'nondiagnostic', label: 'Nondiagnostic' },
];
const preparation: ReferralOption[] = [
  { value: '', label: 'Select preparation…' },
  { value: 'adequate', label: 'Adequate' },
  { value: 'suboptimal', label: 'Suboptimal' },
  { value: 'inadequate', label: 'Inadequate' },
  { value: 'not assessed', label: 'Not assessed' },
];
const distention: ReferralOption[] = [
  { value: '', label: 'Select distention…' },
  { value: 'adequate', label: 'Adequate' },
  { value: 'limited', label: 'Limited' },
  { value: 'collapsed', label: 'Collapsed / nondiagnostic' },
  { value: 'not assessed', label: 'Not assessed' },
];
const morphology: ReferralOption[] = [
  { value: '', label: 'Select morphology…' },
  { value: 'pedunculated', label: 'Pedunculated' },
  { value: 'sessile', label: 'Sessile' },
  { value: 'flat', label: 'Flat' },
  { value: 'annular mass', label: 'Annular mass' },
  { value: 'other', label: 'Other' },
  { value: 'indeterminate', label: 'Indeterminate' },
];
const mobility: ReferralOption[] = [
  { value: '', label: 'Select mobility…' },
  { value: 'fixed', label: 'Fixed between positions' },
  { value: 'mobile', label: 'Mobile between positions' },
  { value: 'indeterminate', label: 'Indeterminate' },
  { value: 'not assessed', label: 'Not assessed' },
];
const confidence: ReferralOption[] = [
  { value: '', label: 'Select confidence…' },
  { value: 'high', label: 'High' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'low', label: 'Low' },
];
const text = (id: string, label: string, placeholder = '', wide = false): WorkflowField => ({ id, label, type: 'text', placeholder, wide });
const area = (id: string, label: string, placeholder = ''): WorkflowField => ({ id, label, type: 'textarea', placeholder, wide: true });
const number = (id: string, label: string, suffix?: string): WorkflowField => ({ id, label, type: 'number', suffix });
const select = (id: string, label: string, options: ReferralOption[]): WorkflowField => ({ id, label, type: 'select', options });

const defaults: WorkflowValues = {
  clinicalIndication: '', clinicalContext: '', comparisonStudy: '', comparisonDate: '',
  modalityProtocol: '', examQuality: '', preparationQuality: '', residualMaterial: '',
  rectosigmoidDistention: '', descendingDistention: '', transverseDistention: '',
  ascendingCecalDistention: '', completeColonAssessment: '', incompleteSegments: '',
  technicalLimitations: '', colonicLesion: '', lesionNumber: '', lesionSegment: '',
  distanceFromAnalVergeCm: '', lesionApMm: '', lesionTrMm: '', lesionCcMm: '',
  lesionMorphology: '', lesionMobility: '', lesionConfidence: '', lesionAttenuation: '',
  additionalLesions: '', stricture: '', strictureDetails: '', diverticularDisease: '',
  otherColonicFindings: '', extracolonicFindings: '', userAssignedColonicCategory: '',
  userAssignedExtracolonicCategory: '', limitationsUncertainty: '', findingsOverride: '',
  impressionOverride: '',
};

export const ctColonographyWorkflowSchema: ReportingWorkflowSchema = {
  moduleType: 'ctColonography',
  moduleId: 'ct-colonography',
  title: 'CT Colonography',
  shortTitle: 'CT colonography',
  modality: 'CT',
  bodySystem: 'Gastrointestinal',
  clinicalQuestion: 'Assess the colon for polyps, masses, strictures, and relevant extracolonic findings while documenting preparation, distention, and incomplete segments.',
  techniqueDefault: 'CT colonography was performed with supine and prone or decubitus acquisitions after colonic insufflation. Two-dimensional and three-dimensional images were reviewed.',
  badges: ['Implemented', 'Educational draft', 'Quality by segment'],
  insertTargets: ['findings', 'impression', 'incidentalFindings', 'recommendations'],
  safetyNote: 'Verify preparation, distention and visualization of every colonic segment, every lesion measurement and location, and extracolonic findings. Categories and management are not calculated automatically.',
  contentMetadata: {
    sourceChapter: 'Chapter 17: CT colonography',
    sourceType: 'Private development reference',
    guidelineOrClassificationName: 'C-RADS',
    guidelineVersion: 'Current official version requires primary-source verification',
    lastReviewedDate: '2026-07-27',
    reviewStatus: 'needs_clinical_review',
    clinicalValidationRequired: true,
  },
  defaultValues: defaults,
  sections: [
    {
      id: 'clinical-context', title: 'Clinical context', defaultOpen: true,
      fields: [
        area('clinicalIndication', 'Clinical indication', 'Screening, incomplete optical colonoscopy, contraindication, or other indication'),
        area('clinicalContext', 'Relevant clinical context', 'Symptoms, colorectal history, prior surgery, or procedural context'),
        text('comparisonStudy', 'Comparison examination'), { id: 'comparisonDate', label: 'Comparison date', type: 'date' },
      ],
    },
    {
      id: 'technical-quality', title: 'Protocol and technical quality', defaultOpen: true,
      fields: [
        text('modalityProtocol', 'Protocol', 'e.g. low-dose supine and prone CT colonography', true),
        select('examQuality', 'Overall examination quality', quality),
        select('preparationQuality', 'Bowel preparation quality', preparation),
        area('residualMaterial', 'Tagged residual fluid or stool', 'Amount, tagging, and affected segments'),
        select('rectosigmoidDistention', 'Rectum and sigmoid distention', distention),
        select('descendingDistention', 'Descending colon distention', distention),
        select('transverseDistention', 'Transverse colon distention', distention),
        select('ascendingCecalDistention', 'Ascending colon and cecum distention', distention),
        select('completeColonAssessment', 'Complete colonic assessment', assessment),
        { ...area('incompleteSegments', 'Incomplete or nondiagnostic segments', 'Segments and reason they could not be assessed'), visibleWhen: { field: 'completeColonAssessment', equals: ['absent', 'indeterminate', 'not assessed'] } },
        area('technicalLimitations', 'Other technical limitations', 'Motion, metal artifact, incomplete insufflation, or other limitation'),
      ],
    },
    {
      id: 'dominant-lesion', title: 'Dominant colonic lesion', defaultOpen: true,
      fields: [
        select('colonicLesion', 'Polyp or mass', assessment),
        { ...text('lesionNumber', 'Lesion identifier', 'e.g. Lesion 1'), visibleWhen: { field: 'colonicLesion', equals: ['present', 'indeterminate'] } },
        { ...text('lesionSegment', 'Colonic segment', 'e.g. ascending colon'), visibleWhen: { field: 'colonicLesion', equals: ['present', 'indeterminate'] } },
        { ...number('distanceFromAnalVergeCm', 'Distance from anal verge', 'cm'), visibleWhen: { field: 'colonicLesion', equals: ['present', 'indeterminate'] } },
        { ...number('lesionApMm', 'AP dimension', 'mm'), visibleWhen: { field: 'colonicLesion', equals: ['present', 'indeterminate'] } },
        { ...number('lesionTrMm', 'Transverse dimension', 'mm'), visibleWhen: { field: 'colonicLesion', equals: ['present', 'indeterminate'] } },
        { ...number('lesionCcMm', 'Craniocaudal dimension', 'mm'), visibleWhen: { field: 'colonicLesion', equals: ['present', 'indeterminate'] } },
        { ...select('lesionMorphology', 'Morphology', morphology), visibleWhen: { field: 'colonicLesion', equals: ['present', 'indeterminate'] } },
        { ...select('lesionMobility', 'Mobility between positions', mobility), visibleWhen: { field: 'colonicLesion', equals: ['present', 'indeterminate'] } },
        { ...select('lesionConfidence', 'Diagnostic confidence', confidence), visibleWhen: { field: 'colonicLesion', equals: ['present', 'indeterminate'] } },
        { ...text('lesionAttenuation', 'Attenuation or internal characteristics', 'Soft tissue, fat, tagged material, or other'), visibleWhen: { field: 'colonicLesion', equals: ['present', 'indeterminate'] } },
        { ...area('additionalLesions', 'Additional lesions', 'Identifier, segment, size, morphology, mobility, and confidence'), visibleWhen: { field: 'colonicLesion', equals: ['present', 'indeterminate'] } },
      ],
    },
    {
      id: 'other-findings', title: 'Other colonic and extracolonic findings', defaultOpen: true,
      fields: [
        select('stricture', 'Colonic stricture', assessment),
        { ...area('strictureDetails', 'Stricture details', 'Segment, length, morphology, upstream dilation, and confidence'), visibleWhen: { field: 'stricture', equals: ['present', 'indeterminate'] } },
        area('diverticularDisease', 'Diverticular disease'),
        area('otherColonicFindings', 'Other colonic findings'),
        area('extracolonicFindings', 'Extracolonic findings'),
        text('userAssignedColonicCategory', 'User-assigned colonic category', 'Optional; no category is calculated', true),
        text('userAssignedExtracolonicCategory', 'User-assigned extracolonic category', 'Optional; no category is calculated', true),
      ],
    },
    {
      id: 'overrides', title: 'Uncertainty and overrides', defaultOpen: false,
      fields: [
        area('limitationsUncertainty', 'Additional uncertainty'),
        area('findingsOverride', 'Findings free-text override', 'When entered, this replaces generated findings'),
        area('impressionOverride', 'Impression free-text override', 'When entered, this replaces generated impression'),
      ],
    },
  ],
  keyNegatives: [],
  incidentalOptions: [],
  quickFills: [
    {
      id: 'diagnostic-negative', label: 'Diagnostic negative examination', description: 'Adequate preparation and distention with no colonic lesion or stricture.', intent: 'normal',
      values: {
        examQuality: 'diagnostic', preparationQuality: 'adequate', rectosigmoidDistention: 'adequate',
        descendingDistention: 'adequate', transverseDistention: 'adequate', ascendingCecalDistention: 'adequate',
        completeColonAssessment: 'present', colonicLesion: 'absent', stricture: 'absent',
      },
    },
    {
      id: 'colonic-lesion', label: 'Colonic lesion', description: 'Open the positive lesion-characterization pathway.', intent: 'positive',
      values: { examQuality: 'diagnostic', completeColonAssessment: 'present', colonicLesion: 'present', stricture: 'absent' },
    },
    {
      id: 'limited-examination', label: 'Limited examination', description: 'Document incomplete segments and limitations.', intent: 'complicated',
      values: { examQuality: 'limited', preparationQuality: 'suboptimal', completeColonAssessment: 'absent', colonicLesion: 'not assessed', stricture: 'not assessed' },
    },
  ],
};
