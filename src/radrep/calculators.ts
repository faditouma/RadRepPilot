import {
  calculateAspects,
  calculateRvLvRatio,
  generateAspectsSentence,
  generateFleischnerSentence,
} from './reportLogic';
import type { CalculatorResult, CalculatorValueMap, NoduleFormState } from './types';

function numberValue(values: CalculatorValueMap, id: string): number | null {
  const raw = values[id];
  const parsed = typeof raw === 'string' ? Number.parseFloat(raw) : Number.NaN;
  return Number.isFinite(parsed) ? parsed : null;
}

function stringValue(values: CalculatorValueMap, id: string): string {
  const raw = values[id];
  return typeof raw === 'string' ? raw : '';
}

function arrayValue(values: CalculatorValueMap, id: string): string[] {
  const raw = values[id];
  return Array.isArray(raw) ? raw : [];
}

function fmt(value: number, digits = 1): string {
  return value.toFixed(digits).replace(/\.0$/, '');
}

export function computeRvLv(values: CalculatorValueMap): CalculatorResult {
  const ratio = calculateRvLvRatio(stringValue(values, 'rvDiameterMm'), stringValue(values, 'lvDiameterMm'));
  if (ratio === null) {
    return {
      summary: 'Enter RV and LV diameters to calculate the ratio.',
      sentence: 'RV/LV ratio cannot be calculated from the provided measurements.',
    };
  }

  const strain = ratio > 1 ? 'with' : 'without';
  return {
    summary: `RV/LV ratio: ${ratio.toFixed(2)}`,
    sentence: `RV/LV ratio is ${ratio.toFixed(2)}, ${strain} CT evidence of right heart strain in the appropriate clinical context.`,
  };
}

export function computeAspects(values: CalculatorValueMap): CalculatorResult {
  const regions = arrayValue(values, 'regions');
  const score = calculateAspects(regions as never[]);
  const side = stringValue(values, 'side') || 'right';

  if (regions.length === 0) {
    return {
      summary: 'ASPECTS: 10',
      sentence: 'ASPECTS score is 10, if clinically applicable.',
    };
  }

  return {
    summary: `ASPECTS: ${score}`,
    sentence: generateAspectsSentence(score, side, regions as never[]).replace(/\.$/, ` in the ${side} MCA territory.`),
  };
}

export function computeFleischner(values: CalculatorValueMap): CalculatorResult {
  const form: NoduleFormState = {
    patientAge: stringValue(values, 'patientAge'),
    knownMalignancy: stringValue(values, 'knownMalignancy') === 'yes' ? 'yes' : 'no',
    immunocompromised: stringValue(values, 'immunocompromised') === 'yes' ? 'yes' : 'no',
    noduleType: (stringValue(values, 'noduleType') || 'solid') as NoduleFormState['noduleType'],
    numberOfNodules: (stringValue(values, 'numberOfNodules') || 'solitary') as NoduleFormState['numberOfNodules'],
    sizeMm: stringValue(values, 'sizeMm'),
    location: stringValue(values, 'location'),
    morphology: (stringValue(values, 'morphology') || 'smooth') as NoduleFormState['morphology'],
    patientRisk: (stringValue(values, 'patientRisk') || 'low risk') as NoduleFormState['patientRisk'],
    priorImagingAvailable: 'no',
    stability: 'unknown',
    additionalFindings: '',
  };

  return {
    summary: 'Simplified Fleischner sentence ready',
    sentence: generateFleischnerSentence(form),
    warning: 'Fleischner guidance may not apply to patients <35, known cancer, or immunocompromised patients.',
  };
}

