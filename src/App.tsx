import { useEffect, useState } from 'react';
import {
  CopyButton,
  FormSection,
  ModuleCard,
  OutputPanel,
  SafetyBanner,
  SavedDraftList,
  Sidebar,
} from './components/radrep/RadRepComponents';
import { ReportingWorkflowPage } from './components/reporting/ReportingWorkflowPage';
import { IncidentalFindingsPanel as WorkflowIncidentalFindingsPanel } from './components/reporting/IncidentalFindingsPanel';
import { BranchingModuleNavigator } from './components/navigation/BranchingModuleNavigator';
import { InteractiveAnatomyNavigator } from './components/dashboard/InteractiveAnatomyNavigator';
import { GuidedDemo } from './components/demo/GuidedDemo';
import { SampleOutputsGallery } from './components/gallery/SampleOutputsGallery';
import { ChangeLogPanel } from './components/changelog/ChangeLogPanel';
import { RadRepPilotLogo } from './components/branding/RadRepPilotLogo';
import { RadIcon, type RadIconName } from './components/icons/RadIcon';
import { HelperDrawer } from './components/helpers/HelperDrawer';
import { ImagingGuidePanel } from './components/appropriateness/ImagingGuidePanel';
import { WhyThisMatters } from './components/portfolio/WhyThisMatters';
import { CompletenessChecklist } from './components/quality/CompletenessChecklist';
import {
  CalculatorRegistry,
  IncidentalFindingsPanel as StandaloneIncidentalFindingsPanel,
  PrimaryCareRequestBuilder,
} from './components/radrep/RegistryComponents';
import {
  buildFullReport,
  builderToReport,
  calculateAspects,
  calculateRvLvRatio,
  defaultReport,
  generateAspectsSentence,
  generateCtpaReport,
  generateFleischnerSentence,
  generateFleischnerRecommendation,
  generateNoduleReport,
  generateRvLvSentence,
  generateStrokeReport,
  getFleischnerApplicabilityWarning,
} from './radrep/reportGenerators';
import { reportingWorkflowSchemas, schemaDrivenModuleTypes, type WorkflowIncidentalOption } from './data/reportingWorkflowSchemas';
import { generateReportingWorkflowReport } from './utils/reportGenerators';
import { scoreReportCompleteness } from './utils/qualityMetrics';
import {
  generateReferralText,
  getReferralTemplate,
} from './radrep/referralLogic';
import type {
  AspectsRegion,
  CalculatorSentence,
  CtpaFormState,
  DraftType,
  InsertTarget,
  ModuleType,
  NoduleFormState,
  PageKey,
  ReferralFieldDefinition,
  ReferralFormState,
  ReportBuilderState,
  ReportSections,
  SavedDraft,
  StrokeFormState,
} from './radrep/types';

const DRAFT_STORAGE_KEY = 'radreppilot:drafts';

type AppProps = {
  embedded?: boolean;
  initialPage?: PageKey;
};

const moduleLabels: Record<ModuleType, string> = {
  ctpa: 'CTPA Pulmonary Embolism',
  nodule: 'Pulmonary Nodule / Fleischner',
  stroke: 'CT Head Stroke / ASPECTS',
  chestXray: 'Chest X-ray: Infection / Dyspnea',
  mskXrayFracture: 'MSK X-ray: Acute Fracture',
  appendicitis: 'CT Abdomen/Pelvis: Appendicitis',
  bowelObstruction: 'CT Abdomen/Pelvis: Bowel Obstruction',
  renalColic: 'CT KUB: Renal Colic',
  ruqUltrasound: 'RUQ Ultrasound: Biliary Colic / Cholecystitis',
  dvtUltrasound: 'Lower-Limb Venous Ultrasound: DVT',
};

const draftLabels: Record<DraftType, string> = {
  ...moduleLabels,
  builder: 'Report Builder',
  referral: 'Imaging requisition',
  calculator: 'Calculator Sentence',
  incidental: 'Incidental Finding Sentence',
  rads: 'RADS / Classification Preview',
};

const aspectsRegions: AspectsRegion[] = [
  'Caudate',
  'Lentiform',
  'Internal capsule',
  'Insula',
  'M1',
  'M2',
  'M3',
  'M4',
  'M5',
  'M6',
];

const defaultCtpa: CtpaFormState = {
  clinicalIndication: '',
  examType: 'CT pulmonary angiogram',
  pePresent: 'no',
  laterality: 'right',
  proximalLevel: 'segmental',
  clotBurden: 'low',
  saddleEmbolus: 'no',
  rvDiameterMm: '',
  lvDiameterMm: '',
  pulmonaryInfarct: 'no',
  pleuralEffusion: 'none',
  alternativeDiagnosis: '',
  incidentalFindings: '',
  additionalFindings: '',
  limitationsUncertainty: '',
};

const defaultNodule: NoduleFormState = {
  patientAge: '',
  knownMalignancy: 'no',
  immunocompromised: 'no',
  noduleType: 'solid',
  numberOfNodules: 'solitary',
  sizeMm: '',
  location: '',
  morphology: 'smooth',
  patientRisk: 'low risk',
  priorImagingAvailable: 'no',
  stability: 'unknown',
  additionalFindings: '',
  limitationsUncertainty: '',
};

const defaultStroke: StrokeFormState = {
  clinicalIndication: '',
  side: 'right',
  hemorrhagePresent: 'no',
  largeVesselOcclusionSuspected: 'unknown',
  earlyIschemicChangePresent: 'no',
  aspectsRegions: [],
  massEffect: 'none',
  midlineShiftMm: '',
  chronicFindings: '',
  additionalFindings: '',
  limitationsUncertainty: '',
};

const defaultBuilder: ReportBuilderState = {
  patientLabel: '',
  exam: '',
  indication: '',
  technique: '',
  findings: '',
  impression: '',
  incidentalFindings: '',
  recommendations: '',
  internalNotes: '',
};

const defaultReferral: ReferralFormState = {
  requestType: 'ct-head-headache',
  values: {},
  generatedText: '',
  outputStyle: 'standard',
  tone: 'polite',
};

const ctChestIncidentalOptions: WorkflowIncidentalOption[] = [
  {
    label: 'Pulmonary nodule',
    sentence:
      'Incidental pulmonary nodule. Follow-up depends on nodule type, size, patient risk, comparison, and guideline applicability.',
  },
  {
    label: 'Thyroid nodule',
    sentence:
      'Incidental thyroid nodule. Consider dedicated thyroid ultrasound depending on size, patient age, and suspicious imaging features.',
  },
  {
    label: 'Adrenal nodule',
    sentence:
      'Incidental adrenal nodule. Consider comparison with prior imaging or adrenal protocol CT/MRI if not previously characterized.',
  },
  {
    label: 'Aortic aneurysm',
    sentence:
      'Incidental aortic aneurysm. Recommend comparison with prior imaging and follow-up according to size, growth, symptoms, and local vascular protocol.',
  },
  {
    label: 'Coronary calcification',
    sentence:
      'Coronary artery calcification is present. Consider cardiovascular risk factor correlation as clinically appropriate.',
  },
  {
    label: 'Bone lesion',
    sentence:
      'Incidental bone lesion. Consider comparison with prior imaging or dedicated characterization if aggressive features, pain, or malignancy history are present.',
  },
];

const ctHeadIncidentalOptions: WorkflowIncidentalOption[] = [
  {
    label: 'Thyroid nodule',
    sentence:
      'Incidental thyroid nodule. Consider dedicated thyroid ultrasound depending on size, patient age, and suspicious imaging features.',
  },
  {
    label: 'Sinus disease',
    sentence:
      'Incidental paranasal sinus disease. Follow-up is usually clinical unless aggressive features or persistent symptoms warrant directed evaluation.',
  },
  {
    label: 'Bone lesion',
    sentence:
      'Incidental bone lesion. Consider comparison with prior imaging or dedicated characterization if aggressive features, pain, or malignancy history are present.',
  },
  {
    label: 'Incidental intracranial cyst/mass',
    sentence:
      'Incidental intracranial cystic/masslike finding. Consider MRI brain for characterization if not previously evaluated, depending on appearance and clinical context.',
  },
];

