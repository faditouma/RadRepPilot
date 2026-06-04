export * from '../radrep/reportGenerators';

import { reportingWorkflowSchemas, type ReportingWorkflowSchema, type WorkflowValues } from '../data/reportingWorkflowSchemas';
import type { ModuleType, ReportSections } from '../radrep/types';
import { cleanLines, formatMeasurement, numberOrNull, sentenceList, workflowList, workflowValue, yes } from './impressionGenerators';

function keyNegativeSentence(values: WorkflowValues): string | undefined {
  const negatives = workflowList(values, 'keyNegatives');
  return negatives.length ? `Key negatives: ${negatives.join('; ')}.` : undefined;
}

function commonReport(schema: ReportingWorkflowSchema, values: WorkflowValues, findings: string, impression: string, recommendations?: string): ReportSections {
  return {
    indication: workflowValue(values, 'indication') || schema.clinicalQuestion,
    technique: workflowValue(values, 'technique') || schema.techniqueDefault,
    findings: cleanLines([
      findings,
      workflowValue(values, 'additionalFindings')
        ? `Additional findings/radiologist comment: ${workflowValue(values, 'additionalFindings')}`
        : undefined,
      workflowValue(values, 'limitationsUncertainty') ? `Limitations/uncertainty: ${workflowValue(values, 'limitationsUncertainty')}` : undefined,
    ]),
    impression,
    incidentalFindings: workflowValue(values, 'incidentalFindings'),
    recommendations:
      recommendations ??
      'Draft language only. Verify all user-entered findings, measurements, complications, comparisons, and final wording.',
  };
}

