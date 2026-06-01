export type PageKey =
  | 'dashboard'
  | 'modules'
  | 'calculators'
  | 'incidental'
  | 'builder'
  | 'referral'
  | 'why'
  | 'gallery'
  | 'drafts'
  | 'safety';

export type ModuleType =
  | 'ctpa'
  | 'nodule'
  | 'stroke'
  | 'appendicitis'
  | 'bowelObstruction'
  | 'renalColic'
  | 'ruqUltrasound'
  | 'dvtUltrasound';

export type DraftType = ModuleType | 'builder' | 'referral' | 'calculator' | 'incidental' | 'rads';

export type DraftCategory =
  | 'Radiology report'
  | 'Calculator sentence'
  | 'RADS/classification preview sentence'
  | 'Incidental finding sentence'
  | 'Imaging requisition'
  | 'Mixed report builder draft';

export type InsertTarget =
  | 'indication'
  | 'technique'
  | 'findings'
  | 'impression'
  | 'incidentalFindings'
  | 'recommendations'
  | 'internalNotes';

export interface ReportSections {
  indication: string;
  technique: string;
  findings: string;
  impression: string;
  incidentalFindings?: string;
  recommendations?: string;
}

export interface ReportBuilderState extends ReportSections {
  patientLabel: string;
  exam: string;
  incidentalFindings: string;
  recommendations: string;
  internalNotes: string;
}

export interface SavedDraft {
  id: string;
  title: string;
  moduleType: DraftType;
  category?: DraftCategory;
  dateTime: string;
  reportText: string;
  impression: string;
  structuredData?: unknown;
}

export type PePresence = 'yes' | 'no' | 'indeterminate';
export type Laterality = 'right' | 'left' | 'bilateral';
export type ProximalLevel = 'main pulmonary artery' | 'lobar' | 'segmental' | 'subsegmental';
export type ClotBurden = 'low' | 'moderate' | 'high';
export type YesNo = 'yes' | 'no';
export type PleuralEffusion = 'none' | 'small' | 'moderate' | 'large';

export interface CtpaFormState {
  clinicalIndication: string;
  examType: 'CT pulmonary angiogram';
  pePresent: PePresence;
  laterality: Laterality;
  proximalLevel: ProximalLevel;
  clotBurden: ClotBurden;
  saddleEmbolus: YesNo;
  rvDiameterMm: string;
  lvDiameterMm: string;
  pulmonaryInfarct: YesNo;
  pleuralEffusion: PleuralEffusion;
  alternativeDiagnosis: string;
  incidentalFindings: string;
}

export type NoduleType = 'solid' | 'subsolid ground-glass' | 'part-solid';
export type NoduleCount = 'solitary' | 'multiple';
export type Morphology = 'spiculated' | 'irregular' | 'smooth' | 'calcified benign pattern';
export type PatientRisk = 'low risk' | 'high risk';
export type Stability = 'new' | 'stable' | 'increased' | 'decreased' | 'unknown';

export interface NoduleFormState {
  patientAge: string;
  knownMalignancy: YesNo;
  immunocompromised: YesNo;
  noduleType: NoduleType;
  numberOfNodules: NoduleCount;
  sizeMm: string;
  location: string;
  morphology: Morphology;
  patientRisk: PatientRisk;
  priorImagingAvailable: YesNo;
  stability: Stability;
  additionalFindings: string;
}

export type StrokeSide = 'left' | 'right' | 'bilateral' | 'none';
export type TernaryUnknown = 'yes' | 'no' | 'unknown';
export type MassEffect = 'none' | 'mild' | 'moderate' | 'severe';

export type AspectsRegion =
  | 'Caudate'
  | 'Lentiform'
  | 'Internal capsule'
  | 'Insula'
  | 'M1'
  | 'M2'
  | 'M3'
  | 'M4'
  | 'M5'
  | 'M6';

export interface StrokeFormState {
  clinicalIndication: string;
  side: StrokeSide;
  hemorrhagePresent: YesNo;
  largeVesselOcclusionSuspected: TernaryUnknown;
  earlyIschemicChangePresent: YesNo;
  aspectsRegions: AspectsRegion[];
  massEffect: MassEffect;
  midlineShiftMm: string;
  chronicFindings: string;
  additionalFindings: string;
}

export interface CalculatorSentence {
  id: string;
  label: string;
  text: string;
}

export type ModuleStatus = 'implemented' | 'placeholder';
export type Modality = 'X-ray' | 'Ultrasound' | 'CT' | 'MRI' | 'Mammography' | 'Nuclear Medicine' | 'Interventional Radiology';
export type BodySystem =
  | 'Neuro'
  | 'Chest'
  | 'Abdomen/Pelvis'
  | 'MSK'
  | 'Vascular'
  | 'GU'
  | 'Breast'
  | 'Pediatrics'
  | 'Oncology';

