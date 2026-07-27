import type { ReferralOption } from '../../radrep/types';
import type { ReportingWorkflowSchema, WorkflowField, WorkflowSection, WorkflowValues } from '../reportingWorkflowSchemas';

const state: ReferralOption[] = [
  { value: '', label: 'Select…' },
  { value: 'absent', label: 'Absent' },
  { value: 'present', label: 'Present' },
  { value: 'indeterminate', label: 'Indeterminate' },
  { value: 'not assessed', label: 'Not assessed' },
];
const quality: ReferralOption[] = [
  { value: '', label: 'Select…' },
  { value: 'diagnostic', label: 'Diagnostic' },
  { value: 'limited', label: 'Limited' },
  { value: 'nondiagnostic', label: 'Nondiagnostic' },
];
const t = (id: string, label: string): WorkflowField => ({ id, label, type: 'text' });
const a = (id: string, label: string): WorkflowField => ({ id, label, type: 'textarea', wide: true });
const n = (id: string, label: string, suffix?: string): WorkflowField => ({ id, label, type: 'number', suffix });
const s = (id: string, label: string): WorkflowField => ({ id, label, type: 'select', options: state });
const choose = (id: string, label: string, options: ReferralOption[]): WorkflowField => ({ id, label, type: 'select', options });
const shown = (field: WorkflowField, when: string, equals: string | string[]): WorkflowField => ({ ...field, visibleWhen: { field: when, equals } });

const base: WorkflowValues = {
  clinicalIndication: '', clinicalContext: '', comparisonStudy: '', comparisonDate: '',
  modalityProtocol: '', examQuality: '', technicalLimitations: '', diagnosticConfidence: '',
  userSynthesis: '', additionalFindings: '', incidentalFindings: '', limitationsUncertainty: '',
  findingsOverride: '', impressionOverride: '',
};
const context: WorkflowField[] = [
  a('clinicalIndication', 'Clinical indication'), a('clinicalContext', 'Relevant clinical context'),
  t('comparisonStudy', 'Comparison examination'), { id: 'comparisonDate', label: 'Comparison date', type: 'date' },
];
const technique: WorkflowField[] = [
  t('modalityProtocol', 'Modality and protocol'),
  { id: 'examQuality', label: 'Examination quality', type: 'select', options: quality },
  a('technicalLimitations', 'Technical limitations'),
];
const close: WorkflowField[] = [
  t('diagnosticConfidence', 'Diagnostic confidence'), a('userSynthesis', 'User-entered diagnostic synthesis'),
  a('additionalFindings', 'Additional findings'), a('incidentalFindings', 'Incidental findings'),
  a('limitationsUncertainty', 'Additional uncertainty'), a('findingsOverride', 'Findings free-text override'),
  a('impressionOverride', 'Impression free-text override'),
];
const meta = (chapter: string, guideline: string) => ({
  sourceChapter: chapter,
  sourceType: 'Private development reference',
  guidelineOrClassificationName: guideline,
  guidelineVersion: 'Current terminology and boundaries require primary-source verification',
  lastReviewedDate: '2026-07-27',
  reviewStatus: 'needs_clinical_review' as const,
  clinicalValidationRequired: true,
});
const shell = (
  schema: Pick<ReportingWorkflowSchema, 'moduleType' | 'moduleId' | 'title' | 'shortTitle' | 'modality' | 'clinicalQuestion' | 'techniqueDefault' | 'safetyNote' | 'contentMetadata'>,
  defaults: WorkflowValues,
  sections: WorkflowSection[],
  quickFills: ReportingWorkflowSchema['quickFills'] = [],
): ReportingWorkflowSchema => ({
  ...schema,
  bodySystem: 'Cardiovascular',
  badges: ['Implemented', 'Educational draft', 'User-controlled classification'],
  insertTargets: ['findings', 'impression', 'incidentalFindings', 'recommendations'],
  defaultValues: { ...base, ...defaults },
  sections: [
    { id: 'context', title: 'Clinical context', defaultOpen: true, fields: context },
    { id: 'quality', title: 'Protocol and technical quality', defaultOpen: true, fields: technique },
    ...sections,
  ],
  keyNegatives: [],
  incidentalOptions: [],
  quickFills,
});

