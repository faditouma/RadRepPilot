# Workflow Registry Reconciliation

This document reconciles the navigation entries that were marked `partial` or `planned` before further workflow development. It is an internal development artifact; statuses describe implementation readiness, not clinical validity.

Decision terms:

- **Link/reuse:** the existing completed workflow already contains the required reporting fields and behavior.
- **Mode/extension:** an existing workflow is the correct base, but routing, defaults, or additional fields are still needed.
- **Separate:** the indication or modality requires a distinct workflow.
- **Remove duplicate:** the card duplicated another entry without adding a distinct reporting pathway.

## Previously partial entries

| Current navigation label and ID | Current status | Matching completed workflow | Recommended action | Additional fields required | Final canonical ID | Final remaining status |
|---|---|---|---|---|---|---|
| Liver Lesion / Incidental Liver Lesion — `incidental-liver-lesion` | partial | HCC CT/MRI is not an incidental-lesion workflow | Preserve distinct US and CT indications; split the colliding ID | Yes, modality-specific characterization | `us-liver-lesion-incidental`; `ct-liver-lesion-incidental` | partial · separate |
| Incidental Renal Finding / Lesion — `incidental-renal-lesion` | partial | Renal Mass CT/MRI overlaps only partly | Preserve US and CT indications; split the colliding ID | Yes, modality-specific cyst/mass characterization | `us-renal-lesion-incidental`; `ct-renal-lesion-incidental` | partial · separate |
| Incidental Adnexal Cyst — `incidental-adnexal-cyst` | partial | Adnexal Cyst Ultrasound is a full sonographic reporting workflow, not a generic incidental helper | Keep the incidental-guidance helper separate | Yes, incidental context and validated guidance inputs | `incidental-adnexal-cyst` | partial · separate |
| Superficial Thrombophlebitis — `us-dvt-superficial` | partial | Lower-Limb DVT Ultrasound | Remove duplicate card; the completed workflow has superficial-vein fields and a quick fill | No | `us-dvt` | resolved_existing |
| Lung Cancer Screening / Lung-RADS — `lung-rads` | partial | Lung Cancer Screening CT collects findings but deliberately does not calculate a category | Keep the classification preview separate until current boundaries are validated | Yes | `lung-rads` | partial · separate |
| Incidental Thyroid Nodule — `incidental-thyroid-nodule` | partial | Thyroid Ultrasound is downstream characterization only | Keep a separate CT incidental-finding workflow | Yes | `incidental-thyroid-nodule` | partial · separate |
| Incidental Adrenal Nodule / Lesion — `incidental-adrenal-nodule` | partial | Adrenal Incidentaloma CT/MRI is dedicated characterization, not a generic incidental-guidance helper | Keep one incidental helper under abdomen; remove its chest alias | Yes, validated incidental-context inputs | `incidental-adrenal-nodule` | partial · separate |
| Incidental Pancreatic Cyst / MRCP Follow-up — `incidental-pancreatic-cyst` | partial | Cystic Pancreatic Lesions CT/MRI is full characterization, not a generic follow-up helper | Keep one incidental helper under CT abdomen; remove its MRI alias | Yes, validated incidental-context inputs | `incidental-pancreatic-cyst` | partial · separate |
| Dissection / Aneurysm — `ct-aorta` | partial | AAA planning and surveillance cover only infrarenal procedural use cases | Keep acute aortic syndrome/dissection separate | Yes | `ct-aorta` | partial · separate |
| RECIST 1.1 Measurement Tracker — `oncology-recist` | partial | No completed generic RECIST workflow | Keep one canonical entry under response assessment; remove the CT alias | Yes | `oncology-recist` | partial · separate |
| Breast MRI / Diagnostic / Preview — `breast-birads` | partial | None | Remove the duplicated MRI card and split clinically distinct mammography, MRI, and preview IDs | Yes | `mammo-diagnostic-birads`; `mri-breast-birads`; `breast-birads-preview` | partial · separate |
| Breast Mass Ultrasound — `breast-us-mass` | partial | None | Keep separate | Yes | `breast-us-mass` | partial · separate |

## Previously planned entries

