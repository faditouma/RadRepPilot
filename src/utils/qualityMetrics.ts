import type { ModuleType, ReferralFormState, ReportSections } from '../radrep/types';

export interface QualityCheck {
  label: string;
  complete: boolean;
  missingLabel?: string;
  completeLabel?: string;
}

export interface QualityScore {
  label: string;
  complete: number;
  total: number;
  percent: number;
  checks: QualityCheck[];
  summary: string;
}

function score(label: string, checks: QualityCheck[]): QualityScore {
  const complete = checks.filter((check) => check.complete).length;
  const total = checks.length;
  const percent = total ? Math.round((complete / total) * 100) : 0;
  return {
    label,
    complete,
    total,
    percent,
    checks,
    summary: `${label}: ${complete}/${total}`,
  };
}

function hasValue(value: unknown): boolean {
  if (typeof value === 'boolean') return true;
  if (Array.isArray(value)) return value.length > 0;
  return typeof value === 'string' ? value.trim().length > 0 : value != null;
}

function hasAny(values: Record<string, unknown>, keys: string[]): boolean {
  return keys.some((key) => hasValue(values[key]));
}

function textValue(value: unknown): string {
  if (typeof value === 'boolean') return value ? 'yes' : 'no';
  if (Array.isArray(value)) return value.join(' ');
  return typeof value === 'string' ? value.trim() : '';
}

function hasMeaningfulText(value: unknown): boolean {
  const text = textValue(value).toLowerCase();
  return Boolean(text) && !['no', 'none', 'nil', 'n/a', 'na', 'not applicable', 'negative'].includes(text);
}

function addressed(value: unknown): boolean {
  const text = textValue(value).toLowerCase();
  return Boolean(text) && !['not specified', 'unknown', 'unspecified', ''].includes(text);
}

function addressedAny(values: Record<string, unknown>, keys: string[]): boolean {
  return keys.some((key) => addressed(values[key]));
}

function hasFreeTextCoverage(values: Record<string, unknown>): boolean {
  return hasMeaningfulText(values.additionalFindings) || hasMeaningfulText(values.limitationsUncertainty);
}

function hasPmhxAddressed(values: Record<string, unknown>): boolean {
  const pmhxStatus = textValue(values.pmhxStatus).toLowerCase();
  const pmhx = textValue(values.pmhx).toLowerCase();
  if (pmhxStatus === 'no-significant-pmhx' || pmhxStatus === 'relevant-pmhx') return true;
  return hasValue(values.pmhx) || /^(healthy|well|no significant|no pmhx|no past medical history)$/.test(pmhx);
}

function hasKeyNegative(values: Record<string, unknown>, phrase: string): boolean {
  const keyNegatives = values.keyNegatives;
  if (!Array.isArray(keyNegatives)) return false;
  const normalizedPhrase = phrase.toLowerCase();
  return keyNegatives.some((item) => String(item).toLowerCase().includes(normalizedPhrase));
}

function hasReportText(report: ReportSections, pattern: RegExp): boolean {
  return pattern.test([report.findings, report.impression, report.incidentalFindings, report.recommendations].filter(Boolean).join(' '));
}

function optionalFindingCheck(
  label: string,
  value: unknown,
  reportText: unknown,
  absentLabel: string,
  presentLabel: string,
): QualityCheck {
  const entered = hasMeaningfulText(value) || hasMeaningfulText(reportText);
  return {
    label,
    complete: true,
    completeLabel: entered ? presentLabel : absentLabel,
  };
}

export function scoreRequisitionCompleteness(form: ReferralFormState): QualityScore {
  const values = form.values ?? {};
  return score('Requisition completeness', [
    { label: 'Age/sex present', complete: hasAny(values, ['age', 'sex']), missingLabel: 'Missing age/sex' },
    { label: 'PMHx addressed', complete: hasPmhxAddressed(values), missingLabel: 'Missing PMHx or “healthy/no PMHx” status' },
    {
      label: 'Symptom/indication present',
      complete: hasAny(values, ['mainSymptom', 'positiveSymptoms', 'symptomType', 'painLocation', 'indication']),
      missingLabel: 'Missing symptom/indication',
    },
    { label: 'Duration present', complete: hasAny(values, ['duration', 'onsetDuration', 'timeSinceInjury']), missingLabel: 'Missing duration' },
    {
      label: 'Red flags addressed',
      complete: hasAny(values, [
        'redFlags',
        'thunderclap',
        'neuroDeficit',
        'trauma',
        'anticoagulation',
        'fever',
        'immunosuppression',
        'cancerHistory',
      ]),
      missingLabel: 'Missing red flags',
    },
    {
      label: 'Specific radiology question present',
      complete: hasAny(values, ['clinicalQuestion', 'question']),
      missingLabel: 'Missing specific question',
    },
  ]);
}

