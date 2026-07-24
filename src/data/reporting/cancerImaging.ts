import type { ReferralOption } from '../../radrep/types';
import type {
  ReportingWorkflowSchema,
  WorkflowField,
  WorkflowValues,
} from '../reportingWorkflowSchemas';

const assessmentOptions: ReferralOption[] = [
  { value: '', label: 'Select assessment…' },
  { value: 'absent', label: 'Absent' },
  { value: 'present', label: 'Present' },
  { value: 'indeterminate', label: 'Indeterminate' },
  { value: 'not assessed', label: 'Not assessed' },
];

const examPurposeOptions: ReferralOption[] = [
  { value: '', label: 'Select purpose…' },
  { value: 'initial staging', label: 'Initial staging' },
  { value: 'interim response assessment', label: 'Interim response assessment' },
  { value: 'end-of-treatment response assessment', label: 'End-of-treatment response assessment' },
  { value: 'surveillance or suspected recurrence', label: 'Surveillance / suspected recurrence' },
];

const technicalQualityOptions: ReferralOption[] = [
  { value: '', label: 'Select quality…' },
  { value: 'diagnostic', label: 'Diagnostic' },
  { value: 'limited', label: 'Limited' },
  { value: 'nondiagnostic', label: 'Nondiagnostic' },
];

const intervalChangeOptions: ReferralOption[] = [
  { value: '', label: 'Select interval assessment…' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'decreased', label: 'Decreased' },
  { value: 'stable', label: 'Stable' },
  { value: 'increased', label: 'Increased' },
  { value: 'mixed', label: 'Mixed response' },
  { value: 'new disease', label: 'New disease' },
  { value: 'not assessed', label: 'Not assessed' },
];

function text(id: string, label: string, placeholder?: string, wide = false): WorkflowField {
  return { id, label, type: 'text', placeholder, wide };
}

function area(id: string, label: string, placeholder?: string): WorkflowField {
  return { id, label, type: 'textarea', placeholder, wide: true };
}

function number(id: string, label: string, suffix?: string): WorkflowField {
  return { id, label, type: 'number', suffix };
}

function select(id: string, label: string, options: ReferralOption[]): WorkflowField {
  return { id, label, type: 'select', options };
}

const defaultValues: WorkflowValues = {
  clinicalIndication: '',
  relevantClinicalContext: '',
  lymphomaSubtype: '',
  examPurpose: '',
  comparisonStudy: '',
  comparisonDate: '',
  tracer: 'F-18 FDG',
  administeredActivity: '',
  uptakeTimeMinutes: '',
  serumGlucose: '',
  examQuality: '',
  technicalLimitations: '',
  nodalDisease: '',
  nodalDistribution: '',
  dominantNodalSite: '',
  dominantNodeSizeMm: '',
  dominantNodeSuvMax: '',
  bulkyDisease: '',
  extranodalDisease: '',
  extranodalSites: '',
  dominantExtranodalSite: '',
  dominantExtranodalSizeMm: '',
  dominantExtranodalSuvMax: '',
  spleenAssessment: '',
  marrowAssessment: '',
  liverAssessment: '',
  bloodPoolSuvMean: '',
  liverSuvMean: '',
  highestUptakeSite: '',
  highestLesionSuvMax: '',
  intervalChange: '',
  newLesions: '',
  newLesionDescription: '',
  userResponseSynthesis: '',
  additionalFindings: '',
  incidentalFindings: '',
  limitationsUncertainty: '',
  findingsOverride: '',
  impressionOverride: '',
};

