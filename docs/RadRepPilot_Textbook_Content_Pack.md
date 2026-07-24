# RadRepPilot Textbook Content Pack

## Purpose

This document converts *Radiology Structured Reporting Handbook: Disease-Specific Templates and Interpretation Pearls* (Brook and Sommer, 2021) into an original, copyright-safe content blueprint for RadRepPilot. It is not a reproduction of the textbook. It summarizes the reporting logic, identifies the information architecture needed by the website, and provides a reliable chapter index for future implementation.

Source files:

- `Radiology_Structured_Reporting_Handbook_Disease-Sp..._(Pg_19--111).pdf`: searchable text, PDF pages 1-93.
- `2nd Half of textbook.pdf`: image-only scan, PDF pages 1-108; OCR is required.

Important indexing note: the image-only PDF is not in normal book order. Its first pages contain the end of chapter 52 and chapter 53; chapter 26 begins at PDF page 10. Index by the explicit map below, not by assuming that PDF page order equals chapter order.

## Recommended RadRepPilot content model

Each disease-specific module should be stored as structured data rather than one large paragraph:

```ts
type ReportingModule = {
  id: string
  title: string
  section: "oncology" | "abdominal" | "thoracic" | "neuro" | "cardiovascular"
  modalities: string[]
  clinicalUse: string
  protocolChecks: Field[]
  findings: FieldGroup[]
  measurements: Measurement[]
  classifications: Classification[]
  comparison: Field[]
  impressionBuilder: ImpressionRule[]
  recommendations: RecommendationRule[]
  pitfalls: string[]
  urgentCommunicationTriggers: string[]
  source: {
    bookChapter: number
    bookPage?: number
    sourcePdf: "first" | "second"
    sourcePdfPageStart: number
    sourcePdfPageEnd?: number
    verification: "text-layer" | "ocr-verified" | "manual-review-needed"
  }
}
```

Every selectable field should support:

- `present`, `absent`, `indeterminate`, and `not assessed` states where clinically appropriate.
- Conditional child fields: selecting a finding reveals only the measurements and descriptors relevant to it.
- Units, allowed ranges, laterality, multiplicity, and comparison with prior imaging.
- A human-readable report sentence plus a discrete machine-readable value.
- A “why this matters” tooltip for staging, management, or multidisciplinary communication.
- Versioning for classifications and guidelines; do not silently treat a 2021 rule as current.
- An override/free-text route so the template assists rather than constrains the radiologist.

## Foundational design principles

### Structured reporting is a spectrum

Adding headings is only basic structure. The clinically useful end of the spectrum uses disease-specific fields chosen with stakeholder input; the most computable form stores those fields as discrete data. RadRepPilot should therefore separate:

1. visual organization of the report;
2. standardized disease content;
3. discrete values suitable for staging, search, audit, and analytics.

### Report quality

A strong report should be clear, correct, confident when justified, concise, complete, consistent, and directly useful to the people making decisions. The impression must synthesize the important findings rather than repeat the findings section.

### Template construction

Build each module around the clinical decision:

1. Identify users and the decision they need to make.
2. Define the minimum required findings.
3. Agree on terminology, measurements, and classifications.
4. Create conditional logic and default normal statements.
5. Test on representative normal, positive, complex, and technically limited cases.
6. Review omissions, ambiguity, completion time, and user feedback.
7. Version the template and maintain an update log.

### Safe implementation

- Do not preselect clinically meaningful “normal” answers that could be overlooked.
- Make technical limitations prominent and propagate them into the impression.
- Distinguish “not present” from “not evaluated.”
- Keep recommendations conditional on patient context and local policy.
- Provide a rapid path for common cases and an expanded path for complex cases.
- Clearly label educational support; final interpretation remains the radiologist’s responsibility.

## Chapter index and source map

### Foundations and cancer imaging

