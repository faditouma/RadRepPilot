import type { ReferralOption } from '../../radrep/types';
import type { ReportingWorkflowSchema, WorkflowField, WorkflowValues } from '../reportingWorkflowSchemas';

const status: ReferralOption[] = [
  { value: '', label: 'Select…' }, { value: 'absent', label: 'Absent' }, { value: 'present', label: 'Present' },
  { value: 'indeterminate', label: 'Indeterminate' }, { value: 'not assessed', label: 'Not assessed' },
];
const patency: ReferralOption[] = [
  { value: '', label: 'Select…' }, { value: 'patent', label: 'Patent' }, { value: 'occluded', label: 'Occluded' },
  { value: 'indeterminate', label: 'Indeterminate' }, { value: 'not assessed', label: 'Not assessed' },
];
const quality: ReferralOption[] = [
  { value: '', label: 'Select…' }, { value: 'diagnostic', label: 'Diagnostic' },
  { value: 'limited', label: 'Limited' }, { value: 'nondiagnostic', label: 'Nondiagnostic' },
];
const t = (id: string, label: string, wide = false): WorkflowField => ({ id, label, type: 'text', wide });
const a = (id: string, label: string): WorkflowField => ({ id, label, type: 'textarea', wide: true });
const n = (id: string, label: string, suffix?: string): WorkflowField => ({ id, label, type: 'number', suffix });
const s = (id: string, label: string, options: ReferralOption[]): WorkflowField => ({ id, label, type: 'select', options });
const context = [a('clinicalIndication', 'Clinical indication'), a('clinicalContext', 'Relevant clinical context'), a('transplantHistory', 'Transplant or operative history'), t('comparisonStudy', 'Comparison examination'), { id: 'comparisonDate', label: 'Comparison date', type: 'date' as const }];
const qualityFields = [t('modalityProtocol', 'Modality and protocol', true), s('examQuality', 'Examination quality', quality), a('technicalLimitations', 'Technical limitations')];
const overrides = [a('additionalFindings', 'Additional findings'), a('incidentalFindings', 'Incidental findings'), a('limitationsUncertainty', 'Additional uncertainty'), a('findingsOverride', 'Findings free-text override'), a('impressionOverride', 'Impression free-text override')];
const baseDefaults = { clinicalIndication: '', clinicalContext: '', transplantHistory: '', comparisonStudy: '', comparisonDate: '', modalityProtocol: '', examQuality: '', technicalLimitations: '', additionalFindings: '', incidentalFindings: '', limitationsUncertainty: '', findingsOverride: '', impressionOverride: '' };