export function computeAdrenalWashout(values: CalculatorValueMap): CalculatorResult {
  const noncontrast = numberValue(values, 'noncontrastHu');
  const enhanced = numberValue(values, 'enhancedHu');
  const delayed = numberValue(values, 'delayedHu');

  if (noncontrast === null || enhanced === null || delayed === null || enhanced === noncontrast || enhanced === 0) {
    return {
      summary: 'Enter valid noncontrast, enhanced, and delayed HU values.',
      sentence: 'Adrenal washout cannot be calculated from the provided HU values.',
      warning: 'Simplified washout logic requires correct phase timing and radiologist verification.',
    };
  }

  const absolute = ((enhanced - delayed) / (enhanced - noncontrast)) * 100;
  const relative = ((enhanced - delayed) / enhanced) * 100;
  const compatible = absolute >= 60 || relative >= 40;

  return {
    summary: `Absolute washout ${fmt(absolute)}%; relative washout ${fmt(relative)}%.`,
    sentence: `Adrenal washout: absolute ${fmt(absolute)}%, relative ${fmt(relative)}%. Findings are ${
      compatible ? 'compatible' : 'not definitively compatible'
    } with adrenal adenoma based on washout thresholds, requiring radiologist verification.`,
    warning: 'Simplified prototype thresholds: absolute washout >=60% or relative washout >=40% suggests adenoma.',
  };
}

export function computeBosniak(values: CalculatorValueMap): CalculatorResult {
  const simple = stringValue(values, 'simpleCyst') === 'yes';
  const septa = stringValue(values, 'septa');
  const thickening = stringValue(values, 'thickening');
  const calcification = stringValue(values, 'calcification');
  const enhancement = stringValue(values, 'enhancement');
  const nodule = stringValue(values, 'nodularComponent') === 'yes';

  let category = 'IIF';
  if (simple || (septa === 'none' && thickening === 'none' && enhancement === 'none' && !nodule)) {
    category = 'I';
  } else if (nodule) {
    category = 'IV';
  } else if (enhancement === 'measurable' && (thickening === 'thick irregular' || septa === 'multiple')) {
    category = 'III';
  } else if (septa === 'few' && (thickening === 'thin' || thickening === 'none') && !nodule) {
    category = calcification === 'thick/nodular' || enhancement === 'perceived' ? 'IIF' : 'II';
  }

  return {
    summary: `Simplified Bosniak suggestion: ${category}`,
    sentence: `Renal cystic lesion features suggest Bosniak ${category} in this simplified prototype; final classification requires radiologist verification.`,
    warning: 'This helper is not a definitive Bosniak classifier and does not replace radiologist review of enhancement and morphology.',
  };
}

export function computeTirads(values: CalculatorValueMap): CalculatorResult {
  const pointsByValue: Record<string, number> = {
    cystic: 0,
    spongiform: 0,
    mixed: 1,
    solid: 2,
    anechoic: 0,
    iso_hyperechoic: 1,
    hypoechoic: 2,
    very_hypoechoic: 3,
    wider_than_tall: 0,
    taller_than_wide: 3,
    smooth: 0,
    ill_defined: 0,
    lobulated_irregular: 2,
    extrathyroidal_extension: 3,
    none: 0,
    comet_tail: 0,
    macrocalcifications: 1,
    peripheral_calcifications: 2,
    punctate_foci: 3,
  };

  const total =
    (pointsByValue[stringValue(values, 'composition')] ?? 0) +
    (pointsByValue[stringValue(values, 'echogenicity')] ?? 0) +
    (pointsByValue[stringValue(values, 'shape')] ?? 0) +
    (pointsByValue[stringValue(values, 'margin')] ?? 0) +
    (pointsByValue[stringValue(values, 'echogenicFoci')] ?? 0);

  const tr = total <= 1 ? 'TR1' : total === 2 ? 'TR2' : total === 3 ? 'TR3' : total <= 6 ? 'TR4' : 'TR5';
  const size = stringValue(values, 'sizeCm') || 'unspecified';

  return {
    summary: `${total} points, ${tr}`,
    sentence: `Thyroid nodule measures ${size} cm and scores ${total} points, corresponding to ${tr} in this simplified prototype. Follow-up/FNA recommendation requires verification against current ACR TI-RADS criteria.`,
    warning: 'Simplified scoring only; verify against current ACR TI-RADS criteria and local reporting practice.',
  };
}