| Ch. | Topic | Book page | Source locator |
|---:|---|---:|---|
| 1 | What Is Structured Reporting? | 3 | first PDF, beginning |
| 2 | Pros and Cons of Structured Reporting | 5 | first PDF |
| 3 | Change Management: Implementation | 9 | first PDF |
| 4 | How to Build a Template | 14 | first PDF |
| 5 | Lymphoma Staging PET-CT | 19 | first PDF |
| 6 | Pancreatic Cancer Initial Staging | 22 | first PDF |
| 7 | Rectal Cancer | 27 | first PDF |
| 8 | Prostate MRI | 31 | first PDF |
| 9 | Renal Mass MRI and CT | 36 | first PDF |
| 10 | Hepatocellular Carcinoma: LI-RADS and OPTN | 40 | first PDF |
| 11 | Hilar Cholangiocarcinoma | 44 | first PDF |
| 12 | Ovarian Cancer Staging | 47 | first PDF |
| 13 | Endometrial Cancer MRI Staging | 50 | first PDF |
| 14 | Cervical Cancer MRI Staging | 53 | first PDF |
| 15 | CT Staging Lung Cancer, TNM 8 | 57 | first PDF |
| 16 | Thyroid Ultrasound | 60 | first PDF |

### Abdominal imaging

| Ch. | Topic | Book page | Source locator |
|---:|---|---:|---|
| 17 | CT Colonography | 65 | first PDF |
| 18 | CT/MR Enterography | 69 | first PDF |
| 19 | Perianal Fistulizing Disease on MRI | 72 | first PDF |
| 20 | Adrenal Incidentaloma on CT/MRI | 76 | first PDF |
| 21 | Ovarian and Adnexal Cyst on Ultrasound | 80 | first PDF |
| 22 | Fibroid MRI | 83 | first PDF |
| 23 | Pelvic Floor Dysfunction | 86 | first PDF |
| 24 | Endometriosis MRI | 90 | first PDF |
| 25 | Cystic Pancreatic Lesions on CT/MRI | 93 | first PDF |
| 26 | Acute and Chronic Pancreatitis | 97 | second PDF pp. 10-12 |
| 27 | Placenta Accreta Spectrum MRI | 100 | second PDF pp. 13-14 |
| 28 | Ultrasound of Liver Transplant | 103 | second PDF pp. 15-17 |
| 29 | Kidney Transplant | 106 | second PDF pp. 18-20 |
| 30 | Living Donor Liver Transplant | 109 | second PDF pp. 21-23 |

### Thoracic imaging

| Ch. | Topic | Source locator |
|---:|---|---|
| 31 | Incidental Pulmonary Nodules | second PDF pp. 25-28 |
| 32 | CT Pulmonary Angiography | second PDF pp. 29-30 |
| 33 | Tracheobronchomalacia | second PDF pp. 31-34 |
| 34 | Fibrotic Lung Disease | second PDF pp. 35-38 |
| 35 | Pulmonary Hypertension CTPA | second PDF pp. 39-42 |
| 36 | Chronic Obstructive Pulmonary Disease | second PDF pp. 43-44 |
| 37 | Cystic Lung Disease | second PDF pp. 45-48 |
| 38 | Lung Cancer Screening | second PDF pp. 49-52 |
| 39 | Chest CT Findings Related to COVID-19 | second PDF pp. 53-56 |
| 40 | COVID-19 on Chest X-ray | second PDF pp. 57-59 |

### Neuroradiology

| Ch. | Topic | Source locator |
|---:|---|---|
| 41 | Brain Tumors MRI | second PDF pp. 61-64 |
| 42 | Multiple Sclerosis | second PDF pp. 65-67 |
| 43 | CT/CTA for Acute Stroke Imaging | second PDF pp. 68-69 |
| 44 | Traumatic Brain Injury | second PDF pp. 70-77 |
| 45 | NI-RADS | second PDF pp. 78-82 |
| 46 | Dementia | second PDF pp. 83-84 |

### Cardiovascular imaging

| Ch. | Topic | Source locator |
|---:|---|---|
| 47 | Coronary CT Angiography | second PDF pp. 86-90 |
| 48 | Transcatheter Aortic Valve Implantation | second PDF pp. 91-94 |
| 49 | Cardiac MR: Cardiomyopathy in an Adult | second PDF pp. 95-99 |
| 50 | AAA Postprocedural Surveillance | second PDF pp. 100-103 |
| 51 | AAA Preprocedural Evaluation | second PDF pp. 104-106 |
| 52 | Coronary Artery Calcium Quantitative CT | second PDF pp. 107-108 plus pp. 1-3 |
| 53 | Fractional Flow Reserve CT for Coronary CTA | second PDF pp. 4-9 |

## Disease-module summaries and field blueprints

### 5. Lymphoma staging PET-CT

**Clinical goal:** Establish metabolically active disease burden, comparison with reference background activity, response category when applicable, and the most clinically important extranodal involvement.