export interface ReportingModuleDefinition {
  id: string;
  title: string;
  modality: Modality;
  bodySystem: BodySystem;
  status: ModuleStatus;
  description: string;
  checklistPreview: string[];
  clinicalScenario?: string;
  keyFindings?: string[];
  keyNegatives?: string[];
  complicationsRedFlags?: string[];
  associatedCalculators?: string[];
  associatedIncidentalFindings?: string[];
  sampleImpression?: string;
  sourceNames?: string[];
  sourceLinks?: string[];
  safetyNote?: string;
  implementedModuleType?: ModuleType;
}

export type CalculatorStatus = 'implemented' | 'partial' | 'placeholder';
export type CalculatorInputKind = 'text' | 'number' | 'select' | 'checkbox-group' | 'lesion-tracker';

export interface CalculatorFieldDefinition {
  id: string;
  label: string;
  type: CalculatorInputKind;
  placeholder?: string;
  options?: ReferralOption[];
}

export interface CalculatorResult {
  summary: string;
  sentence: string;
  warning?: string;
}

export interface CalculatorDefinition {
  id: string;
  name: string;
  modality: Modality | 'Multimodality';
  bodySystem: BodySystem | 'Multisystem';
  status: CalculatorStatus;
  description: string;
  fields: CalculatorFieldDefinition[];
  defaultValues?: CalculatorValueMap;
  compute?: (values: CalculatorValueMap) => CalculatorResult;
  applicabilityWarning?: string;
  contentStatus?: ContentStatus;
}

export type CalculatorValueMap = Record<string, string | string[]>;

export type ReferralRequestType = string;

export type PrimaryCareMode = 'quick' | 'detailed';
export type RequisitionOutputStyle = 'ultra' | 'standard' | 'detailed';

export type ReferralFieldType = 'text' | 'textarea' | 'select' | 'checkbox';

export interface ReferralOption {
  value: string;
  label: string;
}

export interface ReferralFieldDefinition {
  id: string;
  label: string;
  type: ReferralFieldType;
  placeholder?: string;
  options?: ReferralOption[];
  important?: boolean;
  defaultValue?: string;
}

export interface ReferralTemplate {
  id: ReferralRequestType;
  title: string;
  category?: BodySystem;
  modality: string;
  description: string;
  fields: ReferralFieldDefinition[];
  requiredFields: string[];
  defaultQuestion?: string;
}

export interface ReferralFormState {
  requestType: ReferralRequestType;
  values: Record<string, string | boolean>;
  generatedText: string;
  outputStyle?: RequisitionOutputStyle;
  tone?: 'direct' | 'polite';
}

export type ContentStatus =
  | 'Draft content'
  | 'Needs radiology review'
  | 'Clinically reviewed'
  | 'Radiologist reviewed'
  | 'Validated against source'
  | 'Local protocol adapted';

export interface SourceMetadata {
  sourceNames: string[];
  sourceLinks: string[];
  safetyNote: string;
}

export interface PrimaryCareFieldDefinition extends ReferralFieldDefinition {
  conciseLabel?: string;
}

export interface PrimaryCareFieldSection {
  id: string;
  title: string;
  fields: PrimaryCareFieldDefinition[];
}

export interface OneClickNegative {
  label: string;
  values: Record<string, string | boolean>;
}

export interface PrimaryCareContentTemplate {
  id: string;
  title: string;
  bodySystem: BodySystem;
  modality: string;
  commonInPrimaryCare: boolean;
  description: string;
  quickFields: PrimaryCareFieldDefinition[];
  detailedFieldSections: PrimaryCareFieldSection[];
  essentialFields: string[];
  oneClickNegatives: OneClickNegative[];
  whyItMatters: string[];
  suggestedClinicalQuestions: string[];
  defaultQuestion: string;
  sourceNames: string[];
  sourceLinks: string[];
  safetyNote: string;
}

export type RadsStatus = 'implemented' | 'partial' | 'planned';

export interface RadsSystemDefinition {
  id: string;
  name: string;
  fullName: string;
  modality: string;
  bodySystem: string;
  status: RadsStatus;
  purpose: string;
  appliesTo: string[];
  doesNotApplyTo: string[];
  keyInputs: string[];
  keyImagingFeatures: string[];
  categoryConcepts: string[];
  reportElements: string[];
  reportReadySentenceTemplate: string;
  recommendationPlaceholder: string;
  safetyWarning: string;
  sourceNames: string[];
  sourceLinks: string[];
  relatedReportingModules: string[];
  relatedIncidentalFindings: string[];
}

export interface IncidentalFindingDefinition {
  id: string;
  name: string;
  organSystem: string;
  commonModalities: string[];
  purpose: string;
  appliesTo: string[];
  keyInputs: PrimaryCareFieldDefinition[];
  redFlagsOrHighRiskFeatures: string[];
  simplifiedOutputLogic: string;
  reportReadySentenceTemplates: string[];
  recommendationPlaceholder: string;
  safetyWarning: string;
  sourceNames: string[];
  sourceLinks: string[];
}