export const lymphomaPetCtWorkflowSchema: ReportingWorkflowSchema = {
  moduleType: 'lymphomaPetCt',
  moduleId: 'pet-ct-lymphoma',
  title: 'Lymphoma PET-CT',
  shortTitle: 'Lymphoma PET-CT',
  modality: 'PET/CT',
  bodySystem: 'Oncology',
  clinicalQuestion: 'Define metabolically active nodal and extranodal disease and assess interval response when applicable.',
  techniqueDefault: 'Whole-body FDG PET/CT was performed with low-dose CT for attenuation correction and anatomic localization.',
  badges: ['Implemented', 'Educational draft', 'Response assessment'],
  insertTargets: ['findings', 'impression', 'incidentalFindings', 'recommendations'],
  safetyNote:
    'Educational reporting workflow. Verify tracer administration, technical quality, all disease sites, comparison imaging, and final response synthesis. No treatment recommendation is generated.',
  contentMetadata: {
    sourceChapter: 'Chapter 5: Lymphoma staging PET-CT',
    sourceType: 'Private development reference',
    guidelineOrClassificationName: 'Lugano / Deauville response assessment',
    guidelineVersion: 'Current version requires primary-source verification',
    lastReviewedDate: '2026-07-24',
    reviewStatus: 'needs_clinical_review',
    clinicalValidationRequired: true,
  },
  defaultValues,
  sections: [
    {
      id: 'clinical-context',
      title: 'Clinical context',
      defaultOpen: true,
      fields: [
        area('clinicalIndication', 'Clinical indication', 'Known or suspected lymphoma and the specific imaging question'),
        area('relevantClinicalContext', 'Relevant clinical context', 'Histology, treatment dates, symptoms, or other relevant history'),
        text('lymphomaSubtype', 'Lymphoma subtype', 'If known'),
        select('examPurpose', 'Examination purpose', examPurposeOptions),
        text('comparisonStudy', 'Comparison examination', 'e.g. PET/CT'),
        { id: 'comparisonDate', label: 'Comparison date', type: 'date' },
      ],
    },
    {
      id: 'technical-quality',
      title: 'Technique and quality',
      defaultOpen: true,
      fields: [
        text('tracer', 'Tracer'),
        number('administeredActivity', 'Administered activity', 'MBq'),
        number('uptakeTimeMinutes', 'Uptake time', 'min'),
        number('serumGlucose', 'Serum glucose', 'mmol/L'),
        select('examQuality', 'Examination quality', technicalQualityOptions),
        area('technicalLimitations', 'Technical limitations', 'Motion, altered biodistribution, hyperglycemia, incomplete coverage, or other limitation'),
      ],
    },
    {
      id: 'nodal-disease',
      title: 'Nodal disease',
      defaultOpen: true,
      fields: [
        select('nodalDisease', 'Metabolically active nodal disease', assessmentOptions),
        {
          ...area('nodalDistribution', 'Involved nodal stations', 'List involved nodal regions and laterality'),
          visibleWhen: { field: 'nodalDisease', equals: ['present', 'indeterminate'] },
        },
        {
          ...text('dominantNodalSite', 'Dominant nodal site', 'Most clinically important or most avid nodal site', true),
          visibleWhen: { field: 'nodalDisease', equals: ['present', 'indeterminate'] },
        },
        {
          ...number('dominantNodeSizeMm', 'Dominant node short axis', 'mm'),
          visibleWhen: { field: 'nodalDisease', equals: ['present', 'indeterminate'] },
        },
        {
          ...number('dominantNodeSuvMax', 'Dominant nodal SUVmax'),
          visibleWhen: { field: 'nodalDisease', equals: ['present', 'indeterminate'] },
        },
        {
          ...select('bulkyDisease', 'Bulky nodal disease', assessmentOptions),
          visibleWhen: { field: 'nodalDisease', equals: ['present', 'indeterminate'] },
        },
      ],
    },
    {
      id: 'extranodal-disease',
      title: 'Extranodal disease',
      defaultOpen: true,
      fields: [
        select('extranodalDisease', 'Metabolically active extranodal disease', assessmentOptions),
        {
          ...area('extranodalSites', 'Extranodal disease sites', 'Organs, bones, soft tissues, or other involved sites'),
          visibleWhen: { field: 'extranodalDisease', equals: ['present', 'indeterminate'] },
        },
        {
          ...text('dominantExtranodalSite', 'Dominant extranodal site', 'Most clinically important or most avid site', true),
          visibleWhen: { field: 'extranodalDisease', equals: ['present', 'indeterminate'] },
        },
        {
          ...number('dominantExtranodalSizeMm', 'Dominant extranodal lesion size', 'mm'),
          visibleWhen: { field: 'extranodalDisease', equals: ['present', 'indeterminate'] },
        },
        {
          ...number('dominantExtranodalSuvMax', 'Dominant extranodal SUVmax'),
          visibleWhen: { field: 'extranodalDisease', equals: ['present', 'indeterminate'] },
        },
        select('spleenAssessment', 'Spleen involvement', assessmentOptions),
        select('marrowAssessment', 'Marrow involvement', assessmentOptions),
        select('liverAssessment', 'Liver involvement', assessmentOptions),
      ],
    },
    {
      id: 'response-assessment',
      title: 'Reference activity and response',
      defaultOpen: false,
      description: 'Reference values and response synthesis are descriptive. No response category is calculated automatically.',
      fields: [
        number('bloodPoolSuvMean', 'Blood-pool SUVmean'),
        number('liverSuvMean', 'Liver SUVmean'),
        text('highestUptakeSite', 'Highest-uptake lesion or site', 'Anatomic site', true),
        number('highestLesionSuvMax', 'Highest lesion SUVmax'),
        select('intervalChange', 'Interval metabolic change', intervalChangeOptions),
        select('newLesions', 'New metabolically active lesions', assessmentOptions),
        {
          ...area('newLesionDescription', 'New lesion description', 'Location, size, uptake, and confidence'),
          visibleWhen: { field: 'newLesions', equals: ['present', 'indeterminate'] },
        },
        area('userResponseSynthesis', 'User-assigned response synthesis', 'Optional radiologist-entered response category or descriptive synthesis'),
      ],
    },
    {
      id: 'additional-findings',
      title: 'Additional findings and overrides',
      defaultOpen: false,
      fields: [
        area('additionalFindings', 'Additional findings', 'Other clinically relevant findings'),
        area('incidentalFindings', 'Incidental findings', 'Actionable or otherwise important incidental findings'),
        area('limitationsUncertainty', 'Additional uncertainty', 'Diagnostic uncertainty not already described'),
        area('findingsOverride', 'Findings free-text override', 'When entered, this replaces generated findings'),
        area('impressionOverride', 'Impression free-text override', 'When entered, this replaces generated impression'),
      ],
    },
  ],
  keyNegatives: [],
  incidentalOptions: [],
  quickFills: [
    {
      id: 'no-active-disease',
      label: 'No active disease',
      description: 'Diagnostic examination with no metabolically active nodal or extranodal disease.',
      intent: 'normal',
      values: {
        examQuality: 'diagnostic',
        nodalDisease: 'absent',
        extranodalDisease: 'absent',
        spleenAssessment: 'absent',
        marrowAssessment: 'absent',
        liverAssessment: 'absent',
        newLesions: 'absent',
      },
    },
    {
      id: 'active-nodal-and-extranodal-disease',
      label: 'Nodal + extranodal disease',
      description: 'Positive pathway revealing disease-distribution and dominant-lesion fields.',
      intent: 'positive',
      values: {
        examQuality: 'diagnostic',
        nodalDisease: 'present',
        extranodalDisease: 'present',
        newLesions: 'not assessed',
      },
    },
    {
      id: 'limited-examination',
      label: 'Limited examination',
      description: 'Technically limited examination requiring explicit limitation documentation.',
      intent: 'complicated',
      values: {
        examQuality: 'limited',
        nodalDisease: 'not assessed',
        extranodalDisease: 'not assessed',
        spleenAssessment: 'not assessed',
        marrowAssessment: 'not assessed',
        liverAssessment: 'not assessed',
        newLesions: 'not assessed',
      },
    },
  ],
};