**Capture:** tracer and uptake time; glucose/technical quality; nodal stations with size and avidity; spleen, marrow, liver, and other extranodal disease; reference liver and blood-pool activity; highest-lesion uptake; comparison; response scale; new lesions; incidental actionable findings.

**Impression logic:** disease distribution, dominant/highest-risk sites, metabolic response category, and any limitation that reduces confidence.

### 6. Pancreatic cancer initial staging

**Clinical goal:** Determine local resectability and metastatic disease.

**Capture:** tumor site, size, morphology and enhancement; pancreatic/biliary duct obstruction; arterial and venous contact by vessel and circumferential extent; narrowing, deformity, thrombosis, or collateralization; adjacent-organ invasion; regional nodes; liver/peritoneal/distant metastases; variant vascular anatomy.

**Impression logic:** likely diagnosis, resectability-oriented vascular summary, nodal and distant disease, and surgically relevant anatomy.

### 7. Rectal cancer MRI

**Capture:** tumor height and relation to anal verge/anorectal junction; craniocaudal length; circumferential location; morphology; depth beyond muscularis propria; T category; distance to mesorectal fascia/circumferential resection margin; sphincter/levator involvement; extramural venous invasion; mesorectal and extramesorectal nodes; tumor deposits; response features after treatment.

### 8. Prostate MRI

**Capture:** prostate dimensions and volume; PSA density when data are available; transition- and peripheral-zone lesions; lesion size, location, sequence characteristics, diffusion and enhancement; PI-RADS category and index lesion; extracapsular extension; neurovascular bundle, seminal vesicle, bladder neck, node, and bone involvement; biopsy or treatment changes.

### 9. Renal mass CT/MRI

**Capture:** laterality and pole; size in three dimensions; solid versus cystic composition; enhancement; fat, hemorrhage, necrosis, calcification; collecting-system or sinus involvement; renal vein/IVC thrombus and cranial extent; perinephric extension; multifocality; nodes/metastases; contralateral kidney; nephrometry-relevant anatomy. Use a current cystic-mass classification when relevant.

### 10. Hepatocellular carcinoma

**Capture:** liver background and technical adequacy; observation number, segment, size, arterial-phase hyperenhancement, washout, capsule, threshold growth, ancillary features, tumor in vein; LI-RADS category; OPTN-relevant status when appropriate; treatment response; portal hypertension and extrahepatic disease.

### 11. Hilar cholangiocarcinoma

**Capture:** ductal epicenter and longitudinal extent; intrahepatic duct dilation; lobar atrophy; portal vein and hepatic artery contact/occlusion; biliary anatomic variants; Bismuth-Corlette pattern when used; liver invasion; nodes; peritoneal and distant disease.

### 12-14. Gynecologic cancer MRI

- **Ovarian:** adnexal primary site, morphology, bilateral disease, peritoneal implants by surgical compartment, ascites, nodes, bowel/mesenteric involvement, pleural or distant disease, and sites that may limit optimal cytoreduction.
- **Endometrial:** tumor size/location, depth of myometrial invasion, cervical stromal involvement, serosal/adnexal/vaginal extension, nodes, and distant disease.
- **Cervical:** tumor dimensions, vaginal and parametrial extension, pelvic sidewall, bladder/rectal invasion, ureteric obstruction, nodes, and distant disease.

### 15. Lung cancer CT staging

**Capture:** primary lesion size and lobe; atelectasis/obstructive change; pleural, chest wall, mediastinal, diaphragmatic, cardiac or great-vessel invasion; separate nodules by lobe; nodal stations; contralateral lung, pleural/pericardial, adrenal, liver, bone, and other metastases; explicit TNM edition.

### 16. Thyroid ultrasound

**Capture:** gland dimensions and background; nodule number, location, size, composition, echogenicity, shape, margins, echogenic foci, vascularity when locally used; classification score/category; interval change; suspicious cervical nodes. Recommendations must reference the selected guideline version and relevant clinical context.

### 17. CT colonography

**Capture:** preparation and distention quality by segment; tagged residual fluid/stool; polyp or mass location, morphology and size; confidence and mobility; stricture; extracolonic findings; explicit incomplete segments; standardized colonic and extracolonic category.

### 18. CT/MR enterography

**Capture:** bowel distention and technical quality; involved segment and length; mural thickness, enhancement, edema and diffusion; ulceration; stricture and upstream dilation; penetrating disease, fistula, abscess or phlegmon; mesenteric inflammation; nodes; extraintestinal manifestations; comparison and activity assessment.