export function computeRecist(values: CalculatorValueMap): CalculatorResult {
  let baseline = 0;
  let current = 0;
  let lesionCount = 0;

  for (let index = 1; index <= 5; index += 1) {
    const base = numberValue(values, `lesion${index}Baseline`);
    const now = numberValue(values, `lesion${index}Current`);
    if (base !== null || now !== null) {
      lesionCount += 1;
      baseline += base ?? 0;
      current += now ?? 0;
    }
  }

  if (lesionCount === 0 || baseline <= 0) {
    return {
      summary: 'Enter at least one baseline and current target lesion measurement.',
      sentence: 'RECIST target lesion change cannot be calculated from the provided measurements.',
      warning: 'This basic tracker does not evaluate non-target lesions or new lesions.',
    };
  }

  const percent = ((current - baseline) / baseline) * 100;
  const absoluteIncrease = current - baseline;
  const category =
    current === 0 ? 'CR' : percent <= -30 ? 'PR' : percent >= 20 && absoluteIncrease >= 5 ? 'PD' : 'SD';

  return {
    summary: `Sum ${fmt(baseline)} mm to ${fmt(current)} mm (${fmt(percent)}%). ${category}.`,
    sentence: `Sum of target lesions changed from ${fmt(baseline)} mm to ${fmt(current)} mm, representing ${fmt(
      percent,
    )}% change, consistent with ${category} by simplified RECIST 1.1 logic, requiring verification.`,
    warning: 'Simplified RECIST logic only; verify target lesion selection, non-target disease, and new lesions.',
  };
}

export function computeBirads(values: CalculatorValueMap): CalculatorResult {
  const modality = stringValue(values, 'modality') || 'breast imaging';
  const finding = stringValue(values, 'findingType') || 'finding';
  const location = stringValue(values, 'location') || 'specified location';
  const size = stringValue(values, 'size') || 'unspecified size';
  const shape = stringValue(values, 'shape') || 'unspecified shape';
  const margin = stringValue(values, 'margin') || 'unspecified margin';
  const comparison = stringValue(values, 'comparison') || 'no prior';
  const suspicious = stringValue(values, 'suspiciousFeatures') === 'yes';
  const knownMalignancy = stringValue(values, 'knownMalignancy') === 'yes';
  const needsAdditional = stringValue(values, 'needsAdditionalImaging') === 'yes';

  let category = 'BI-RADS 3 placeholder';
  if (needsAdditional) category = 'BI-RADS 0';
  else if (knownMalignancy) category = 'BI-RADS 6';
  else if (finding === 'none') category = 'BI-RADS 1';
  else if (['decreased', 'stable'].includes(comparison) && ['circumscribed', 'obscured'].includes(margin) && !suspicious) category = 'BI-RADS 2';
  else if (margin === 'spiculated' && suspicious) category = 'BI-RADS 5 placeholder';
  else if (['irregular', 'spiculated'].includes(shape) || ['microlobulated', 'indistinct', 'spiculated'].includes(margin) || suspicious) {
    category = 'BI-RADS 4 placeholder';
  }

  return {
    summary: `Suggested category: ${category}`,
    sentence: `${modality} demonstrates ${finding} in the ${location} measuring ${size} with ${shape} shape and ${margin} margin. BI-RADS category requires breast radiologist verification; this prototype suggests ${category} based on selected features.`,
    warning: 'Prototype preview only. Final BI-RADS assessment and management require official criteria, complete imaging context, and breast radiologist verification.',
  };
}