export function scoreReportCompleteness(moduleType: ModuleType, values: Record<string, unknown>, report: ReportSections): QualityScore {
  if (['tracheobronchomalacia', 'fibroticLungDisease', 'pulmonaryHypertensionCtpa', 'copdCt'].includes(moduleType)) {
    const requiredByModule: Partial<Record<ModuleType, string[]>> = {
      tracheobronchomalacia: ['respiratoryEffort', 'airwayCollapse', 'distribution', 'airTrapping', 'diagnosticConfidence'],
      fibroticLungDisease: ['fibrosis', 'axialDistribution', 'craniocaudalDistribution', 'reticulation', 'tractionBronchiectasis', 'honeycombing', 'airTrapping', 'intervalProgression', 'acuteAbnormality', 'diagnosticConfidence'],
      pulmonaryHypertensionCtpa: ['contrastQuality', 'mainPaMm', 'chronicThromboembolicSigns', 'rvLvRatio', 'septalFlattening', 'contrastReflux', 'mosaicPerfusion', 'diagnosticConfidence'],
      copdCt: ['emphysema', 'airTrapping', 'bullae', 'airwayWallThickening', 'mucusPlugging', 'bronchiectasis'],
    };
    const required = requiredByModule[moduleType] || [];
    return score('Report completeness', [
      { label: 'Clinical context addressed', complete: hasMeaningfulText(values.clinicalIndication) },
      { label: 'Protocol and technical quality addressed', complete: hasMeaningfulText(values.modalityProtocol) && addressed(values.examQuality) },
      { label: 'Core disease-specific findings addressed', complete: required.every((key) => addressed(values[key])) },
      { label: 'Comparison addressed', complete: hasAny(values, ['comparisonStudy', 'comparisonDate']) || addressed(values.intervalProgression) },
      { label: 'Impression generated', complete: hasMeaningfulText(report.impression) },
    ]);
  }

  if (moduleType === 'liverTransplantUltrasound') {
    return score('Report completeness', [
      { label: 'Clinical and transplant context addressed', complete: hasMeaningfulText(values.clinicalIndication) && hasMeaningfulText(values.transplantHistory) },
      { label: 'Protocol and quality addressed', complete: hasMeaningfulText(values.modalityProtocol) && addressed(values.examQuality) },
      { label: 'Graft and biliary tree addressed', complete: hasMeaningfulText(values.graftAppearance) && addressed(values.biliaryDilation) },
      { label: 'Hepatic artery documented', complete: addressed(values.hepaticArteryPatency) && hasMeaningfulText(values.hepaticArteryWaveform) && hasMeaningfulText(values.hepaticArteryRi) },
      { label: 'Portal and venous flow documented', complete: addressed(values.portalVeinPatency) && hasMeaningfulText(values.portalFlowDirection) && addressed(values.hepaticVeinPatency) && addressed(values.ivcPatency) },
      { label: 'Collections and urgent findings addressed', complete: addressed(values.collection) && addressed(values.urgentFinding) },
      { label: 'Impression generated', complete: hasMeaningfulText(report.impression) },
    ]);
  }
  if (moduleType === 'kidneyTransplantUltrasound') {
    return score('Report completeness', [
      { label: 'Clinical and transplant context addressed', complete: hasMeaningfulText(values.clinicalIndication) && hasMeaningfulText(values.transplantHistory) },
      { label: 'Protocol and quality addressed', complete: hasMeaningfulText(values.modalityProtocol) && addressed(values.examQuality) },
      { label: 'Graft measurements and morphology documented', complete: ['graftLengthCm', 'graftApCm', 'graftTrCm'].every((key) => hasMeaningfulText(values[key])) && hasMeaningfulText(values.graftEchogenicity) },
      { label: 'Collecting system, collection, and bladder addressed', complete: addressed(values.collectingSystemDilation) && addressed(values.collection) && hasMeaningfulText(values.bladderFindings) },
      { label: 'Artery, vein, and Doppler documented', complete: addressed(values.renalArteryPatency) && addressed(values.renalVeinPatency) && hasMeaningfulText(values.anastomoticPsv) && ['riUpper', 'riMid', 'riLower'].every((key) => hasMeaningfulText(values[key])) },
      { label: 'Waveform and urgent findings addressed', complete: addressed(values.waveformAbnormality) && addressed(values.urgentFinding) },
      { label: 'Impression generated', complete: hasMeaningfulText(report.impression) },
    ]);
  }
  if (moduleType === 'livingDonorLiver') {
    return score('Report completeness', [
      { label: 'Clinical and operative context addressed', complete: hasMeaningfulText(values.clinicalIndication) && hasMeaningfulText(values.transplantHistory) },
      { label: 'Protocol and quality addressed', complete: hasMeaningfulText(values.modalityProtocol) && addressed(values.examQuality) },
      { label: 'Parenchyma, lesions, and steatosis addressed', complete: hasMeaningfulText(values.liverMorphology) && addressed(values.liverLesion) && addressed(values.steatosis) },
      { label: 'Total, graft, and remnant volumes documented', complete: ['totalLiverVolumeMl', 'proposedGraft', 'graftVolumeMl', 'remnantVolumeMl'].every((key) => hasMeaningfulText(values[key])) },
      { label: 'Arterial and portal anatomy documented', complete: hasMeaningfulText(values.arterialAnatomy) && hasMeaningfulText(values.portalAnatomy) },
      { label: 'Venous and biliary anatomy documented', complete: hasMeaningfulText(values.hepaticVenousAnatomy) && hasMeaningfulText(values.biliaryAnatomy) },
      { label: 'Surgical planes and drainage documented', complete: hasMeaningfulText(values.surgicalPlanes) && hasMeaningfulText(values.venousDrainage) },
      { label: 'Impression generated', complete: hasMeaningfulText(report.impression) },
    ]);
  }

  if (moduleType === 'placentaAccretaMri') {
    const detail = (statusKey: string, detailsKey?: string) => {
      const status = textValue(values[statusKey]);
      return addressed(values[statusKey]) && (!detailsKey || !['present', 'indeterminate'].includes(status) || hasMeaningfulText(values[detailsKey]));
    };
    return score('Report completeness', [
      { label: 'Indication, gestational age, and uterine surgery addressed', complete: hasMeaningfulText(values.clinicalIndication) && hasMeaningfulText(values.gestationalAge) && hasMeaningfulText(values.priorUterineSurgery), missingLabel: 'Indication, gestational age, or prior uterine surgery missing' },
      { label: 'Protocol, quality, and orientation addressed', complete: hasMeaningfulText(values.modalityProtocol) && addressed(values.examQuality) && hasMeaningfulText(values.fetalOrientation) && hasMeaningfulText(values.uterineOrientation), missingLabel: 'Protocol, quality, fetal orientation, or uterine orientation missing' },
      { label: 'Placental location and previa addressed', complete: hasMeaningfulText(values.placentalLocation) && detail('placentaPrevia'), missingLabel: 'Placental location or previa assessment missing' },
      { label: 'Placental and myometrial signs addressed', complete: ['placentalHeterogeneity', 'darkBands', 'uterineBulge', 'myometrialThinning', 'myometrialInterruption', 'abnormalVascularity'].every((key) => addressed(values[key])), missingLabel: 'One or more placental/myometrial signs not assessed' },
      { label: 'Bladder and parametrial interfaces addressed', complete: detail('bladderInterface', 'bladderDetails') && detail('parametrialExtension', 'parametrialDetails'), missingLabel: 'Bladder or parametrial assessment/details incomplete' },
      { label: 'Cervical and extrauterine extension addressed', complete: detail('cervicalInvolvement', 'cervicalDetails') && detail('extrauterineExtension', 'extrauterineDetails'), missingLabel: 'Cervical or extrauterine assessment/details incomplete' },
      { label: 'Diagnostic confidence entered', complete: hasMeaningfulText(values.diagnosticConfidence), missingLabel: 'Diagnostic confidence missing' },
      { label: 'Impression generated', complete: hasMeaningfulText(report.impression), missingLabel: 'Impression incomplete' },
    ]);
  }

  if (moduleType === 'pancreatitis') {
    const detail = (statusKey: string, detailsKey?: string) => {
      const status = textValue(values[statusKey]);
      return addressed(values[statusKey]) && (!detailsKey || !['present', 'indeterminate'].includes(status) || hasMeaningfulText(values[detailsKey]));
    };
    const necrosis = textValue(values.necrosis);
    const collection = textValue(values.collection);
    return score('Report completeness', [
      { label: 'Clinical indication and reporting mode addressed', complete: hasMeaningfulText(values.clinicalIndication) && hasMeaningfulText(values.pancreatitisMode), missingLabel: 'Clinical indication or acute/chronic mode missing' },
      { label: 'Protocol and technical quality addressed', complete: hasMeaningfulText(values.modalityProtocol) && addressed(values.examQuality), missingLabel: 'Protocol or examination quality missing' },
      { label: 'Parenchyma and necrosis characterized', complete: hasMeaningfulText(values.pancreasSize) && hasMeaningfulText(values.enhancementPattern) && detail('necrosis', 'necrosisDistribution') && (!['present', 'indeterminate'].includes(necrosis) || hasMeaningfulText(values.necrosisPercent)), missingLabel: 'Parenchymal size, enhancement, necrosis extent, or distribution missing' },
      { label: 'Dominant collection characterized when present', complete: addressed(values.collection) && (!['present', 'indeterminate'].includes(collection) || (hasMeaningfulText(values.collectionType) && hasMeaningfulText(values.collectionLocation) && hasAny(values, ['collectionApMm', 'collectionTrMm', 'collectionCcMm']) && hasMeaningfulText(values.collectionWall) && hasMeaningfulText(values.collectionContents))), missingLabel: 'Collection type, location, dimensions, wall, or contents missing' },
      { label: 'Duct dilation, disruption, and stones addressed', complete: detail('ductDilation') && detail('ductDisruption') && detail('ductStones'), missingLabel: 'Duct dilation, disruption, or stones assessment missing' },
      { label: 'Vascular complication addressed', complete: detail('vascularComplication', 'vascularDetails'), missingLabel: 'Vascular complication assessment/details incomplete' },
      { label: 'Biliary cause or obstruction addressed', complete: detail('biliaryCause', 'biliaryDetails'), missingLabel: 'Biliary assessment/details incomplete' },
      { label: 'Impression generated', complete: hasMeaningfulText(report.impression), missingLabel: 'Impression incomplete' },
    ]);
  }

  if (moduleType === 'pancreaticCyst') {
    const status = textValue(values.cysticLesion);
    const lesionComplete = !['present', 'indeterminate'].includes(status) ||
      (hasMeaningfulText(values.multiplicity) && hasMeaningfulText(values.dominantCystSite) &&
        hasAny(values, ['cystApMm', 'cystTrMm', 'cystCcMm']) && hasMeaningfulText(values.cystMorphology) &&
        addressed(values.ductCommunication) && hasMeaningfulText(values.mainDuctDiameterMm));
    const detail = (statusKey: string, detailsKey?: string) => {
      const itemStatus = textValue(values[statusKey]);
      return addressed(values[statusKey]) && (!detailsKey || !['present', 'indeterminate'].includes(itemStatus) || hasMeaningfulText(values[detailsKey]));
    };
    return score('Report completeness', [
      { label: 'Clinical indication and pancreatitis history addressed', complete: hasMeaningfulText(values.clinicalIndication) && hasMeaningfulText(values.pancreatitisHistory), missingLabel: 'Clinical indication or pancreatitis history missing' },
      { label: 'Protocol and technical quality addressed', complete: hasMeaningfulText(values.modalityProtocol) && addressed(values.examQuality), missingLabel: 'Protocol or examination quality missing' },
      { label: 'Dominant cyst and duct relationship characterized', complete: addressed(values.cysticLesion) && lesionComplete, missingLabel: status === 'present' || status === 'indeterminate' ? 'Multiplicity, site, size, morphology, duct communication, or duct caliber missing' : 'Cyst assessment missing' },
      { label: 'Mural nodule and solid component addressed', complete: detail('muralNodule', 'muralNoduleDetails') && detail('solidComponent', 'solidComponentDetails'), missingLabel: 'Mural nodule or solid component assessment/details incomplete' },
      { label: 'Wall, septa, and growth addressed', complete: detail('wallEnhancement') && detail('septalEnhancement') && detail('intervalGrowth', 'intervalGrowthDetails'), missingLabel: 'Wall, septal, or growth assessment/details incomplete' },
      { label: 'Pancreatitis, obstruction, and atrophy addressed', complete: detail('pancreatitis') && detail('biliaryObstruction') && detail('parenchymalAtrophy'), missingLabel: 'Pancreatitis, biliary obstruction, or atrophy missing' },
      { label: 'Suspicious nodes addressed', complete: detail('suspiciousNodes', 'suspiciousNodeDetails'), missingLabel: 'Nodal assessment/details incomplete' },
      { label: 'Impression generated', complete: hasMeaningfulText(report.impression), missingLabel: 'Impression incomplete' },
    ]);
  }

  if (moduleType === 'endometriosisMri') {
    const detail = (statusKey: string, detailsKey?: string) => {
      const status = textValue(values[statusKey]);
      return addressed(values[statusKey]) && (!detailsKey || !['present', 'indeterminate'].includes(status) || hasMeaningfulText(values[detailsKey]));
    };
    const bowel = textValue(values.bowelInvolvement);
    return score('Report completeness', [
      { label: 'Clinical indication and surgery history addressed', complete: hasMeaningfulText(values.clinicalIndication) && hasMeaningfulText(values.surgeryTreatmentHistory), missingLabel: 'Clinical indication or surgery/treatment history missing' },
      { label: 'Protocol and technical quality addressed', complete: hasMeaningfulText(values.modalityProtocol) && addressed(values.examQuality), missingLabel: 'Protocol or examination quality missing' },
      { label: 'Ovaries and three compartments mapped', complete: detail('endometrioma', 'endometriomaDetails') && detail('anteriorCompartment', 'anteriorDetails') && detail('middleCompartment', 'middleDetails') && detail('posteriorCompartment', 'posteriorDetails'), missingLabel: 'Ovarian or compartment assessment/details incomplete' },
      { label: 'Uterosacral and rectovaginal regions mapped', complete: detail('uterosacralTorus', 'uterosacralTorusDetails') && detail('rectovaginalVaginal', 'rectovaginalVaginalDetails'), missingLabel: 'Uterosacral/torus or rectovaginal assessment/details incomplete' },
      { label: 'Urinary tract and hydronephrosis addressed', complete: detail('bladderUreter', 'bladderUreterDetails') && detail('hydronephrosis', 'hydronephrosisDetails'), missingLabel: 'Urinary tract or hydronephrosis assessment/details incomplete' },
      { label: 'Bowel involvement mapped when present', complete: addressed(values.bowelInvolvement) && (!['present', 'indeterminate'].includes(bowel) || (hasMeaningfulText(values.bowelSegment) && hasMeaningfulText(values.bowelLesionLengthMm) && hasMeaningfulText(values.bowelDepth) && hasMeaningfulText(values.bowelCircumference))), missingLabel: 'Bowel segment, length, depth, or circumference missing' },
      { label: 'Pouch of Douglas and adhesions addressed', complete: hasMeaningfulText(values.pouchDouglas) && hasMeaningfulText(values.adhesions), missingLabel: 'Pouch of Douglas or adhesions missing' },
      { label: 'Impression generated', complete: hasMeaningfulText(report.impression), missingLabel: 'Impression incomplete' },
    ]);
  }

  if (moduleType === 'pelvicFloorImaging') {
    const detail = (statusKey: string, detailsKey?: string) => {
      const status = textValue(values[statusKey]);
      return addressed(values[statusKey]) && (!detailsKey || !['present', 'indeterminate'].includes(status) || hasMeaningfulText(values[detailsKey]));
    };
    const rectocele = textValue(values.rectocele);
    return score('Report completeness', [
      { label: 'Clinical indication and prior surgery addressed', complete: hasMeaningfulText(values.clinicalIndication) && hasMeaningfulText(values.priorSurgery), missingLabel: 'Clinical indication or prior surgery missing' },
      { label: 'Protocol, effort, quality, and reference line addressed', complete: hasMeaningfulText(values.modalityProtocol) && addressed(values.examQuality) && hasMeaningfulText(values.patientEffort) && hasMeaningfulText(values.referenceLine), missingLabel: 'Protocol, effort, quality, or reference line missing' },
      { label: 'Rest and evacuation measurements entered', complete: ['restHLineCm', 'restMLineCm', 'evacuationHLineCm', 'evacuationMLineCm'].every((key) => hasMeaningfulText(values[key])), missingLabel: 'Rest or evacuation measurements missing' },
      { label: 'Anterior and middle compartments addressed', complete: detail('cystocele', 'cystoceleDetails') && detail('uterineVaultProlapse', 'uterineVaultDetails') && detail('enterocele', 'enteroceleDetails'), missingLabel: 'Anterior or middle compartment assessment/details incomplete' },
      { label: 'Rectocele characterized when present', complete: addressed(values.rectocele) && (!['present', 'indeterminate'].includes(rectocele) || (hasMeaningfulText(values.rectoceleDepthCm) && hasMeaningfulText(values.rectoceleEmptying))), missingLabel: 'Rectocele depth or emptying missing' },
      { label: 'Intussusception and prolapse addressed', complete: detail('intussusception', 'intussusceptionDetails') && detail('rectalProlapse', 'rectalProlapseDetails'), missingLabel: 'Intussusception or rectal prolapse assessment/details incomplete' },
      { label: 'Evacuation and puborectalis addressed', complete: hasMeaningfulText(values.evacuationCompleteness) && hasMeaningfulText(values.puborectalisBehavior), missingLabel: 'Evacuation or puborectalis behavior missing' },
      { label: 'Impression generated', complete: hasMeaningfulText(report.impression), missingLabel: 'Impression incomplete' },
    ]);
  }

  if (moduleType === 'fibroidMri') {
    const status = textValue(values.dominantFibroid);
    const lesionComplete = !['present', 'indeterminate'].includes(status) ||
      (hasMeaningfulText(values.fibroidLocation) && hasAny(values, ['fibroidApMm', 'fibroidTrMm', 'fibroidCcMm']) &&
        hasMeaningfulText(values.endometrialRelationship) && hasMeaningfulText(values.serosalRelationship) &&
        hasMeaningfulText(values.enhancement) && hasMeaningfulText(values.diffusion));
    const pedunculated = textValue(values.pedunculated);
    const adenomyosis = textValue(values.adenomyosis);
    return score('Report completeness', [
      { label: 'Clinical indication and treatment history addressed', complete: hasMeaningfulText(values.clinicalIndication) && hasMeaningfulText(values.treatmentHistory), missingLabel: 'Clinical indication or treatment history missing' },
      { label: 'Protocol and technical quality addressed', complete: hasMeaningfulText(values.modalityProtocol) && addressed(values.examQuality), missingLabel: 'Protocol or examination quality missing' },
      { label: 'Uterus measured and fibroid burden described', complete: ['uterusApMm', 'uterusTrMm', 'uterusCcMm'].every((key) => hasMeaningfulText(values[key])) && hasMeaningfulText(values.fibroidBurden), missingLabel: 'Uterine dimensions or fibroid burden missing' },
      { label: 'Dominant fibroid characterized when present', complete: addressed(values.dominantFibroid) && lesionComplete, missingLabel: status === 'present' || status === 'indeterminate' ? 'Fibroid location, size, relationships, enhancement, or diffusion missing' : 'Dominant fibroid assessment missing' },
      { label: 'Pedunculation and stalk addressed', complete: addressed(values.pedunculated) && (!['present', 'indeterminate'].includes(pedunculated) || hasMeaningfulText(values.stalkDetails)), missingLabel: 'Pedunculation or stalk details incomplete' },
      { label: 'Adenomyosis addressed', complete: addressed(values.adenomyosis) && (!['present', 'indeterminate'].includes(adenomyosis) || hasMeaningfulText(values.adenomyosisDetails)), missingLabel: 'Adenomyosis assessment/details incomplete' },
      { label: 'Endometrium and adnexa addressed', complete: hasMeaningfulText(values.endometrium) && hasMeaningfulText(values.ovariesAdnexa), missingLabel: 'Endometrium or adnexa missing' },
      { label: 'Impression generated', complete: hasMeaningfulText(report.impression), missingLabel: 'Impression incomplete' },
    ]);
  }

  if (moduleType === 'adnexalCystUltrasound') {
    const lesionStatus = textValue(values.adnexalLesion);
    const lesionComplete =
      !['present', 'indeterminate'].includes(lesionStatus) ||
      (hasMeaningfulText(values.laterality) && hasMeaningfulText(values.lesionOrigin) &&
        hasAny(values, ['lesionApMm', 'lesionTrMm', 'lesionCcMm']) &&
        hasMeaningfulText(values.architecture) && hasMeaningfulText(values.wallSurface) &&
        hasMeaningfulText(values.dopplerFlow));
    const detail = (statusKey: string, detailsKey?: string) => {
      const status = textValue(values[statusKey]);
      return addressed(values[statusKey]) && (!detailsKey || !['present', 'indeterminate'].includes(status) || hasMeaningfulText(values[detailsKey]));
    };
    return score('Report completeness', [
      { label: 'Clinical indication and menopausal context addressed', complete: hasMeaningfulText(values.clinicalIndication) && hasMeaningfulText(values.menopausalStatus), missingLabel: 'Clinical indication or menopausal status missing' },
      { label: 'Protocol and technical quality addressed', complete: hasMeaningfulText(values.modalityProtocol) && addressed(values.examQuality), missingLabel: 'Protocol or examination quality missing' },
      { label: 'Adnexal lesion fully characterized when present', complete: addressed(values.adnexalLesion) && lesionComplete, missingLabel: lesionStatus === 'present' || lesionStatus === 'indeterminate' ? 'Origin, laterality, size, architecture, wall, or Doppler flow missing' : 'Adnexal lesion assessment missing' },
      { label: 'Papillary and solid components addressed', complete: detail('papillaryProjections', 'papillaryDetails') && detail('solidComponent', 'solidDetails'), missingLabel: 'Papillary or solid component assessment/details incomplete' },
      { label: 'Ascites and peritoneum addressed', complete: detail('ascites') && detail('peritonealFindings', 'peritonealDetails'), missingLabel: 'Ascites or peritoneal assessment/details incomplete' },
      { label: 'Contralateral adnexa addressed', complete: hasMeaningfulText(values.contralateralOvary), missingLabel: 'Contralateral ovary/adnexa missing' },
      { label: 'Impression generated', complete: hasMeaningfulText(report.impression), missingLabel: 'Impression incomplete' },
    ]);
  }

  if (moduleType === 'adrenalIncidentaloma') {
    const lesionStatus = textValue(values.adrenalLesion);
    const lesionComplete =
      !['present', 'indeterminate'].includes(lesionStatus) ||
      (hasMeaningfulText(values.laterality) && hasAny(values, ['lesionApMm', 'lesionTrMm', 'lesionCcMm']) &&
        hasMeaningfulText(values.homogeneity) &&
        addressedAny(values, ['unenhancedHu', 'chemicalShiftLoss', 'macroscopicFat', 'userEnteredWashout']));
    const detail = (statusKey: string, detailsKey?: string) => {
      const status = textValue(values[statusKey]);
      return addressed(values[statusKey]) &&
        (!detailsKey || !['present', 'indeterminate'].includes(status) || hasMeaningfulText(values[detailsKey]));
    };
    return score('Report completeness', [
      { label: 'Clinical indication and cancer context addressed', complete: hasMeaningfulText(values.clinicalIndication) && hasMeaningfulText(values.cancerHistory), missingLabel: 'Clinical indication or cancer history missing' },
      { label: 'Protocol and technical quality addressed', complete: hasMeaningfulText(values.modalityProtocol) && addressed(values.examQuality), missingLabel: 'Protocol or examination quality missing' },
      { label: 'Adrenal lesion characterized when present', complete: addressed(values.adrenalLesion) && lesionComplete, missingLabel: lesionStatus === 'present' || lesionStatus === 'indeterminate' ? 'Laterality, size, homogeneity, or characterization feature missing' : 'Adrenal lesion assessment missing' },
      { label: 'Interval growth addressed', complete: detail('growthStatus', 'growthDetails'), missingLabel: 'Growth assessment/details incomplete' },
      { label: 'Local invasion addressed', complete: detail('localInvasion', 'localInvasionDetails'), missingLabel: 'Local invasion assessment/details incomplete' },
      { label: 'Metastatic disease addressed', complete: detail('metastaticDisease', 'metastaticDiseaseDetails'), missingLabel: 'Metastatic disease assessment/details incomplete' },
      { label: 'Contralateral adrenal addressed', complete: hasMeaningfulText(values.contralateralAdrenal), missingLabel: 'Contralateral adrenal not addressed' },
      { label: 'Impression generated', complete: hasMeaningfulText(report.impression), missingLabel: 'Impression incomplete' },
    ]);
  }

  if (moduleType === 'perianalFistulaMri') {
    const tractStatus = textValue(values.primaryFistula);
    const tractComplete =
      !['present', 'indeterminate'].includes(tractStatus) ||
      (hasMeaningfulText(values.internalOpeningClock) && hasMeaningfulText(values.internalOpeningHeightCm) &&
        hasMeaningfulText(values.tractClassification) && hasMeaningfulText(values.tractCourse) &&
        hasMeaningfulText(values.externalOpening) && hasMeaningfulText(values.tractActivity));
    const detail = (statusKey: string, detailsKey?: string) => {
      const status = textValue(values[statusKey]);
      return addressed(values[statusKey]) &&
        (!detailsKey || !['present', 'indeterminate'].includes(status) || hasMeaningfulText(values[detailsKey]));
    };
    const abscessStatus = textValue(values.abscess);
    const abscessComplete =
      addressed(values.abscess) &&
      (!['present', 'indeterminate'].includes(abscessStatus) ||
        (hasMeaningfulText(values.abscessLocation) && hasAny(values, ['abscessApMm', 'abscessTrMm', 'abscessCcMm'])));
    return score('Report completeness', [
      { label: 'Clinical indication addressed', complete: hasMeaningfulText(values.clinicalIndication), missingLabel: 'Clinical indication missing' },
      { label: 'Protocol and technical quality addressed', complete: hasMeaningfulText(values.modalityProtocol) && addressed(values.examQuality), missingLabel: 'Protocol or examination quality missing' },
      { label: 'Primary tract fully mapped when present', complete: addressed(values.primaryFistula) && tractComplete, missingLabel: tractStatus === 'present' || tractStatus === 'indeterminate' ? 'Internal opening, height, classification, course, external opening, or activity missing' : 'Primary tract assessment missing' },
      { label: 'Secondary tracts addressed', complete: detail('secondaryTracts', 'secondaryTractDetails'), missingLabel: 'Secondary tract assessment/details incomplete' },
      { label: 'Abscess or collection addressed', complete: abscessComplete, missingLabel: 'Collection location or measurement missing' },
      { label: 'Horseshoe and superior extension addressed', complete: detail('horseshoeExtension') && detail('supralevatorExtension') && detail('translevatorExtension'), missingLabel: 'Horseshoe, supralevator, or translevator assessment missing' },
      { label: 'Proctitis addressed', complete: detail('proctitis', 'proctitisDetails'), missingLabel: 'Proctitis assessment/details incomplete' },
      { label: 'Impression generated', complete: hasMeaningfulText(report.impression), missingLabel: 'Impression incomplete' },
    ]);
  }

  if (moduleType === 'enterography') {
    const activityStatus = textValue(values.activeInflammation);
    const activityComplete =
      !['present', 'indeterminate'].includes(activityStatus) ||
      (hasMeaningfulText(values.involvedSegment) &&
        hasMeaningfulText(values.involvedLengthCm) &&
        hasMeaningfulText(values.muralThicknessMm) &&
        hasMeaningfulText(values.muralEnhancement) &&
        addressed(values.muralEdema));
    const detail = (statusKey: string, detailsKey?: string) => {
      const status = textValue(values[statusKey]);
      return addressed(values[statusKey]) &&
        (!detailsKey || !['present', 'indeterminate'].includes(status) || hasMeaningfulText(values[detailsKey]));
    };
    const strictureStatus = textValue(values.stricture);
    const strictureComplete =
      addressed(values.stricture) &&
      (!['present', 'indeterminate'].includes(strictureStatus) ||
        (hasMeaningfulText(values.strictureLocation) && hasMeaningfulText(values.strictureLengthCm) && addressed(values.upstreamDilation)));
    const distention = textValue(values.bowelDistention);
    const limitationComplete =
      !['limited', 'collapsed', 'not assessed'].includes(distention) || hasMeaningfulText(values.incompleteSegments);
    return score('Report completeness', [
      { label: 'Clinical indication addressed', complete: hasMeaningfulText(values.clinicalIndication), missingLabel: 'Clinical indication missing' },
      { label: 'Protocol, quality, and bowel distention addressed', complete: hasMeaningfulText(values.modalityProtocol) && addressed(values.examQuality) && addressed(values.bowelDistention) && limitationComplete, missingLabel: 'Protocol, quality, bowel distention, or incomplete segments missing' },
      { label: 'Dominant inflammatory segment characterized', complete: addressed(values.activeInflammation) && activityComplete, missingLabel: activityStatus === 'present' || activityStatus === 'indeterminate' ? 'Inflammatory segment, length, thickness, enhancement, or edema missing' : 'Active inflammation assessment missing' },
      { label: 'Stricture and upstream dilation addressed', complete: strictureComplete, missingLabel: 'Stricture location, length, or upstream dilation assessment missing' },
      { label: 'Penetrating disease addressed', complete: detail('penetratingDisease', 'fistulaDetails'), missingLabel: 'Fistula or sinus assessment/details incomplete' },
      { label: 'Abscess or phlegmon addressed', complete: detail('abscessPhlegmon', 'abscessPhlegmonDetails'), missingLabel: 'Abscess or phlegmon assessment/details incomplete' },
      { label: 'Mesentery and lymph nodes addressed', complete: detail('mesentericInflammation', 'mesentericDetails') && detail('suspiciousNodes', 'suspiciousNodeDetails'), missingLabel: 'Mesenteric or lymph-node assessment/details incomplete' },
      { label: 'Impression generated', complete: hasMeaningfulText(report.impression), missingLabel: 'Impression incomplete' },
    ]);
  }

  if (moduleType === 'ctColonography') {
    const lesionStatus = textValue(values.colonicLesion);
    const completeStatus = textValue(values.completeColonAssessment);
    const lesionComplete =
      !['present', 'indeterminate'].includes(lesionStatus) ||
      (hasMeaningfulText(values.lesionSegment) &&
        hasAny(values, ['lesionApMm', 'lesionTrMm', 'lesionCcMm']) &&
        addressed(values.lesionMorphology) &&
        addressed(values.lesionMobility) &&
        addressed(values.lesionConfidence));
    const incompleteSegmentsComplete =
      !['absent', 'indeterminate', 'not assessed'].includes(completeStatus) ||
      hasMeaningfulText(values.incompleteSegments);
    const strictureStatus = textValue(values.stricture);
    const strictureComplete =
      addressed(values.stricture) &&
      (!['present', 'indeterminate'].includes(strictureStatus) || hasMeaningfulText(values.strictureDetails));
    return score('Report completeness', [
      { label: 'Clinical indication addressed', complete: hasMeaningfulText(values.clinicalIndication), missingLabel: 'Clinical indication missing' },
      { label: 'Protocol, preparation, and overall quality addressed', complete: hasMeaningfulText(values.modalityProtocol) && addressed(values.examQuality) && addressed(values.preparationQuality), missingLabel: 'Protocol, preparation, or examination quality missing' },
      { label: 'Distention addressed for every colonic segment', complete: ['rectosigmoidDistention', 'descendingDistention', 'transverseDistention', 'ascendingCecalDistention'].every((key) => addressed(values[key])), missingLabel: 'Segmental colonic distention assessment incomplete' },
      { label: 'Complete visualization or incomplete segments documented', complete: addressed(values.completeColonAssessment) && incompleteSegmentsComplete, missingLabel: 'Colonic completeness or incomplete segments missing' },
      { label: 'Dominant lesion characterized when present', complete: addressed(values.colonicLesion) && lesionComplete, missingLabel: lesionStatus === 'present' || lesionStatus === 'indeterminate' ? 'Dominant lesion location, size, morphology, mobility, or confidence missing' : 'Colonic lesion assessment missing' },
      { label: 'Stricture addressed', complete: strictureComplete, missingLabel: 'Stricture assessment or details incomplete' },
      { label: 'Extracolonic findings addressed', complete: hasValue(values.extracolonicFindings) || hasValue(values.incidentalFindings) || completeStatus === 'present', missingLabel: 'Extracolonic findings not addressed' },
      { label: 'Impression generated', complete: hasMeaningfulText(report.impression), missingLabel: 'Impression incomplete' },
    ]);
  }

  if (moduleType === 'lymphomaPetCt') {
    const nodalStatus = textValue(values.nodalDisease);
    const extranodalStatus = textValue(values.extranodalDisease);
    const responseExam = /response|surveillance|recurrence/i.test(textValue(values.examPurpose));
    const nodalDetailsComplete =
      !['present', 'indeterminate'].includes(nodalStatus) ||
      (hasMeaningfulText(values.nodalDistribution) && hasMeaningfulText(values.dominantNodalSite));
    const extranodalDetailsComplete =
      !['present', 'indeterminate'].includes(extranodalStatus) ||
      (hasMeaningfulText(values.extranodalSites) && hasMeaningfulText(values.dominantExtranodalSite));
    const responseComplete =
      !responseExam ||
      (hasAny(values, ['comparisonStudy', 'comparisonDate']) &&
        addressed(values.intervalChange) &&
        addressed(values.newLesions));

    return score('Report completeness', [
      {
        label: 'Clinical indication and examination purpose addressed',
        complete: hasMeaningfulText(values.clinicalIndication) && addressed(values.examPurpose),
        missingLabel: 'Clinical indication or examination purpose missing',
      },
      {
        label: 'Tracer and technical quality addressed',
        complete: hasMeaningfulText(values.tracer) && addressed(values.examQuality),
        missingLabel: 'Tracer or examination quality missing',
      },
      {
        label: 'Nodal disease distribution complete',
        complete: addressed(values.nodalDisease) && nodalDetailsComplete,
        missingLabel:
          nodalStatus === 'present' || nodalStatus === 'indeterminate'
            ? 'Nodal distribution or dominant site missing'
            : 'Nodal disease assessment missing',
      },
      {
        label: 'Extranodal disease distribution complete',
        complete: addressed(values.extranodalDisease) && extranodalDetailsComplete,
        missingLabel:
          extranodalStatus === 'present' || extranodalStatus === 'indeterminate'
            ? 'Extranodal distribution or dominant site missing'
            : 'Extranodal disease assessment missing',
      },
      {
        label: 'Spleen, marrow, and liver addressed',
        complete:
          addressed(values.spleenAssessment) &&
          addressed(values.marrowAssessment) &&
          addressed(values.liverAssessment),
        missingLabel: 'Spleen, marrow, or liver assessment missing',
      },
      {
        label: 'Response assessment complete when applicable',
        complete: responseComplete,
        missingLabel: 'Comparison, interval change, or new-lesion assessment missing',
      },
      {
        label: 'Impression generated',
        complete: hasMeaningfulText(report.impression),
        missingLabel: 'Impression incomplete',
      },
      optionalFindingCheck(
        'Incidental findings addressed',
        values.incidentalFindings,
        report.incidentalFindings,
        'No incidental finding entered',
        'Incidental finding documented',
      ),
    ]);
  }

  if (moduleType === 'pancreaticCancer') {
    const massStatus = textValue(values.pancreaticMass);
    const tumorDetailsComplete =
      !['present', 'indeterminate'].includes(massStatus) ||
      (addressed(values.tumorLocation) &&
        hasAny(values, ['tumorSizeApMm', 'tumorSizeTrMm', 'tumorSizeCcMm']) &&
        addressed(values.tumorMorphology) &&
        addressed(values.tumorEnhancement));
    const vesselRelationshipsComplete = [
      'smaContact',
      'celiacContact',
      'commonHepaticArteryContact',
      'smvContact',
      'portalVeinContact',
    ].every((key) => addressed(values[key]));
    const statusDetailsComplete = (statusKey: string, detailsKey: string): boolean => {
      const status = textValue(values[statusKey]);
      return (
        addressed(values[statusKey]) &&
        (!['present', 'indeterminate'].includes(status) || hasMeaningfulText(values[detailsKey]))
      );
    };

    return score('Report completeness', [
      {
        label: 'Clinical indication addressed',
        complete: hasMeaningfulText(values.clinicalIndication),
        missingLabel: 'Clinical indication missing',
      },
      {
        label: 'Protocol and technical quality addressed',
        complete: hasMeaningfulText(values.modalityProtocol) && addressed(values.examQuality),
        missingLabel: 'Modality/protocol or examination quality missing',
      },
      {
        label: 'Primary tumor characterized',
        complete: addressed(values.pancreaticMass) && tumorDetailsComplete,
        missingLabel:
          massStatus === 'present' || massStatus === 'indeterminate'
            ? 'Tumor location, size, morphology, or enhancement missing'
            : 'Pancreatic mass assessment missing',
      },
      {
        label: 'Pancreaticobiliary ducts addressed',
        complete:
          addressed(values.pancreaticDuctObstruction) &&
          addressed(values.biliaryObstruction) &&
          addressed(values.upstreamAtrophy),
        missingLabel: 'Pancreatic duct, biliary obstruction, or upstream atrophy missing',
      },
      {
        label: 'Major vascular relationships addressed',
        complete: vesselRelationshipsComplete,
        missingLabel: 'One or more major vessel relationships are not assessed',
      },
      {
        label: 'Local extension and regional nodes addressed',
        complete:
          statusDetailsComplete('adjacentOrganInvasion', 'adjacentOrganDetails') &&
          statusDetailsComplete('regionalNodes', 'regionalNodeDetails'),
        missingLabel: 'Local invasion or regional nodal assessment/details incomplete',
      },
      {
        label: 'Distant metastatic disease addressed',
        complete:
          statusDetailsComplete('liverMetastases', 'liverMetastasisDetails') &&
          statusDetailsComplete('peritonealMetastases', 'peritonealMetastasisDetails') &&
          statusDetailsComplete('otherMetastases', 'otherMetastasisDetails'),
        missingLabel: 'Liver, peritoneal, or other metastatic disease assessment/details incomplete',
      },
      {
        label: 'Impression generated',
        complete: hasMeaningfulText(report.impression),
        missingLabel: 'Impression incomplete',
      },
      optionalFindingCheck(
        'Incidental findings addressed',
        values.incidentalFindings,
        report.incidentalFindings,
        'No incidental finding entered',
        'Incidental finding documented',
      ),
    ]);
  }

  if (moduleType === 'rectalCancerMri') {
    const tumorStatus = textValue(values.rectalTumor);
    const tumorDetailsComplete =
      !['present', 'indeterminate'].includes(tumorStatus) ||
      (hasAny(values, ['distanceFromAnalVergeCm']) &&
        hasAny(values, ['craniocaudalLengthMm']) &&
        addressed(values.circumferentialLocation) &&
        addressed(values.tumorMorphology));
    const statusDetailsComplete = (statusKey: string, detailsKey: string): boolean => {
      const status = textValue(values[statusKey]);
      return (
        addressed(values[statusKey]) &&
        (!['present', 'indeterminate'].includes(status) || hasMeaningfulText(values[detailsKey]))
      );
    };
    const responseExam = /post-treatment|surveillance|recurrence/i.test(textValue(values.examPurpose));
    const responseComplete =
      !responseExam ||
      (hasAny(values, ['comparisonStudy', 'comparisonDate']) &&
        (addressed(values.intervalChange) || hasMeaningfulText(values.userResponseSynthesis)));

    return score('Report completeness', [
      {
        label: 'Clinical indication and examination purpose addressed',
        complete: hasMeaningfulText(values.clinicalIndication) && addressed(values.examPurpose),
        missingLabel: 'Clinical indication or examination purpose missing',
      },
      {
        label: 'Protocol and technical quality addressed',
        complete: hasMeaningfulText(values.modalityProtocol) && addressed(values.examQuality),
        missingLabel: 'MRI protocol or examination quality missing',
      },
      {
        label: 'Primary tumor localized and measured',
        complete: addressed(values.rectalTumor) && tumorDetailsComplete,
        missingLabel:
          tumorStatus === 'present' || tumorStatus === 'indeterminate'
            ? 'Tumor height, length, circumferential location, or morphology missing'
            : 'Rectal tumor assessment missing',
      },
      {
        label: 'Mesorectal fascia and pelvic floor addressed',
        complete:
          addressed(values.mesorectalFasciaRelationship) &&
          statusDetailsComplete('sphincterInvolvement', 'sphincterDetails') &&
          statusDetailsComplete('levatorInvolvement', 'levatorDetails') &&
          statusDetailsComplete('adjacentOrganInvasion', 'adjacentOrganDetails'),
        missingLabel: 'Fascia, sphincter, levator, or adjacent-organ assessment incomplete',
      },
      {
        label: 'EMVI, nodes, and deposits addressed',
        complete:
          statusDetailsComplete('emvi', 'emviDetails') &&
          statusDetailsComplete('mesorectalNodes', 'mesorectalNodeDetails') &&
          statusDetailsComplete('extramesorectalNodes', 'extramesorectalNodeDetails') &&
          statusDetailsComplete('tumorDeposits', 'tumorDepositDetails'),
        missingLabel: 'EMVI, nodal, or tumor-deposit assessment/details incomplete',
      },
      {
        label: 'Distant metastatic disease addressed',
        complete: statusDetailsComplete('distantMetastases', 'distantMetastasisDetails'),
        missingLabel: 'Distant metastatic disease assessment/details incomplete',
      },
      {
        label: 'Response assessment complete when applicable',
        complete: responseComplete,
        missingLabel: 'Comparison or interval response assessment missing',
      },
      {
        label: 'Impression generated',
        complete: hasMeaningfulText(report.impression),
        missingLabel: 'Impression incomplete',
      },
      optionalFindingCheck(
        'Incidental findings addressed',
        values.incidentalFindings,
        report.incidentalFindings,
        'No incidental finding entered',
        'Incidental finding documented',
      ),
    ]);
  }

  if (moduleType === 'prostateMri') {
    const lesionStatus = textValue(values.lesionAssessment);
    const lesionDetailsComplete =
      !['present', 'indeterminate'].includes(lesionStatus) ||
      (hasMeaningfulText(values.indexLesionLocation) &&
        addressed(values.indexLesionZone) &&
        hasAny(values, ['indexLesionSizeMm']) &&
        hasMeaningfulText(values.t2Description) &&
        (hasMeaningfulText(values.diffusionDescription) || hasMeaningfulText(values.adcDescription)));
    const statusDetailsComplete = (statusKey: string, detailsKey: string): boolean => {
      const status = textValue(values[statusKey]);
      return (
        addressed(values[statusKey]) &&
        (!['present', 'indeterminate'].includes(status) || hasMeaningfulText(values[detailsKey]))
      );
    };

    return score('Report completeness', [
      {
        label: 'Clinical indication and examination purpose addressed',
        complete: hasMeaningfulText(values.clinicalIndication) && addressed(values.examPurpose),
        missingLabel: 'Clinical indication or examination purpose missing',
      },
      {
        label: 'Protocol and technical quality addressed',
        complete: hasMeaningfulText(values.modalityProtocol) && addressed(values.examQuality),
        missingLabel: 'MRI protocol or examination quality missing',
      },
      {
        label: 'Prostate dimensions or volume entered',
        complete:
          hasAny(values, ['prostateVolumeMl']) ||
          ['glandApMm', 'glandTrMm', 'glandCcMm'].every((key) => hasValue(values[key])),
        missingLabel: 'Prostate dimensions or entered volume missing',
      },
      {
        label: 'Index lesion characterized when applicable',
        complete: addressed(values.lesionAssessment) && lesionDetailsComplete,
        missingLabel:
          lesionStatus === 'present' || lesionStatus === 'indeterminate'
            ? 'Index lesion location, zone, size, or sequence findings missing'
            : 'Prostate lesion assessment missing',
      },
      {
        label: 'Additional lesions addressed',
        complete: statusDetailsComplete('additionalLesions', 'additionalLesionDetails'),
        missingLabel: 'Additional lesion assessment/details incomplete',
      },
      {
        label: 'Local extension addressed',
        complete:
          statusDetailsComplete('extracapsularExtension', 'extracapsularExtensionDetails') &&
          statusDetailsComplete('neurovascularBundleInvolvement', 'neurovascularBundleDetails') &&
          statusDetailsComplete('seminalVesicleInvasion', 'seminalVesicleDetails') &&
          statusDetailsComplete('bladderNeckInvasion', 'bladderNeckDetails'),
        missingLabel: 'Extraprostatic, neurovascular, seminal vesicle, or bladder neck assessment incomplete',
      },
      {
        label: 'Nodes and bone addressed',
        complete:
          statusDetailsComplete('suspiciousNodes', 'suspiciousNodeDetails') &&
          statusDetailsComplete('osseousMetastases', 'osseousMetastasisDetails'),
        missingLabel: 'Nodal or osseous metastatic assessment/details incomplete',
      },
      {
        label: 'Impression generated',
        complete: hasMeaningfulText(report.impression),
        missingLabel: 'Impression incomplete',
      },
      optionalFindingCheck(
        'Incidental findings addressed',
        values.incidentalFindings,
        report.incidentalFindings,
        'No incidental finding entered',
        'Incidental finding documented',
      ),
    ]);
  }

  if (moduleType === 'renalMass') {
    const massStatus = textValue(values.renalMass);
    const massComplete =
      !['present', 'indeterminate'].includes(massStatus) ||
      (addressed(values.laterality) &&
        addressed(values.poleLocation) &&
        hasAny(values, ['massApMm', 'massTrMm', 'massCcMm']) &&
        addressed(values.composition) &&
        addressed(values.enhancement));
    const statusDetailsComplete = (statusKey: string, detailsKey?: string): boolean => {
      const status = textValue(values[statusKey]);
      return addressed(values[statusKey]) &&
        (!detailsKey || !['present', 'indeterminate'].includes(status) || hasMeaningfulText(values[detailsKey]));
    };
    return score('Report completeness', [
      { label: 'Clinical indication addressed', complete: hasMeaningfulText(values.clinicalIndication), missingLabel: 'Clinical indication missing' },
      { label: 'Protocol and technical quality addressed', complete: hasMeaningfulText(values.modalityProtocol) && addressed(values.examQuality), missingLabel: 'Protocol or examination quality missing' },
      { label: 'Primary renal lesion characterized', complete: addressed(values.renalMass) && massComplete, missingLabel: massStatus === 'present' || massStatus === 'indeterminate' ? 'Lesion side, location, size, composition, or enhancement missing' : 'Renal mass assessment missing' },
      {
        label: 'Local extension and venous involvement addressed',
        complete:
          statusDetailsComplete('renalSinusInvolvement') &&
          statusDetailsComplete('collectingSystemInvolvement') &&
          statusDetailsComplete('renalVeinThrombus', 'renalVeinThrombusDetails') &&
          statusDetailsComplete('ivcThrombus', 'ivcThrombusDetails') &&
          statusDetailsComplete('perinephricExtension', 'perinephricExtensionDetails') &&
          statusDetailsComplete('adjacentOrganInvasion', 'adjacentOrganDetails'),
        missingLabel: 'Local extension or venous involvement assessment/details incomplete',
      },
      {
        label: 'Multifocal disease, nodes, and metastases addressed',
        complete:
          statusDetailsComplete('multifocalDisease', 'multifocalDetails') &&
          statusDetailsComplete('suspiciousNodes', 'suspiciousNodeDetails') &&
          statusDetailsComplete('distantMetastases', 'distantMetastasisDetails'),
        missingLabel: 'Multifocal, nodal, or metastatic assessment/details incomplete',
      },
      { label: 'Contralateral kidney addressed', complete: hasMeaningfulText(values.contralateralKidney), missingLabel: 'Contralateral kidney not documented' },
      { label: 'Impression generated', complete: hasMeaningfulText(report.impression), missingLabel: 'Impression incomplete' },
      optionalFindingCheck('Incidental findings addressed', values.incidentalFindings, report.incidentalFindings, 'No incidental finding entered', 'Incidental finding documented'),
    ]);
  }

  if (moduleType === 'hccLiver') {
    const observationStatus = textValue(values.observationStatus);
    const observationComplete =
      !['present', 'indeterminate'].includes(observationStatus) ||
      (hasMeaningfulText(values.observationNumber) &&
        hasMeaningfulText(values.segment) &&
        hasAny(values, ['sizeApMm', 'sizeTrMm', 'sizeCcMm']) &&
        addressed(values.treatmentStatus) &&
        addressed(values.arterialEnhancement) &&
        addressed(values.washout) &&
        addressed(values.capsule) &&
        addressed(values.thresholdGrowth));
    const statusDetailsComplete = (statusKey: string, detailsKey?: string) => {
      const status = textValue(values[statusKey]);
      return addressed(values[statusKey]) &&
        (!detailsKey || !['present', 'indeterminate'].includes(status) || hasMeaningfulText(values[detailsKey]));
    };
    return score('Report completeness', [
      { label: 'Clinical indication and HCC risk context addressed', complete: hasMeaningfulText(values.clinicalIndication) && hasMeaningfulText(values.riskContext), missingLabel: 'Clinical indication or HCC risk context missing' },
      {
        label: 'Protocol quality and phase adequacy addressed',
        complete: hasMeaningfulText(values.modalityProtocol) && addressed(values.examQuality) &&
          addressed(values.arterialPhaseAdequacy) && addressed(values.portalVenousPhaseAdequacy) &&
          addressed(values.delayedPhaseAdequacy),
        missingLabel: 'Protocol, quality, or phase adequacy missing',
      },
      { label: 'Dominant observation characterized', complete: addressed(values.observationStatus) && observationComplete, missingLabel: observationStatus === 'present' || observationStatus === 'indeterminate' ? 'Observation identifier, segment, size, treatment status, or major features missing' : 'Focal observation assessment missing' },
      { label: 'Tumor in vein addressed', complete: statusDetailsComplete('tumorInVein', 'tumorInVeinDetails'), missingLabel: 'Tumor-in-vein assessment/details incomplete' },
      { label: 'Portal hypertension addressed', complete: statusDetailsComplete('portalHypertension', 'portalHypertensionDetails'), missingLabel: 'Portal hypertension assessment/details incomplete' },
      {
        label: 'Nodes and extrahepatic disease addressed',
        complete: statusDetailsComplete('suspiciousNodes', 'suspiciousNodeDetails') &&
          statusDetailsComplete('extrahepaticMetastases', 'extrahepaticMetastasisDetails'),
        missingLabel: 'Nodal or extrahepatic metastatic assessment/details incomplete',
      },
      { label: 'Impression generated', complete: hasMeaningfulText(report.impression), missingLabel: 'Impression incomplete' },
      optionalFindingCheck('Incidental findings addressed', values.incidentalFindings, report.incidentalFindings, 'No incidental finding entered', 'Incidental finding documented'),
    ]);
  }

  if (moduleType === 'hilarCholangiocarcinoma') {
    const lesionStatus = textValue(values.hilarLesion);
    const lesionComplete =
      !['present', 'indeterminate'].includes(lesionStatus) ||
      (hasMeaningfulText(values.ductalEpicenter) && hasMeaningfulText(values.longitudinalExtent) &&
        hasAny(values, ['lesionApMm', 'lesionTrMm', 'lesionCcMm']) &&
        hasMeaningfulText(values.rightDuctExtent) && hasMeaningfulText(values.leftDuctExtent));
    const statusDetailsComplete = (statusKey: string, detailsKey?: string) => {
      const status = textValue(values[statusKey]);
      return addressed(values[statusKey]) &&
        (!detailsKey || !['present', 'indeterminate'].includes(status) || hasMeaningfulText(values[detailsKey]));
    };
    const vesselComplete = (relationshipKey: string, detailsKey: string) => {
      const relationship = textValue(values[relationshipKey]);
      return addressed(values[relationshipKey]) &&
        (!['contact or encasement', 'narrowed', 'occluded', 'indeterminate'].includes(relationship) ||
          hasMeaningfulText(values[detailsKey]));
    };
    return score('Report completeness', [
      { label: 'Clinical indication addressed', complete: hasMeaningfulText(values.clinicalIndication), missingLabel: 'Clinical indication missing' },
      { label: 'Protocol and technical quality addressed', complete: hasMeaningfulText(values.modalityProtocol) && addressed(values.examQuality), missingLabel: 'Protocol or examination quality missing' },
      { label: 'Primary tumor and ductal extent characterized', complete: addressed(values.hilarLesion) && lesionComplete, missingLabel: lesionStatus === 'present' || lesionStatus === 'indeterminate' ? 'Ductal epicenter, longitudinal/right/left extent, or measurement missing' : 'Hilar lesion assessment missing' },
      { label: 'Duct dilation and lobar atrophy addressed', complete: statusDetailsComplete('intrahepaticDuctDilation') && statusDetailsComplete('lobarAtrophy', 'lobarAtrophyDetails'), missingLabel: 'Duct dilation or lobar atrophy assessment/details incomplete' },
      { label: 'Portal vein and hepatic artery relationships addressed', complete: vesselComplete('portalVeinRelationship', 'portalVeinDetails') && vesselComplete('hepaticArteryRelationship', 'hepaticArteryDetails'), missingLabel: 'Portal or arterial relationship/details incomplete' },
      { label: 'Local invasion and nodes addressed', complete: statusDetailsComplete('liverInvasion', 'liverInvasionDetails') && statusDetailsComplete('adjacentOrganInvasion', 'adjacentOrganDetails') && statusDetailsComplete('suspiciousNodes', 'suspiciousNodeDetails'), missingLabel: 'Local invasion or nodal assessment/details incomplete' },
      { label: 'Peritoneal and distant metastases addressed', complete: statusDetailsComplete('peritonealMetastases', 'peritonealMetastasisDetails') && statusDetailsComplete('distantMetastases', 'distantMetastasisDetails'), missingLabel: 'Metastatic disease assessment/details incomplete' },
      { label: 'Impression generated', complete: hasMeaningfulText(report.impression), missingLabel: 'Impression incomplete' },
    ]);
  }

  if (moduleType === 'ovarianCancer') {
    const primaryStatus = textValue(values.adnexalPrimary);
    const primaryComplete = !['present', 'indeterminate'].includes(primaryStatus) ||
      (addressed(values.laterality) && hasMeaningfulText(values.primarySite) &&
        hasAny(values, ['sizeApMm', 'sizeTrMm', 'sizeCcMm']) && hasMeaningfulText(values.morphology));
    const detail = (statusKey: string, detailsKey?: string) => {
      const status = textValue(values[statusKey]);
      return addressed(values[statusKey]) &&
        (!detailsKey || !['present', 'indeterminate'].includes(status) || hasMeaningfulText(values[detailsKey]));
    };
    return score('Report completeness', [
      { label: 'Clinical indication addressed', complete: hasMeaningfulText(values.clinicalIndication), missingLabel: 'Clinical indication missing' },
      { label: 'Protocol and technical quality addressed', complete: hasMeaningfulText(values.modalityProtocol) && addressed(values.examQuality), missingLabel: 'Protocol or examination quality missing' },
      { label: 'Primary adnexal tumor characterized', complete: addressed(values.adnexalPrimary) && primaryComplete, missingLabel: primaryStatus === 'present' || primaryStatus === 'indeterminate' ? 'Primary side, origin, size, or morphology missing' : 'Primary tumor assessment missing' },
      { label: 'Pelvic, omental, and upper abdominal disease addressed', complete: detail('pelvicPeritoneum', 'pelvicPeritoneumDetails') && detail('omentum', 'omentumDetails') && detail('upperAbdominalPeritoneum', 'upperAbdominalDetails'), missingLabel: 'Peritoneal compartment assessment/details incomplete' },
      { label: 'Bowel, mesentery, wall, and diaphragm addressed', complete: detail('bowelMesentery', 'bowelMesenteryDetails') && detail('abdominalWallDiaphragm', 'abdominalWallDiaphragmDetails'), missingLabel: 'Bowel/mesenteric or wall/diaphragm assessment incomplete' },
      { label: 'Nodes, pleura, and distant disease addressed', complete: detail('suspiciousNodes', 'suspiciousNodeDetails') && detail('pleuralDisease', 'pleuralDiseaseDetails') && detail('distantMetastases', 'distantMetastasisDetails'), missingLabel: 'Nodal, pleural, or distant metastatic assessment incomplete' },
      { label: 'Impression generated', complete: hasMeaningfulText(report.impression), missingLabel: 'Impression incomplete' },
    ]);
  }

  if (moduleType === 'endometrialCancerMri') {
    const tumorStatus = textValue(values.uterineTumor);
    const tumorComplete = !['present', 'indeterminate'].includes(tumorStatus) ||
      (hasMeaningfulText(values.tumorLocation) && hasAny(values, ['tumorApMm', 'tumorTrMm', 'tumorCcMm']) &&
        hasMeaningfulText(values.tumorMorphology));
    const detail = (statusKey: string, detailsKey?: string) => {
      const status = textValue(values[statusKey]);
      return addressed(values[statusKey]) &&
        (!detailsKey || !['present', 'indeterminate'].includes(status) || hasMeaningfulText(values[detailsKey]));
    };
    return score('Report completeness', [
      { label: 'Clinical indication addressed', complete: hasMeaningfulText(values.clinicalIndication), missingLabel: 'Clinical indication missing' },
      { label: 'Protocol and technical quality addressed', complete: hasMeaningfulText(values.modalityProtocol) && addressed(values.examQuality), missingLabel: 'Protocol or examination quality missing' },
      { label: 'Primary uterine tumor characterized', complete: addressed(values.uterineTumor) && tumorComplete, missingLabel: tumorStatus === 'present' || tumorStatus === 'indeterminate' ? 'Tumor location, size, or morphology missing' : 'Primary tumor assessment missing' },
      { label: 'Myometrial and cervical stromal invasion addressed', complete: detail('myometrialInvasion', 'myometrialInvasionDetails') && detail('cervicalStromalInvasion', 'cervicalStromalDetails'), missingLabel: 'Myometrial or cervical stromal invasion assessment/details incomplete' },
      { label: 'Extrauterine pelvic extension addressed', complete: detail('serosalExtension', 'serosalExtensionDetails') && detail('adnexalExtension', 'adnexalExtensionDetails') && detail('vaginalExtension', 'vaginalExtensionDetails') && detail('parametrialExtension', 'parametrialExtensionDetails') && detail('bladderRectalInvasion', 'bladderRectalDetails'), missingLabel: 'Extrauterine pelvic extension assessment/details incomplete' },
      { label: 'Nodes and distant disease addressed', complete: detail('pelvicNodes', 'pelvicNodeDetails') && detail('paraAorticNodes', 'paraAorticNodeDetails') && detail('distantMetastases', 'distantMetastasisDetails'), missingLabel: 'Nodal or distant metastatic assessment/details incomplete' },
      { label: 'Impression generated', complete: hasMeaningfulText(report.impression), missingLabel: 'Impression incomplete' },
    ]);
  }

  if (moduleType === 'cervicalCancerMri') {
    const tumorStatus = textValue(values.cervicalTumor);
    const tumorComplete = !['present', 'indeterminate'].includes(tumorStatus) ||
      (hasMeaningfulText(values.tumorEpicenter) && hasAny(values, ['tumorApMm', 'tumorTrMm', 'tumorCcMm']) &&
        hasMeaningfulText(values.tumorMorphology));
    const detail = (statusKey: string, detailsKey?: string) => {
      const status = textValue(values[statusKey]);
      return addressed(values[statusKey]) &&
        (!detailsKey || !['present', 'indeterminate'].includes(status) || hasMeaningfulText(values[detailsKey]));
    };
    return score('Report completeness', [
      { label: 'Clinical indication addressed', complete: hasMeaningfulText(values.clinicalIndication), missingLabel: 'Clinical indication missing' },
      { label: 'Protocol and technical quality addressed', complete: hasMeaningfulText(values.modalityProtocol) && addressed(values.examQuality), missingLabel: 'Protocol or examination quality missing' },
      { label: 'Primary cervical tumor characterized', complete: addressed(values.cervicalTumor) && tumorComplete, missingLabel: tumorStatus === 'present' || tumorStatus === 'indeterminate' ? 'Tumor epicenter, size, or morphology missing' : 'Primary tumor assessment missing' },
      { label: 'Vaginal and parametrial extent addressed', complete: detail('uterineExtension', 'uterineExtensionDetails') && detail('vaginalInvolvement', 'vaginalInvolvementDetails') && detail('parametrialInvolvement', 'parametrialDetails'), missingLabel: 'Uterine, vaginal, or parametrial assessment/details incomplete' },
      { label: 'Sidewall, adjacent organs, and urinary obstruction addressed', complete: detail('pelvicSidewallInvolvement', 'pelvicSidewallDetails') && detail('bladderInvasion', 'bladderInvasionDetails') && detail('rectalInvasion', 'rectalInvasionDetails') && detail('uretericObstruction', 'uretericObstructionDetails'), missingLabel: 'Sidewall, bladder/rectum, or urinary obstruction assessment incomplete' },
      { label: 'Nodes and distant disease addressed', complete: detail('pelvicNodes', 'pelvicNodeDetails') && detail('paraAorticNodes', 'paraAorticNodeDetails') && detail('distantMetastases', 'distantMetastasisDetails'), missingLabel: 'Nodal or distant metastatic assessment/details incomplete' },
      { label: 'Impression generated', complete: hasMeaningfulText(report.impression), missingLabel: 'Impression incomplete' },
    ]);
  }

  if (moduleType === 'lungCancerCt') {
    const tumorStatus = textValue(values.primaryTumor);
    const tumorComplete = !['present', 'indeterminate'].includes(tumorStatus) ||
      (hasMeaningfulText(values.primaryLobe) && hasMeaningfulText(values.primaryLocation) &&
        hasAny(values, ['tumorApMm', 'tumorTrMm', 'tumorCcMm']) && hasMeaningfulText(values.tumorMorphology));
    const detail = (statusKey: string, detailsKey?: string) => {
      const status = textValue(values[statusKey]);
      return addressed(values[statusKey]) &&
        (!detailsKey || !['present', 'indeterminate'].includes(status) || hasMeaningfulText(values[detailsKey]));
    };
    return score('Report completeness', [
      { label: 'Clinical indication addressed', complete: hasMeaningfulText(values.clinicalIndication), missingLabel: 'Clinical indication missing' },
      { label: 'Protocol and technical quality addressed', complete: hasMeaningfulText(values.modalityProtocol) && addressed(values.examQuality), missingLabel: 'Protocol or examination quality missing' },
      { label: 'Primary lung tumor characterized', complete: addressed(values.primaryTumor) && tumorComplete, missingLabel: tumorStatus === 'present' || tumorStatus === 'indeterminate' ? 'Primary lobe, location, size, or morphology missing' : 'Primary tumor assessment missing' },
      { label: 'Airway and local invasion addressed', complete: detail('airwayObstruction', 'airwayObstructionDetails') && detail('visceralPleuralInvasion', 'visceralPleuralDetails') && detail('chestWallInvasion', 'chestWallDetails') && detail('mediastinalInvasion', 'mediastinalDetails') && detail('diaphragmaticInvasion', 'diaphragmaticDetails') && detail('cardiacGreatVesselInvasion', 'cardiacGreatVesselDetails'), missingLabel: 'Airway or local invasion assessment/details incomplete' },
      { label: 'Separate pulmonary nodules addressed', complete: detail('sameLobeNodules', 'sameLobeNoduleDetails') && detail('ipsilateralOtherLobeNodules', 'ipsilateralOtherLobeDetails') && detail('contralateralLungNodules', 'contralateralNoduleDetails'), missingLabel: 'Separate pulmonary nodule assessment/details incomplete' },
      { label: 'Nodes, pleura, and pericardium addressed', complete: detail('suspiciousNodes', 'suspiciousNodeDetails') && detail('pleuralDisease', 'pleuralDiseaseDetails') && detail('pericardialDisease', 'pericardialDiseaseDetails'), missingLabel: 'Nodal, pleural, or pericardial assessment/details incomplete' },
      { label: 'Distant metastatic sites addressed', complete: detail('adrenalMetastases', 'adrenalMetastasisDetails') && detail('liverMetastases', 'liverMetastasisDetails') && detail('boneMetastases', 'boneMetastasisDetails') && detail('otherDistantMetastases', 'otherDistantMetastasisDetails'), missingLabel: 'Distant metastatic site assessment/details incomplete' },
      { label: 'Impression generated', complete: hasMeaningfulText(report.impression), missingLabel: 'Impression incomplete' },
    ]);
  }

  if (moduleType === 'thyroidUltrasound') {
    const noduleStatus = textValue(values.dominantNodule);
    const noduleComplete = !['present', 'indeterminate'].includes(noduleStatus) ||
      (hasMeaningfulText(values.noduleIdentifier) && addressed(values.noduleSide) &&
        hasMeaningfulText(values.noduleLocation) && hasAny(values, ['noduleApMm', 'noduleTrMm', 'noduleCcMm']) &&
        addressedAny(values, ['composition']) && addressedAny(values, ['echogenicity']) &&
        addressedAny(values, ['shape']) && addressedAny(values, ['margins']) && addressedAny(values, ['echogenicFoci']));
    const nodeStatus = textValue(values.cervicalNodes);
    const extensionStatus = textValue(values.extrathyroidalExtension);
    const intervalStatus = textValue(values.intervalChange);
    return score('Report completeness', [
      { label: 'Clinical indication addressed', complete: hasMeaningfulText(values.clinicalIndication), missingLabel: 'Clinical indication missing' },
      { label: 'Technique and examination quality addressed', complete: hasMeaningfulText(values.modalityProtocol) && addressed(values.examQuality), missingLabel: 'Technique or examination quality missing' },
      { label: 'Thyroid gland background addressed', complete: hasMeaningfulText(values.glandBackground) && hasMeaningfulText(values.rightLobeSize) && hasMeaningfulText(values.leftLobeSize), missingLabel: 'Gland background or lobe measurements missing' },
      { label: 'Clinically relevant nodule characterized', complete: addressed(values.dominantNodule) && noduleComplete, missingLabel: noduleStatus === 'present' || noduleStatus === 'indeterminate' ? 'Nodule identifier, location, size, or descriptors missing' : 'Nodule assessment missing' },
      { label: 'Extrathyroidal extension and interval change addressed', complete: (!['present', 'indeterminate'].includes(noduleStatus) || (addressed(values.extrathyroidalExtension) && (!['present', 'indeterminate'].includes(extensionStatus) || hasMeaningfulText(values.extrathyroidalExtensionDetails)) && addressed(values.intervalChange) && (!['new', 'increased', 'stable', 'decreased'].includes(intervalStatus) || hasMeaningfulText(values.intervalChangeDetails)))), missingLabel: 'Extrathyroidal extension or interval change assessment/details incomplete' },
      { label: 'Cervical lymph nodes addressed', complete: addressed(values.cervicalNodes) && (!['present', 'indeterminate'].includes(nodeStatus) || hasMeaningfulText(values.cervicalNodeDetails)), missingLabel: 'Cervical node assessment/details incomplete' },
      { label: 'Impression generated', complete: hasMeaningfulText(report.impression), missingLabel: 'Impression incomplete' },
    ]);
  }

  if (moduleType === 'chestXray') {
    const airspaceAddressed = addressedAny(values, ['consolidation', 'atelectaticChange', 'interstitialEdema']) || hasFreeTextCoverage(values);
    const pleuraAddressed = addressedAny(values, ['pleuralEffusion', 'pneumothorax']) || hasFreeTextCoverage(values);
    return score('Report completeness', [
      {
        label: 'Study quality or technique addressed',
        complete: addressed(values.studyQuality) || hasMeaningfulText(values.technique) || hasFreeTextCoverage(values),
        missingLabel: 'Study quality/technique not addressed',
      },
      {
        label: 'Cardiomediastinal silhouette addressed',
        complete: addressed(values.cardiomediastinalSilhouette) || hasFreeTextCoverage(values),
        missingLabel: 'Cardiomediastinal silhouette not addressed',
      },
      {
        label: 'Lung/airspace findings addressed',
        complete: airspaceAddressed,
        missingLabel: 'Airspace/edema findings not addressed',
      },
      {
        label: 'Pleura/pneumothorax addressed',
        complete: pleuraAddressed,
        missingLabel: 'Pleural effusion/pneumothorax not addressed',
      },
      {
        label: 'Impression generated',
        complete: hasMeaningfulText(report.impression),
        missingLabel: 'Impression incomplete',
      },
    ]);
  }

  if (moduleType === 'mskXrayFracture') {
    return score('Report completeness', [
      {
        label: 'Body part/laterality addressed',
        complete: hasMeaningfulText(values.bodyPart) && addressed(values.laterality),
        missingLabel: 'Body part or laterality missing',
      },
      {
        label: 'Fracture status addressed',
        complete: addressed(values.fracture),
        missingLabel: 'Fracture status not addressed',
      },
      {
        label: 'Alignment/dislocation addressed',
        complete: addressed(values.jointAlignment),
        missingLabel: 'Alignment/dislocation not addressed',
      },
      {
        label: 'Soft tissue/joint effusion addressed',
        complete: addressed(values.softTissueEffusion) || hasFreeTextCoverage(values),
        missingLabel: 'Soft tissue/effusion status not addressed',
      },
      {
        label: 'Impression generated',
        complete: hasMeaningfulText(report.impression),
        missingLabel: 'Impression incomplete',
      },
    ]);
  }

  if (moduleType === 'ctpa') {
    const peStatus = textValue(values.pePresent);
    const positivePeDetailsComplete =
      peStatus !== 'present' ||
      (addressed(values.embolusAppearance) &&
        addressed(values.laterality) &&
        addressed(values.proximalLevel) &&
        hasMeaningfulText(values.involvedBranches));
    const indeterminateDetailsComplete =
      peStatus !== 'indeterminate' ||
      (addressed(values.indeterminateLevel) && hasMeaningfulText(values.indeterminateLocation));
    const rightHeartAddressed =
      addressed(values.rightHeartSynthesis) ||
      addressedAny(values, [
        'rvDiameterMm',
        'lvDiameterMm',
        'enteredRvLvRatio',
        'septalConfiguration',
        'contrastReflux',
        'mainPulmonaryArteryEnlargement',
      ]) ||
      hasMeaningfulText(values.otherRightHeartFindings);
    const associatedFindingsAddressed =
      addressedAny(values, [
        'pulmonaryInfarct',
        'pleuralEffusion',
        'atelectaticConsolidativeOpacity',
        'pneumothorax',
      ]) || hasAny(values, ['alternativeDiagnosis', 'additionalFindings', 'findingsOverride']);
    const urgentFinding =
      ['present', 'indeterminate', 'not-adequately-assessed'].includes(peStatus) ||
      textValue(values.examQuality) === 'nondiagnostic' ||
      textValue(values.pneumothorax) === 'present';
    const communicationComplete =
      !urgentFinding ||
      (addressed(values.communicationStatus) &&
        (textValue(values.communicationStatus) !== 'occurred' ||
          (hasMeaningfulText(values.communicationRecipient) &&
            hasMeaningfulText(values.communicationDate) &&
            hasMeaningfulText(values.communicationTime) &&
            hasMeaningfulText(values.communicationMethod))));

    return score('Report completeness', [
      {
        label: 'Clinical indication addressed',
        complete: hasMeaningfulText(values.clinicalIndication),
        missingLabel: 'Clinical indication not entered',
      },
      {
        label: 'Technical quality addressed',
        complete:
          addressed(values.contrastOpacification) &&
          addressed(values.examQuality) &&
          addressed(values.respiratoryMotion) &&
          addressed(values.bolusTimingArtifact),
        missingLabel: 'Contrast quality, diagnostic quality, motion, or bolus timing not addressed',
      },
      {
        label: 'PE assessment and distribution complete',
        complete: addressed(values.pePresent) && positivePeDetailsComplete && indeterminateDetailsComplete,
        missingLabel:
          peStatus === 'present'
            ? 'Positive PE appearance/distribution incomplete'
            : peStatus === 'indeterminate'
              ? 'Indeterminate filling-defect detail incomplete'
              : 'PE assessment not entered',
      },
      {
        label: 'Right-heart findings addressed',
        complete: rightHeartAddressed,
        missingLabel: 'Right-heart assessment not entered',
      },
      {
        label: 'Associated findings addressed',
        complete: associatedFindingsAddressed,
        missingLabel: 'Complications/associated thoracic findings not addressed',
      },
      {
        label: 'Impression generated',
        complete: hasMeaningfulText(report.impression),
        missingLabel: 'Impression incomplete',
      },
      {
        label: 'Urgent communication status addressed when applicable',
        complete: communicationComplete,
        missingLabel: 'Critical-result communication status/details incomplete',
      },
      optionalFindingCheck('Incidental follow-up addressed if present', values.incidentalFindings, report.incidentalFindings, 'No incidental finding entered', 'Incidental finding/follow-up documented'),
    ]);
  }

  if (moduleType === 'nodule') {
    return score('Report completeness', [
      {
        label: 'Guideline applicability context addressed',
        complete: hasAny(values, ['patientAge', 'knownMalignancy', 'immunocompromised', 'patientRisk']) && hasMeaningfulText(values.guidelineEligibility),
        missingLabel: 'Applicability context not addressed',
      },
      {
        label: 'Protocol, quality, nodule type/count addressed',
        complete: hasMeaningfulText(values.modalityProtocol) && addressed(values.examQuality) && addressed(values.noduleType) && addressed(values.numberOfNodules),
        missingLabel: 'Nodule type/count not addressed',
      },
      {
        label: 'Size/location addressed',
        complete: hasAny(values, ['sizeMm', 'longAxisMm', 'shortAxisMm', 'volumeMm3']) && hasMeaningfulText(values.location) && hasMeaningfulText(values.seriesImage),
        missingLabel: 'Nodule size/location not addressed',
      },
      {
        label: 'Morphology and dated comparison addressed',
        complete: addressed(values.morphology) && addressed(values.stability) && (textValue(values.priorImagingAvailable) !== 'yes' || hasAny(values, ['comparisonStudy', 'comparisonDate'])),
        missingLabel: 'Morphology, stability, or dated comparison not addressed',
      },
      {
        label: 'Impression generated',
        complete: hasMeaningfulText(report.impression),
        missingLabel: 'Impression incomplete',
      },
    ]);
  }

  if (moduleType === 'stroke') {
    return score('Report completeness', [
      {
        label: 'Hemorrhage addressed',
        complete: addressed(values.hemorrhagePresent) || hasReportText(report, /hemorrhage/i),
        missingLabel: 'Hemorrhage not addressed',
      },
      {
        label: 'Early ischemic change/ASPECTS addressed',
        complete: addressed(values.earlyIschemicChangePresent) || hasValue(values.aspectsRegions) || hasReportText(report, /ASPECTS|ischemic|infarct/i),
        missingLabel: 'ASPECTS/ischemic change not addressed',
      },
      {
        label: 'Mass effect/shift addressed',
        complete: addressed(values.massEffect) || hasAny(values, ['midlineShiftMm']) || hasReportText(report, /mass effect|midline shift/i),
        missingLabel: 'Mass effect/shift not addressed',
      },
      {
        label: 'LVO/clinical context addressed',
        complete: addressed(values.largeVesselOcclusionSuspected) || hasAny(values, ['clinicalIndication']) || hasFreeTextCoverage(values),
        missingLabel: 'LVO/context not addressed',
      },
      {
        label: 'Impression generated',
        complete: hasMeaningfulText(report.impression),
        missingLabel: 'Impression incomplete',
      },
    ]);
  }

  if (moduleType === 'appendicitis') {
    const combinedReportText = [report.findings, report.impression].filter(Boolean).join(' ');
    const alternativeReportMention =
      /alternative (finding|diagnosis)/i.test(combinedReportText) &&
      !/alternative (finding|diagnosis):?\s*(none|no|negative)/i.test(combinedReportText);
    const alternativeEntered = hasMeaningfulText(values.alternativeDiagnosis) || alternativeReportMention;
    return score('Report completeness', [
      {
        label: 'Appendix visualization/diameter addressed',
        complete: hasAny(values, ['appendixVisualized']) && (textValue(values.appendixVisualized) === 'no' || hasAny(values, ['appendixDiameterMm']) || hasReportText(report, /normal in caliber|not confidently visualized/i)),
        missingLabel: 'Appendix visualization/diameter not addressed',
      },
      { label: 'Inflammatory changes addressed', complete: hasAny(values, ['fatStranding', 'wallThickeningEnhancement']) || hasReportText(report, /inflammatory|stranding|wall thickening/i), missingLabel: 'Inflammatory changes not addressed' },
      {
        label: 'Abscess/perforation addressed',
        complete: hasAny(values, ['abscessPhlegmon', 'freeAirPerforation']) || hasKeyNegative(values, 'abscess') || hasKeyNegative(values, 'perforation') || hasReportText(report, /abscess|perforation|free air/i),
        missingLabel: 'Abscess/perforation not addressed',
      },
      {
        label: 'Bowel obstruction addressed',
        complete: hasAny(values, ['obstructionIleus']) || hasKeyNegative(values, 'bowel obstruction') || hasReportText(report, /bowel obstruction|ileus/i),
        missingLabel: 'Bowel obstruction not addressed',
      },
      {
        label: 'Alternative diagnosis addressed',
        complete: true,
        completeLabel: alternativeEntered ? 'Alternative diagnosis documented' : 'No alternative diagnosis entered',
      },
      optionalFindingCheck('Incidental findings addressed', values.incidentalFindings, report.incidentalFindings, 'No incidental finding entered', 'Incidental finding/follow-up documented'),
    ]);
  }

  return score('Report completeness', [
    { label: 'Findings generated', complete: hasValue(report.findings) },
    { label: 'Impression generated', complete: hasValue(report.impression) },
    { label: 'Key negatives/complications considered', complete: hasAny(values, ['keyNegatives']) || /no /i.test(report.findings + report.impression) },
    optionalFindingCheck('Incidental follow-up addressed if present', values.incidentalFindings, report.incidentalFindings, 'No incidental finding entered', 'Incidental finding/follow-up documented'),
  ]);
}