function generateChestXrayReport(schema: ReportingWorkflowSchema, values: WorkflowValues): ReportSections {
  const studyQuality = workflowValue(values, 'studyQuality');
  const silhouette = workflowValue(values, 'cardiomediastinalSilhouette');
  const lungVolumes = workflowValue(values, 'lungVolumes');
  const consolidation = workflowValue(values, 'consolidation');
  const consolidationLocation = workflowValue(values, 'consolidationLocation');
  const edema = workflowValue(values, 'interstitialEdema');
  const effusion = workflowValue(values, 'pleuralEffusion');
  const effusionLocation = workflowValue(values, 'pleuralEffusionLocation');
  const pneumothorax = workflowValue(values, 'pneumothorax');
  const pneumothoraxSideSize = workflowValue(values, 'pneumothoraxSideSize');
  const devices = workflowValue(values, 'linesTubesDevices');

  const consolidationPresent = consolidation !== 'not specified' && consolidation !== 'none';
  const edemaPresent = edema !== 'not specified' && edema !== 'absent';
  const effusionPresent = effusion !== 'not specified' && effusion !== 'none';
  const pneumothoraxPresent = pneumothorax === 'present';
  const normalSilhouette = silhouette === 'normal' || silhouette === 'not specified';
  const noAcutePattern =
    !consolidationPresent &&
    !edemaPresent &&
    !effusionPresent &&
    !pneumothoraxPresent &&
    normalSilhouette;

  const qualitySentence =
    studyQuality && studyQuality !== 'not specified'
      ? studyQuality === 'adequate'
        ? 'Study quality is adequate.'
        : `Study quality: ${studyQuality}.`
      : undefined;
  const silhouetteSentence =
    silhouette && silhouette !== 'not specified'
      ? silhouette === 'normal'
        ? 'Cardiomediastinal silhouette is within normal size limits.'
        : `Cardiomediastinal silhouette is ${silhouette}.`
      : undefined;
  const lungVolumeSentence =
    lungVolumes && lungVolumes !== 'not specified'
      ? lungVolumes === 'normal'
        ? 'Lung volumes are normal.'
        : `Lung volumes are ${lungVolumes}.`
      : undefined;
  const consolidationSentence = consolidationPresent
    ? consolidation === 'focal consolidation'
      ? `Focal airspace consolidation${consolidationLocation ? ` in ${consolidationLocation}` : ''}.`
      : `${consolidation[0].toUpperCase()}${consolidation.slice(1)}${consolidationLocation ? ` in ${consolidationLocation}` : ''}.`
    : consolidation === 'none'
      ? 'No focal airspace consolidation.'
      : undefined;
  const edemaSentence = edemaPresent
    ? `${edema[0].toUpperCase()}${edema.slice(1)} interstitial pulmonary edema pattern is entered.`
    : edema === 'absent'
      ? 'No interstitial pulmonary edema.'
      : undefined;
  const effusionSentence = effusionPresent
    ? `${effusion[0].toUpperCase()}${effusion.slice(1)} pleural effusion${effusionLocation ? ` (${effusionLocation})` : ''}.`
    : effusion === 'none'
      ? 'No pleural effusion.'
      : undefined;
  const pneumothoraxSentence = pneumothoraxPresent
    ? `Pneumothorax is present${pneumothoraxSideSize ? `: ${pneumothoraxSideSize}` : ''}.`
    : pneumothorax === 'none'
      ? 'No pneumothorax.'
      : undefined;

  const findings = cleanLines([
    qualitySentence,
    silhouetteSentence,
    lungVolumeSentence,
    consolidationSentence,
    edemaSentence,
    effusionSentence,
    pneumothoraxSentence,
    devices ? `Lines/tubes/devices: ${devices}.` : undefined,
  ]);

  const impressionLines = [
    pneumothoraxPresent ? `Pneumothorax${pneumothoraxSideSize ? `: ${pneumothoraxSideSize}` : ' is present'}.` : undefined,
    consolidationPresent
      ? consolidation === 'focal consolidation'
        ? `Focal airspace consolidation${consolidationLocation ? ` in ${consolidationLocation}` : ''}, compatible with pneumonia in the appropriate clinical context.`
        : `${consolidation[0].toUpperCase()}${consolidation.slice(1)}${consolidationLocation ? ` in ${consolidationLocation}` : ''}; correlate clinically.`
      : undefined,
    edemaPresent || effusionPresent
      ? cleanLines([
          edemaPresent ? `${edema[0].toUpperCase()}${edema.slice(1)} interstitial edema pattern.` : undefined,
          effusionPresent ? `${effusion[0].toUpperCase()}${effusion.slice(1)} pleural effusion${effusionLocation ? ` (${effusionLocation})` : ''}.` : undefined,
          'Findings may be compatible with pulmonary edema/CHF in the appropriate clinical context.',
        ]).replace(/\n/g, ' ')
      : undefined,
    noAcutePattern ? 'No acute cardiopulmonary abnormality.' : undefined,
  ];

  return {
    indication: workflowValue(values, 'indication'),
    technique: workflowValue(values, 'technique') || schema.techniqueDefault,
    findings: cleanLines([
      findings || 'No specific chest radiograph finding has been entered.',
      workflowValue(values, 'additionalFindings')
        ? `Additional findings/radiologist comment: ${workflowValue(values, 'additionalFindings')}`
        : undefined,
      workflowValue(values, 'limitationsUncertainty') ? `Limitations/uncertainty: ${workflowValue(values, 'limitationsUncertainty')}` : undefined,
    ]),
    impression: cleanLines(impressionLines),
    incidentalFindings: workflowValue(values, 'incidentalFindings'),
    recommendations: 'Educational draft only. Verify all user-entered radiographic findings and final wording before use.',
  };
}