export const coronaryCtaWorkflowSchema = shell({
  moduleType: 'coronaryCta', moduleId: 'ct-coronary-angiography', title: 'Coronary CT Angiography', shortTitle: 'Coronary CTA',
  modality: 'CTA', clinicalQuestion: 'Assess coronary origins, dominance, plaque and stenosis by segment, stents or grafts, high-risk plaque features, and cardiac/extracardiac findings.',
  techniqueDefault: 'ECG-gated coronary CTA was performed after intravenous contrast with multiplanar and curved-planar reformats.',
  safetyNote: 'Verify heart rate, acquisition quality, every coronary segment, stenosis, plaque, stents/grafts, and extracardiac findings. CAD-RADS and management are not calculated.',
  contentMetadata: meta('Chapter 47: Coronary CT angiography', 'CAD-RADS'),
}, {
  heartRateBpm: '', coronaryOrigins: '', dominance: '', segmentAssessment: '', nondiagnosticSegments: '',
  plaqueBurden: '', maximalStenosis: '', highRiskPlaque: '', stents: '', grafts: '', cardiacFindings: '',
  userCadRads: '',
}, [
  { id: 'coronaries', title: 'Coronary anatomy and disease', defaultOpen: true, fields: [
    n('heartRateBpm', 'Acquisition heart rate', 'bpm'), a('coronaryOrigins', 'Coronary origins and course'),
    t('dominance', 'Coronary dominance'), a('segmentAssessment', 'Segment-by-segment plaque and stenosis'),
    a('nondiagnosticSegments', 'Nondiagnostic segments'), a('plaqueBurden', 'Overall plaque burden'),
    a('maximalStenosis', 'Most important stenosis'), s('highRiskPlaque', 'High-risk plaque features'),
    s('stents', 'Coronary stents'), s('grafts', 'Bypass grafts'), a('cardiacFindings', 'Other cardiac findings'),
    t('userCadRads', 'User-entered CAD-RADS category'), ...close,
  ] },
], [{ id: 'no-coronary-disease', label: 'No coronary plaque or stenosis', description: 'Diagnostic study without entered coronary disease.', intent: 'normal', values: { examQuality: 'diagnostic', highRiskPlaque: 'absent', stents: 'absent', grafts: 'absent', maximalStenosis: 'No coronary stenosis.' } }]);

export const taviPlanningCtaWorkflowSchema = shell({
  moduleType: 'taviPlanningCta', moduleId: 'ct-tavi-planning', title: 'TAVI Planning CTA', shortTitle: 'TAVI planning CTA',
  modality: 'CTA', clinicalQuestion: 'Document aortic valve, annulus, coronary heights, root/aorta, fluoroscopic angle, and access-vessel anatomy for procedural planning.',
  techniqueDefault: 'ECG-gated cardiac and aortoiliofemoral CTA was performed for transcatheter valve planning.',
  safetyNote: 'Verify measurement phase and plane, annulus, coronary heights, root, access vessels, and program-specific conventions. Device eligibility is not calculated.',
  contentMetadata: meta('Chapter 48: TAVI planning CTA', 'Program-specific TAVI planning standards'),
}, {
  valveMorphology: '', valveCalcium: '', annularAreaMm2: '', annularPerimeterMm: '', annularMinMm: '', annularMaxMm: '',
  leftCoronaryHeightMm: '', rightCoronaryHeightMm: '', sinusDimensions: '', sinotubularJunction: '', ascendingAorta: '',
  lvot: '', fluoroscopicAngle: '', iliofemoralDiameters: '', accessCalcification: '', accessTortuosity: '',
  accessSummary: '', alternativeAccess: '', cardiacFindings: '',
}, [
  { id: 'valve-root', title: 'Valve, annulus, and root', defaultOpen: true, fields: [
    a('valveMorphology', 'Valve morphology'), a('valveCalcium', 'Valve calcification'),
    n('annularAreaMm2', 'Annular area', 'mm²'), n('annularPerimeterMm', 'Annular perimeter', 'mm'),
    n('annularMinMm', 'Minimum annular diameter', 'mm'), n('annularMaxMm', 'Maximum annular diameter', 'mm'),
    n('leftCoronaryHeightMm', 'Left coronary height', 'mm'), n('rightCoronaryHeightMm', 'Right coronary height', 'mm'),
    a('sinusDimensions', 'Sinus of Valsalva dimensions'), a('sinotubularJunction', 'Sinotubular junction'),
    a('ascendingAorta', 'Ascending aorta'), a('lvot', 'LVOT'), t('fluoroscopicAngle', 'Suggested fluoroscopic angle'),
  ] },
  { id: 'access', title: 'Access assessment', defaultOpen: true, fields: [
    a('iliofemoralDiameters', 'Iliofemoral minimum diameters'), a('accessCalcification', 'Access-vessel calcification'),
    a('accessTortuosity', 'Access-vessel tortuosity'), a('accessSummary', 'User-entered access summary'),
    a('alternativeAccess', 'Alternative access anatomy'), a('cardiacFindings', 'Additional cardiac findings'), ...close,
  ] },
]);

