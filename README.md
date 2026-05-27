# RadRepPilot

RadRepPilot is a local React/TypeScript prototype for a dual radiology workflow:

- Better requisitions in: structured primary-care imaging request builders help referrers provide concise, radiology-useful clinical context and a focused question.
- Better reports out: radiologist-facing reporting modules, calculators, RADS/classification previews, and incidental finding helpers generate editable report-ready language from user-entered findings.

RadRepPilot does not interpret images, diagnose disease, determine imaging appropriateness, or replace radiologist review.

The current prototype includes a professional RadRepPilot brand mark: a radiology screen, report page, and navigation arrow motif used in the sidebar and dashboard hero.

RadRepPilot is also a credibility/portfolio prototype. It is meant to show an understanding of radiology as a workflow,
communication, safety, reporting, and clinical reasoning specialty, not simply a website that fills report text.

## Run Locally

```bash
npm install
npm run dev
```

For a production build and local preview:

```bash
npm run build
npm run preview
```

## Implemented Prototype Areas

- Dashboard with dual-workflow positioning and an Anatomy Cockpit card navigator
- Prominent 3-minute guided demo for reviewers
- Why RadRepPilot Matters portfolio page
- Example Reports & Requisitions gallery
- Prototype quality metrics for requisitions, reports, and incidental follow-up language
- Interactive body-system card grid for head/neck, chest, abdomen, pelvis/GU, spine, MSK, vascular, and oncology workflows
- Radiology Reporting Modules with branching navigation: modality -> body system -> workflow
- Reusable schema-driven reporting workflow engine for high-yield modules
- Implemented reporting workflows:
  - CTPA pulmonary embolism
  - CT chest pulmonary nodule / simplified Fleischner assistant
  - CT head stroke / ASPECTS assistant
  - CT abdomen/pelvis appendicitis
  - CT abdomen/pelvis bowel obstruction
  - CT KUB renal colic
  - RUQ ultrasound biliary colic/cholecystitis
  - Lower-limb venous ultrasound DVT
- Primary Care Imaging Requests with Quick Mode, Detailed Mode, age/sex/PMHx context, output style controls, one-click negatives, missing essentials, and "why this matters" guidance
- Guidelines & Calculators branching workspace by body system/helper family
- RADS/classification preview registry
- Embedded context-aware Incidental Findings & Follow-up support inside reporting workflows
- ACR Appropriateness Criteria prototype topic-mapping framework
- Content status badges for draft/unreviewed clinical content
- Change log panel
- Report Builder with dedicated Incidental Findings / Follow-up and Recommendations sections
- Saved Drafts in browser `localStorage`

## Guided Demo Mode

The dashboard includes a **Run 3-minute demo** button. The guided demo walks a reviewer through three high-yield stories:

- Vague GP requisition -> improved requisition -> CT abdomen/pelvis appendicitis workflow -> incidental adrenal follow-up -> final impression
- CTPA pulmonary embolism workflow with RV/LV ratio helper language
- Pulmonary nodule follow-up language with simplified Fleischner-style applicability warnings

The demo uses short step cards with progress, Next/Back controls, copyable sample output, and an "Open this workflow" button.
The intent is to make the product's clinical value obvious without requiring the reviewer to discover every feature manually.

## Why RadRepPilot Matters

The app includes a portfolio-style **Why This Matters** page explaining the clinical insight behind the project:

- Radiology quality begins before image interpretation.
- Better requisitions help radiologists answer better clinical questions.
- Structured reporting workflows prompt key findings, negatives, complications, calculators, and follow-up language.
- Incidental findings are a communication and safety challenge.
- A Family Medicine background helps bridge what referrers send and what radiologists need.
- The prototype does not interpret images or diagnose; it organizes user-entered information into draft language.

## Example Outputs Gallery

The **Example Reports & Requisitions** gallery lets reviewers understand the product without manually filling forms. Current
sample cards include:

- GP requisition before/after
- CTPA no PE
- CTPA PE with right heart strain
- CT appendicitis
- CT bowel obstruction
- Pulmonary nodule follow-up
- CT head ASPECTS

Each sample includes the clinical scenario, generated output, what RadRepPilot contributed, a copy button, a content status
badge, and an option to open the related workflow when applicable.

## Prototype Quality Metrics

RadRepPilot includes lightweight, non-validated quality support to demonstrate a safety mindset:

- **Requisition completeness score:** age/sex, relevant PMHx, symptom/indication, duration, red flags, and specific radiology question.
- **Report completeness checklist:** workflow-specific prompts such as PE distribution/RV strain or appendix visualization/complications.
- **Follow-up safety indicator:** recommendation present, modality present, interval present when applicable, and applicability/protocol warning present.

These metrics are explicitly labeled **Prototype quality support**. They do not claim validated performance or clinical safety.

## Primary Care Imaging Requests

Quick Mode is designed for busy clinicians who need usable requisition text in under 60 seconds. It asks for compact demographics/context, the main symptom, duration, key red flags, a small number of objective details, and the clinical question.

Default requisitions are concise:

> 34M, known for Crohn disease, presenting with 3 days of right lower quadrant pain and fever. Please assess for/rule out appendicitis, complication, or alternative acute intra-abdominal pathology. Thank you.

Universal GP fields include age, sex/gender shorthand, relevant PMHx, surgical history, cancer history, immunosuppression, pregnancy status when relevant, and contrast/eGFR safety when relevant. Output styles are Minimal, Standard, and Detailed, with Direct Clinical or Polite Requisition tone.

Detailed Mode expands the same template into collapsible sections:

- Symptoms
- Red flags
- Exam
- Labs
- Relevant history
- Contrast/safety
- Question for radiology

Generated requisitions support three output styles:

- Ultra-concise
- Standard
- Detailed

