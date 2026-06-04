import { generateFleischnerRecommendation } from '../radrep/reportLogic';
import type { IncidentalFindingDefinition, NoduleFormState } from '../radrep/types';

export type IncidentalValueMap = Record<string, string | boolean | undefined>;

function value(values: IncidentalValueMap, id: string): string {
  const raw = values[id];
  if (typeof raw === 'boolean') return raw ? 'yes' : 'no';
  return raw?.trim() ?? '';
}

function numberValue(values: IncidentalValueMap, id: string): number | null {
  const parsed = Number.parseFloat(value(values, id));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function fmtNumber(valueToFormat: number | null, suffix = ''): string {
  return valueToFormat === null ? 'unspecified' : `${valueToFormat.toFixed(1).replace(/\.0$/, '')}${suffix}`;
}

function yesNoPhrase(values: IncidentalValueMap, id: string, yes: string, no: string): string | undefined {
  const current = value(values, id);
  if (current === 'yes') return yes;
  if (current === 'no') return no;
  return undefined;
}

function join(parts: Array<string | undefined | null>, separator = ', '): string {
  return parts.filter((part): part is string => Boolean(part?.trim())).join(separator);
}

// Simplified prototype logic only. The generated text must be verified against current official guidance and source images.
function generatePulmonaryNodule(values: IncidentalValueMap): string {
  const age = value(values, 'age');
  const size = value(values, 'sizeMm');
  const location = value(values, 'location') || 'specified lung location';
  const noduleType = value(values, 'noduleType') || 'solid';
  const count = value(values, 'count') || 'solitary';
  const risk = value(values, 'riskCategory') || 'low risk';
  const stability = value(values, 'stability');
  const knownCancer = value(values, 'knownCancer') === 'yes';
  const immunocompromised = value(values, 'immunocompromised') === 'yes';

  const form: NoduleFormState = {
    patientAge: age,
    knownMalignancy: knownCancer ? 'yes' : 'no',
    immunocompromised: immunocompromised ? 'yes' : 'no',
    noduleType: noduleType === 'ground-glass' ? 'subsolid ground-glass' : (noduleType as NoduleFormState['noduleType']),
    numberOfNodules: count === 'multiple' ? 'multiple' : 'solitary',
    sizeMm: size,
    location,
    morphology: 'smooth',
    patientRisk: risk === 'high risk' ? 'high risk' : 'low risk',
    priorImagingAvailable: stability && stability !== 'unknown' ? 'yes' : 'no',
    stability: (stability || 'unknown') as NoduleFormState['stability'],
    additionalFindings: '',
    limitationsUncertainty: '',
  };
  const recommendation = generateFleischnerRecommendation(form);
  const applicability = Number.parseFloat(age) < 35 || knownCancer || immunocompromised
    ? ' Fleischner guidance may not apply; consider individualized follow-up based on clinical context.'
    : '';

  return `Incidental ${count} ${noduleType} pulmonary nodule${count === 'multiple' ? 's' : ''} measuring ${
    size || 'unspecified'
  } mm in the ${location}. Based on simplified Fleischner guidance, ${recommendation.charAt(0).toLowerCase()}${recommendation.slice(
    1,
  )} Assuming guideline applicability.${applicability}`;
}

function generateAdrenal(values: IncidentalValueMap): string {
  const side = value(values, 'side');
  const sizeNumber = numberValue(values, 'sizeCm');
  const size = sizeNumber === null ? '' : `${fmtNumber(sizeNumber, ' cm')} `;
  const hu = value(values, 'noncontrastHu');
  const homogeneous = yesNoPhrase(values, 'homogeneous', 'homogeneous', 'heterogeneous or not confirmed homogeneous');
  const malignancy = yesNoPhrase(values, 'knownMalignancy', 'known malignancy history present', 'no known malignancy history entered');
  const stability = value(values, 'priorStability');
  const washout = value(values, 'washout');
  const huNumber = Number.parseFloat(hu);

  let followUp = 'If not previously characterized, consider adrenal protocol CT/MRI or biochemical/clinical correlation as appropriate.';
  if ((Number.isFinite(huNumber) && huNumber <= 10 && value(values, 'homogeneous') === 'yes' && value(values, 'knownMalignancy') !== 'yes') || stability === 'stable') {
    followUp = 'No specific imaging follow-up is suggested in this prototype, assuming benign imaging features or stability are verified.';
  } else if (sizeNumber !== null && sizeNumber > 4) {
    followUp = 'Consider endocrine/surgical correlation and dedicated adrenal characterization according to local protocol.';
  } else if (value(values, 'knownMalignancy') === 'yes') {
    followUp = 'Consider adrenal protocol CT/MRI, PET/CT, or comparison with prior imaging depending on oncologic context.';
  } else if (sizeNumber !== null && sizeNumber >= 1 && sizeNumber <= 4) {
    followUp = 'Consider adrenal protocol CT or MRI for characterization if not previously evaluated.';
  }

  const features = join([
    hu ? `${hu} HU on noncontrast imaging` : undefined,
    homogeneous,
    stability && stability !== 'unknown' ? `${stability} compared with prior imaging` : undefined,
    malignancy,
  ]);

  return `Incidental ${size}${side ? `${side} ` : ''}adrenal nodule${features ? ` with ${features}` : ''}. ${
    washout ? `Washout information entered: ${washout}. ` : ''
  }${followUp} Verify against current adrenal incidental finding guidance and local protocol.`;
}

function generateRenal(values: IncidentalValueMap): string {
  const lesionType = value(values, 'lesionType') || 'indeterminate';
  const size = fmtNumber(numberValue(values, 'sizeCm'), ' cm');
  const simple = value(values, 'simpleCyst') === 'yes';
  const enhancement = value(values, 'enhancement');
  const complex = value(values, 'complexFeatures');
  const stability = value(values, 'priorStability');

  if (lesionType === 'cystic' && simple && (enhancement === 'none' || !enhancement)) {
    return `Simple-appearing renal cyst measuring ${size}. No specific imaging follow-up is suggested in this prototype, assuming simple cyst features are confirmed by the radiologist.`;
  }

  const action = enhancement === 'present'
    ? 'Recommend renal protocol CT/MRI if not already characterized, with urology correlation depending on clinical context.'
    : lesionType === 'cystic'
      ? 'Consider renal protocol CT or MRI for Bosniak characterization if not previously evaluated.'
      : stability === 'stable'
        ? 'Stability supports benignity; follow-up should be individualized based on imaging phenotype.'
        : 'Consider renal protocol CT/MRI for characterization if not previously evaluated.';

  return `Incidental ${lesionType} renal lesion measuring ${size}${complex ? ` with ${complex}` : ''}${
    enhancement && enhancement !== 'unknown' ? ` and ${enhancement} enhancement` : ''
  }${stability && stability !== 'unknown' ? `, ${stability} compared with prior imaging` : ''}. ${action} Final Bosniak/renal mass classification requires verification.`;
}

function generateThyroid(values: IncidentalValueMap): string {
  const size = fmtNumber(numberValue(values, 'sizeCm'), ' cm');
  const age = value(values, 'age');
  const sizeNumber = numberValue(values, 'sizeCm');
  const ageNumber = Number.parseFloat(age);
  const suspicious = value(values, 'suspiciousFeatures') === 'yes';
  const nodes = value(values, 'lymphadenopathy') === 'yes';
  const modality = value(values, 'modality') || 'CT/MRI';
  const meetsAgeThreshold =
    sizeNumber !== null &&
    ((Number.isFinite(ageNumber) && ageNumber < 35 && sizeNumber >= 1) ||
      (!Number.isFinite(ageNumber) && sizeNumber >= 1.5) ||
      (Number.isFinite(ageNumber) && ageNumber >= 35 && sizeNumber >= 1.5));
  const followUp = suspicious || nodes
    ? 'Recommend dedicated thyroid ultrasound.'
    : meetsAgeThreshold
      ? 'Consider dedicated thyroid ultrasound.'
      : 'No dedicated ultrasound follow-up is suggested in this simplified prototype if no suspicious features are present.';

  return `Incidental thyroid nodule measuring ${size} on ${modality}${age ? ` in a ${age}-year-old patient` : ''}. ${followUp} Further management should be based on ultrasound features/TI-RADS if performed and requires verification.`;
}

function generateLiver(values: IncidentalValueMap): string {
  const size = fmtNumber(numberValue(values, 'sizeCm'), ' cm');
  const risk = value(values, 'riskCategory') || 'low risk';
  const benign = value(values, 'benignFeatures') === 'yes';
  const hccRisk = value(values, 'hccRisk') === 'yes';
  const malignancy = value(values, 'knownMalignancy') === 'yes';
  const features = value(values, 'features') || (benign ? 'benign imaging features' : 'indeterminate features');
  const lesionSize = numberValue(values, 'sizeCm');
  const action = benign && risk === 'low risk' && !hccRisk && !malignancy
    ? 'no specific follow-up is suggested in this prototype'
    : hccRisk
      ? 'LI-RADS framework may apply; consider liver protocol CT/MRI or hepatology/radiology-directed follow-up'
      : (lesionSize ?? 0) > 1 || risk === 'high risk' || malignancy
        ? 'consider MRI liver protocol for characterization if not previously evaluated'
        : 'comparison with prior imaging or MRI characterization may be considered depending on features';

  return `Incidental liver lesion measuring ${size} with ${features}. In a ${risk} patient, ${action} in this simplified prototype, depending on imaging features and prior stability. LI-RADS should only be applied in an appropriate HCC-risk population.`;
}

function generatePancreaticCyst(values: IncidentalValueMap): string {
  const size = fmtNumber(numberValue(values, 'sizeCm'), ' cm');
  const age = value(values, 'age');
  const highRisk = ['ductDilation', 'muralNodule', 'solidComponent', 'symptoms'].some((id) => value(values, id) === 'yes');
  const interval = value(values, 'interval') || 'per local protocol';

  if (highRisk) {
    return `Incidental pancreatic cystic lesion measuring ${size}${age ? ` in a ${age}-year-old patient` : ''} with high-risk feature(s) entered such as duct dilation, mural nodule, solid component, or symptoms. Recommend dedicated pancreatic MRI/MRCP and specialist correlation. Final recommendation requires verification.`;
  }

  return `Incidental pancreatic cystic lesion measuring ${size}${age ? ` in a ${age}-year-old patient` : ''} without high-risk features in this prototype. Consider MRI/MRCP surveillance at ${interval}, depending on size, age, stability, and local guideline after radiologist verification.`;
}

function generateAdnexal(values: IncidentalValueMap): string {
  const menopausal = value(values, 'menopausalStatus') || 'unknown menopausal status';
  const size = fmtNumber(numberValue(values, 'sizeCm'), ' cm');
  const complexity = value(values, 'complexity') || 'indeterminate';
  const symptomatic = value(values, 'symptoms') === 'yes';
  const sizeNumber = numberValue(values, 'sizeCm');
  let followUp = 'Follow-up depends on size, complexity, symptoms, and menopausal status.';
  if (complexity === 'simple' && menopausal === 'premenopausal' && (sizeNumber === null || sizeNumber < 5) && !symptomatic) {
    followUp = 'No follow-up or routine follow-up may be appropriate depending on exact size and local protocol.';
  } else if (complexity === 'simple' && (sizeNumber ?? 0) >= 5) {
    followUp = 'Consider pelvic ultrasound follow-up in 6-12 months, depending on local protocol.';
  } else if (menopausal === 'postmenopausal' || complexity !== 'simple') {
    followUp = 'Consider pelvic ultrasound follow-up or gynecology correlation depending on features; O-RADS-based characterization may be appropriate.';
  }

  return `Incidental ${complexity} adnexal cyst measuring ${size} in a ${menopausal} patient${
    symptomatic ? ' with symptoms entered' : ''
  }. ${followUp} O-RADS may be used for ultrasound/MRI risk stratification when applicable.`;
}

function generateAorticAneurysm(values: IncidentalValueMap): string {
  const location = value(values, 'location') || 'aortic';
  const diameter = fmtNumber(numberValue(values, 'diameterCm'), ' cm');
  const symptomatic = value(values, 'symptoms') === 'yes';
  const sex = value(values, 'sex');
  const growth = value(values, 'priorSizeGrowth');
  const interval = value(values, 'interval') || 'per vascular protocol';
  const diameterNumber = numberValue(values, 'diameterCm');
  const action = symptomatic || interval === 'urgent vascular correlation'
    ? 'Vascular surgery correlation is recommended.'
    : diameterNumber !== null && diameterNumber >= 5
      ? 'Vascular surgery correlation should be considered, with surveillance according to local protocol.'
      : `Recommend comparison with prior imaging and surveillance by ultrasound/CT ${interval}.`;

  return `${location.charAt(0).toUpperCase()}${location.slice(1)} aortic aneurysm measuring ${diameter}${
    sex ? ` in a ${sex} patient` : ''
  }${symptomatic ? ' with symptoms entered' : ''}${growth ? `; prior size/growth: ${growth}` : ''}. ${action} Verify diameter thresholds and interval against local vascular protocol.`;
}

export function generateIncidentalFindingSentence(
  finding: IncidentalFindingDefinition,
  values: IncidentalValueMap,
): string {
  switch (finding.id) {
    case 'incidental-pulmonary-nodule':
      return generatePulmonaryNodule(values);
    case 'incidental-adrenal-nodule':
      return generateAdrenal(values);
    case 'incidental-renal-lesion':
      return generateRenal(values);
    case 'incidental-thyroid-nodule':
      return generateThyroid(values);
    case 'incidental-liver-lesion':
      return generateLiver(values);
    case 'incidental-pancreatic-cyst':
      return generatePancreaticCyst(values);
    case 'incidental-adnexal-cyst':
      return generateAdnexal(values);
    case 'aortic-aneurysm':
      return generateAorticAneurysm(values);
    default:
      return `${finding.name}: enter finding details to generate a simplified report-ready incidental finding sentence. Final wording requires clinician/radiologist verification.`;
  }
}