function loadDrafts(): SavedDraft[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(DRAFT_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function appendSentence(existing: string, sentence: string): string {
  if (!sentence.trim()) return existing;
  return existing.trim() ? `${existing.trim()}\n${sentence.trim()}` : sentence.trim();
}

function createDraftTitle(moduleType: DraftType, report: ReportSections, fallback?: string): string {
  if (fallback?.trim()) return fallback.trim();
  const firstLine = report.impression.split('\n').find(Boolean);
  if (firstLine) return firstLine.slice(0, 82);
  return moduleType === 'builder' ? 'Report builder draft' : `${draftLabels[moduleType]} draft`;
}

function isReportSections(value: unknown): value is ReportSections {
  if (!value || typeof value !== 'object') return false;
  return 'indication' in value && 'technique' in value && 'findings' in value && 'impression' in value;
}

function isBuilderState(value: unknown): value is ReportBuilderState {
  return isReportSections(value) && 'patientLabel' in value && 'exam' in value && 'internalNotes' in value;
}

function isReferralFormState(value: unknown): value is ReferralFormState {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<ReferralFormState>;
  return typeof candidate.requestType === 'string' && Boolean(candidate.values) && typeof candidate.values === 'object';
}

function getStructuredObject(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

function App({ embedded = false, initialPage = 'dashboard' }: AppProps) {
  const [activePage, setActivePage] = useState<PageKey>(initialPage);
  const [demoOpen, setDemoOpen] = useState(false);
  const [builderSourceModule, setBuilderSourceModule] = useState<ModuleType>('ctpa');
  const [drafts, setDrafts] = useState<SavedDraft[]>(() => loadDrafts());
  const [toastMessage, setToastMessage] = useState('');
  const [pendingHelperId, setPendingHelperId] = useState('');
  const [helperDrawerId, setHelperDrawerId] = useState('');
  const [dashboardWorkflowId, setDashboardWorkflowId] = useState('');

  const [ctpaForm, setCtpaForm] = useState<CtpaFormState>(defaultCtpa);
  const [noduleForm, setNoduleForm] = useState<NoduleFormState>(defaultNodule);
  const [strokeForm, setStrokeForm] = useState<StrokeFormState>(defaultStroke);

  const [ctpaReport, setCtpaReport] = useState<ReportSections>(() => defaultReport());
  const [noduleReport, setNoduleReport] = useState<ReportSections>(() => defaultReport());
  const [strokeReport, setStrokeReport] = useState<ReportSections>(() => defaultReport());
  const [builder, setBuilder] = useState<ReportBuilderState>(defaultBuilder);
  const [referralForm, setReferralForm] = useState<ReferralFormState>(defaultReferral);

  const [calculatorSentences, setCalculatorSentences] = useState<CalculatorSentence[]>([]);
  const [selectedSentenceId, setSelectedSentenceId] = useState('');

  useEffect(() => {
    window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(drafts));
  }, [drafts]);

  useEffect(() => {
    if (!toastMessage) return;
    const timeout = window.setTimeout(() => setToastMessage(''), 1800);
    return () => window.clearTimeout(timeout);
  }, [toastMessage]);

  useEffect(() => {
    const listener = (event: Event) => {
      const detail = (event as CustomEvent<string>).detail;
      if (detail) setToastMessage(detail);
    };
    window.addEventListener('radreppilot-toast', listener);
    return () => window.removeEventListener('radreppilot-toast', listener);
  }, []);

  const generateReportForModule = (moduleType: ModuleType): ReportSections => {
    if (moduleType in reportingWorkflowSchemas) {
      const schema = reportingWorkflowSchemas[moduleType as keyof typeof reportingWorkflowSchemas];
      return generateReportingWorkflowReport(moduleType, schema.defaultValues);
    }

    if (moduleType === 'ctpa') {
      const report = generateCtpaReport(ctpaForm);
      setCtpaReport(report);
      return report;
    }

    if (moduleType === 'nodule') {
      const report = generateNoduleReport(noduleForm);
      setNoduleReport(report);
      return report;
    }

    if (moduleType === 'stroke') {
      const report = generateStrokeReport(strokeForm);
      setStrokeReport(report);
      return report;
    }

    return defaultReport();
  };

  const saveDraft = (
    moduleType: DraftType,
    report: ReportSections,
    structuredData?: unknown,
    title?: string,
  ) => {
    const reportText = buildFullReport(report);
    if (!reportText.trim()) return;

    const draft: SavedDraft = {
      id: crypto.randomUUID(),
      title: createDraftTitle(moduleType, report, title),
      moduleType,
      category:
        moduleType === 'builder'
          ? 'Mixed report builder draft'
          : moduleType === 'incidental'
            ? 'Incidental finding sentence'
            : moduleType === 'rads'
              ? 'RADS/classification preview sentence'
          : moduleType === 'calculator'
            ? 'Calculator sentence'
            : moduleType === 'referral'
              ? 'Imaging requisition'
              : 'Radiology report',
      dateTime: new Date().toISOString(),
      reportText,
      impression: report.impression,
      structuredData,
    };
    setDrafts((existing) => [draft, ...existing]);
    setToastMessage('Saved draft');
    setActivePage('drafts');
  };

  const saveTextDraft = (title: string, moduleType: DraftType, text: string, structuredData?: unknown) => {
    if (!text.trim()) return;
    const draft: SavedDraft = {
      id: crypto.randomUUID(),
      title,
      moduleType,
      category:
        moduleType === 'incidental'
          ? 'Incidental finding sentence'
          : moduleType === 'rads'
            ? 'RADS/classification preview sentence'
            : moduleType === 'calculator'
          ? 'Calculator sentence'
          : moduleType === 'referral'
            ? 'Imaging requisition'
            : moduleType === 'builder'
              ? 'Mixed report builder draft'
              : 'Radiology report',
      dateTime: new Date().toISOString(),
      reportText: text,
      impression: text,
      structuredData,
    };
    setDrafts((existing) => [draft, ...existing]);
    setToastMessage('Saved draft');
    setActivePage('drafts');
  };

  const insertTextIntoBuilder = (text: string, label: string, target: InsertTarget = 'recommendations') => {
    if (!text.trim()) return;
    setBuilder((existing) => ({
      ...existing,
      exam: existing.exam || label,
      [target]: appendSentence(existing[target], text),
    }));
    const targetLabels: Record<InsertTarget, string> = {
      indication: 'Indication',
      technique: 'Technique',
      findings: 'Findings',
      impression: 'Impression',
      incidentalFindings: 'Incidental Follow-up',
      recommendations: 'Recommendations',
      internalNotes: 'Internal Notes',
    };
    setToastMessage(`Inserted into ${targetLabels[target]}`);
    setActivePage('builder');
  };

  const openHelper = (helperId: string) => {
    setPendingHelperId(helperId);
    setActivePage('calculators');
  };

  const openHelperDrawer = (helperId: string) => {
    setHelperDrawerId(helperId);
  };

  const saveReferralDraft = () => {
    const template = getReferralTemplate(referralForm.requestType);
    const text = generateReferralText(referralForm);
    if (!text.trim()) return;

    const draft: SavedDraft = {
      id: crypto.randomUUID(),
      title: template.title,
      moduleType: 'referral',
      category: 'Imaging requisition',
      dateTime: new Date().toISOString(),
      reportText: text,
      impression: text,
      structuredData: { referralForm, referralText: text },
    };

    setDrafts((existing) => [draft, ...existing]);
    setToastMessage('Saved draft');
    setActivePage('drafts');
  };

  const sendReportToBuilder = (moduleType: ModuleType, report: ReportSections) => {
    setBuilder((existing) => ({
      ...existing,
      exam: moduleLabels[moduleType],
      indication: report.indication,
      technique: report.technique,
      findings: report.findings,
      impression: report.impression,
      incidentalFindings: report.incidentalFindings ?? '',
      recommendations: report.recommendations ?? '',
    }));
    setBuilderSourceModule(moduleType);
    setActivePage('builder');
  };

  const addCalculatorSentence = (label: string, text: string) => {
    if (!text.trim()) return;
    const sentence: CalculatorSentence = {
      id: `${label}-${Date.now()}`,
      label,
      text,
    };
    setCalculatorSentences((existing) => [sentence, ...existing].slice(0, 12));
    setSelectedSentenceId(sentence.id);
  };

  const insertSelectedSentence = () => {
    const sentence = calculatorSentences.find((item) => item.id === selectedSentenceId) ?? calculatorSentences[0];
    if (!sentence) return;
    setBuilder((existing) => ({
      ...existing,
      recommendations: appendSentence(existing.recommendations, sentence.text),
    }));
  };

  const openDraft = (draft: SavedDraft) => {
    const structured = getStructuredObject(draft.structuredData);
    const builderState = structured.builderState;
    const referralState = structured.referralForm;
    const report = structured.report;

    if (draft.moduleType === 'referral' && isReferralFormState(referralState)) {
      setReferralForm(referralState);
      setActivePage('referral');
      return;
    }

    if (isBuilderState(builderState)) {
      setBuilder(builderState);
    } else if (isReportSections(report)) {
      setBuilder({
        ...defaultBuilder,
        patientLabel: draft.title,
        exam: draft.moduleType === 'builder' ? '' : draftLabels[draft.moduleType],
        ...report,
        recommendations: report.recommendations ?? '',
      });
    } else {
      setBuilder({
        ...defaultBuilder,
        patientLabel: draft.title,
        exam: draft.moduleType === 'builder' ? '' : draftLabels[draft.moduleType],
        findings: draft.reportText,
        impression: draft.impression,
      });
    }

    setActivePage('builder');
  };

  const openWorkflowFromStory = (workflowId: string) => {
    setDemoOpen(false);
    setDashboardWorkflowId(workflowId);
    setActivePage('modules');
  };

  const renderDashboard = () => (
    <div className="page-stack">
      <section className="hero-panel">
        <div className="hero-brand-row">
          <RadRepPilotLogo variant="full" size={56} />
          <div>
            <span className="eyebrow">Built around the referrer-radiologist handoff</span>
            <h1>A clearer handoff into and out of radiology.</h1>
          </div>
        </div>
        <p>
          RadRepPilot is a clinical workflow prototype: it helps turn vague imaging requests into radiology-useful
          questions, then helps organize user-entered findings into clear draft report language, calculators, and
          follow-up recommendations.
        </p>
        <div className="inline-note hero-safety">
          User-entered findings only. No image interpretation. Final wording requires clinician/radiologist verification.
        </div>
        <div className="hero-actions">
          <button className="primary-button demo-button" onClick={() => setDemoOpen(true)} type="button">
            Run 3-minute demo
          </button>
          <button
            className="secondary-button"
            onClick={() => {
              setActivePage('modules');
            }}
            type="button"
          >
            Start reporting
          </button>
          <button className="secondary-button" onClick={() => setActivePage('calculators')} type="button">
            Open calculators
          </button>
          <button className="secondary-button" onClick={() => setActivePage('referral')} type="button">
            Build imaging requisition
          </button>
          <button className="secondary-button" onClick={() => setActivePage('gallery')} type="button">
            View sample outputs
          </button>
          <button className="ghost-button" onClick={() => setActivePage('why')} type="button">
            Why this matters
          </button>
        </div>
      </section>

      <section className="module-grid">
        <ModuleCard
          title="From vague request to useful question"
          meta="Requisitions in"
          iconName="primaryCare"
          description="A busy GP can turn “abdo pain, please assess” into a concise question with age, context, duration, red flags, and what radiology needs to answer."
          onOpen={() => setActivePage('referral')}
          ctaLabel="Build a requisition"
        />
        <ModuleCard
          title="Structured reporting without pretending to diagnose"
          meta="Reports out"
          iconName="xray"
          description="Reporting workflows prompt the radiologist to address key findings, key negatives, complications, and report-ready wording while keeping everything editable."
          onOpen={() => {
            setActivePage('modules');
          }}
          ctaLabel="Start reporting"
        />
        <ModuleCard
          title="Follow-up language GPs can act on"
          meta="Incidental findings"
          iconName="followUp"
          description="Incidental findings often create ambiguity after the report is read. RadRepPilot keeps follow-up wording inside the reporting workflow so the next step is clearer."
          onOpen={() => setActivePage('modules')}
          ctaLabel="See workflows"
        />
        <ModuleCard
          title="Show, don’t explain"
          meta="3-minute review"
          iconName="normal"
          description="A guided demo and sample outputs show the full idea quickly: requisition quality, reporting prompts, calculator language, and follow-up safety."
          onOpen={() => setActivePage('gallery')}
          ctaLabel="View examples"
        />
      </section>

      <InteractiveAnatomyNavigator
        onOpenReporting={(workflowId) => {
          setDashboardWorkflowId(workflowId ?? '');
          setActivePage('modules');
        }}
        onOpenHelper={openHelper}
        onOpenIncidental={(helperId) => {
          if (helperId) {
            openHelperDrawer(helperId);
            return;
          }
          setActivePage('modules');
        }}
      />

      <section className="safety-note-card">
        <strong>Safety note</strong>
        <p>
          This is a portfolio prototype, not a clinical device. It organizes user-entered information and draft language only;
          guideline logic and follow-up wording must be verified against radiology judgment and local protocol.
        </p>
      </section>
    </div>
  );

  const renderWhy = () => (
    <div className="page-stack">
      <PageHeader
        eyebrow="Portfolio / clinical insight"
        title="Why RadRepPilot Matters"
        description="A concise explanation of the workflow problem, the clinical communication insight, and the safety positioning behind the prototype."
      />
      <WhyThisMatters />
    </div>
  );

  const renderGallery = () => (
    <div className="page-stack">
      <PageHeader
        eyebrow="Example Reports & Requisitions"
        title="Sample output gallery"
        description="Review prototype outputs without manually filling forms. These examples are draft language only and require verification."
      />
      <SampleOutputsGallery onOpenWorkflow={openWorkflowFromStory} />
    </div>
  );

  const renderCtpaModule = () => {
    const ratio = calculateRvLvRatio(ctpaForm.rvDiameterMm, ctpaForm.lvDiameterMm);

    return (
      <div className="module-workspace">
        <div className="input-panel">
          <section className="workflow-quickfill-panel">
            <div className="section-heading">
              <span className="eyebrow">Quick start</span>
              <h3>Start from a common CTPA pattern</h3>
            </div>
            <div className="quickfill-grid">
              {[
                { label: 'No PE', values: { pePresent: 'no', rvDiameterMm: '36', lvDiameterMm: '40', alternativeDiagnosis: '' } },
                { label: 'Segmental PE without strain', values: { pePresent: 'yes', proximalLevel: 'segmental', laterality: 'right', rvDiameterMm: '36', lvDiameterMm: '42', clotBurden: 'low' } },
                { label: 'Central PE with right heart strain', values: { pePresent: 'yes', proximalLevel: 'main pulmonary artery', laterality: 'bilateral', rvDiameterMm: '48', lvDiameterMm: '40', clotBurden: 'high' } },
                { label: 'Limited study', values: { pePresent: 'indeterminate', alternativeDiagnosis: 'Study quality limits evaluation for small peripheral emboli.' } },
              ].map((preset) => (
                <button
                  className="quickfill-card"
                  onClick={() => {
                    const next = { ...ctpaForm, ...preset.values } as CtpaFormState;
                    setCtpaForm(next);
                    setCtpaReport(generateCtpaReport(next));
                  }}
                  type="button"
                  key={preset.label}
                >
                  <strong>{preset.label}</strong>
                  <span>Populate editable findings</span>
                </button>
              ))}
            </div>
          </section>

          <FormSection title="Core CTPA Findings" description="User-entered PE findings and exam details.">
            <SelectField
              label="Exam type"
              value={ctpaForm.examType}
              onChange={() => undefined}
              options={['CT pulmonary angiogram']}
            />
            <SelectField
              label="PE present?"
              value={ctpaForm.pePresent}
              onChange={(value) => setCtpaForm({ ...ctpaForm, pePresent: value as CtpaFormState['pePresent'] })}
              options={['no', 'yes', 'indeterminate']}
            />
          </FormSection>

          {ctpaForm.pePresent === 'yes' ? (
            <FormSection title="Pulmonary Embolism Findings">
              <SelectField
                label="Laterality"
                value={ctpaForm.laterality}
                onChange={(value) => setCtpaForm({ ...ctpaForm, laterality: value as CtpaFormState['laterality'] })}
                options={['right', 'left', 'bilateral']}
              />
              <SelectField
                label="Most proximal level"
                value={ctpaForm.proximalLevel}
                onChange={(value) => setCtpaForm({ ...ctpaForm, proximalLevel: value as CtpaFormState['proximalLevel'] })}
                options={['main pulmonary artery', 'lobar', 'segmental', 'subsegmental']}
              />
              <SelectField
                label="Clot burden"
                value={ctpaForm.clotBurden}
                onChange={(value) => setCtpaForm({ ...ctpaForm, clotBurden: value as CtpaFormState['clotBurden'] })}
                options={['low', 'moderate', 'high']}
              />
              <SelectField
                label="Saddle embolus"
                value={ctpaForm.saddleEmbolus}
                onChange={(value) => setCtpaForm({ ...ctpaForm, saddleEmbolus: value as CtpaFormState['saddleEmbolus'] })}
                options={['no', 'yes']}
              />
            </FormSection>
          ) : null}

          <FormSection title="RV/LV Ratio">
            <NumberField
              label="RV diameter (mm)"
              value={ctpaForm.rvDiameterMm}
              onChange={(value) => setCtpaForm({ ...ctpaForm, rvDiameterMm: value })}
            />
            <NumberField
              label="LV diameter (mm)"
              value={ctpaForm.lvDiameterMm}
              onChange={(value) => setCtpaForm({ ...ctpaForm, lvDiameterMm: value })}
            />
            <div className="metric-card">
              <span>Calculated RV/LV</span>
              <strong>{ratio === null ? '--' : ratio.toFixed(2)}</strong>
              <small>{generateRvLvSentence(ctpaForm.rvDiameterMm, ctpaForm.lvDiameterMm)}</small>
            </div>
            <button className="secondary-button" onClick={() => openHelperDrawer('rv-lv-ratio')} type="button">
              Open RV/LV helper
            </button>
          </FormSection>

          <FormSection title="Other Findings">
            <SelectField
              label="Pulmonary infarct"
              value={ctpaForm.pulmonaryInfarct}
              onChange={(value) => setCtpaForm({ ...ctpaForm, pulmonaryInfarct: value as CtpaFormState['pulmonaryInfarct'] })}
              options={['no', 'yes']}
            />
            <SelectField
              label="Pleural effusion"
              value={ctpaForm.pleuralEffusion}
              onChange={(value) => setCtpaForm({ ...ctpaForm, pleuralEffusion: value as CtpaFormState['pleuralEffusion'] })}
              options={['none', 'small', 'moderate', 'large']}
            />
            <TextAreaField
              label="Alternative diagnosis"
              value={ctpaForm.alternativeDiagnosis}
              onChange={(value) => setCtpaForm({ ...ctpaForm, alternativeDiagnosis: value })}
              placeholder="e.g. Right lower lobe pneumonia"
            />
            <TextAreaField
              label="Additional findings / radiologist comment"
              value={ctpaForm.additionalFindings}
              onChange={(value) => setCtpaForm({ ...ctpaForm, additionalFindings: value })}
              placeholder="Add relevant findings not captured above, nuance, comparison, uncertainty, or differential considerations."
            />
            <TextAreaField
              label="Limitations / uncertainty"
              value={ctpaForm.limitationsUncertainty}
              onChange={(value) => setCtpaForm({ ...ctpaForm, limitationsUncertainty: value })}
              placeholder="e.g. motion artifact, incomplete visualization, limited contrast timing, technically limited study."
            />
          </FormSection>

          <WorkflowIncidentalFindingsPanel
            options={ctChestIncidentalOptions}
            value={ctpaForm.incidentalFindings}
            onChange={(value) => setCtpaForm({ ...ctpaForm, incidentalFindings: value })}
            onInsert={(target, text) => insertTextIntoBuilder(text, 'CTPA incidental finding', target)}
            onOpenHelper={openHelperDrawer}
          />

          <CompletenessChecklist score={scoreReportCompleteness('ctpa', { ...ctpaForm }, ctpaReport)} />

          <details className="workflow-card workflow-accordion">
            <summary>
              <span>Optional clinical context</span>
              <small>Clinical context is optional and not included unless expanded.</small>
            </summary>
            <div className="workflow-form-grid">
              <TextAreaField
                label="Clinical indication"
                value={ctpaForm.clinicalIndication}
                onChange={(value) => setCtpaForm({ ...ctpaForm, clinicalIndication: value })}
                placeholder="e.g. Pleuritic chest pain, elevated D-dimer, concern for PE"
              />
            </div>
          </details>

          <div className="button-row sticky-actions">
            <button className="primary-button" onClick={() => setCtpaReport(generateCtpaReport(ctpaForm))} type="button">
              Generate CTPA report
            </button>
            <button
              className="secondary-button"
              onClick={() => addCalculatorSentence('RV/LV ratio', generateRvLvSentence(ctpaForm.rvDiameterMm, ctpaForm.lvDiameterMm))}
              type="button"
            >
              Save RV/LV sentence
            </button>
          </div>
        </div>

        <OutputPanel
          title="CTPA draft report"
          report={ctpaReport}
          onChange={setCtpaReport}
          onSendToBuilder={() => sendReportToBuilder('ctpa', ctpaReport)}
          onSaveDraft={() => saveDraft('ctpa', ctpaReport, { form: ctpaForm, report: ctpaReport })}
        />
      </div>
    );
  };

  const renderNoduleModule = () => {
    const warning = getFleischnerApplicabilityWarning(noduleForm);
    const recommendation = generateFleischnerRecommendation(noduleForm);

    return (
      <div className="module-workspace">
        <div className="input-panel">
          <section className="workflow-quickfill-panel">
            <div className="section-heading">
              <span className="eyebrow">Quick start</span>
              <h3>Start from a common nodule pattern</h3>
            </div>
            <div className="quickfill-grid">
              {[
                { label: 'Benign calcified nodule', values: { morphology: 'calcified benign pattern', noduleType: 'solid', sizeMm: '4', patientRisk: 'low risk' } },
                { label: 'Solid nodule <6 mm', values: { noduleType: 'solid', numberOfNodules: 'solitary', sizeMm: '4', morphology: 'smooth' } },
                { label: 'Solid nodule 6-8 mm', values: { noduleType: 'solid', numberOfNodules: 'solitary', sizeMm: '7', morphology: 'smooth' } },
                { label: 'Solid nodule >8 mm', values: { noduleType: 'solid', numberOfNodules: 'solitary', sizeMm: '10', morphology: 'irregular' } },
                { label: 'Ground-glass nodule', values: { noduleType: 'subsolid ground-glass', sizeMm: '8', morphology: 'smooth' } },
                { label: 'Part-solid nodule', values: { noduleType: 'part-solid', sizeMm: '8', morphology: 'irregular' } },
              ].map((preset) => (
                <button
                  className="quickfill-card"
                  onClick={() => {
                    const next = { ...noduleForm, ...preset.values } as NoduleFormState;
                    setNoduleForm(next);
                    setNoduleReport(generateNoduleReport(next));
                  }}
                  type="button"
                  key={preset.label}
                >
                  <strong>{preset.label}</strong>
                  <span>Populate editable descriptors</span>
                </button>
              ))}
            </div>
          </section>

          <FormSection title="Patient / Guideline Applicability">
            <NumberField
              label="Patient age"
              value={noduleForm.patientAge}
              onChange={(value) => setNoduleForm({ ...noduleForm, patientAge: value })}
            />
            <SelectField
              label="Known malignancy?"
              value={noduleForm.knownMalignancy}
              onChange={(value) => setNoduleForm({ ...noduleForm, knownMalignancy: value as NoduleFormState['knownMalignancy'] })}
              options={['no', 'yes']}
            />
            <SelectField
              label="Immunocompromised?"
              value={noduleForm.immunocompromised}
              onChange={(value) => setNoduleForm({ ...noduleForm, immunocompromised: value as NoduleFormState['immunocompromised'] })}
              options={['no', 'yes']}
            />
            {warning ? <div className="warning-card">{warning}</div> : <div className="inline-note">Simplified prototype guidance assumes guideline applicability.</div>}
          </FormSection>

          <FormSection title="Nodule Findings">
            <SelectField
              label="Nodule type"
              value={noduleForm.noduleType}
              onChange={(value) => setNoduleForm({ ...noduleForm, noduleType: value as NoduleFormState['noduleType'] })}
              options={['solid', 'subsolid ground-glass', 'part-solid']}
            />
            <SelectField
              label="Number of nodules"
              value={noduleForm.numberOfNodules}
              onChange={(value) => setNoduleForm({ ...noduleForm, numberOfNodules: value as NoduleFormState['numberOfNodules'] })}
              options={['solitary', 'multiple']}
            />
            <NumberField
              label="Size (mm)"
              value={noduleForm.sizeMm}
              onChange={(value) => setNoduleForm({ ...noduleForm, sizeMm: value })}
            />
            <TextField
              label="Location / lobe"
              value={noduleForm.location}
              onChange={(value) => setNoduleForm({ ...noduleForm, location: value })}
              placeholder="e.g. right upper lobe"
            />
            <SelectField
              label="Suspicious morphology"
              value={noduleForm.morphology}
              onChange={(value) => setNoduleForm({ ...noduleForm, morphology: value as NoduleFormState['morphology'] })}
              options={['smooth', 'irregular', 'spiculated', 'calcified benign pattern']}
            />
            <SelectField
              label="Patient risk"
              value={noduleForm.patientRisk}
              onChange={(value) => setNoduleForm({ ...noduleForm, patientRisk: value as NoduleFormState['patientRisk'] })}
              options={['low risk', 'high risk']}
            />
            <SelectField
              label="Prior imaging available?"
              value={noduleForm.priorImagingAvailable}
              onChange={(value) =>
                setNoduleForm({ ...noduleForm, priorImagingAvailable: value as NoduleFormState['priorImagingAvailable'] })
              }
              options={['no', 'yes']}
            />
            <SelectField
              label="Stability compared with prior"
              value={noduleForm.stability}
              onChange={(value) => setNoduleForm({ ...noduleForm, stability: value as NoduleFormState['stability'] })}
              options={['unknown', 'new', 'stable', 'increased', 'decreased']}
            />
            <TextAreaField
              label="Additional findings / radiologist comment"
              value={noduleForm.additionalFindings}
              onChange={(value) => setNoduleForm({ ...noduleForm, additionalFindings: value })}
              placeholder="Add relevant findings not captured above, nuance, comparison, uncertainty, or differential considerations."
            />
            <TextAreaField
              label="Limitations / uncertainty"
              value={noduleForm.limitationsUncertainty}
              onChange={(value) => setNoduleForm({ ...noduleForm, limitationsUncertainty: value })}
              placeholder="e.g. motion artifact, incomplete visualization, limited contrast timing, technically limited study."
            />
          </FormSection>

          <section className="guidance-preview">
            <span>Simplified prototype recommendation</span>
            <p>{recommendation}</p>
            <div className="button-row">
              <button className="secondary-button" onClick={() => openHelperDrawer('fleischner')} type="button">
                Open Fleischner helper
              </button>
              <button className="secondary-button" onClick={() => openHelperDrawer('lungrads')} type="button">
                Open Lung-RADS helper
              </button>
            </div>
          </section>

          <WorkflowIncidentalFindingsPanel
            options={ctChestIncidentalOptions.filter((option) => option.label !== 'Pulmonary nodule')}
            value={noduleForm.additionalFindings}
            onChange={(value) => setNoduleForm({ ...noduleForm, additionalFindings: value })}
            onInsert={(target, text) => insertTextIntoBuilder(text, 'CT chest incidental finding', target)}
            onOpenHelper={openHelperDrawer}
          />

          <CompletenessChecklist score={scoreReportCompleteness('nodule', { ...noduleForm }, noduleReport)} />

          <div className="button-row sticky-actions">
            <button className="primary-button" onClick={() => setNoduleReport(generateNoduleReport(noduleForm))} type="button">
              Generate nodule report
            </button>
            <button
              className="secondary-button"
              onClick={() => addCalculatorSentence('Fleischner', generateFleischnerSentence(noduleForm))}
              type="button"
            >
              Save guideline sentence
            </button>
          </div>
        </div>

        <OutputPanel
          title="Pulmonary nodule draft report"
          report={noduleReport}
          onChange={setNoduleReport}
          onSendToBuilder={() => sendReportToBuilder('nodule', noduleReport)}
          onSaveDraft={() => saveDraft('nodule', noduleReport, { form: noduleForm, report: noduleReport })}
        />
      </div>
    );
  };

  const renderStrokeModule = () => {
    const aspectsScore = calculateAspects(strokeForm.aspectsRegions);

    return (
      <div className="module-workspace">
        <div className="input-panel">
          <section className="workflow-quickfill-panel">
            <div className="section-heading">
              <span className="eyebrow">Quick start</span>
              <h3>Start from a common CT head pattern</h3>
            </div>
            <div className="quickfill-grid">
              {[
                { label: 'No acute findings', values: { hemorrhagePresent: 'no', earlyIschemicChangePresent: 'no', aspectsRegions: [], massEffect: 'none', midlineShiftMm: '' } },
                { label: 'Early ischemic change with ASPECTS', values: { hemorrhagePresent: 'no', earlyIschemicChangePresent: 'yes', aspectsRegions: ['Insula', 'M2'], side: 'right' } },
                { label: 'Hemorrhage', values: { hemorrhagePresent: 'yes', earlyIschemicChangePresent: 'no', aspectsRegions: [], massEffect: 'mild' } },
                { label: 'Mass effect', values: { hemorrhagePresent: 'no', massEffect: 'moderate', midlineShiftMm: '4' } },
                { label: 'Chronic changes only', values: { hemorrhagePresent: 'no', earlyIschemicChangePresent: 'no', aspectsRegions: [], chronicFindings: 'Chronic microangiopathic change.' } },
              ].map((preset) => (
                <button
                  className="quickfill-card"
                  onClick={() => {
                    const next = { ...strokeForm, ...preset.values } as StrokeFormState;
                    setStrokeForm(next);
                    setStrokeReport(generateStrokeReport(next));
                  }}
                  type="button"
                  key={preset.label}
                >
                  <strong>{preset.label}</strong>
                  <span>Populate editable stroke fields</span>
                </button>
              ))}
            </div>
          </section>

          <FormSection title="Core CT Head Findings">
            <SelectField
              label="Side"
              value={strokeForm.side}
              onChange={(value) => setStrokeForm({ ...strokeForm, side: value as StrokeFormState['side'] })}
              options={['right', 'left', 'bilateral', 'none']}
            />
            <SelectField
              label="Hemorrhage present?"
              value={strokeForm.hemorrhagePresent}
              onChange={(value) => setStrokeForm({ ...strokeForm, hemorrhagePresent: value as StrokeFormState['hemorrhagePresent'] })}
              options={['no', 'yes']}
            />
            <SelectField
              label="Large vessel occlusion suspected?"
              value={strokeForm.largeVesselOcclusionSuspected}
              onChange={(value) =>
                setStrokeForm({
                  ...strokeForm,
                  largeVesselOcclusionSuspected: value as StrokeFormState['largeVesselOcclusionSuspected'],
                })
              }
              options={['unknown', 'no', 'yes']}
            />
            <SelectField
              label="Early ischemic change present?"
              value={strokeForm.earlyIschemicChangePresent}
              onChange={(value) =>
                setStrokeForm({ ...strokeForm, earlyIschemicChangePresent: value as StrokeFormState['earlyIschemicChangePresent'] })
              }
              options={['no', 'yes']}
            />
          </FormSection>

          <FormSection title="ASPECTS Regions" description="Start at 10 and subtract one point for each selected involved region.">
            <CheckboxGrid
              values={aspectsRegions}
              selected={strokeForm.aspectsRegions}
              onChange={(regions) => setStrokeForm({ ...strokeForm, aspectsRegions: regions })}
            />
            <div className="metric-card">
              <span>ASPECTS</span>
              <strong>{aspectsScore}</strong>
              <small>{generateAspectsSentence(aspectsScore, strokeForm.side, strokeForm.aspectsRegions)}</small>
            </div>
            <button className="secondary-button" onClick={() => openHelperDrawer('aspects')} type="button">
              Open ASPECTS helper
            </button>
          </FormSection>

          <FormSection title="Mass Effect / Additional Findings">
            <SelectField
              label="Mass effect"
              value={strokeForm.massEffect}
              onChange={(value) => setStrokeForm({ ...strokeForm, massEffect: value as StrokeFormState['massEffect'] })}
              options={['none', 'mild', 'moderate', 'severe']}
            />
            <NumberField
              label="Midline shift (mm)"
              value={strokeForm.midlineShiftMm}
              onChange={(value) => setStrokeForm({ ...strokeForm, midlineShiftMm: value })}
            />
            <TextAreaField
              label="Chronic findings"
              value={strokeForm.chronicFindings}
              onChange={(value) => setStrokeForm({ ...strokeForm, chronicFindings: value })}
            />
            <TextAreaField
              label="Additional findings / radiologist comment"
              value={strokeForm.additionalFindings}
              onChange={(value) => setStrokeForm({ ...strokeForm, additionalFindings: value })}
              placeholder="Add relevant findings not captured above, nuance, comparison, uncertainty, or differential considerations."
            />
            <TextAreaField
              label="Limitations / uncertainty"
              value={strokeForm.limitationsUncertainty}
              onChange={(value) => setStrokeForm({ ...strokeForm, limitationsUncertainty: value })}
              placeholder="e.g. motion artifact, incomplete visualization, limited contrast timing, technically limited study."
            />
          </FormSection>

          <WorkflowIncidentalFindingsPanel
            options={ctHeadIncidentalOptions}
            value={strokeForm.additionalFindings}
            onChange={(value) => setStrokeForm({ ...strokeForm, additionalFindings: value })}
            onInsert={(target, text) => insertTextIntoBuilder(text, 'CT head incidental finding', target)}
            onOpenHelper={openHelperDrawer}
          />

          <CompletenessChecklist score={scoreReportCompleteness('stroke', { ...strokeForm }, strokeReport)} />

          <details className="workflow-card workflow-accordion">
            <summary>
              <span>Optional clinical context</span>
              <small>Clinical context is optional and not included unless expanded.</small>
            </summary>
            <div className="workflow-form-grid">
              <TextAreaField
                label="Clinical indication"
                value={strokeForm.clinicalIndication}
                onChange={(value) => setStrokeForm({ ...strokeForm, clinicalIndication: value })}
                placeholder="e.g. Left-sided weakness, last known well 90 minutes ago"
              />
            </div>
          </details>

          <div className="button-row sticky-actions">
            <button className="primary-button" onClick={() => setStrokeReport(generateStrokeReport(strokeForm))} type="button">
              Generate stroke report
            </button>
            <button
              className="secondary-button"
              onClick={() =>
                addCalculatorSentence(
                  'ASPECTS',
                  generateAspectsSentence(calculateAspects(strokeForm.aspectsRegions), strokeForm.side, strokeForm.aspectsRegions),
                )
              }
              type="button"
            >
              Save ASPECTS sentence
            </button>
          </div>
        </div>

        <OutputPanel
          title="CT head stroke draft report"
          report={strokeReport}
          onChange={setStrokeReport}
          onSendToBuilder={() => sendReportToBuilder('stroke', strokeReport)}
          onSaveDraft={() => saveDraft('stroke', strokeReport, { form: strokeForm, report: strokeReport })}
        />
      </div>
    );
  };

  const renderModules = () => (
    <div className="page-stack">
      <PageHeader
        eyebrow="Radiology Reporting Modules"
        title="Structured Reporting Modules"
        description="Select a modality and body system to open a focused educational reporting workflow."
      />
      <BranchingModuleNavigator
        initialWorkflowId={dashboardWorkflowId}
        onInitialWorkflowOpened={() => setDashboardWorkflowId('')}
        onOpenCalculators={() => setActivePage('calculators')}
        renderWorkflow={(moduleType) => {
          if (moduleType === 'ctpa') return renderCtpaModule();
          if (moduleType === 'nodule') return renderNoduleModule();
          if (moduleType === 'stroke') return renderStrokeModule();
          if (schemaDrivenModuleTypes.includes(moduleType as keyof typeof reportingWorkflowSchemas)) {
            return (
              <ReportingWorkflowPage
                schema={reportingWorkflowSchemas[moduleType as keyof typeof reportingWorkflowSchemas]}
                onInsertText={insertTextIntoBuilder}
                onSaveDraft={(report, structuredData, title) => saveDraft(moduleType, report, structuredData, title)}
                onOpenHelper={openHelperDrawer}
              />
            );
          }
          return null;
        }}
      />
    </div>
  );

  const renderWorkspaceOverview = () => (
    <div className="page-stack">
      <PageHeader
        eyebrow="Workspace overview"
        title="Choose a workspace tool"
        description="Use the side navigation to open structured reporting workflows, focused calculators, requisition support, examples, or local drafts."
      />
      <section className="module-grid">
        <ModuleCard
          title="Structured reporting modules"
          meta="Reporting"
          iconName="xray"
          description="Open a modality and body-system pathway, then draft editable report language from user-entered findings."
          onOpen={() => setActivePage('modules')}
          ctaLabel="Open workflows"
        />
        <ModuleCard
          title="Calculators and helpers"
          meta="Support"
          iconName="calculator"
          description="Use focused educational helpers and insert report-ready sentences into the report builder."
          onOpen={() => setActivePage('calculators')}
          ctaLabel="Open calculators"
        />
        <ModuleCard
          title="Imaging Guide"
          meta="Appropriateness"
          iconName="helper"
          description="Search seed appropriateness-style topics, compare imaging options, and draft requisition-ready wording."
          onOpen={() => setActivePage('imagingGuide')}
          ctaLabel="Open guide"
        />
        <ModuleCard
          title="Imaging requisitions"
          meta="Requisitions"
          iconName="primaryCare"
          description="Practise writing concise imaging requests that communicate the clinical question clearly."
          onOpen={() => setActivePage('referral')}
          ctaLabel="Build requisition"
        />
      </section>
    </div>
  );

  const renderReferral = () => (
    <div className="page-stack">
      <PageHeader
        eyebrow="Imaging requisitions"
        title="Imaging requisitions"
        description="Generate concise, radiology-useful requisition text in under 60 seconds. This does not determine imaging appropriateness."
      />
      <PrimaryCareRequestBuilder initialForm={referralForm} onInsertText={insertTextIntoBuilder} onSaveText={saveTextDraft} />
    </div>
  );

  const renderCalculators = () => (
    <div className="page-stack">
      <PageHeader
        eyebrow="Guidelines & Calculators"
        title="Reusable calculator and classification registry"
        description="Implemented helpers generate editable report-ready sentences that can be copied, saved, or inserted directly into the report builder."
      />
      <CalculatorRegistry
        initialHelperId={pendingHelperId}
        onHelperOpened={() => setPendingHelperId('')}
        onInsertSentence={(sentence, label, target) => {
          addCalculatorSentence(label, sentence);
          insertTextIntoBuilder(sentence, label, target ?? 'recommendations');
        }}
        onSaveText={saveTextDraft}
      />
    </div>
  );

  const renderImagingGuide = () => (
    <div className="page-stack">
      <PageHeader
        eyebrow="Imaging Guide"
        title="Appropriateness-style imaging guide"
        description="A seed framework for concise educational summaries of imaging options, missing clinical information, requisition language, and reporting pearls."
      />
      <ImagingGuidePanel />
    </div>
  );

  const renderIncidental = () => (
    <div className="page-stack">
      <PageHeader
        eyebrow="Incidental Findings & Follow-up"
        title="Context-aware follow-up language"
        description="Generate report-ready incidental finding language from user-entered descriptors, with cautious follow-up modality and interval suggestions when reasonable."
      />
      <StandaloneIncidentalFindingsPanel
        onInsertSentence={(sentence, label, target) => insertTextIntoBuilder(sentence, label, target ?? 'incidentalFindings')}
        onSaveText={saveTextDraft}
      />
    </div>
  );

  const renderBuilder = () => {
    const report = builderToReport(builder);
    const fullReport = buildFullReport(report);

    return (
      <div className="page-stack">
        <PageHeader
          eyebrow="Report Builder"
          title="Assemble report-ready text"
          description="Pull in module output and calculator sentences, then copy the full report or impression only."
        />

        <section className="builder-toolbar">
          <SelectField
            label="Selected module"
            value={builderSourceModule}
            onChange={(value) => setBuilderSourceModule(value as ModuleType)}
            options={Object.keys(moduleLabels)}
            labels={moduleLabels}
          />
          <button
            className="primary-button"
            onClick={() => {
              const generatedReport = generateReportForModule(builderSourceModule);
              sendReportToBuilder(builderSourceModule, generatedReport);
            }}
            type="button"
          >
            Generate from selected module
          </button>
          <SelectField
            label="Calculator sentence"
            value={selectedSentenceId}
            onChange={setSelectedSentenceId}
            options={calculatorSentences.map((sentence) => sentence.id)}
            labels={Object.fromEntries(calculatorSentences.map((sentence) => [sentence.id, sentence.label]))}
            placeholder="No saved sentences"
          />
          <button className="secondary-button" onClick={insertSelectedSentence} type="button">
            Insert calculator sentence
          </button>
        </section>

        <section className="builder-grid">
          <div className="builder-form">
            <FormSection title="Report Fields">
              <TextField
                label="Patient/context label, optional"
                value={builder.patientLabel}
                onChange={(value) => setBuilder({ ...builder, patientLabel: value })}
                placeholder="No PHI; e.g. teaching case 01"
              />
              <TextField label="Exam" value={builder.exam} onChange={(value) => setBuilder({ ...builder, exam: value })} />
              <TextAreaField label="Indication" value={builder.indication} onChange={(value) => setBuilder({ ...builder, indication: value })} />
              <TextAreaField label="Technique" value={builder.technique} onChange={(value) => setBuilder({ ...builder, technique: value })} />
              <TextAreaField label="Findings" value={builder.findings} onChange={(value) => setBuilder({ ...builder, findings: value })} large />
              <TextAreaField
                label="Impression"
                value={builder.impression}
                onChange={(value) => setBuilder({ ...builder, impression: value })}
                large
              />
              <TextAreaField
                label="Incidental findings / follow-up"
                value={builder.incidentalFindings}
                onChange={(value) => setBuilder({ ...builder, incidentalFindings: value })}
              />
              <TextAreaField
                label="Recommendations"
                value={builder.recommendations}
                onChange={(value) => setBuilder({ ...builder, recommendations: value })}
              />
              <TextAreaField
                label="Internal notes, not included in final copied report"
                value={builder.internalNotes}
                onChange={(value) => setBuilder({ ...builder, internalNotes: value })}
              />
            </FormSection>

            <div className="button-row sticky-actions">
              <CopyButton text={fullReport} label="Copy full report" className="primary-button" />
              <CopyButton text={builder.impression} label="Copy impression only" />
              <button
                className="secondary-button"
                onClick={() => saveDraft('builder', report, { builderState: builder }, builder.patientLabel || builder.exam)}
                type="button"
              >
                Save draft
              </button>
              <button className="ghost-button" onClick={() => setBuilder(defaultBuilder)} type="button">
                Clear
              </button>
            </div>
          </div>

          <aside className="report-preview">
            <div className="output-heading">
              <div>
                <span>Final copied text</span>
                <h3>{builder.patientLabel || 'Draft report'}</h3>
              </div>
            </div>
            <pre>{fullReport || 'Generated report text will appear here.'}</pre>
          </aside>
        </section>
      </div>
    );
  };

  const renderDrafts = () => (
    <div className="page-stack">
      <PageHeader
        eyebrow="Saved Drafts"
        title="Local browser drafts"
        description="Drafts are stored only in this browser localStorage. Do not use this prototype for patient-identifying information."
      />
      <SavedDraftList
        drafts={drafts}
        onOpen={openDraft}
        onDelete={(id) => setDrafts((existing) => existing.filter((draft) => draft.id !== id))}
      />
    </div>
  );

  const renderSafety = () => (
    <div className="page-stack">
      <PageHeader
        eyebrow="About / Safety"
        title="What RadRepPilot is, and what it is not"
        description="A workflow prototype for structured reporting support, guideline reminders, and report-ready language."
      />
      <section className="info-grid">
        <article>
          <h3>What it does</h3>
          <p>
            RadRepPilot helps radiologists, residents, trainees, and supervised clinicians organize user-entered findings into
            structured report sections, integrate simplified guideline/calculator outputs, and draft impression language.
          </p>
        </article>
        <article>
          <h3>What it does not do</h3>
          <p>
            It is not a medical device, not a diagnostic image interpretation model, and not a substitute for radiologist review.
            It does not analyze images or independently diagnose disease.
          </p>
        </article>
        <article>
          <h3>User responsibility</h3>
          <p>
            The user remains responsible for verifying all measurements, findings, guideline applicability, recommendations, and
            final report wording before clinical use.
          </p>
        </article>
        <article>
          <h3>Prototype limitations</h3>
          <p>
            Guideline logic is simplified for prototype purposes and must be checked against current official sources. Do not enter
            patient-identifying information into this prototype.
          </p>
        </article>
        <article>
          <h3>Referral Optimization</h3>
          <p>
            Referral Optimization helps referring clinicians provide structured, clinically relevant information to radiologists. It is
            designed to improve communication and report quality, not to replace clinical judgment or determine imaging
            appropriateness.
          </p>
        </article>
      </section>
      <ChangeLogPanel />
    </div>
  );

  const workspaceTabs: Array<{ key: PageKey; label: string; iconName: RadIconName }> = [
    { key: 'dashboard', label: 'Overview', iconName: 'dashboard' },
    { key: 'modules', label: 'Reporting workflows', iconName: 'xray' },
    { key: 'calculators', label: 'Calculators', iconName: 'calculator' },
    { key: 'referral', label: 'Imaging requisitions', iconName: 'primaryCare' },
    { key: 'imagingGuide', label: 'Imaging Guide', iconName: 'helper' },
    { key: 'builder', label: 'Report builder', iconName: 'report' },
    { key: 'gallery', label: 'Examples', iconName: 'followUp' },
    { key: 'drafts', label: 'Local drafts', iconName: 'savedDrafts' },
    { key: 'safety', label: 'Safety', iconName: 'safety' },
  ];

  return (
    <div className={embedded ? 'workspace-legacy-shell' : 'app-shell'}>
      {embedded ? (
        <aside className="workspace-side-panel" aria-label="Workspace tools">
          <div className="workspace-side-panel-header">
            <span>Workspace</span>
            <strong>Modules</strong>
          </div>
          {workspaceTabs.map((tab) => (
            <button
              className={activePage === tab.key ? 'active' : ''}
              key={tab.key}
              onClick={() => setActivePage(tab.key)}
              type="button"
            >
              <RadIcon name={tab.iconName} size={20} />
              {tab.label}
            </button>
          ))}
        </aside>
      ) : (
        <Sidebar activePage={activePage} onNavigate={setActivePage} />
      )}
      <main className={embedded ? 'workspace-main-shell' : 'main-shell'}>
        <SafetyBanner />
        {embedded && activePage === 'dashboard' ? renderWorkspaceOverview() : null}
        {!embedded && activePage === 'dashboard' ? renderDashboard() : null}
        {activePage === 'modules' ? renderModules() : null}
        {activePage === 'referral' ? renderReferral() : null}
        {activePage === 'calculators' ? renderCalculators() : null}
        {activePage === 'imagingGuide' ? renderImagingGuide() : null}
        {activePage === 'incidental' ? renderIncidental() : null}
        {activePage === 'builder' ? renderBuilder() : null}
        {activePage === 'why' ? renderWhy() : null}
        {activePage === 'gallery' ? renderGallery() : null}
        {activePage === 'drafts' ? renderDrafts() : null}
        {activePage === 'safety' ? renderSafety() : null}
        <GuidedDemo open={demoOpen} onClose={() => setDemoOpen(false)} onOpenWorkflow={openWorkflowFromStory} />
        {toastMessage ? <div className="toast-notice">{toastMessage}</div> : null}
        {helperDrawerId ? (
          <HelperDrawer
            helperId={helperDrawerId}
            onClose={() => setHelperDrawerId('')}
            onInsertText={(text, label, target) => insertTextIntoBuilder(text, label, target)}
          />
        ) : null}
        <footer>RadRepPilot prototype. User-entered findings only. Final report requires clinician verification.</footer>
      </main>
    </div>
  );
}

interface PageHeaderProps {
  eyebrow: string;
  title: string;
  description: string;
}

function PageHeader({ eyebrow, title, description }: PageHeaderProps) {
  return (
    <header className="page-header">
      <span className="eyebrow">{eyebrow}</span>
      <h1>{title}</h1>
      <p>{description}</p>
    </header>
  );
}

interface FieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

function TextField({ label, value, onChange, placeholder }: FieldProps) {
  return (
    <label className="field">
      {label}
      <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} type="text" />
    </label>
  );
}

function NumberField({ label, value, onChange, placeholder }: FieldProps) {
  return (
    <label className="field">
      {label}
      <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} type="number" min="0" step="0.1" />
    </label>
  );
}