export const liverTransplantUltrasoundWorkflowSchema: ReportingWorkflowSchema = {
  moduleType: 'liverTransplantUltrasound', moduleId: 'us-liver-transplant', title: 'Liver-Transplant Ultrasound', shortTitle: 'Liver transplant ultrasound',
  modality: 'Ultrasound', bodySystem: 'Transplant', clinicalQuestion: 'Assess liver graft morphology, transplant vasculature, biliary tree, collections, and urgent complications.',
  techniqueDefault: 'Grayscale, color, and spectral Doppler ultrasound of the liver transplant was performed.',
  badges: ['Implemented', 'Educational draft', 'Doppler mapping'], insertTargets: ['findings', 'impression', 'incidentalFindings', 'recommendations'],
  safetyNote: 'Verify vessels, sample locations and angles, waveforms, velocities, resistive indices, biliary tree, collections, comparison, and communication. Institution-specific thresholds are not interpreted automatically.',
  contentMetadata: { sourceChapter: 'Chapter 28: Liver-transplant ultrasound', sourceType: 'Private development reference', guidelineOrClassificationName: 'Local transplant Doppler protocol', guidelineVersion: 'Institution-specific thresholds require validation', lastReviewedDate: '2026-07-27', reviewStatus: 'needs_clinical_review', clinicalValidationRequired: true },
  defaultValues: { ...baseDefaults, graftAppearance: '', hepaticArteryPatency: '', hepaticArteryWaveform: '', hepaticArteryRi: '', hepaticArteryPsv: '', portalVeinPatency: '', portalFlowDirection: '', portalVeinVelocity: '', hepaticVeinPatency: '', hepaticVeinWaveform: '', ivcPatency: '', biliaryDilation: '', biliaryDetails: '', collection: '', collectionDetails: '', urgentFinding: '', urgentDetails: '', communicationOccurred: '', communicationDetails: '' },
  sections: [
    { id: 'context', title: 'Clinical context', defaultOpen: true, fields: context },
    { id: 'quality', title: 'Technique and quality', defaultOpen: true, fields: qualityFields },
    { id: 'graft', title: 'Graft and associated findings', defaultOpen: true, fields: [a('graftAppearance', 'Graft appearance'), s('biliaryDilation', 'Biliary dilation', status), { ...a('biliaryDetails', 'Biliary details'), visibleWhen: { field: 'biliaryDilation', equals: ['present', 'indeterminate'] } }, s('collection', 'Perihepatic collection', status), { ...a('collectionDetails', 'Collection details'), visibleWhen: { field: 'collection', equals: ['present', 'indeterminate'] } }] },
    { id: 'doppler', title: 'Transplant Doppler', defaultOpen: true, fields: [s('hepaticArteryPatency', 'Hepatic artery patency', patency), t('hepaticArteryWaveform', 'Hepatic artery waveform'), n('hepaticArteryRi', 'Hepatic artery resistive index'), n('hepaticArteryPsv', 'Hepatic artery PSV', 'cm/s'), s('portalVeinPatency', 'Portal vein patency', patency), t('portalFlowDirection', 'Portal flow direction'), n('portalVeinVelocity', 'Portal vein velocity', 'cm/s'), s('hepaticVeinPatency', 'Hepatic vein patency', patency), t('hepaticVeinWaveform', 'Hepatic vein waveform'), s('ivcPatency', 'IVC patency', patency)] },
    { id: 'urgent', title: 'Urgent findings and overrides', defaultOpen: true, fields: [s('urgentFinding', 'Urgent vascular finding', status), { ...a('urgentDetails', 'Urgent finding details'), visibleWhen: { field: 'urgentFinding', equals: ['present', 'indeterminate'] } }, t('communicationOccurred', 'Communication occurred'), a('communicationDetails', 'Recipient, date/time, and method'), ...overrides] },
  ],
  keyNegatives: [], incidentalOptions: [], quickFills: [
    { id: 'patent', label: 'Patent transplant vessels', description: 'Diagnostic examination with patent vessels.', intent: 'normal', values: { examQuality: 'diagnostic', hepaticArteryPatency: 'patent', portalVeinPatency: 'patent', hepaticVeinPatency: 'patent', ivcPatency: 'patent', biliaryDilation: 'absent', collection: 'absent', urgentFinding: 'absent' } },
    { id: 'abnormal', label: 'Vascular abnormality', description: 'Open urgent finding documentation.', intent: 'positive', values: { examQuality: 'diagnostic', urgentFinding: 'present' } },
  ],
};