export const cardiomyopathyMriWorkflowSchema = shell({
  moduleType: 'cardiomyopathyMri', moduleId: 'mri-cardiomyopathy', title: 'Cardiac MRI for Adult Cardiomyopathy', shortTitle: 'Cardiomyopathy MRI',
  modality: 'MRI', clinicalQuestion: 'Document chamber volumes and function, wall motion and thickness, tissue characterization, thrombus, valves, pericardium, and phenotype synthesis.',
  techniqueDefault: 'Multiparametric cardiac MRI was performed with cine imaging and tissue characterization as entered.',
  safetyNote: 'Verify indexing, sequence quality, ventricular measurements, regional function, mapping reference ranges, edema, perfusion, LGE, and thrombus. Diagnostic criteria are not calculated.',
  contentMetadata: meta('Chapter 49: Cardiac MRI for adult cardiomyopathy', 'Current SCMR reporting standards'),
}, {
  lvEdvi: '', lvEsvi: '', lvEf: '', lvMassIndex: '', rvEdvi: '', rvEsvi: '', rvEf: '',
  wallMotion: '', wallThickness: '', atria: '', valves: '', pericardium: '', edema: '', perfusion: '',
  lateGadoliniumEnhancement: '', mapping: '', thrombus: '', noncompactionFeatures: '', arrhythmogenicFeatures: '',
}, [
  { id: 'function', title: 'Chambers and function', defaultOpen: true, fields: [
    n('lvEdvi', 'LV EDV index', 'mL/m²'), n('lvEsvi', 'LV ESV index', 'mL/m²'), n('lvEf', 'LV ejection fraction', '%'),
    n('lvMassIndex', 'LV mass index', 'g/m²'), n('rvEdvi', 'RV EDV index', 'mL/m²'),
    n('rvEsvi', 'RV ESV index', 'mL/m²'), n('rvEf', 'RV ejection fraction', '%'),
    a('wallMotion', 'Regional wall motion'), a('wallThickness', 'Wall thickness'), a('atria', 'Atria'),
  ] },
  { id: 'tissue', title: 'Tissue characterization and synthesis', defaultOpen: true, fields: [
    a('valves', 'Valves'), a('pericardium', 'Pericardium'), a('edema', 'Edema-sensitive imaging'),
    a('perfusion', 'Perfusion'), a('lateGadoliniumEnhancement', 'Late gadolinium enhancement'),
    a('mapping', 'T1/T2/ECV mapping with local reference ranges'), s('thrombus', 'Intracardiac thrombus'),
    a('noncompactionFeatures', 'Noncompaction features'), a('arrhythmogenicFeatures', 'Arrhythmogenic phenotype features'), ...close,
  ] },
]);