export function computeOrads(values: CalculatorValueMap): CalculatorResult {
  const menopausal = stringValue(values, 'menopausalStatus') || 'unknown menopausal status';
  const lesionType = stringValue(values, 'lesionType') || 'adnexal lesion';
  const size = stringValue(values, 'sizeCm') || 'unspecified';
  const papillary = stringValue(values, 'papillaryProjections') || 'none';
  const solid = stringValue(values, 'solidComponent') === 'yes';
  const vascularity = stringValue(values, 'vascularity') || 'none';
  const ascites = stringValue(values, 'ascitesPeritoneal') === 'yes';

  let category = 'O-RADS 3 placeholder';
  if (lesionType === 'simple cyst') category = 'O-RADS 2 placeholder';
  if (['hemorrhagic cyst', 'endometrioma', 'dermoid'].includes(lesionType) && !solid && !ascites) category = 'O-RADS 2-3 placeholder';
  if (lesionType === 'multilocular cyst' || papillary === '1-3' || solid) category = 'O-RADS 4 placeholder';
  if (ascites || papillary === '>=4' || (lesionType === 'solid lesion' && vascularity === 'strong')) category = 'O-RADS 5 placeholder';

  return {
    summary: `Suggested category: ${category}`,
    sentence: `Adnexal lesion in a ${menopausal} patient measures ${size} cm and is described as ${lesionType}${
      solid ? ' with solid component' : ''
    }, vascularity ${vascularity}. Suggested ${category} in this prototype; final O-RADS category requires radiologist verification.`,
    warning: 'Prototype O-RADS preview only. Verify menopausal status, lesion morphology, Doppler features, and current O-RADS criteria.',
  };
}

export function computePirads(values: CalculatorValueMap): CalculatorResult {
  const zone = stringValue(values, 'zone') || 'peripheral';
  const size = stringValue(values, 'size') || 'unspecified';
  const dwi = Number.parseInt(stringValue(values, 'dwiScore') || '1', 10);
  const t2 = Number.parseInt(stringValue(values, 't2Score') || '1', 10);
  const dce = stringValue(values, 'dce') || 'negative';
  const epe = stringValue(values, 'epe') === 'yes';
  let score = zone === 'peripheral' ? dwi : t2;
  if (zone === 'peripheral' && dwi === 3 && dce === 'positive') score = 4;
  if (epe) score = Math.max(score, 5);

  return {
    summary: `Suggested PI-RADS ${score}`,
    sentence: `Lesion in the ${zone} zone measuring ${size} with DWI score ${dwi}, T2 score ${t2}, and DCE ${dce}. Suggested PI-RADS ${score} in this prototype; final scoring requires official criteria and radiologist verification.`,
    warning: 'Simplified PI-RADS preview. It does not replace official scoring rules, prostate MRI protocol review, or radiologist assessment.',
  };
}

export function computeLirads(values: CalculatorValueMap): CalculatorResult {
  const hccRisk = stringValue(values, 'hccRisk') === 'yes';
  const size = numberValue(values, 'sizeMm');
  const aphe = stringValue(values, 'aphe') === 'yes';
  const washout = stringValue(values, 'washout') === 'yes';
  const capsule = stringValue(values, 'capsule') === 'yes';
  const growth = stringValue(values, 'thresholdGrowth') === 'yes';
  const tiv = stringValue(values, 'tumorInVein') === 'yes';
  const malignantNotHcc = stringValue(values, 'malignantNotHcc') === 'yes';
  const segment = stringValue(values, 'segment') || 'specified segment';
  const featureCount = [aphe, washout, capsule, growth].filter(Boolean).length;

  let category = 'LI-RADS not applicable';
  if (hccRisk) {
    if (tiv) category = 'LR-TIV placeholder';
    else if (malignantNotHcc) category = 'LR-M placeholder';
    else if (aphe && (size ?? 0) >= 10 && featureCount >= 3) category = 'LR-5 placeholder';
    else if (aphe && featureCount >= 2) category = 'LR-4 placeholder';
    else if (aphe || featureCount >= 1) category = 'LR-3 placeholder';
    else category = 'LR-2 placeholder';
  }

  return {
    summary: `Suggested category: ${category}`,
    sentence: `Observation in segment ${segment} measuring ${size ? fmt(size, 0) : 'unspecified'} mm demonstrates ${
      aphe ? 'arterial phase hyperenhancement' : 'no entered APHE'
    }${washout ? ', washout' : ''}${capsule ? ', enhancing capsule' : ''}${growth ? ', threshold growth' : ''}. ${
      hccRisk
        ? `In an appropriate HCC-risk population, this prototype suggests ${category}; final category requires radiologist verification.`
        : 'LI-RADS should not be applied unless the patient is in an appropriate HCC-risk population.'
    }`,
    warning: hccRisk
      ? 'Prototype LI-RADS preview only. Verify eligibility, modality, phases, major features, ancillary features, and official criteria.'
      : 'LI-RADS should not be applied unless patient is in an appropriate HCC-risk population.',
  };
}

