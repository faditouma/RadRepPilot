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

const enterographyDefaults: WorkflowValues = {
  clinicalIndication: '', clinicalContext: '', comparisonStudy: '', comparisonDate: '',
  modalityProtocol: '', examQuality: '', bowelDistention: '', incompleteSegments: '',
  technicalLimitations: '', activeInflammation: '', involvedSegment: '', involvedLengthCm: '',
  muralThicknessMm: '', muralEnhancement: '', muralEdema: '', diffusionRestriction: '',
  ulceration: '', stricture: '', strictureLocation: '', strictureLengthCm: '',
  upstreamDilation: '', upstreamDiameterMm: '', penetratingDisease: '', fistulaDetails: '',
  abscessPhlegmon: '', abscessPhlegmonDetails: '', mesentericInflammation: '',
  mesentericDetails: '', suspiciousNodes: '', suspiciousNodeDetails: '',
  extraintestinalFindings: '', intervalChange: '', userActivitySynthesis: '',
  additionalBowelFindings: '', incidentalFindings: '', limitationsUncertainty: '',
  findingsOverride: '', impressionOverride: '',
};

export const enterographyWorkflowSchema: ReportingWorkflowSchema = {
  moduleType: 'enterography',
  moduleId: 'ct-mr-enterography',
  title: 'CT/MR Enterography',
  shortTitle: 'Enterography',
  modality: 'CT/MRI',
  bodySystem: 'Gastrointestinal',
  clinicalQuestion: 'Assess small-bowel distention, active mural inflammation, stricturing or penetrating disease, complications, and extraintestinal findings.',
  techniqueDefault: 'CT or MR enterography was performed after enteric contrast administration with intravenous contrast as applicable. Multiplanar images were reviewed.',
  badges: ['Implemented', 'Educational draft', 'Conditional disease mapping'],
  insertTargets: ['findings', 'impression', 'incidentalFindings', 'recommendations'],
  safetyNote: 'Verify bowel distention, every involved segment and length, inflammatory features, strictures, penetrating complications, and comparison. Disease activity and management are not calculated automatically.',
  contentMetadata: {
    sourceChapter: 'Chapter 18: CT/MR enterography',
    sourceType: 'Private development reference',
    guidelineOrClassificationName: 'Standardized inflammatory bowel disease imaging terminology',
    guidelineVersion: 'Current consensus terminology requires primary-source verification',
    lastReviewedDate: '2026-07-27',
    reviewStatus: 'needs_clinical_review',
    clinicalValidationRequired: true,
  },
  defaultValues: enterographyDefaults,
  sections: [
    {
      id: 'clinical-context', title: 'Clinical context', defaultOpen: true,
      fields: [
        area('clinicalIndication', 'Clinical indication', 'Suspected or known inflammatory bowel disease, obstruction, bleeding, or other question'),
        area('clinicalContext', 'Relevant clinical context', 'Symptoms, diagnosis, surgery, medications, or treatment'),
        text('comparisonStudy', 'Comparison examination'), { id: 'comparisonDate', label: 'Comparison date', type: 'date' },
      ],
    },
    {
      id: 'technical-quality', title: 'Protocol and technical quality', defaultOpen: true,
      fields: [
        text('modalityProtocol', 'Modality and protocol', 'e.g. MR enterography with enteric and intravenous contrast', true),
        select('examQuality', 'Examination quality', quality),
        select('bowelDistention', 'Small-bowel distention', distention),
        { ...area('incompleteSegments', 'Incompletely assessed segments', 'Segments and reason for incomplete assessment'), visibleWhen: { field: 'bowelDistention', equals: ['limited', 'collapsed', 'not assessed'] } },
        area('technicalLimitations', 'Technical limitations', 'Motion, incomplete distention, missing sequences/phases, or other issue'),
      ],
    },
    {
      id: 'mural-disease', title: 'Dominant bowel segment', defaultOpen: true,
      fields: [
        select('activeInflammation', 'Active mural inflammation', assessment),
        { ...text('involvedSegment', 'Involved segment', 'e.g. terminal ileum'), visibleWhen: { field: 'activeInflammation', equals: ['present', 'indeterminate'] } },
        { ...number('involvedLengthCm', 'Involved length', 'cm'), visibleWhen: { field: 'activeInflammation', equals: ['present', 'indeterminate'] } },
        { ...number('muralThicknessMm', 'Maximum mural thickness', 'mm'), visibleWhen: { field: 'activeInflammation', equals: ['present', 'indeterminate'] } },
        { ...text('muralEnhancement', 'Mural enhancement', 'Pattern and degree'), visibleWhen: { field: 'activeInflammation', equals: ['present', 'indeterminate'] } },
        { ...select('muralEdema', 'Mural edema', assessment), visibleWhen: { field: 'activeInflammation', equals: ['present', 'indeterminate'] } },
        { ...select('diffusionRestriction', 'Diffusion restriction', assessment), visibleWhen: { field: 'activeInflammation', equals: ['present', 'indeterminate'] } },
        { ...select('ulceration', 'Ulceration', assessment), visibleWhen: { field: 'activeInflammation', equals: ['present', 'indeterminate'] } },
        area('additionalBowelFindings', 'Additional bowel findings', 'Other involved segments, chronic changes, motility, or colonic findings'),
      ],
    },
    {
      id: 'complications', title: 'Stricturing and penetrating complications', defaultOpen: true,
      fields: [
        select('stricture', 'Stricture', assessment),
        { ...text('strictureLocation', 'Stricture location'), visibleWhen: { field: 'stricture', equals: ['present', 'indeterminate'] } },
        { ...number('strictureLengthCm', 'Stricture length', 'cm'), visibleWhen: { field: 'stricture', equals: ['present', 'indeterminate'] } },
        { ...select('upstreamDilation', 'Upstream bowel dilation', assessment), visibleWhen: { field: 'stricture', equals: ['present', 'indeterminate'] } },
        { ...number('upstreamDiameterMm', 'Maximum upstream caliber', 'mm'), visibleWhen: { field: 'upstreamDilation', equals: ['present', 'indeterminate'] } },
        select('penetratingDisease', 'Fistula or sinus tract', assessment),
        { ...area('fistulaDetails', 'Fistula or sinus details', 'Origin, course, destination, and activity'), visibleWhen: { field: 'penetratingDisease', equals: ['present', 'indeterminate'] } },
        select('abscessPhlegmon', 'Abscess or phlegmon', assessment),
        { ...area('abscessPhlegmonDetails', 'Abscess or phlegmon details', 'Location, dimensions, drainability descriptors, and relationships'), visibleWhen: { field: 'abscessPhlegmon', equals: ['present', 'indeterminate'] } },
      ],
    },
    {
      id: 'mesentery-extraintestinal', title: 'Mesenteric and extraintestinal findings', defaultOpen: true,
      fields: [
        select('mesentericInflammation', 'Mesenteric inflammatory change', assessment),
        { ...area('mesentericDetails', 'Mesenteric details', 'Hyperemia, edema, fibrofatty proliferation, or other finding'), visibleWhen: { field: 'mesentericInflammation', equals: ['present', 'indeterminate'] } },
        select('suspiciousNodes', 'Suspicious lymph nodes', assessment),
        { ...area('suspiciousNodeDetails', 'Lymph-node details'), visibleWhen: { field: 'suspiciousNodes', equals: ['present', 'indeterminate'] } },
        area('extraintestinalFindings', 'Extraintestinal manifestations or complications'),
        area('intervalChange', 'Interval change', 'Improved, stable, progressed, new complication, or other comparison'),
        area('userActivitySynthesis', 'User-entered activity synthesis', 'Optional descriptive synthesis; no score is calculated'),
        area('incidentalFindings', 'Incidental findings'),
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
      id: 'diagnostic-negative', label: 'No active bowel inflammation', description: 'Diagnostic examination without active mural, stricturing, or penetrating disease.', intent: 'normal',
      values: {
        examQuality: 'diagnostic', bowelDistention: 'adequate', activeInflammation: 'absent',
        stricture: 'absent', penetratingDisease: 'absent', abscessPhlegmon: 'absent',
        mesentericInflammation: 'absent', suspiciousNodes: 'absent',
      },
    },
    {
      id: 'active-segment', label: 'Active segmental inflammation', description: 'Open the active mural disease pathway.', intent: 'positive',
      values: { examQuality: 'diagnostic', bowelDistention: 'adequate', activeInflammation: 'present', stricture: 'absent', penetratingDisease: 'absent', abscessPhlegmon: 'absent' },
    },
    {
      id: 'limited-enterography', label: 'Limited examination', description: 'Document incomplete bowel assessment.', intent: 'complicated',
      values: { examQuality: 'limited', bowelDistention: 'limited', activeInflammation: 'not assessed', stricture: 'not assessed', penetratingDisease: 'not assessed', abscessPhlegmon: 'not assessed', mesentericInflammation: 'not assessed', suspiciousNodes: 'not assessed' },
    },
  ],
};

const perianalDefaults: WorkflowValues = {
  clinicalIndication: '', clinicalContext: '', comparisonStudy: '', comparisonDate: '',
  modalityProtocol: '', examQuality: '', technicalLimitations: '', primaryFistula: '',
  internalOpeningClock: '', internalOpeningHeightCm: '', tractClassification: '',
  tractCourse: '', externalOpening: '', tractActivity: '', secondaryTracts: '',
  secondaryTractDetails: '', abscess: '', abscessLocation: '', abscessApMm: '',
  abscessTrMm: '', abscessCcMm: '', horseshoeExtension: '', supralevatorExtension: '',
  translevatorExtension: '', proctitis: '', proctitisDetails: '', additionalFindings: '',
  incidentalFindings: '', userAssignedClassification: '', limitationsUncertainty: '',
  findingsOverride: '', impressionOverride: '',
};

export const perianalFistulaMriWorkflowSchema: ReportingWorkflowSchema = {
  moduleType: 'perianalFistulaMri',
  moduleId: 'mri-perianal-fistula',
  title: 'Perianal Fistulizing Disease MRI',
  shortTitle: 'Perianal fistula MRI',
  modality: 'MRI',
  bodySystem: 'Pelvis',
  clinicalQuestion: 'Map perianal fistula openings, sphincter relationships, secondary tracts, collections, extension, and inflammatory activity.',
  techniqueDefault: 'Multiplanar pelvic MRI was performed with dedicated small-field-of-view perianal sequences and intravenous contrast as available.',
  badges: ['Implemented', 'Educational draft', 'Tract mapping'],
  insertTargets: ['findings', 'impression', 'incidentalFindings', 'recommendations'],
  safetyNote: 'Verify internal and external openings, tract course relative to the sphincter complex, every secondary tract and collection, supralevator extension, and activity. Classification and management are not calculated automatically.',
  contentMetadata: {
    sourceChapter: 'Chapter 19: Perianal fistulizing disease MRI',
    sourceType: 'Private development reference',
    guidelineOrClassificationName: 'Parks and St James classifications',
    guidelineVersion: 'Current terminology requires primary-source verification',
    lastReviewedDate: '2026-07-27',
    reviewStatus: 'needs_clinical_review',
    clinicalValidationRequired: true,
  },
  defaultValues: perianalDefaults,
  sections: [
    {
      id: 'clinical-context', title: 'Clinical context', defaultOpen: true,
      fields: [
        area('clinicalIndication', 'Clinical indication', 'Suspected or known perianal fistula, drainage, pain, or treatment response'),
        area('clinicalContext', 'Relevant clinical context', 'Inflammatory bowel disease, prior drainage, seton, surgery, or treatment'),
        text('comparisonStudy', 'Comparison examination'), { id: 'comparisonDate', label: 'Comparison date', type: 'date' },
      ],
    },
    {
      id: 'technical-quality', title: 'Protocol and technical quality', defaultOpen: true,
      fields: [
        text('modalityProtocol', 'MRI protocol', 'e.g. dedicated perianal MRI with contrast', true),
        select('examQuality', 'Examination quality', quality),
        area('technicalLimitations', 'Technical limitations', 'Motion, incomplete coverage, susceptibility, missing contrast, or other issue'),
      ],
    },
    {
      id: 'primary-tract', title: 'Primary fistula tract', defaultOpen: true,
      fields: [
        select('primaryFistula', 'Primary fistula tract', assessment),
        { ...text('internalOpeningClock', 'Internal opening clock-face', 'e.g. 6 o’clock'), visibleWhen: { field: 'primaryFistula', equals: ['present', 'indeterminate'] } },
        { ...number('internalOpeningHeightCm', 'Internal opening height above anal verge', 'cm'), visibleWhen: { field: 'primaryFistula', equals: ['present', 'indeterminate'] } },
        { ...text('tractClassification', 'Anatomic tract type', 'Intersphincteric, transsphincteric, suprasphincteric, extrasphincteric, or indeterminate'), visibleWhen: { field: 'primaryFistula', equals: ['present', 'indeterminate'] } },
        { ...area('tractCourse', 'Tract course', 'Origin, relationship to internal/external sphincters, direction, and length'), visibleWhen: { field: 'primaryFistula', equals: ['present', 'indeterminate'] } },
        { ...text('externalOpening', 'External opening', 'Clock-face and skin location'), visibleWhen: { field: 'primaryFistula', equals: ['present', 'indeterminate'] } },
        { ...text('tractActivity', 'Activity or fibrosis', 'Active, predominantly fibrotic, mixed, indeterminate, or not assessed'), visibleWhen: { field: 'primaryFistula', equals: ['present', 'indeterminate'] } },
        { ...text('userAssignedClassification', 'User-assigned classification', 'Optional; no class is calculated'), visibleWhen: { field: 'primaryFistula', equals: ['present', 'indeterminate'] } },
      ],
    },
    {
      id: 'extensions-collections', title: 'Secondary tracts and collections', defaultOpen: true,
      fields: [
        select('secondaryTracts', 'Secondary tracts', assessment),
        { ...area('secondaryTractDetails', 'Secondary tract details', 'Clock-face, level, course, sphincter relationship, and activity'), visibleWhen: { field: 'secondaryTracts', equals: ['present', 'indeterminate'] } },
        select('abscess', 'Abscess or drainable collection', assessment),
        { ...text('abscessLocation', 'Collection location'), visibleWhen: { field: 'abscess', equals: ['present', 'indeterminate'] } },
        { ...number('abscessApMm', 'AP dimension', 'mm'), visibleWhen: { field: 'abscess', equals: ['present', 'indeterminate'] } },
        { ...number('abscessTrMm', 'Transverse dimension', 'mm'), visibleWhen: { field: 'abscess', equals: ['present', 'indeterminate'] } },
        { ...number('abscessCcMm', 'Craniocaudal dimension', 'mm'), visibleWhen: { field: 'abscess', equals: ['present', 'indeterminate'] } },
        select('horseshoeExtension', 'Horseshoe component', assessment),
        select('supralevatorExtension', 'Supralevator extension', assessment),
        select('translevatorExtension', 'Translevator extension', assessment),
      ],
    },
    {
      id: 'associated-findings', title: 'Associated findings and overrides', defaultOpen: true,
      fields: [
        select('proctitis', 'Proctitis', assessment),
        { ...area('proctitisDetails', 'Proctitis details'), visibleWhen: { field: 'proctitis', equals: ['present', 'indeterminate'] } },
        area('additionalFindings', 'Additional pelvic findings'), area('incidentalFindings', 'Incidental findings'),
        area('limitationsUncertainty', 'Additional uncertainty'),
        area('findingsOverride', 'Findings free-text override', 'When entered, this replaces generated findings'),
        area('impressionOverride', 'Impression free-text override', 'When entered, this replaces generated impression'),
      ],
    },
  ],
  keyNegatives: [], incidentalOptions: [],
  quickFills: [
    {
      id: 'no-fistula', label: 'No fistula identified', description: 'Diagnostic examination without fistula or collection.', intent: 'normal',
      values: { examQuality: 'diagnostic', primaryFistula: 'absent', secondaryTracts: 'absent', abscess: 'absent', horseshoeExtension: 'absent', supralevatorExtension: 'absent', translevatorExtension: 'absent', proctitis: 'absent' },
    },
    {
      id: 'primary-fistula', label: 'Primary fistula', description: 'Open the detailed tract-mapping pathway.', intent: 'positive',
      values: { examQuality: 'diagnostic', primaryFistula: 'present', secondaryTracts: 'absent', abscess: 'absent', horseshoeExtension: 'absent', supralevatorExtension: 'absent', translevatorExtension: 'absent' },
    },
    {
      id: 'limited-assessment', label: 'Limited examination', description: 'Document an incompletely assessed fistula and complications.', intent: 'complicated',
      values: { examQuality: 'limited', primaryFistula: 'indeterminate', secondaryTracts: 'not assessed', abscess: 'not assessed', horseshoeExtension: 'not assessed', supralevatorExtension: 'not assessed', translevatorExtension: 'not assessed', proctitis: 'not assessed' },
    },
  ],
};