function generateAppendicitisReport(schema: ReportingWorkflowSchema, values: WorkflowValues): ReportSections {
  const visualized = workflowValue(values, 'appendixVisualized') === 'yes';
  const diameter = numberOrNull(values, 'appendixDiameterMm');
  const diameterText = workflowValue(values, 'appendixDiameterMm') ? `${workflowValue(values, 'appendixDiameterMm')} mm` : 'unspecified caliber';
  const fat = workflowValue(values, 'fatStranding');
  const hasInflammation = yes(values, 'wallThickeningEnhancement') || fat !== 'none';
  const enlarged = diameter !== null && diameter > 6;
  const abscess = yes(values, 'abscessPhlegmon');
  const perforation = yes(values, 'freeAirPerforation');
  const alternative = workflowValue(values, 'alternativeDiagnosis');

  let primaryFindings = '';
  let impression = '';

  if (!visualized) {
    primaryFindings = hasInflammation || abscess || perforation
      ? 'The appendix is not confidently visualized. Secondary inflammatory changes are entered in the right lower quadrant.'
      : 'The appendix is not confidently visualized. No secondary inflammatory changes are identified in the right lower quadrant.';
    impression = hasInflammation || abscess || perforation
      ? 'Appendix not confidently visualized; secondary inflammatory changes are present and require radiologist correlation.'
      : 'Appendix not confidently visualized; no secondary signs of acute appendicitis.';
  } else if (!enlarged && !hasInflammation && !abscess && !perforation) {
    primaryFindings = 'The appendix is visualized and is normal in caliber without periappendiceal inflammatory change.';
    impression = 'No CT evidence of acute appendicitis.';
  } else {
    const appendicolith = yes(values, 'appendicolith') ? 'Appendicolith is present.' : undefined;
    const fluid = yes(values, 'periappendicealFluid') ? 'Periappendiceal fluid is present.' : undefined;
    if (abscess || perforation) {
      const complications = sentenceList([
        abscess ? `periappendiceal abscess/phlegmon${workflowValue(values, 'abscessSize') ? ` measuring ${workflowValue(values, 'abscessSize')}` : ''}` : '',
        perforation ? 'free air/perforation' : '',
      ].filter(Boolean));
      primaryFindings = cleanLines([
        `The appendix is enlarged and inflamed with ${complications}. Findings are compatible with complicated acute appendicitis.`,
        appendicolith,
        fluid,
      ]);
      impression = perforation
        ? 'Acute complicated appendicitis with perforation.'
        : 'Acute complicated appendicitis with periappendiceal abscess/phlegmon.';
    } else {
      primaryFindings = cleanLines([
        `The appendix is visualized and measures ${diameterText}, with wall thickening/enhancement and ${fat} periappendiceal inflammatory stranding.`,
        appendicolith,
        'No periappendiceal abscess or free intraperitoneal air.',
      ]);
      impression = 'Acute uncomplicated appendicitis.';
    }
  }

  if (alternative) impression = cleanLines([impression, `Alternative finding: ${alternative}.`]);

  return commonReport(
    schema,
    values,
    cleanLines([
      primaryFindings,
      yes(values, 'obstructionIleus') ? 'Associated bowel obstruction/ileus is entered as present.' : undefined,
      yes(values, 'cecalTerminalIlealInflammation') ? 'Cecal/terminal ileal inflammatory change is entered as present.' : undefined,
      alternative ? `Alternative diagnosis: ${alternative}.` : undefined,
      keyNegativeSentence(values),
    ]),
    impression,
    'Verify appendix visualization, diameter, inflammatory changes, and complications on source images. Communicate urgent findings per local policy.',
  );
}

