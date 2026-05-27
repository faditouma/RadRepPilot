import { reportingModules as baseReportingModules, bodySystems, modalities } from '../radrep/reportingModules';
import type { ReportingModuleDefinition } from '../radrep/types';
import { prototypeSafetyNote } from './sourceMetadata';

type Preview = Partial<
  Pick<
    ReportingModuleDefinition,
    | 'clinicalScenario'
    | 'keyFindings'
    | 'keyNegatives'
    | 'complicationsRedFlags'
    | 'associatedCalculators'
    | 'associatedIncidentalFindings'
    | 'sampleImpression'
    | 'sourceNames'
    | 'sourceLinks'
    | 'safetyNote'
  >
>;

const previewById: Record<string, Preview> = {
  'xray-cxr-pneumonia': {
    clinicalScenario: 'Cough, fever, dyspnea, or suspected lower respiratory tract infection.',
    keyFindings: ['Focal or multifocal airspace opacity', 'Lobar versus bronchopneumonia pattern', 'Pleural effusion', 'Cavitation', 'Volume loss/atelectasis'],
    keyNegatives: ['No pleural effusion', 'No pneumothorax', 'No pulmonary edema'],
    complicationsRedFlags: ['Cavitation', 'Empyema/large effusion', 'Non-resolving or mass-like opacity'],
    associatedIncidentalFindings: ['Pulmonary nodule', 'Pleural effusion'],
    sampleImpression: '[Lobar/multifocal] airspace opacity in the [location], concerning for pneumonia in the appropriate clinical context. No pleural effusion or pneumothorax.',
  },
  'xray-cxr-chf': {
    clinicalScenario: 'Dyspnea, orthopnea, edema, CHF exacerbation, or volume overload concern.',
    keyFindings: ['Cardiomediastinal size', 'Vascular congestion', 'Interstitial edema', 'Alveolar edema', 'Pleural effusions'],
    keyNegatives: ['No focal consolidation', 'No pneumothorax'],
    complicationsRedFlags: ['Large effusions', 'Asymmetric edema', 'Concurrent pneumonia concern'],
    sampleImpression: 'Findings compatible with pulmonary edema, including [features].',
  },
  'xray-cxr-pneumothorax': {
    clinicalScenario: 'Chest pain, dyspnea, trauma, line placement, or post-procedure check.',
    keyFindings: ['Side', 'Size estimate', 'Tension features', 'Chest tube position'],
    keyNegatives: ['No mediastinal shift', 'No pleural effusion'],
    complicationsRedFlags: ['Tension physiology', 'Increasing pneumothorax', 'Malpositioned tube'],
    sampleImpression: '[Small/moderate/large] [left/right] pneumothorax without tension features.',
  },
  'xray-cxr-effusion': {
    clinicalScenario: 'Dyspnea, CHF, infection, malignancy, or pleural disease follow-up.',
    keyFindings: ['Laterality', 'Size', 'Loculation', 'Associated consolidation/atelectasis'],
    keyNegatives: ['No pneumothorax', 'No pulmonary edema if absent'],
    complicationsRedFlags: ['Loculation', 'Large effusion causing mass effect', 'Pleural nodularity if visible'],
    sampleImpression: '[Small/moderate/large] [left/right] pleural effusion with adjacent [atelectasis/consolidation if present].',
  },
  'xray-cxr-lines': {
    clinicalScenario: 'Post-intubation, line placement, enteric tube placement, or ICU device check.',
    keyFindings: ['ETT position relative to carina', 'Enteric tube course and tip', 'Central venous catheter tip', 'Pneumothorax complication check'],
    keyNegatives: ['No pneumothorax', 'No malpositioned support device'],
    complicationsRedFlags: ['Mainstem intubation', 'Extravascular catheter course', 'Tube tip above GE junction'],
    sampleImpression: 'Support devices as described. No pneumothorax.',
  },
  'xray-abd-obstruction': {
    clinicalScenario: 'Vomiting, distension, constipation, ileus, or obstruction concern.',
    keyFindings: ['Small bowel dilation', 'Large bowel dilation', 'Air-fluid levels', 'Rectal gas', 'Free air if assessed'],
    keyNegatives: ['No free intraperitoneal air on provided views', 'No high-grade obstruction pattern'],
    complicationsRedFlags: ['Free air', 'Marked colonic dilation', 'Closed-loop concern requires CT'],
    sampleImpression: 'Bowel gas pattern [suggestive/not suggestive] of obstruction. No free intraperitoneal air on provided views.',
  },
  'xray-abd-constipation': {
    clinicalScenario: 'Constipation, fecal loading, abdominal pain, or stool burden assessment.',
    keyFindings: ['Stool burden', 'Rectal stool ball', 'Obstruction signs', 'Colonic caliber'],
    keyNegatives: ['No bowel obstruction pattern', 'No free air on provided views'],
    complicationsRedFlags: ['Rectal fecal impaction', 'Marked colonic dilation'],
    sampleImpression: 'Moderate/large colonic stool burden without radiographic evidence of bowel obstruction.',
  },
  'xray-msk-trauma': {
    clinicalScenario: 'Acute trauma, focal tenderness, swelling, deformity, or inability to bear weight.',
    keyFindings: ['Fracture location', 'Displacement/angulation', 'Intra-articular extension', 'Alignment/dislocation', 'Soft tissue swelling', 'Hardware if present'],
    keyNegatives: ['No acute fracture', 'No dislocation'],
    complicationsRedFlags: ['Open fracture concern', 'Joint involvement', 'Hardware failure'],
    sampleImpression: '[Acute/subacute] fracture of the [bone/location] with [displacement/alignment].',
  },
  'xray-msk-arthritis': {
    clinicalScenario: 'Chronic joint pain, reduced range of motion, inflammatory features, or pre-referral baseline.',
    keyFindings: ['Joint space narrowing', 'Osteophytes', 'Subchondral sclerosis/cysts', 'Erosions', 'Alignment'],
    keyNegatives: ['No acute osseous abnormality', 'No erosive change if absent'],
    complicationsRedFlags: ['Aggressive bone lesion', 'Erosive arthropathy', 'Avascular necrosis features'],
    sampleImpression: 'Degenerative changes of the [joint], greatest at [location]. No acute osseous abnormality.',
  },
  'us-ruq-biliary': {
    clinicalScenario: 'RUQ pain, biliary colic, cholecystitis, jaundice, or abnormal cholestatic labs.',
    keyFindings: ['Gallstones', 'Gallbladder wall thickening', 'Pericholecystic fluid', 'Sonographic Murphy sign', 'CBD diameter', 'Intrahepatic duct dilation'],
    keyNegatives: ['No biliary duct dilation', 'No sonographic cholecystitis features'],
    complicationsRedFlags: ['Marked duct dilation', 'Gallbladder perforation concern', 'Mass or obstructing lesion'],
    associatedIncidentalFindings: ['Liver lesion', 'Renal cyst/mass'],
    sampleImpression: 'Cholelithiasis with [features], [concerning/not concerning] for acute cholecystitis.',
  },
  'us-renal-bladder': {
    clinicalScenario: 'Flank pain, renal dysfunction, retention, hydronephrosis, or stone follow-up.',
    keyFindings: ['Hydronephrosis grade', 'Stones', 'Renal size/echogenicity', 'Renal cyst/mass', 'Bladder volume/post-void residual'],
    keyNegatives: ['No hydronephrosis', 'No renal calculus visualized'],
    complicationsRedFlags: ['Bilateral obstruction', 'Solid renal mass', 'Very high post-void residual'],
    associatedIncidentalFindings: ['Renal cyst/mass'],
    sampleImpression: '[Mild/moderate/severe] [left/right] hydronephrosis. [Stone if seen].',
  },
  'us-pelvic-pain': {
    clinicalScenario: 'Pelvic pain, adnexal pain, torsion concern, cyst follow-up, or acute gynecologic symptoms.',
    keyFindings: ['Uterus/endometrium', 'Ovarian size', 'Adnexal cyst/mass morphology', 'Doppler flow if torsion concern', 'Free fluid'],
    keyNegatives: ['No adnexal mass', 'No abnormal free fluid'],
    complicationsRedFlags: ['Enlarged ovary with torsion concern', 'Complex mass', 'Hemoperitoneum'],
    associatedCalculators: ['O-RADS preview'],
    associatedIncidentalFindings: ['Adnexal cyst'],
    sampleImpression: '[Simple/complex] [left/right] adnexal cyst measuring [size]. O-RADS/adnexal follow-up may be considered if applicable.',
  },
  'us-dvt': {
    clinicalScenario: 'Leg swelling, pain, redness, VTE risk factors, or anticoagulation decision support.',
    keyFindings: ['Compressibility', 'Thrombus location', 'Occlusive/nonocclusive', 'Acute/chronic features'],
    keyNegatives: ['No DVT in assessed veins'],
    complicationsRedFlags: ['Extensive iliofemoral thrombus', 'Progression', 'Limited calf vein assessment'],
    sampleImpression: '[Occlusive/nonocclusive] DVT involving the [vein segments].',
  },
  'ct-ap-appendicitis': {
    clinicalScenario: 'RLQ pain, fever, leukocytosis, appendicitis or alternative acute abdomen concern.',
    keyFindings: ['Appendix diameter', 'Wall enhancement', 'Fat stranding', 'Appendicolith', 'Abscess/perforation', 'Alternative diagnosis'],
    keyNegatives: ['No abscess', 'No free air', 'No bowel obstruction'],
    complicationsRedFlags: ['Perforation', 'Abscess', 'Phlegmon', 'Portal venous gas'],
    sampleImpression: 'Findings consistent with [uncomplicated/complicated] acute appendicitis.',
  },
  'ct-ap-diverticulitis': {
    clinicalScenario: 'LLQ pain, fever, bowel symptoms, recurrent diverticulitis, or complication concern.',
    keyFindings: ['Segment involved', 'Diverticula', 'Wall thickening', 'Pericolonic inflammation', 'Abscess/perforation/fistula/obstruction'],
    keyNegatives: ['No abscess', 'No free air', 'No obstruction'],
    complicationsRedFlags: ['Abscess', 'Perforation', 'Fistula', 'Obstruction'],
    sampleImpression: 'Acute [location] diverticulitis without/with complication.',
  },
  'ct-ap-bowel-obstruction': {
    clinicalScenario: 'Vomiting, distension, obstipation, prior surgery, hernia, or obstruction concern.',
    keyFindings: ['Small versus large bowel', 'Transition point', 'Degree of obstruction', 'Cause', 'Closed loop', 'Ischemia signs', 'Perforation'],
    keyNegatives: ['No CT evidence of ischemia', 'No perforation'],
    complicationsRedFlags: ['Closed-loop obstruction', 'Bowel ischemia', 'Perforation'],
    sampleImpression: '[Small/large] bowel obstruction with transition point at [location]. No CT evidence of ischemia or perforation.',
  },
  'ct-kub-renal-colic': {
    clinicalScenario: 'Flank pain, hematuria, renal colic, or obstructing calculus concern.',
    keyFindings: ['Stone size/location', 'Hydronephrosis', 'Perinephric stranding', 'Additional stones'],
    keyNegatives: ['No hydronephrosis', 'No urinary tract calculus'],
    complicationsRedFlags: ['Obstructing stone with infection concern', 'Solitary kidney', 'Marked hydronephrosis'],
    associatedIncidentalFindings: ['Renal cyst/mass', 'Adrenal nodule'],
    sampleImpression: 'Obstructing [size] mm stone at the [location] causing [degree] hydronephrosis.',
  },
  'ct-aorta': {
    clinicalScenario: 'Acute aortic syndrome, aneurysm surveillance, chest/back/abdominal pain, or vascular follow-up.',
    keyFindings: ['Aneurysm/dissection', 'Maximum diameter', 'Branch involvement', 'Rupture signs'],
    keyNegatives: ['No dissection', 'No rupture signs'],
    complicationsRedFlags: ['Rupture/leak', 'Malperfusion', 'Rapid growth'],
    associatedIncidentalFindings: ['Aortic aneurysm'],
    sampleImpression: '[Aneurysm/dissection] involving [segment], measuring up to [size].',
  },
  'mri-spine-cauda': {
    clinicalScenario: 'Urinary retention, saddle anesthesia, bilateral sciatica, progressive weakness, or severe back pain.',
    keyFindings: ['Canal stenosis', 'Disc herniation', 'Cauda equina compression', 'Infection/malignancy signs'],
    keyNegatives: ['No cauda equina compression', 'No epidural abscess if absent'],
    complicationsRedFlags: ['Severe canal stenosis', 'Epidural abscess', 'Pathologic fracture'],
    sampleImpression: '[Level] disc herniation causing [degree] canal stenosis and [presence/absence] cauda equina compression.',
  },
  'mri-knee': {
    clinicalScenario: 'Internal derangement, meniscal tear, ligament injury, locking, instability, or persistent pain.',
    keyFindings: ['Menisci', 'Cruciate/collateral ligaments', 'Cartilage', 'Bone marrow edema/fracture', 'Effusion'],
    keyNegatives: ['No meniscal tear', 'No ligament rupture', 'No fracture'],
    complicationsRedFlags: ['Occult fracture', 'Root tear', 'Multiligament injury'],
    sampleImpression: '[Meniscal/ligamentous/cartilage] injury as described.',
  },
  'mri-shoulder': {
    clinicalScenario: 'Rotator cuff tear, labral injury, instability, weakness, or persistent shoulder pain.',
    keyFindings: ['Rotator cuff tendons', 'Tear thickness', 'Retraction', 'Muscle atrophy', 'Labrum', 'Biceps tendon'],
    keyNegatives: ['No full-thickness cuff tear', 'No muscle atrophy if absent'],
    complicationsRedFlags: ['Massive cuff tear', 'Advanced atrophy', 'Occult fracture or infection'],
    sampleImpression: '[Partial/full-thickness] tear of [tendon] with [retraction/atrophy if present].',
  },
};

const defaultPreview: Preview = {
  clinicalScenario: 'Planned structured workflow with indication-specific checklist and report-ready language.',
  keyFindings: ['Primary abnormality descriptors', 'Location/extent', 'Comparison', 'Clinically actionable associated findings'],
  keyNegatives: ['No acute complication if absent', 'No high-risk feature if absent'],
  complicationsRedFlags: ['Unexpected critical finding', 'High-risk imaging feature', 'Need for comparison or urgent communication'],
  associatedCalculators: ['Relevant RADS/calculator support when applicable'],
  associatedIncidentalFindings: ['Incidental Findings & Follow-up support when applicable'],
  sampleImpression: '[Finding] involving [location], with [key qualifiers]. Final report language requires radiologist verification.',
};

export const reportingModules: ReportingModuleDefinition[] = baseReportingModules.map((module) => ({
  ...module,
  ...defaultPreview,
  ...(previewById[module.id] ?? {}),
  sourceNames: previewById[module.id]?.sourceNames ?? ['Prototype structured reporting content'],
  sourceLinks: previewById[module.id]?.sourceLinks ?? [],
  safetyNote: prototypeSafetyNote,
}));

export { bodySystems, modalities };