export function computeBoneRads(values: CalculatorValueMap): CalculatorResult {
  const modality = stringValue(values, 'modality') || 'CT/MRI';
  const location = stringValue(values, 'location') || 'specified location';
  const pain = stringValue(values, 'pain') === 'yes';
  const malignancy = stringValue(values, 'knownMalignancy') === 'yes';
  const aggressive = arrayValue(values, 'aggressiveFeatures');
  const benign = arrayValue(values, 'benignFeatures');
  const stability = stringValue(values, 'priorStability') || 'unknown';

  let bucket = 'follow-up imaging';
  if (aggressive.length) bucket = 'biopsy/oncologic referral';
  else if (benign.length || stability === 'stable') bucket = 'likely benign / leave alone';
  else if (pain || malignancy) bucket = 'different imaging modality or specialist-directed evaluation';

  return {
    summary: `Prototype Bone-RADS bucket: ${bucket}`,
    sentence: `Incidental solitary bone lesion in the ${location} evaluated on ${modality}${
      aggressive.length ? ` with aggressive feature(s): ${aggressive.join(', ')}` : ''
    }${benign.length ? ` with benign feature(s): ${benign.join(', ')}` : ''}. Prototype Bone-RADS management bucket: ${bucket}. Final recommendation requires MSK radiologist verification.`,
    warning: 'Simplified Bone-RADS preview. Verify symptoms, malignancy history, lesion morphology, and official SSR guidance.',
  };
}

export function computeCadRads(values: CalculatorValueMap): CalculatorResult {
  const stenosis = stringValue(values, 'maxStenosis') || 'none';
  const vessel = stringValue(values, 'vessel') || 'specified vessel/segment';
  const highRisk = stringValue(values, 'highRiskPlaque') === 'yes';
  const stent = stringValue(values, 'stent') === 'yes';
  const cabg = stringValue(values, 'cabg') === 'yes';
  const nondiagnostic = stringValue(values, 'nondiagnostic') === 'yes';
  const map: Record<string, string> = {
    none: 'CAD-RADS 0',
    '1-24%': 'CAD-RADS 1',
    '25-49%': 'CAD-RADS 2',
    '50-69%': 'CAD-RADS 3',
    '70-99%': 'CAD-RADS 4 placeholder',
    occluded: 'CAD-RADS 5 placeholder',
  };
  const modifiers = [highRisk ? 'high-risk plaque modifier' : '', stent ? 'stent modifier' : '', cabg ? 'graft modifier' : '', nondiagnostic ? 'non-diagnostic segment modifier' : ''].filter(Boolean);

  return {
    summary: `${map[stenosis] ?? 'CAD-RADS placeholder'}${modifiers.length ? ` with ${modifiers.join(', ')}` : ''}`,
    sentence: `Coronary CTA demonstrates ${stenosis} maximal stenosis involving ${vessel}. ${
      map[stenosis] ?? 'CAD-RADS placeholder'
    }${modifiers.length ? ` with ${modifiers.join(', ')}` : ''} in this prototype; final categorization requires cardiac radiologist verification.`,
    warning: 'Prototype CAD-RADS preview. Verify study quality, stenosis severity, modifiers, and current CAD-RADS criteria.',
  };
}