| Current navigation label and ID | Current status | Matching completed workflow | Recommended action | Additional fields required | Final canonical ID | Final remaining status |
|---|---|---|---|---|---|---|
| CHF / Pulmonary Edema — `xray-cxr-chf` | planned | Chest X-ray Infection/Dyspnea | Add an indication preset/mode to the existing workflow | No; routing/defaults only | `xray-cxr-chf` | planned · extension |
| Pneumothorax — `xray-cxr-pneumothorax` | planned | Chest X-ray Infection/Dyspnea | Add an indication preset/mode to the existing workflow | No; routing/defaults only | `xray-cxr-pneumothorax` | planned · extension |
| Pleural Effusion — `xray-cxr-effusion` | planned | Chest X-ray Infection/Dyspnea | Add an indication preset/mode to the existing workflow | No; routing/defaults only | `xray-cxr-effusion` | planned · extension |
| Line / Tube Placement — `xray-cxr-lines` | planned | Chest X-ray Infection/Dyspnea has free-text device support | Keep one Lines/Tubes entry and extend the existing workflow | Yes, device-specific position and complication fields | `xray-cxr-lines` | planned · extension |
| Bowel Obstruction / Ileus — `xray-abd-obstruction` | planned | CT Bowel Obstruction is a different modality | Keep separate | Yes | `xray-abd-obstruction` | planned · separate |
| Constipation / Fecal Loading — `xray-abd-constipation` | planned | None | Keep separate | Yes | `xray-abd-constipation` | planned · separate |
| Arthritis / Degenerative Disease — `xray-msk-arthritis` | planned | Acute Fracture X-ray does not cover arthritis | Keep separate | Yes | `xray-msk-arthritis` | planned · separate |
| Trauma / Alignment — `xray-spine-trauma` | planned | None | Keep separate | Yes | `xray-spine-trauma` | planned · separate |
| Abnormal LFTs / Biliary Dilation — `us-ruq-biliary` | planned | RUQ Pain / Cholecystitis Ultrasound | Remove the colliding alias; the completed workflow already supports abnormal LFTs and ductal dilation | No | `us-ruq-biliary` | resolved_existing |
| Ascites — `incidental-ascites` | planned | RUQ Ultrasound overlaps only partly | Extend RUQ ultrasound or add a focused mode | Yes, distribution, volume, and procedural-access descriptors | `incidental-ascites` | planned · extension |
| Hydronephrosis / Stone / Retention — `us-renal-bladder` | planned | Renal Colic is CT-only | Keep separate | Yes | `us-renal-bladder` | planned · separate |
| Pelvic Pain / Adnexal Lesion — `us-pelvic-pain` | planned | Adnexal Cyst Ultrasound overlaps partly | Extend the adnexal workflow for pain/torsion and non-cyst causes | Yes | `us-pelvic-pain` | planned · extension |
| Abnormal Uterine Bleeding — `us-pelvic-aub` | planned | Fibroid MRI is a different modality and indication | Keep separate | Yes | `us-pelvic-aub` | planned · separate |
| Early Pregnancy / Ectopic Concern — `us-early-pregnancy` | planned | None | Keep separate | Yes | `us-early-pregnancy` | planned · separate |
| Torsion / Epididymitis / Mass — `us-scrotal` | planned | None | Keep separate | Yes | `us-scrotal` | planned · separate |
| Soft Tissue Lump — `us-soft-tissue-lump` | planned | None | Keep separate | Yes | `us-soft-tissue-lump` | planned · separate |
| Headache / Acute Intracranial Abnormality — `ct-head-headache` | planned | Stroke and trauma workflows do not cover general headache | Keep separate | Yes | `ct-head-headache` | planned · separate |
| Pneumonia / ILD / Mass — `ct-chest-pneumonia-ild-mass` | planned | Viral pneumonia, fibrotic lung disease, and lung cancer staging each cover only part | Retain as an unfinished dispatcher/general parenchymal pathway; do not falsely link it to one disease workflow | Yes | `ct-chest-pneumonia-ild-mass` | planned · separate |
| Diverticulitis — `ct-ap-diverticulitis` | planned | None | Keep separate | Yes | `ct-ap-diverticulitis` | planned · separate |
| Abdominal Pain General — `ct-ap-abdominal-pain` | planned | Existing acute-abdomen workflows are indication-specific | Keep separate | Yes | `ct-ap-abdominal-pain` | planned · separate |
| Trauma Abdomen/Pelvis / CAP — `ct-trauma-cap` | planned | Traumatic Brain Injury covers head trauma only | Keep one canonical entry under Trauma; remove the abdomen alias | Yes | `ct-trauma-cap` | planned · separate |
| C-Spine Trauma — `ct-cspine-trauma` | planned | None | Keep separate | Yes | `ct-cspine-trauma` | planned · separate |
| Treatment Response Comparison — `oncology-response` | planned | Disease-specific staging workflows do not replace generic longitudinal response | Keep one canonical entry under response assessment; remove the CT alias | Yes | `oncology-response` | planned · separate |
| Brain Stroke — `mri-brain-stroke` | planned | CT/CTA Stroke is a different modality | Keep separate | Yes | `mri-brain-stroke` | planned · separate |
| Brain Mass — `mri-brain-mass` | planned | Brain Tumor MRI is optimized for known tumor/treatment response | Use the tumor workflow as a base, but retain a distinct initial-mass mode | Yes | `mri-brain-mass` | planned · extension |
| Seizure — `mri-brain-seizure` | planned | None | Keep separate | Yes | `mri-brain-seizure` | planned · separate |
| Radiculopathy / Degenerative Disease — `mri-lumbar-radiculopathy` | planned | None | Keep separate | Yes | `mri-lumbar-radiculopathy` | planned · separate |
| Cauda Equina — `mri-spine-cauda` | planned | None | Keep separate | Yes | `mri-spine-cauda` | planned · separate |
| Spine Infection / Malignancy — `mri-spine-infection-malignancy` | planned | None | Keep separate | Yes | `mri-spine-infection-malignancy` | planned · separate |
| Knee Internal Derangement — `mri-knee` | planned | None | Keep separate | Yes | `mri-knee` | planned · separate |
| Shoulder Rotator Cuff / Labrum — `mri-shoulder` | planned | None | Keep separate | Yes | `mri-shoulder` | planned · separate |
| Screening Callback — `breast-screen-callback` | planned | None | Keep separate | Yes | `breast-screen-callback` | planned · separate |
| Thyroid / Parathyroid Preview — `nuc-med-thyroid` | planned | Thyroid Ultrasound is a different modality | Keep separate | Yes | `nuc-med-thyroid` | planned · separate |
| Vascular Procedure Preview — `ir-vascular-procedure` | planned | None | Keep separate | Yes | `ir-vascular-procedure` | planned · separate |
| Drainage / Biopsy Preview — `ir-drain-biopsy` | planned | None | Keep separate | Yes | `ir-drain-biopsy` | planned · separate |

