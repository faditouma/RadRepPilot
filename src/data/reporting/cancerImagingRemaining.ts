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
const enhancement: ReferralOption[] = [
  { value: '', label: 'Select appearance…' },
  { value: 'absent', label: 'Absent' },
  { value: 'nonrim arterial phase hyperenhancement', label: 'Nonrim arterial-phase hyperenhancement' },
  { value: 'rim arterial phase hyperenhancement', label: 'Rim arterial-phase hyperenhancement' },
  { value: 'other enhancement', label: 'Other enhancement' },
  { value: 'indeterminate', label: 'Indeterminate' },
  { value: 'not assessed', label: 'Not assessed' },
];
const treatedStatus: ReferralOption[] = [
  { value: '', label: 'Select treatment status…' },
  { value: 'untreated', label: 'Untreated observation' },
  { value: 'treated', label: 'Treated observation' },
];
const response: ReferralOption[] = [
  { value: '', label: 'Select response appearance…' },
  { value: 'no masslike enhancement', label: 'No masslike enhancement' },
  { value: 'residual or recurrent masslike enhancement', label: 'Residual/recurrent masslike enhancement' },
  { value: 'equivocal enhancement', label: 'Equivocal enhancement' },
  { value: 'not assessed', label: 'Not assessed' },
];
const text = (id: string, label: string, placeholder = '', wide = false): WorkflowField => ({ id, label, type: 'text', placeholder, wide });
const area = (id: string, label: string, placeholder = ''): WorkflowField => ({ id, label, type: 'textarea', placeholder, wide: true });
const number = (id: string, label: string, suffix?: string): WorkflowField => ({ id, label, type: 'number', suffix });
const select = (id: string, label: string, options: ReferralOption[]): WorkflowField => ({ id, label, type: 'select', options });

const defaults: WorkflowValues = {
  clinicalIndication: '', riskContext: '', treatmentHistory: '', comparisonStudy: '', comparisonDate: '',
  modalityProtocol: '', examQuality: '', arterialPhaseAdequacy: '', portalVenousPhaseAdequacy: '',
  delayedPhaseAdequacy: '', technicalLimitations: '', liverBackground: '', observationStatus: '',
  observationNumber: '', segment: '', sizeApMm: '', sizeTrMm: '', sizeCcMm: '', treatmentStatus: '',
  arterialEnhancement: '', washout: '', capsule: '', thresholdGrowth: '', ancillaryFeatures: '',
  tumorInVein: '', tumorInVeinDetails: '', treatmentResponse: '', userAssignedLirads: '',
  userAssignedOptn: '', portalHypertension: '', portalHypertensionDetails: '', suspiciousNodes: '',
  suspiciousNodeDetails: '', extrahepaticMetastases: '', extrahepaticMetastasisDetails: '',
  additionalObservations: '', additionalFindings: '', incidentalFindings: '', limitationsUncertainty: '',
  findingsOverride: '', impressionOverride: '',
};