export function scoreFollowUpSafety(sentence: string): QualityScore {
  const text = sentence.toLowerCase();
  const noFollowUp = /no (specific |routine )?(imaging )?follow-up/.test(text);
  const actionPresent = /follow-up|consider|recommend|surveillance|characterization|correlation/.test(text);
  const modalityPresent = /ct|mri|ultrasound|pet\/ct|x-ray|mrcp|adrenal protocol|renal protocol|thyroid ultrasound|chest/.test(text) || noFollowUp;
  const intervalPresent = /\b(3|6|9|12|18|24)[ -]?(month|months)|6-12|18-24|local protocol|no specific|further characterization/.test(text);
  const warningPresent = /guideline|applicability|protocol|verification|clinically appropriate/.test(text);

  return score('Follow-up safety', [
    { label: 'Follow-up recommendation present', complete: actionPresent, missingLabel: 'Follow-up recommendation missing' },
    { label: 'Modality specified when applicable', complete: modalityPresent, missingLabel: 'Follow-up modality missing' },
    { label: 'Interval specified if applicable', complete: intervalPresent || noFollowUp, missingLabel: 'Follow-up interval missing' },
    { label: 'Applicability/verification warning shown', complete: warningPresent, missingLabel: 'Applicability warning missing' },
  ]);
}