export const kidneyTransplantUltrasoundWorkflowSchema: ReportingWorkflowSchema = {
  moduleType: 'kidneyTransplantUltrasound', moduleId: 'us-kidney-transplant', title: 'Kidney-Transplant Ultrasound', shortTitle: 'Kidney transplant ultrasound',
  modality: 'Ultrasound', bodySystem: 'Transplant', clinicalQuestion: 'Assess renal graft morphology, collecting system, collections, arterial and venous Doppler, waveforms, and bladder.',
  techniqueDefault: 'Grayscale, color, and spectral Doppler ultrasound of the renal transplant was performed.',
  badges: ['Implemented', 'Educational draft', 'Intrarenal Doppler'], insertTargets: ['findings', 'impression', 'incidentalFindings', 'recommendations'],
  safetyNote: 'Verify graft measurements, collecting system, collections, vessels, Doppler technique, velocities, resistive indices, acceleration, waveforms, bladder, comparison, and communication. Thresholds are not interpreted automatically.',
  contentMetadata: { sourceChapter: 'Chapter 29: Kidney-transplant ultrasound', sourceType: 'Private development reference', guidelineOrClassificationName: 'Local transplant Doppler protocol', guidelineVersion: 'Institution-specific thresholds require validation', lastReviewedDate: '2026-07-27', reviewStatus: 'needs_clinical_review', clinicalValidationRequired: true },
  defaultValues: { ...baseDefaults, graftLengthCm: '', graftApCm: '', graftTrCm: '', graftEchogenicity: '', collectingSystemDilation: '', collectingSystemDetails: '', collection: '', collectionDetails: '', renalArteryPatency: '', anastomoticPsv: '', intrarenalPsv: '', riUpper: '', riMid: '', riLower: '', accelerationTimeMs: '', waveformAbnormality: '', waveformDetails: '', renalVeinPatency: '', bladderFindings: '', urgentFinding: '', urgentDetails: '', communicationOccurred: '', communicationDetails: '' },
  sections: [
    { id: 'context', title: 'Clinical context', defaultOpen: true, fields: context }, { id: 'quality', title: 'Technique and quality', defaultOpen: true, fields: qualityFields },
    { id: 'graft', title: 'Graft and collecting system', defaultOpen: true, fields: [n('graftLengthCm', 'Graft length', 'cm'), n('graftApCm', 'Graft AP dimension', 'cm'), n('graftTrCm', 'Graft transverse dimension', 'cm'), t('graftEchogenicity', 'Graft echogenicity'), s('collectingSystemDilation', 'Collecting-system dilation', status), { ...a('collectingSystemDetails', 'Collecting-system details'), visibleWhen: { field: 'collectingSystemDilation', equals: ['present', 'indeterminate'] } }, s('collection', 'Peritransplant collection', status), { ...a('collectionDetails', 'Collection details'), visibleWhen: { field: 'collection', equals: ['present', 'indeterminate'] } }, a('bladderFindings', 'Bladder findings')] },
    { id: 'doppler', title: 'Transplant Doppler', defaultOpen: true, fields: [s('renalArteryPatency', 'Transplant renal artery patency', patency), n('anastomoticPsv', 'Anastomotic PSV', 'cm/s'), n('intrarenalPsv', 'Intrarenal PSV', 'cm/s'), n('riUpper', 'Upper-pole RI'), n('riMid', 'Mid-pole RI'), n('riLower', 'Lower-pole RI'), n('accelerationTimeMs', 'Acceleration time', 'ms'), s('waveformAbnormality', 'Tardus-parvus or other abnormal waveform', status), { ...a('waveformDetails', 'Waveform details'), visibleWhen: { field: 'waveformAbnormality', equals: ['present', 'indeterminate'] } }, s('renalVeinPatency', 'Transplant renal vein patency', patency)] },
    { id: 'urgent', title: 'Urgent findings and overrides', defaultOpen: true, fields: [s('urgentFinding', 'Urgent vascular finding', status), { ...a('urgentDetails', 'Urgent finding details'), visibleWhen: { field: 'urgentFinding', equals: ['present', 'indeterminate'] } }, t('communicationOccurred', 'Communication occurred'), a('communicationDetails', 'Recipient, date/time, and method'), ...overrides] },
  ],
  keyNegatives: [], incidentalOptions: [], quickFills: [{ id: 'patent', label: 'Patent graft vessels', description: 'Diagnostic examination with patent vessels.', intent: 'normal', values: { examQuality: 'diagnostic', collectingSystemDilation: 'absent', collection: 'absent', renalArteryPatency: 'patent', waveformAbnormality: 'absent', renalVeinPatency: 'patent', urgentFinding: 'absent' } }],
};