### 19. Perianal fistulizing disease MRI

**Capture:** internal opening using clock-face and height; tract course relative to sphincters; external opening; primary classification; secondary tracts; abscess dimensions; supralevator/translevator extension; horseshoe component; active versus fibrotic appearance; associated proctitis.

### 20. Adrenal incidentaloma

**Capture:** side, size, homogeneity; unenhanced attenuation; enhancement and delayed washout when protocol permits; chemical-shift signal loss; macroscopic fat; calcification, hemorrhage, necrosis; growth; invasion/metastases. Recommendations must account for cancer history, hormonal work-up, lesion size, imaging phenotype, and current guideline version.

### 21. Ovarian/adnexal cyst ultrasound

**Capture:** menopausal status if known; side and ovarian versus extraovarian origin; dimensions; unilocular/multilocular architecture; septa; wall irregularity; solid components or papillary projections; Doppler flow; acoustic shadows; ascites/peritoneal findings; classification and follow-up recommendation with guideline version.

### 22. Fibroid MRI

**Capture:** uterine size; number and dominant fibroid dimensions; FIGO location/type; enhancement, degeneration, diffusion, calcification/hemorrhage; relationship to endometrium and serosa; pedunculation and stalk; adenomyosis; ovarian findings; features relevant to embolization or surgery.

### 23. Pelvic floor dysfunction

**Capture:** examination quality and patient effort; reference line; resting and evacuation measurements; anterior, middle, and posterior compartment descent; cystocele, uterine/vaginal vault prolapse, enterocele/peritoneocele, rectocele, intussusception and rectal prolapse; evacuation completeness; paradoxical puborectalis behavior.

### 24. Endometriosis MRI

**Capture:** endometriomas; deep implants by compartment; uterosacral ligaments, torus, rectovaginal septum, vagina, bladder/ureters and bowel; lesion dimensions and depth/circumference of bowel involvement; adhesions and pouch-of-Douglas obliteration; hydronephrosis; adenomyosis; surgically relevant mapping.

### 25. Cystic pancreatic lesions

**Capture:** number, site and size; duct communication; main pancreatic duct diameter; mural nodule or solid component; wall/septal enhancement; growth; pancreatitis; biliary obstruction; parenchymal atrophy; nodes. Separate worrisome from high-risk features and state the guideline/version used.

### 26. Acute and chronic pancreatitis

**Capture:** pancreatic enlargement/atrophy and enhancement; necrosis percentage and distribution; inflammatory change; fluid collections with maturity, wall, contents and size; duct disruption/dilation/stones; calcification; vascular thrombosis/pseudoaneurysm; biliary cause; organ complications. Use current standardized terminology for interstitial versus necrotizing disease and collection type.

### 27. Placenta accreta spectrum MRI

**Capture:** placental location and previa; prior uterine surgery if known; uterine bulge; dark intraplacental bands; heterogeneous placenta; myometrial thinning/interruption; abnormal vascularity; bladder interface and parametrial extension; cervix; fetal/uterine orientation. Avoid assigning invasion depth beyond imaging confidence.

### 28-30. Transplant modules

- **Liver transplant ultrasound:** graft appearance; hepatic artery waveform and resistive index; portal and hepatic vein direction/patency; anastomotic velocities; biliary dilation; collections; comparison and urgent vascular complications.
- **Kidney transplant:** graft size and echogenicity; collecting system; perinephric collections; renal artery/vein patency; anastomotic and intrarenal velocities; resistive indices; acceleration time/tardus-parvus waveform; bladder; comparison.
- **Living liver donor:** segmental anatomy; total and proposed graft/remnant volumes; arterial, portal, hepatic venous and biliary variants; steatosis and focal lesions; measurements that affect surgical planes and venous drainage.

### 31. Incidental pulmonary nodules

**Capture:** patient risk context and cancer history; solid/subsolid type; number; mean or volumetric size; lobe and series/image; morphology; growth and prior date; dominant/most suspicious nodule; guideline eligibility and exclusions. Generate follow-up only after verifying that the chosen guideline applies.

### 32. CT pulmonary angiography

**Capture:** contrast quality and limiting artifact; embolus location and most proximal level; acute versus chronic features; clot burden only if locally used; RV/LV ratio and right-heart strain signs; pulmonary infarct; alternative diagnosis; urgent communication.

### 33. Tracheobronchomalacia