Example output:

> Clinical information: 45-year-old patient with 2 days of right lower quadrant pain, fever, localized tenderness, WBC 14, and elevated CRP. Question for radiology: assess for appendicitis, complication, or alternative acute intra-abdominal pathology.

## Calculators / Classification Helpers

The calculator workspace now opens as a branching helper cockpit rather than a long reading list. Users select a category such as Chest, Neuro, Abdomen/Liver, GU, Breast, Gyn/Adnexa, MSK, Cardiac/Vascular, Oncology, or Thyroid, then open a specific interactive helper.

Implemented calculator helpers:

- RV/LV ratio
- ASPECTS
- Simplified Fleischner pulmonary nodule assistant
- Adrenal washout
- Simplified Bosniak renal cyst helper
- Simplified TI-RADS thyroid nodule helper
- Basic RECIST 1.1 measurement tracker

Interactive partial prototype helpers now include:

- LI-RADS
- PI-RADS
- BI-RADS
- O-RADS
- Lung-RADS
- CAD-RADS
- Bone-RADS
- NI-RADS
- VI-RADS

Renal mass characterization and cross-sectional incidental lesion follow-up remain planned preview helpers with source/limitations metadata.

## Incidental Findings & Follow-up

The incidental finding helpers are primarily embedded inside radiology reporting workflows so radiologists can add follow-up language without leaving the report. They generate draft follow-up language from radiologist-entered descriptors. Implemented prototype helpers:

- Incidental pulmonary nodule
- Incidental adrenal nodule
- Incidental renal cyst/mass
- Incidental thyroid nodule
- Incidental liver lesion
- Incidental pancreatic cyst
- Incidental adnexal cyst
- Aortic aneurysm

Within reporting workflows, incidental support is context-aware and compact: users choose a finding type, complete a mini-form, generate a sentence, then insert it into Findings, Impression, Incidental Findings / Follow-up, Recommendations, or the Report Builder. Associated helpers such as Fleischner, Lung-RADS, adrenal washout, Bosniak, TI-RADS, LI-RADS, O-RADS, and vascular follow-up previews open in an in-workflow drawer so the reporting state is preserved.

Incidental outputs now aim to include:

- Description sentence
- Suggested follow-up/action sentence
- Modality when reasonable, such as CT chest, adrenal protocol CT/MRI, renal protocol CT/MRI, thyroid ultrasound, MRI liver protocol, MRI/MRCP, pelvic ultrasound, or surveillance ultrasound/CT
- Time interval when reasonable or user-selected, such as 6 months, 12 months, 2 years, or per local protocol
- Applicability and verification warning

## Reporting Workflow Engine

The newer implemented reporting modules are powered by static workflow schemas and report generators. Each schema defines:

- Main imaging findings
- Measurements
- Key negatives
- Complications/red flags
- Incidental finding options
- Quick-fill templates
- Optional clinical context fields
- Default technique and clinical question

Clinical context is collapsed by default in radiologist-facing workflows so imaging findings and quick-fill templates are first. Planned modules remain rich preview cards with key findings, negatives, red flags, related tools, incidental support, sample impression language, and source/limitations metadata.

## New UX Model

RadRepPilot uses branching navigation to reduce scrolling:

- Reporting: modality -> body system -> workflow
- Calculators: body system/helper family -> interactive helper
- Incidental findings: context-aware mini-form inside the active workflow
- Dashboard: Anatomy Cockpit card -> related workflows, helpers, and incidental findings

No CTPA or other reporting workflow opens by default. The user chooses a path, then works in one focused area with a live editable output panel.

## ACR Appropriateness Criteria Prototype

The referrer workflow includes a prototype ACR Appropriateness Criteria support panel. It maps selected GP templates to a curated topic placeholder and official ACR verification link, such as Headache, Suspected Pulmonary Embolism, Right Lower Quadrant Pain, Right Upper Quadrant Pain, Acute Pelvic Pain, or Suspected Lower-Extremity DVT.

This does not reproduce ACR rating tables, does not assign definitive appropriateness ratings, and does not determine whether imaging should be ordered. It is a communication and verification scaffold only.

## Clinical Content Validation Plan

1. Build workflow prototype.
2. Review with radiology resident/staff.
3. Verify key findings and key negatives.
4. Verify impression language.
5. Verify follow-up recommendation logic.
6. Adapt to local institutional reporting style.
7. Mark as reviewed only after verification.

New or unverified workflows/helpers are marked Draft content or Needs radiology review.

The validation layer is intentionally visible in the UI through draft/review status badges and explanatory safety notes. Content
should only be marked as reviewed, source verified, or local protocol adapted after actual radiology review.

## Safety Limitations

Prototype only. Do not enter patient-identifying information.

All calculator, guideline, RADS, and follow-up logic is simplified, paraphrased prototype logic. Users must verify:

- Source image findings and measurements
- Guideline applicability
- Current official guideline versions
- Local protocol requirements
- Final report/requisition wording

The app uses static local registry metadata and does not fetch internet data at runtime. There is no backend, authentication, database, API key, or autonomous image interpretation.

## Future Roadmap

- Convert placeholder reporting previews into deep structured workflows
- ACR Appropriateness Criteria integration for referrer support
- Full LI-RADS, PI-RADS, BI-RADS, O-RADS, Lung-RADS, CAD-RADS, NI-RADS, VI-RADS, and Bone-RADS helpers
- Renal mass characterization
- CXR pneumonia/CHF/pneumothorax/line-tube assistants
- CT abdomen/pelvis diverticulitis and additional acute abdomen workflows
- Pelvic ultrasound torsion/ectopic/AUB assistants
- CT C-spine trauma assistant
- MRI brain, spine, MSK, oncology, and staging modules