export function computeLungRads(values: CalculatorValueMap): CalculatorResult {
  const screening = stringValue(values, 'screeningContext') === 'yes';
  const context = stringValue(values, 'screeningRound') || 'screening';
  const noduleType = stringValue(values, 'noduleType') || 'solid';
  const size = numberValue(values, 'sizeMm');
  const growth = stringValue(values, 'growth') === 'yes';
  const isNew = stringValue(values, 'newNodule') === 'yes';
  const suspicious = stringValue(values, 'suspiciousFeatures') === 'yes';

  let category = 'Lung-RADS 2 placeholder';
  if (!screening) category = 'Use incidental pulmonary nodule guidance instead';
  else if (suspicious || (size ?? 0) >= 15) category = 'Lung-RADS 4B/4X placeholder';
  else if (growth || isNew || (size ?? 0) >= 8) category = 'Lung-RADS 4A placeholder';
  else if ((size ?? 0) >= 6) category = 'Lung-RADS 3 placeholder';
  else if (!size) category = 'Lung-RADS 1 placeholder';

  return {
    summary: `Suggested category: ${category}`,
    sentence: `Low-dose ${context} CT demonstrates ${noduleType} nodule measuring ${size ? fmt(size, 1) : 'unspecified'} mm${
      growth ? ' with growth' : isNew ? ' that is new' : ''
    }. ${screening ? `${category} in this prototype; final category and follow-up require verification.` : 'Use Fleischner-style incidental nodule logic rather than Lung-RADS if this is not a lung cancer screening CT.'}`,
    warning: screening
      ? 'Prototype Lung-RADS preview. Verify screening eligibility, nodule measurements, growth, and official Lung-RADS criteria.'
      : 'Use Fleischner-style incidental nodule logic rather than Lung-RADS if this is not a lung cancer screening CT.',
  };
}

export function computeNiRads(values: CalculatorValueMap): CalculatorResult {
  const surveillance = stringValue(values, 'surveillance') === 'yes';
  const primaryConcern = stringValue(values, 'primaryConcern') === 'yes';
  const nodes = stringValue(values, 'neckNodes') === 'yes';
  const fdg = stringValue(values, 'fdgUptake') === 'yes';
  const mass = stringValue(values, 'suspiciousMass') === 'yes';
  const concernCount = [primaryConcern, nodes, fdg, mass].filter(Boolean).length;
  const category = concernCount >= 2 ? 'NI-RADS 3/4 placeholder' : concernCount === 1 ? 'NI-RADS 2 placeholder' : 'NI-RADS 1 placeholder';

  return {
    summary: `Suggested category: ${category}`,
    sentence: `Post-treatment head and neck surveillance imaging${surveillance ? '' : ' context not fully specified'} demonstrates ${
      concernCount ? 'user-entered suspicious finding(s)' : 'no suspicious primary-site or nodal finding entered'
    }. Prototype ${category}; final NI-RADS assessment requires head and neck radiologist verification.`,
    warning: 'Prototype NI-RADS preview only. Verify treatment history, primary site, neck nodes, FDG uptake, and official criteria.',
  };
}

export function computeViRads(values: CalculatorValueMap): CalculatorResult {
  const t2 = Number.parseInt(stringValue(values, 't2Category') || '1', 10);
  const dwi = Number.parseInt(stringValue(values, 'dwiCategory') || '1', 10);
  const dce = Number.parseInt(stringValue(values, 'dceCategory') || '1', 10);
  const invasion = stringValue(values, 'muscleInvasion') === 'yes';
  const score = invasion ? Math.max(4, t2, dwi, dce) : Math.max(t2, dwi, dce);
  const likelihood = score <= 2 ? 'unlikely' : score === 3 ? 'equivocal' : score === 4 ? 'likely' : 'very likely';

  return {
    summary: `Suggested VI-RADS ${score}`,
    sentence: `Bladder lesion demonstrates T2 category ${t2}, DWI category ${dwi}, and DCE category ${dce}. Suggested VI-RADS ${score} in this prototype, with muscle invasion ${likelihood}; final score requires radiologist verification.`,
    warning: 'Prototype VI-RADS preview only. Verify MRI quality, sequence categories, tumor location, and official criteria.',
  };
}