**Capture:** inspiratory and expiratory technique; tracheal and main bronchial caliber and percentage collapse; morphology of expiratory collapse; focal versus diffuse involvement; air trapping; associated airway or lung disease; technical adequacy of forced expiration.

### 34. Fibrotic lung disease

**Capture:** image quality and inspiratory/prone/expiratory series; distribution by axial and craniocaudal pattern; reticulation, traction bronchiectasis, honeycombing, ground glass, mosaic attenuation and air trapping; emphysema; confidence in UIP or alternative pattern; interval progression; acute superimposed abnormality.

### 35. Pulmonary hypertension CTPA

**Capture:** pulmonary artery dimensions; embolic disease and chronic thromboembolic signs; right-heart chamber and septal findings; reflux; lung parenchymal disease; mosaic attenuation; left-heart/valvular clues; systemic collaterals; potential etiology rather than diameter alone.

### 36. COPD CT

**Capture:** emphysema type, distribution and severity; airway wall thickening, bronchiectasis and mucus plugging; air trapping; bullae; fissure completeness when relevant to intervention; pulmonary nodules; alternative or associated disease.

### 37. Cystic lung disease

**Capture:** true cyst morphology, size and wall; upper/lower and central/peripheral distribution; number; associated nodules, ground glass, septal thickening or pneumothorax; extrapulmonary clues. Structure the differential from pattern and clinical context.

### 38. Lung cancer screening

**Capture:** screening eligibility data when available; nodule type, size/volume, growth and category; prior comparison; significant incidental findings; overall screening category; management recommendation. Store the classification system and version as data.

### 39-40. COVID-related chest imaging

The book provides pandemic-era standardized descriptors. These should be presented in RadRepPilot as a historical/adaptable viral-pneumonia module, not as timeless management guidance.

**CT capture:** ground-glass and consolidation distribution, crazy paving, organizing-pneumonia signs, findings atypical for the suspected infection, pleural findings, embolism if angiography performed, and extent/severity.

**Radiograph capture:** distribution and predominance of opacities, consolidation, pleural findings, support devices, complications, and change.

### 41. Brain tumor MRI

**Capture:** examination and treatment history; lesion location and dimensions; enhancement and nonenhancing abnormality; diffusion, susceptibility, perfusion and spectroscopy where available; edema/infiltration; mass effect, herniation and hydrocephalus; ventricular/ependymal, leptomeningeal and cranial nerve spread; treatment response and confidence distinguishing progression from treatment effect.

### 42. Multiple sclerosis

**Capture:** protocol completeness; lesion count or burden by periventricular, juxtacortical/cortical, infratentorial and spinal compartments; enhancing and diffusion-restricting lesions; new/enlarging lesions versus dated prior; T1 hypointense burden and atrophy if locally reported; findings atypical for demyelination.

### 43. Acute stroke CT/CTA

**Capture:** exact symptom/onset context if supplied; hemorrhage; early ischemic change and ASPECTS with limitations; infarct core/penumbra only when perfusion is performed and technically valid; occlusion site; collateral assessment; cervical/intracranial stenosis or dissection; tandem lesion; urgent treatment-relevant findings and communication time.

### 44. Traumatic brain injury

**Capture:** extra-axial and intra-axial hemorrhage type, site and size; contusions; diffuse axonal injury clues; mass effect, midline shift, cisterns and herniation; skull/facial fractures; pneumocephalus; vascular injury concern; devices; comparison and progression. Critical findings require explicit communication.

### 45. NI-RADS

**Capture:** primary site and nodal bed separately; expected post-treatment change; focal mucosal abnormality; deep mass or enhancement; size and metabolic information when available; category, confidence, and management linkage. Store version and ensure local head-and-neck workflow agreement.

### 46. Dementia MRI

**Capture:** technical adequacy; regional and global atrophy pattern; medial temporal and posterior cortical predominance; vascular lesion burden, lacunes and strategic infarcts; microbleeds/siderosis; hydrocephalus pattern; mass/subdural collection; potentially reversible causes. Avoid diagnosing a clinical dementia syndrome from imaging alone.

### 47. Coronary CTA

**Capture:** heart rate/quality and nondiagnostic segments; coronary origin and dominance; plaque composition; stenosis by segment; stents/grafts; high-risk plaque features where used; overall CAD-RADS category and modifiers; cardiac and extracardiac findings. Classification and management links must be versioned.

### 48. TAVI planning CTA