interface TextAreaFieldProps extends FieldProps {
  large?: boolean;
}

function TextAreaField({ label, value, onChange, placeholder, large }: TextAreaFieldProps) {
  return (
    <label className="field">
      {label}
      <textarea
        className={large ? 'large' : ''}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
      />
    </label>
  );
}

interface SelectFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  labels?: Record<string, string>;
  placeholder?: string;
}

function SelectField({ label, value, onChange, options, labels, placeholder }: SelectFieldProps) {
  return (
    <label className="field">
      {label}
      <select value={value} onChange={(event) => onChange(event.target.value)} disabled={options.length === 0}>
        {options.length === 0 ? <option value="">{placeholder ?? 'No options'}</option> : null}
        {options.map((option) => (
          <option value={option} key={option}>
            {labels?.[option] ?? option}
          </option>
        ))}
      </select>
    </label>
  );
}

interface ReferralFieldProps {
  field: ReferralFieldDefinition;
  value: string | boolean | undefined;
  onChange: (value: string | boolean) => void;
}

function ReferralField({ field, value, onChange }: ReferralFieldProps) {
  if (field.type === 'select') {
    const options = field.options ?? [];
    return (
      <label className={`field ${field.important ? 'important-field' : ''}`}>
        {field.label}
        <select value={typeof value === 'string' ? value : ''} onChange={(event) => onChange(event.target.value)}>
          {options.map((option) => (
            <option value={option.value} key={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
    );
  }

  if (field.type === 'textarea') {
    return (
      <label className={`field ${field.important ? 'important-field' : ''}`}>
        {field.label}
        <textarea
          value={typeof value === 'string' ? value : ''}
          onChange={(event) => onChange(event.target.value)}
          placeholder={field.placeholder}
        />
      </label>
    );
  }

  if (field.type === 'checkbox') {
    return (
      <label className="check-card">
        <input checked={Boolean(value)} onChange={(event) => onChange(event.target.checked)} type="checkbox" />
        <span>{field.label}</span>
      </label>
    );
  }

  return (
    <label className={`field ${field.important ? 'important-field' : ''}`}>
      {field.label}
      <input
        value={typeof value === 'string' ? value : ''}
        onChange={(event) => onChange(event.target.value)}
        placeholder={field.placeholder}
        type="text"
      />
    </label>
  );
}

interface CheckboxGridProps {
  values: AspectsRegion[];
  selected: AspectsRegion[];
  onChange: (regions: AspectsRegion[]) => void;
}

function CheckboxGrid({ values, selected, onChange }: CheckboxGridProps) {
  return (
    <div className="checkbox-grid">
      {values.map((value) => {
        const checked = selected.includes(value);
        return (
          <label key={value}>
            <input
              checked={checked}
              onChange={() => {
                onChange(checked ? selected.filter((item) => item !== value) : [...selected, value]);
              }}
              type="checkbox"
            />
            <span>{value}</span>
          </label>
        );
      })}
    </div>
  );
}

interface ReportSentenceProps {
  sentence: string;
  onInsert: () => void;
}

function ReportSentence({ sentence, onInsert }: ReportSentenceProps) {
  return (
    <div className="sentence-box">
      <span>Report-ready sentence</span>
      <p>{sentence}</p>
      <div className="button-row">
        <CopyButton text={sentence} label="Copy sentence" />
        <button className="secondary-button" onClick={onInsert} type="button">
          Insert into builder list
        </button>
      </div>
    </div>
  );
}

export default App;