function generateBowelObstructionReport(schema: ReportingWorkflowSchema, values: WorkflowValues): ReportSections {
  const present = workflowValue(values, 'obstructionPresent');
  const type = workflowValue(values, 'obstructionType') || 'small bowel';
  const degree = workflowValue(values, 'degree') || 'low-grade';
  const transition = workflowValue(values, 'transitionPoint') || 'unspecified location';
  const cause = workflowValue(values, 'suspectedCause') || 'unspecified cause';
  const closedLoop = yes(values, 'closedLoop');
  const freeAir = yes(values, 'freeAirPerforation');
  const ischemiaFeatures = [
    yes(values, 'hypoenhancement') ? 'bowel wall hypoenhancement' : '',
    yes(values, 'pneumatosis') ? 'pneumatosis' : '',
    yes(values, 'portalVenousGas') ? 'portal venous gas' : '',
    yes(values, 'mesentericEdema') ? 'mesenteric edema' : '',
  ].filter(Boolean);
  const alternative = workflowValue(values, 'alternativeDiagnosis');

  let findings = '';
  let impression = '';

  if (present === 'no') {
    findings = 'No dilated bowel loops or transition point are entered. No CT evidence of bowel obstruction from the provided findings.';
    impression = 'No CT evidence of bowel obstruction.';
  } else if (type === 'large bowel') {
    findings = `Dilated large bowel${workflowValue(values, 'largeBowelDiameterCm') ? ` measuring up to ${workflowValue(values, 'largeBowelDiameterCm')} cm` : ''} with transition point at ${transition}, compatible with large bowel obstruction. Suspected cause: ${cause}.`;
    impression = `Large bowel obstruction with transition point at ${transition}, likely secondary to ${cause}.`;
  } else {
    findings = `Dilated small bowel loops${workflowValue(values, 'smallBowelDiameterCm') ? ` measuring up to ${workflowValue(values, 'smallBowelDiameterCm')} cm` : ''} with transition point at ${transition}, compatible with ${degree} small bowel obstruction. Suspected cause: ${cause}.`;
    impression = `${degree.charAt(0).toUpperCase()}${degree.slice(1)} small bowel obstruction with transition point at ${transition}, likely secondary to ${cause}. No CT evidence of ischemia or perforation.`;
  }

  const complicationLines = [
    closedLoop ? 'Configuration is concerning for closed-loop obstruction.' : undefined,
    ischemiaFeatures.length ? `There are CT features concerning for bowel ischemia, including ${sentenceList(ischemiaFeatures)}.` : undefined,
    freeAir ? 'Free intraperitoneal air is present, concerning for perforation.' : undefined,
    workflowValue(values, 'freeFluid') !== 'none' ? `${workflowValue(values, 'freeFluid')} free fluid is entered as present.` : undefined,
  ];

  if (closedLoop && type !== 'large bowel') impression = `Closed-loop small bowel obstruction involving ${transition}. Urgent surgical correlation recommended.`;
  if (ischemiaFeatures.length && type !== 'large bowel') impression = 'Small bowel obstruction with CT features concerning for ischemia. Urgent surgical correlation recommended.';
  if (freeAir) impression = 'Bowel obstruction complicated by perforation/free intraperitoneal air.';
  if (alternative) impression = cleanLines([impression, `Alternative finding: ${alternative}.`]);

  return commonReport(
    schema,
    values,
    cleanLines([findings, ...complicationLines, alternative ? `Alternative diagnosis: ${alternative}.` : undefined, keyNegativeSentence(values)]),
    impression,
    closedLoop || ischemiaFeatures.length || freeAir
      ? 'Urgent surgical correlation recommended. Verify transition point, cause, and ischemia/perforation features on source images.'
      : 'Verify transition point, obstruction grade, suspected cause, and complications on source images.',
  );
}

function generateRenalColicReport(schema: ReportingWorkflowSchema, values: WorkflowValues): ReportSections {
  const present = yes(values, 'stonePresent');
  const side = workflowValue(values, 'stoneSide') || workflowValue(values, 'painSide') || 'specified side';
  const location = workflowValue(values, 'stoneLocation') || 'urinary tract';
  const size = formatMeasurement(workflowValue(values, 'stoneSizeMm'), 'unspecified size');
  const hydro = workflowValue(values, 'hydronephrosis') || 'none';
  const obstructing = present && location !== 'kidney' && location !== 'bladder' && hydro !== 'none';
  const nonobstructing = present && !obstructing;
  const alternative = workflowValue(values, 'alternativeDiagnosis');

  let findings = '';
  let impression = '';

  if (!present) {
    findings = 'No urinary tract calculus or hydronephrosis identified.';
    impression = 'No urinary tract calculus or hydronephrosis.';
  } else if (obstructing) {
    findings = `${size} mm obstructing calculus at the ${location} on the ${side}, causing ${hydro} hydroureteronephrosis${
      yes(values, 'stranding') ? ' and perinephric/periureteric stranding' : ''
    }.`;
    impression = `Obstructing ${size} mm ${side} ${location} calculus causing ${hydro} hydroureteronephrosis.`;
  } else {
    findings = `Nonobstructing ${side} renal/urinary tract calculus measuring ${size} mm. No hydronephrosis.`;
    impression = `Nonobstructing ${side} renal calculus. No hydronephrosis.`;
  }

  const addenda = [
    yes(values, 'additionalNonobstructingStones') ? 'Additional nonobstructing renal calculi are entered as present.' : undefined,
    yes(values, 'bilateralObstruction') ? 'Bilateral obstruction is entered as present.' : undefined,
    alternative ? `Alternative diagnosis: ${alternative}.` : undefined,
    keyNegativeSentence(values),
  ];

  const impressionAddenda = [
    workflowValue(values, 'fever') === 'yes' && obstructing ? 'In the appropriate clinical context, superimposed infection should be considered clinically.' : undefined,
    (workflowValue(values, 'solitaryKidney') === 'yes' || yes(values, 'bilateralObstruction')) && (obstructing || yes(values, 'bilateralObstruction'))
      ? 'Given solitary kidney/bilateral obstruction, urgent urologic correlation may be warranted.'
      : undefined,
    alternative ? `Alternative finding: ${alternative}.` : undefined,
  ];

  return commonReport(
    schema,
    values,
    cleanLines([findings, ...addenda]),
    cleanLines([impression, ...impressionAddenda]),
    'Verify stone size/location, obstruction severity, laterality, renal function context, and alternative findings on source images.',
  );
}