export const hccLiverWorkflowSchema: ReportingWorkflowSchema = {
  moduleType: 'hccLiver',
  moduleId: 'mri-liver-lirads',
  title: 'Hepatocellular Carcinoma CT/MRI',
  shortTitle: 'HCC CT/MRI',
  modality: 'CT/MRI',
  bodySystem: 'Oncology',
  clinicalQuestion: 'Characterize liver observations in an at-risk patient, including major imaging features, vascular invasion, treatment response, and extrahepatic disease.',
  techniqueDefault: 'Multiphase liver CT/MRI was performed with arterial, portal venous, and delayed phase imaging as available.',
  badges: ['Implemented', 'Educational draft', 'Observation mapping'],
  insertTargets: ['findings', 'impression', 'incidentalFindings', 'recommendations'],
  safetyNote: 'Verify at-risk population applicability, phase timing, every observation, tumor-in-vein findings, treatment history, and any user-assigned LI-RADS or OPTN category. No category or management recommendation is generated automatically.',
  contentMetadata: {
    sourceChapter: 'Chapter 10: Hepatocellular carcinoma',
    sourceType: 'Private development reference',
    guidelineOrClassificationName: 'LI-RADS and OPTN',
    guidelineVersion: 'Current official versions require primary-source verification',
    lastReviewedDate: '2026-07-24',
    reviewStatus: 'needs_clinical_review',
    clinicalValidationRequired: true,
  },
  defaultValues: defaults,
  sections: [
    {
      id: 'clinical-context', title: 'Clinical context', defaultOpen: true,
      fields: [
        area('clinicalIndication', 'Clinical indication', 'HCC screening, observation characterization, staging, or treatment response'),
        area('riskContext', 'HCC risk context', 'Cirrhosis, chronic liver disease, transplant status, or other eligibility context'),
        area('treatmentHistory', 'Treatment history', 'Ablation, embolization, radiation, resection, transplant, or systemic therapy'),
        text('comparisonStudy', 'Comparison examination'), { id: 'comparisonDate', label: 'Comparison date', type: 'date' },
      ],
    },
    {
      id: 'technical-quality', title: 'Protocol and technical quality', defaultOpen: true,
      fields: [
        text('modalityProtocol', 'Modality and protocol', 'e.g. multiphase liver MRI', true),
        select('examQuality', 'Examination quality', quality),
        select('arterialPhaseAdequacy', 'Arterial phase adequacy', assessment),
        select('portalVenousPhaseAdequacy', 'Portal venous phase adequacy', assessment),
        select('delayedPhaseAdequacy', 'Delayed phase adequacy', assessment),
        area('technicalLimitations', 'Technical limitations', 'Phase timing, motion, subtraction limitation, or other issue'),
        area('liverBackground', 'Background liver', 'Morphology, steatosis, iron, fibrosis/cirrhosis, and relevant diffuse findings'),
      ],
    },
    {
      id: 'dominant-observation', title: 'Dominant observation', defaultOpen: true,
      fields: [
        select('observationStatus', 'Focal liver observation', assessment),
        { ...text('observationNumber', 'Observation identifier', 'e.g. Observation 1'), visibleWhen: { field: 'observationStatus', equals: ['present', 'indeterminate'] } },
        { ...text('segment', 'Liver segment', 'e.g. segment 8'), visibleWhen: { field: 'observationStatus', equals: ['present', 'indeterminate'] } },
        { ...number('sizeApMm', 'AP dimension', 'mm'), visibleWhen: { field: 'observationStatus', equals: ['present', 'indeterminate'] } },
        { ...number('sizeTrMm', 'Transverse dimension', 'mm'), visibleWhen: { field: 'observationStatus', equals: ['present', 'indeterminate'] } },
        { ...number('sizeCcMm', 'Craniocaudal dimension', 'mm'), visibleWhen: { field: 'observationStatus', equals: ['present', 'indeterminate'] } },
        { ...select('treatmentStatus', 'Observation treatment status', treatedStatus), visibleWhen: { field: 'observationStatus', equals: ['present', 'indeterminate'] } },
        { ...select('arterialEnhancement', 'Arterial-phase enhancement', enhancement), visibleWhen: { field: 'observationStatus', equals: ['present', 'indeterminate'] } },
        { ...select('washout', 'Washout appearance', assessment), visibleWhen: { field: 'observationStatus', equals: ['present', 'indeterminate'] } },
        { ...select('capsule', 'Enhancing capsule appearance', assessment), visibleWhen: { field: 'observationStatus', equals: ['present', 'indeterminate'] } },
        { ...select('thresholdGrowth', 'Threshold growth', assessment), visibleWhen: { field: 'observationStatus', equals: ['present', 'indeterminate'] } },
        { ...area('ancillaryFeatures', 'Ancillary and other features', 'Diffusion, T2 signal, fat, blood products, mosaic architecture, or other descriptors'), visibleWhen: { field: 'observationStatus', equals: ['present', 'indeterminate'] } },
        { ...select('treatmentResponse', 'Treated-observation enhancement', response), visibleWhen: { field: 'treatmentStatus', equals: 'treated' } },
        { ...text('userAssignedLirads', 'User-assigned LI-RADS category', 'Optional; no category is calculated', true), visibleWhen: { field: 'observationStatus', equals: ['present', 'indeterminate'] } },
        { ...text('userAssignedOptn', 'User-assigned OPTN status', 'Optional; no status is calculated', true), visibleWhen: { field: 'observationStatus', equals: ['present', 'indeterminate'] } },
        area('additionalObservations', 'Additional observations', 'Identifier, segment, size, major features, treatment status, and user-assigned category'),
      ],
    },
    {
      id: 'vascular-extrahepatic', title: 'Vascular and extrahepatic findings', defaultOpen: true,
      fields: [
        select('tumorInVein', 'Tumor in vein', assessment),
        { ...area('tumorInVeinDetails', 'Tumor-in-vein details', 'Vessel, extent, enhancement, and confidence'), visibleWhen: { field: 'tumorInVein', equals: ['present', 'indeterminate'] } },
        select('portalHypertension', 'Portal hypertension findings', assessment),
        { ...area('portalHypertensionDetails', 'Portal hypertension details', 'Varices, ascites, splenomegaly, collaterals, or thrombosis'), visibleWhen: { field: 'portalHypertension', equals: ['present', 'indeterminate'] } },
        select('suspiciousNodes', 'Suspicious nodes', assessment),
        { ...area('suspiciousNodeDetails', 'Suspicious node details'), visibleWhen: { field: 'suspiciousNodes', equals: ['present', 'indeterminate'] } },
        select('extrahepaticMetastases', 'Extrahepatic metastases', assessment),
        { ...area('extrahepaticMetastasisDetails', 'Extrahepatic metastasis details', 'Sites, burden, measurements, and confidence'), visibleWhen: { field: 'extrahepaticMetastases', equals: ['present', 'indeterminate'] } },
      ],
    },
    {
      id: 'additional-overrides', title: 'Additional findings and overrides', defaultOpen: false,
      fields: [
        area('additionalFindings', 'Additional findings'), area('incidentalFindings', 'Incidental findings'),
        area('limitationsUncertainty', 'Additional uncertainty'),
        area('findingsOverride', 'Findings free-text override', 'When entered, this replaces generated findings'),
        area('impressionOverride', 'Impression free-text override', 'When entered, this replaces generated impression'),
      ],
    },
  ],
  keyNegatives: [], incidentalOptions: [],
  quickFills: [
    {
      id: 'no-focal-observation', label: 'No focal observation', description: 'Diagnostic multiphase study with no suspicious observation.', intent: 'normal',
      values: { examQuality: 'diagnostic', arterialPhaseAdequacy: 'present', portalVenousPhaseAdequacy: 'present', delayedPhaseAdequacy: 'present', observationStatus: 'absent', tumorInVein: 'absent', portalHypertension: 'absent', suspiciousNodes: 'absent', extrahepaticMetastases: 'absent' },
    },
    { id: 'dominant-observation', label: 'Dominant observation', description: 'Positive pathway for observation characterization.', intent: 'positive', values: { examQuality: 'diagnostic', observationStatus: 'present', treatmentStatus: 'untreated' } },
    { id: 'limited-liver-study', label: 'Limited examination', description: 'Limited phase adequacy and observation assessment.', intent: 'complicated', values: { examQuality: 'limited', arterialPhaseAdequacy: 'not assessed', portalVenousPhaseAdequacy: 'not assessed', delayedPhaseAdequacy: 'not assessed', observationStatus: 'indeterminate', tumorInVein: 'not assessed', portalHypertension: 'not assessed', suspiciousNodes: 'not assessed', extrahepaticMetastases: 'not assessed' } },
  ],
};