**Capture:** aortic valve morphology and calcium; annular area, perimeter and diameters; coronary ostial heights; sinus of Valsalva and sinotubular junction; ascending aorta; optimal fluoroscopic angle if used; iliofemoral minimal luminal diameters, calcification and tortuosity; alternative access; left ventricular outflow tract and other relevant cardiac findings.

### 49. Cardiac MR for cardiomyopathy

**Capture:** image quality; ventricular volumes, ejection fractions and mass indexed to body size; regional wall motion; wall thickness; atrial size; valve/pericardial findings; edema; perfusion; late gadolinium enhancement pattern and extent; thrombus; noncompaction or arrhythmogenic features; parametric mapping when available. Synthesize the phenotype and differential rather than merely listing measurements.

### 50. AAA postprocedural surveillance

**Capture:** repair type; aneurysm sac maximum diameter and/or volume with prior comparison; graft position, migration, kinking, patency and limb occlusion; endoleak type and source; branch-vessel patency; rupture/inflammation; access-site or other complication.

### 51. AAA preprocedural evaluation

**Capture:** aneurysm location, morphology and maximal orthogonal diameter; proximal neck length, diameter, angulation, thrombus and calcification; renal/visceral branches and variants; iliac aneurysm; landing zones; access-vessel minimum diameters, calcification and tortuosity; rupture signs; branch-vessel disease.

### 52. Coronary calcium CT

**Capture:** acquisition quality; Agatston score by vessel and total; number of involved vessels; age/sex percentile when an appropriate reference is available; standardized category; extracoronary and incidental findings. The score reflects calcified plaque burden and does not exclude noncalcified disease, especially in symptomatic patients.

### 53. Fractional flow reserve CT

**Capture:** adequacy of the source coronary CTA; vessel and lesion location; plaque and anatomic stenosis; FFR-CT value at a standardized location; lowest vessel value; focal versus gradual pressure drop; likelihood of flow limitation; segments that cannot be analyzed.

**Interpretation guardrail:** values should be interpreted with symptoms, coronary anatomy, image quality, and revascularization feasibility. Avoid turning a threshold into an automatic treatment instruction.

## Recommended first implementation wave

The strongest first expansion is a focused set of high-value modules that fit RadRepPilot’s existing branching-report concept:

1. **CT pulmonary angiography** - compact, high-frequency, urgent, and naturally conditional.
2. **Incidental pulmonary nodules** - ideal for guideline/version logic and follow-up generation.
3. **Pancreatic cancer staging** - demonstrates multidisciplinary and resectability-oriented reporting.
4. **Rectal cancer MRI** - showcases structured staging and margin assessment.
5. **Renal mass CT/MRI** - combines characterization, staging, and surgical anatomy.
6. **Acute stroke CT/CTA** - supports time-critical findings and communication.
7. **AAA preprocedural evaluation** - measurement-heavy and well suited to discrete fields.
8. **Coronary CTA** - valuable but should follow only after versioned CAD-RADS logic is implemented.

## Implementation guardrails for Codex

When using this content to modify RadRepPilot:

- Do not paste raw OCR into the user interface.
- Do not create all 53 modules as static React components.
- Store module definitions in typed JSON/TypeScript data and render them through shared field components.
- Keep classification engines separate from display text.
- Add `guidelineName`, `guidelineVersion`, `lastReviewed`, and `reviewStatus` to every recommendation-bearing module.
- Use `manually_curated`, `needs_clinical_review`, and `reviewed` states.
- Add automated tests for conditional visibility, unit handling, missing required fields, classification boundaries, report sentence generation, and persistence.
- Treat OCR-derived wording as a locator only. Verify any exact threshold, staging rule, or management recommendation against the textbook page and a current primary guideline before production use.
- Show the source chapter and review date in an expandable “Evidence and provenance” area.

## Suggested content workflow

1. Select one module from the first implementation wave.
2. Verify its exact source pages visually.
3. Convert each finding into a discrete field and define conditional children.
4. Build impression rules from combinations of findings.
5. Add current guideline logic from a primary source where management is generated.
6. Have a radiologist review wording and completeness.
7. Mark the module reviewed and record reviewer/date/version.

## Copyright and clinical-use note

This pack is an original synthesis for product development. The attached textbook should remain a private reference. Do not publish long verbatim templates, tables, figures, or textbook prose. Clinical classifications and recommendations may have changed since 2021; confirm them against current primary guidance before using them for patient care.