export const livingDonorLiverWorkflowSchema: ReportingWorkflowSchema = {
  moduleType: 'livingDonorLiver', moduleId: 'ct-mri-living-donor-liver', title: 'Living-Donor Liver Evaluation', shortTitle: 'Living-donor liver',
  modality: 'CT/MRI/MRCP', bodySystem: 'Transplant', clinicalQuestion: 'Map liver parenchyma, volumetry, vascular and biliary anatomy, variants, surgical planes, and venous drainage.',
  techniqueDefault: 'Multiphase liver CT or MRI with angiographic and biliary mapping was performed as available.',
  badges: ['Implemented', 'Educational draft', 'Donor anatomy map'], insertTargets: ['findings', 'impression', 'incidentalFindings', 'recommendations'],
  safetyNote: 'Verify program protocol, segmentation and volumes, vascular and biliary variants, steatosis, lesions, surgical planes, and drainage. Suitability is not calculated.',
  contentMetadata: { sourceChapter: 'Chapter 30: Living-donor liver evaluation', sourceType: 'Private development reference', guidelineOrClassificationName: 'Donor-program imaging protocol', guidelineVersion: 'Program-specific requirements require validation', lastReviewedDate: '2026-07-27', reviewStatus: 'needs_clinical_review', clinicalValidationRequired: true },
  defaultValues: { ...baseDefaults, liverMorphology: '', liverLesion: '', liverLesionDetails: '', steatosis: '', steatosisDetails: '', totalLiverVolumeMl: '', proposedGraft: '', graftVolumeMl: '', remnantVolumeMl: '', userVolumeRatios: '', arterialAnatomy: '', arterialVariants: '', portalAnatomy: '', portalVariants: '', hepaticVenousAnatomy: '', venousVariants: '', biliaryAnatomy: '', biliaryVariants: '', surgicalPlanes: '', venousDrainage: '', userSuitabilitySynthesis: '' },
  sections: [
    { id: 'context', title: 'Clinical context', defaultOpen: true, fields: context }, { id: 'quality', title: 'Protocol and quality', defaultOpen: true, fields: qualityFields },
    { id: 'volumes', title: 'Parenchyma and volumetry', defaultOpen: true, fields: [a('liverMorphology', 'Liver morphology'), s('liverLesion', 'Focal liver lesion', status), { ...a('liverLesionDetails', 'Lesion details'), visibleWhen: { field: 'liverLesion', equals: ['present', 'indeterminate'] } }, s('steatosis', 'Steatosis', status), { ...a('steatosisDetails', 'Steatosis details'), visibleWhen: { field: 'steatosis', equals: ['present', 'indeterminate'] } }, n('totalLiverVolumeMl', 'Total liver volume', 'mL'), t('proposedGraft', 'Proposed graft'), n('graftVolumeMl', 'Graft volume', 'mL'), n('remnantVolumeMl', 'Remnant volume', 'mL'), a('userVolumeRatios', 'User-entered volume ratios')] },
    { id: 'anatomy', title: 'Vascular and biliary anatomy', defaultOpen: true, fields: [a('arterialAnatomy', 'Arterial anatomy'), a('arterialVariants', 'Arterial variants'), a('portalAnatomy', 'Portal anatomy'), a('portalVariants', 'Portal variants'), a('hepaticVenousAnatomy', 'Hepatic venous anatomy'), a('venousVariants', 'Venous variants'), a('biliaryAnatomy', 'Biliary anatomy'), a('biliaryVariants', 'Biliary variants'), a('surgicalPlanes', 'Surgical planes'), a('venousDrainage', 'Segmental venous drainage')] },
    { id: 'synthesis', title: 'Synthesis and overrides', defaultOpen: true, fields: [a('userSuitabilitySynthesis', 'User-entered program synthesis'), ...overrides] },
  ],
  keyNegatives: [], incidentalOptions: [], quickFills: [{ id: 'donor-map', label: 'Start donor map', description: 'Diagnostic donor evaluation.', intent: 'normal', values: { examQuality: 'diagnostic', liverLesion: 'absent', steatosis: 'absent' } }],
};