function generateRuqReport(schema: ReportingWorkflowSchema, values: WorkflowValues): ReportSections {
  const stones = yes(values, 'gallstones');
  const wall = numberOrNull(values, 'wallThicknessMm');
  const wallThick = wall !== null && wall > 3;
  const perichole = yes(values, 'pericholecysticFluid');
  const murphy = workflowValue(values, 'sonographicMurphy');
  const chole = stones && (wallThick || perichole || murphy === 'positive' || yes(values, 'hyperemia'));
  const cbd = numberOrNull(values, 'cbdDiameterMm');
  const ductDilation = (cbd !== null && cbd > 6) || yes(values, 'intrahepaticDuctDilation') || workflowValue(values, 'choledocholithiasis') === 'yes';
  const alternative = workflowValue(values, 'alternativeDiagnosis');

  let findings = '';
  const impressionLines: string[] = [];

  if (!stones && !wallThick && !perichole && !ductDilation) {
    findings = 'No gallstones, gallbladder wall thickening, or pericholecystic fluid. Sonographic Murphy sign is negative. No biliary ductal dilation.';
    impressionLines.push('No cholelithiasis or sonographic evidence of acute cholecystitis.');
  } else if (chole) {
    findings = `Gallstones are present with gallbladder wall thickening${workflowValue(values, 'wallThicknessMm') ? ` measuring ${workflowValue(values, 'wallThicknessMm')} mm` : ''}${
      perichole ? ', pericholecystic fluid' : ''
    }${murphy ? `, and ${murphy} sonographic Murphy sign` : ''}, concerning for acute cholecystitis.`;
    impressionLines.push('Findings concerning for acute calculous cholecystitis.');
  } else if (stones) {
    findings = 'Gallstones are present without gallbladder wall thickening, pericholecystic fluid, or positive sonographic Murphy sign.';
    impressionLines.push('Cholelithiasis without sonographic evidence of acute cholecystitis.');
  }

  if (ductDilation) {
    const ductSentence = `The common bile duct measures ${workflowValue(values, 'cbdDiameterMm') || 'unspecified'} mm${
      yes(values, 'intrahepaticDuctDilation') ? ' with intrahepatic duct dilation' : ''
    }${workflowValue(values, 'choledocholithiasis') === 'yes' ? '. Choledocholithiasis is entered as seen/suspected' : ''}.`;
    findings = cleanLines([findings, ductSentence]);
    impressionLines.push(`Biliary ductal dilation with CBD measuring ${workflowValue(values, 'cbdDiameterMm') || 'unspecified'} mm. Correlate with cholestatic labs; MRCP/ERCP may be considered depending on clinical context.`);
  }

  const otherLines = [
    yes(values, 'sludge') ? 'Gallbladder sludge is present.' : undefined,
    yes(values, 'hepaticSteatosis') ? 'Hepatic steatosis is entered as present.' : undefined,
    yes(values, 'ascites') ? 'Ascites is entered as present.' : undefined,
    workflowValue(values, 'liverLesion') ? `Liver lesion/incidental: ${workflowValue(values, 'liverLesion')}.` : undefined,
    alternative ? `Alternative diagnosis: ${alternative}.` : undefined,
    keyNegativeSentence(values),
  ];

  if (alternative) impressionLines.push(`Alternative finding: ${alternative}.`);

  return commonReport(
    schema,
    values,
    cleanLines([findings, ...otherLines]),
    cleanLines(impressionLines),
    'Verify gallbladder findings, CBD measurement, sonographic Murphy sign, ductal dilation, and lab correlation before finalizing.',
  );
}