## Registry changes made

- Removed the colliding `Abnormal LFTs / Biliary Dilation` alias; the completed RUQ workflow remains canonical.
- Preserved incidental adnexal, adrenal, pancreatic, and Lung-RADS helpers because they provide a different guidance/classification purpose from the completed reporting workflows.
- Removed the fully redundant superficial-thrombophlebitis card because the completed DVT workflow already has the same fields and quick fill.
- Centralized the incidental adrenal and pancreatic helpers in one navigation location each.
- Centralized repeated line/tube, trauma, RECIST, and treatment-response entries.
- Removed the duplicated breast-MRI card and assigned distinct canonical IDs to mammography, ultrasound, MRI, and preview pathways.
- Split liver-lesion and renal-lesion IDs by modality because their reporting requirements differ.

### Definitive count reconciliation

The counts use two different units and are reconciled as follows:

1. The decision tables contain **47 original IDs**: 12 previously partial plus 35 previously planned.
2. **2 original IDs** were resolved through completed workflow reuse, leaving 45 unresolved original IDs.
3. Three ambiguous source IDs represented clinically distinct workflows and were split:
   - liver lesion: one ID became US and CT IDs (**+1**);
   - renal lesion: one ID became US and CT IDs (**+1**);
   - breast BI-RADS: one ID became mammography, MRI, and preview IDs (**+2**).
4. Therefore, **45 + 4 = 49 genuinely unfinished canonical workflows**.
5. The **9 removed duplicate cards** were repeated navigation occurrences, not additional original IDs, so they do not reduce the 47-row decision-table count.

The final internal registry contains **55 completed**, **15 partial**, and **34 planned** canonical entries. Planned entries are retained only in the internal registry and are excluded from ordinary user navigation. Partial entries remain visible solely as explicitly labeled, non-functional previews.

## Recommended implementation priority

1. **Urgent and time-sensitive:** pneumothorax and line/tube modes, early pregnancy/ectopic concern, scrotal torsion, CT trauma, C-spine trauma, cauda equina, and spine infection.
2. **High-volume general practice:** CHF/edema and effusion modes, abdominal radiography, renal/bladder ultrasound, pelvic pain/AUB, diverticulitis, general abdominal pain, and CT headache.
3. **Incidental and longitudinal oncology:** liver/renal/thyroid incidental findings, acute aortic syndrome, RECIST, and treatment-response comparison.
4. **Specialized elective workflows:** breast imaging, brain mass/seizure, MSK MRI, nuclear medicine, and interventional radiology.