export const aaaPostprocedureWorkflowSchema = shell({
  moduleType: 'aaaPostprocedure', moduleId: 'ct-aaa-postprocedure', title: 'AAA Postprocedural Surveillance', shortTitle: 'AAA surveillance',
  modality: 'CTA', clinicalQuestion: 'Assess aneurysm sac, repair integrity, graft position and patency, endoleak, branches, and complications.',
  techniqueDefault: 'Aortic CTA was performed with postcontrast phases as entered for aneurysm-repair surveillance.',
  safetyNote: 'Verify repair type, orthogonal sac measurements and dated comparison, graft/limb patency, endoleak source, branches, rupture signs, and access complications. Surveillance advice is not generated.',
  contentMetadata: meta('Chapter 50: AAA postprocedural surveillance', 'Endoleak classification'),
}, {
  repairType: '', repairDate: '', sacApMm: '', sacTrMm: '', sacVolumeMl: '', sacChange: '',
  graftPosition: '', migration: '', kinking: '', graftPatency: '', limbOcclusion: '',
  endoleakStatus: '', userEndoleakType: '', endoleakSource: '', branchPatency: '',
  ruptureInflammation: '', accessComplications: '',
}, [
  { id: 'repair-sac', title: 'Repair and aneurysm sac', defaultOpen: true, fields: [
    t('repairType', 'Repair type'), { id: 'repairDate', label: 'Repair date', type: 'date' },
    n('sacApMm', 'Sac AP diameter', 'mm'), n('sacTrMm', 'Sac transverse diameter', 'mm'),
    n('sacVolumeMl', 'Sac volume', 'mL'), a('sacChange', 'Sac change from dated comparison'),
  ] },
  { id: 'graft', title: 'Graft and complications', defaultOpen: true, fields: [
    a('graftPosition', 'Graft position'), s('migration', 'Migration'), s('kinking', 'Kinking'),
    s('graftPatency', 'Graft patency abnormality'), s('limbOcclusion', 'Limb occlusion'),
    s('endoleakStatus', 'Endoleak'), shown(t('userEndoleakType', 'User-entered endoleak type'), 'endoleakStatus', ['present', 'indeterminate']),
    shown(a('endoleakSource', 'Endoleak source and extent'), 'endoleakStatus', ['present', 'indeterminate']),
    a('branchPatency', 'Branch-vessel patency'), s('ruptureInflammation', 'Rupture or inflammatory complication'),
    a('accessComplications', 'Access-site complications'), ...close,
  ] },
]);

export const aaaPreprocedureWorkflowSchema = shell({
  moduleType: 'aaaPreprocedure', moduleId: 'ct-aaa-preprocedure', title: 'AAA Preprocedural Evaluation', shortTitle: 'AAA planning CTA',
  modality: 'CTA', clinicalQuestion: 'Document aneurysm morphology, orthogonal size, proximal neck, branch anatomy, landing zones, and access vessels for planning.',
  techniqueDefault: 'Arterial-phase aortoiliofemoral CTA was performed with multiplanar centerline reformats as entered.',
  safetyNote: 'Verify centerline/orthogonal technique, neck and landing-zone measurements, branch anatomy, access vessels, and rupture signs. Device or procedural eligibility is not calculated.',
  contentMetadata: meta('Chapter 51: AAA preprocedural evaluation', 'Device/program-specific aortic planning conventions'),
}, {
  aneurysmLocation: '', aneurysmMorphology: '', maxDiameterMm: '', aneurysmLengthMm: '', neckLengthMm: '',
  neckDiameterMm: '', neckAngle: '', neckThrombus: '', neckCalcification: '', branchAnatomy: '', iliacLandingZones: '',
  accessDiameters: '', accessTortuosity: '', accessCalcification: '', ruptureSigns: '', planningSummary: '',
}, [
  { id: 'aneurysm', title: 'Aneurysm and proximal neck', defaultOpen: true, fields: [
    t('aneurysmLocation', 'Aneurysm location'), t('aneurysmMorphology', 'Morphology'),
    n('maxDiameterMm', 'Maximum orthogonal diameter', 'mm'), n('aneurysmLengthMm', 'Aneurysm length', 'mm'),
    n('neckLengthMm', 'Proximal neck length', 'mm'), n('neckDiameterMm', 'Proximal neck diameter', 'mm'),
    t('neckAngle', 'Neck angulation'), a('neckThrombus', 'Neck thrombus'), a('neckCalcification', 'Neck calcification'),
  ] },
  { id: 'landing-access', title: 'Branches, landing zones, and access', defaultOpen: true, fields: [
    a('branchAnatomy', 'Renal/visceral branch anatomy and variants'), a('iliacLandingZones', 'Iliac anatomy and landing zones'),
    a('accessDiameters', 'Access-vessel minimum diameters'), a('accessTortuosity', 'Access-vessel tortuosity'),
    a('accessCalcification', 'Access-vessel calcification'), s('ruptureSigns', 'Rupture/impending rupture signs'),
    a('planningSummary', 'User-entered planning summary'), ...close,
  ] },
]);