function generateDvtReport(schema: ReportingWorkflowSchema, values: WorkflowValues): ReportSections {
  const dvt = yes(values, 'dvtPresent');
  const superficial = yes(values, 'superficialThrombosis');
  const segment = workflowValue(values, 'veinSegments') || 'specified vein segments';
  const side = workflowValue(values, 'dvtSide') || workflowValue(values, 'examSide') || 'specified side';
  const occlusion = workflowValue(values, 'occlusion') || 'occlusive';
  const acuity = workflowValue(values, 'acuity') || 'acute';
  const calf = ['posterior tibial veins', 'peroneal veins', 'calf veins'].includes(segment);

  let findings = '';
  let impression = '';

  if (dvt) {
    findings = `Thrombus is present in the ${side} ${segment}, ${occlusion}, with ${workflowValue(values, 'compressibility')} compressibility and ${workflowValue(values, 'dopplerFlow')} Doppler flow.`;
    impression = calf
      ? `Isolated calf vein thrombosis involving the ${side} ${segment}.`
      : `${acuity.charAt(0).toUpperCase()}${acuity.slice(1)} ${occlusion} DVT involving the ${side} ${segment}.`;
  } else {
    findings = 'The assessed deep veins are compressible with preserved Doppler flow. No deep venous thrombosis identified.';
    impression = 'No deep venous thrombosis identified in the assessed lower-limb veins.';
  }

  if (superficial) {
    const vein = workflowValue(values, 'superficialVein') || 'superficial vein';
    findings = cleanLines([findings, `Superficial venous thrombosis involving the ${vein} is present.`]);
    impression = dvt ? cleanLines([impression, `Superficial thrombophlebitis involving the ${vein}.`]) : `Superficial thrombophlebitis involving the ${vein}. No deep venous thrombosis identified in the assessed veins.`;
  }

  return commonReport(
    schema,
    values,
    cleanLines([
      findings,
      yes(values, 'iliacExtension') ? 'Extension into the iliac veins is suspected.' : undefined,
      workflowValue(values, 'softTissueFinding') ? `Soft tissue finding: ${workflowValue(values, 'softTissueFinding')}.` : undefined,
      keyNegativeSentence(values),
    ]),
    impression,
    'Verify assessed venous segments, compressibility, Doppler flow, thrombus acuity, and exam limitations before finalizing.',
  );
}

export function generateReportingWorkflowReport(moduleType: ModuleType, values: WorkflowValues): ReportSections {
  const schema = reportingWorkflowSchemas[moduleType as keyof typeof reportingWorkflowSchemas];
  if (!schema) {
    return {
      indication: '',
      technique: '',
      findings: '',
      impression: '',
      incidentalFindings: '',
      recommendations: 'No schema-driven workflow is available for this module.',
    };
  }

  switch (moduleType) {
    case 'chestXray':
      return generateChestXrayReport(schema, values);
    case 'appendicitis':
      return generateAppendicitisReport(schema, values);
    case 'bowelObstruction':
      return generateBowelObstructionReport(schema, values);
    case 'renalColic':
      return generateRenalColicReport(schema, values);
    case 'ruqUltrasound':
      return generateRuqReport(schema, values);
    case 'dvtUltrasound':
      return generateDvtReport(schema, values);
    default:
      return commonReport(schema, values, '', '', undefined);
  }
}