export const calciumScoreWorkflowSchema = shell({
  moduleType: 'calciumScore', moduleId: 'ct-coronary-calcium-score', title: 'Coronary Artery Calcium Scoring', shortTitle: 'Calcium score',
  modality: 'CT', clinicalQuestion: 'Document acquisition quality, vessel-specific and total Agatston scores, involved-vessel count, optional validated percentile, and extracoronary findings.',
  techniqueDefault: 'Noncontrast ECG-gated cardiac CT was performed for coronary calcium scoring.',
  safetyNote: 'Verify acquisition quality, every vessel score, total score, demographic percentile reference, and extracardiac coverage. CAC-DRS and management are not calculated.',
  contentMetadata: meta('Chapter 52: Coronary artery calcium scoring', 'Agatston score; CAC-DRS if used'),
}, {
  lmScore: '', ladScore: '', lcxScore: '', rcaScore: '', otherScore: '', totalAgatston: '',
  involvedVesselCount: '', percentile: '', percentileReference: '', userCacCategory: '',
  extracoronaryCalcification: '', cardiacFindings: '',
}, [
  { id: 'scores', title: 'Coronary calcium', defaultOpen: true, fields: [
    n('lmScore', 'Left main Agatston score'), n('ladScore', 'LAD Agatston score'),
    n('lcxScore', 'LCx Agatston score'), n('rcaScore', 'RCA Agatston score'),
    n('otherScore', 'Other coronary score'), n('totalAgatston', 'Total Agatston score'),
    n('involvedVesselCount', 'Number of involved vessels'), n('percentile', 'Validated percentile', '%'),
    t('percentileReference', 'Percentile reference population'), t('userCacCategory', 'User-entered CAC category'),
    a('extracoronaryCalcification', 'Extracoronary calcification'), a('cardiacFindings', 'Other cardiac findings'), ...close,
  ] },
]);

export const ffrCtWorkflowSchema = shell({
  moduleType: 'ffrCt', moduleId: 'ct-fractional-flow-reserve', title: 'Fractional Flow Reserve CT', shortTitle: 'FFR-CT',
  modality: 'CT', clinicalQuestion: 'Document source-CTA adequacy, vessel and lesion, plaque/stenosis, analyzability, standardized-location and lowest FFR-CT values, and pressure-drop pattern.',
  techniqueDefault: 'FFR-CT analysis was derived from the source coronary CTA dataset as entered.',
  safetyNote: 'Verify source CTA adequacy, lesion location, analysis location, analyzability, all entered values, and pressure-drop pattern. Ischemia thresholds and treatment advice are not calculated.',
  contentMetadata: meta('Chapter 53: Fractional flow reserve CT', 'FFR-CT interpretation conventions'),
}, {
  sourceCtaAdequacy: '', vessel: '', lesionLocation: '', plaqueStenosis: '', analyzability: '',
  standardLocation: '', standardValue: '', lowestLocation: '', lowestValue: '', pressureDropPattern: '',
  focalDrop: '', distalTapering: '',
}, [
  { id: 'analysis', title: 'Lesion and FFR-CT analysis', defaultOpen: true, fields: [
    choose('sourceCtaAdequacy', 'Source CTA adequacy', quality), t('vessel', 'Vessel'),
    t('lesionLocation', 'Lesion location'), a('plaqueStenosis', 'Plaque and anatomic stenosis'),
    choose('analyzability', 'Segment analyzability', quality),
    t('standardLocation', 'Standardized measurement location'), n('standardValue', 'FFR-CT value'),
    t('lowestLocation', 'Location of lowest value'), n('lowestValue', 'Lowest FFR-CT value'),
    a('pressureDropPattern', 'Pressure-drop pattern'), s('focalDrop', 'Focal pressure drop'),
    s('distalTapering', 'Gradual distal tapering'), ...close,
  ] },
]);
