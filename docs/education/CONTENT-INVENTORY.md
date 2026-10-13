# Imported assets and outstanding content dependencies

All five originals and validated neutral-name PNG delivery copies were actually downloaded on 2026-10-13. Repeat import returned five `existing` results and preserved asset UUIDs/checksums. Approximate totals: **7.84 MB original + 15.70 MB delivery**, excluding SQLite and source evidence. 1,000 complete five-image opens would transfer roughly 15.7 GB before HTTP overhead (about 14.6 GiB). No paid services created.

| Draft | Actual source | Licence | Scope / status |
|---|---|---|---|
| rr-001 | [PA chest](https://commons.wikimedia.org/wiki/File:Chest_Xray_PA_3-8-2010.png), Stillwaterising | CC0 1.0 | 2412×1956 selected PA image; source normal category only, full normal answer remains unverified |
| rr-002 | [Lobar pneumonia](https://commons.wikimedia.org/wiki/File:X-ray_of_lobar_pneumonia.jpg), Mikael Häggström | CC0 1.0 | 3027×2407 selected radiograph; creator description supplies right middle lobe location and source-patient age/sex; no organism inferred from image |
| rr-003 | [Proximal humerus](https://commons.wikimedia.org/wiki/File:X-ray_of_complex_fracture_of_proximal_humerus.jpg), Georg Mattiassich and article coauthors | CC BY 2.0 | 416×471 selected figure; original article DOI 10.1186/1471-2474-14-231. Resolution, laterality, classification and figure-specific article context need review |
| rr-004 | [Chest image](https://commons.wikimedia.org/wiki/File:Pneumothorax_CXR.jpg), Clinical Cases | CC BY-SA 2.5 | 877×807 selected radiograph; source-described left pleural air/displacement/effusion. Source fictional tension history is not a source-patient fact |
| rr-005 | [Clavicle](https://commons.wikimedia.org/wiki/File:Clavicle_fracture.jpg), mexican 2000 | CC BY-SA 2.0 | 1530×1020 photo of displayed radiographs, source right-sided fracture. Visible edge text: quarantine for human identifier review/remediation |

**Published reviewed content: zero.** Five image-based reporting drafts and five ordering drafts exist in private SQLite and tracked editorial seed inventory. No reviewer IDs, review dates, privacy approvals or permission grants have been invented. Licence evidence is recorded as a source-backed candidate determination; editorial rights review is still pending. Mandatory source/creator/licence/modification credit stays available. ShareAlike applies to adapted image material, separately from application-code licensing. All imported assets conservatively flag potential attribution answer leakage and start assessment-ineligible; learning-only publication is possible after actual reviews.

Preliminary visual inspection is recorded separately from approval. Images were displayed in a contact sheet and decoded at original dimensions; this is not a completed de-identification or clinical review. Edge text, source blacked-out/cropped regions, source-patient age facts and low resolution require attention. Removing EXIF is insufficient. No facial-risk or clinical correspondence approval was recorded. Draft annotation coordinates on rr-002/rr-004 are suggestions requiring verification against original images.

## Missing / excluded imaging

- **Scrollable CT/DICOM study: not imported.** [TCIA's current FAQ](https://www.cancerimagingarchive.net/faqs/) describes transition to supported distribution services including IDC. [IDC's current download documentation](https://learn.canceridc.dev/data/downloading-data) lists idc-index, s5cmd and DICOMweb. No individual CT series with a source-supported diagnostic report, reviewed reuse obligations and full privacy/sequence/orientation assessment was established in this implementation. TCIA collection labels were not treated as diagnoses. Implement the separate DICOM adapter and choose a study with individual clinical evidence before adding a scrollable diagnostic case. Raster stack infrastructure exists but was not tested against a real CT series.
- **Pneumonia x-ray.jpg composite excluded:** Commons description has missing source/author fields and combines images from different government sites; incomplete provenance and poor resolution were not substituted for a suitable study.
- **Pleural_effusion.jpg excluded:** already annotated selected screenshot, 475×382 and original government attribution requires deeper verification; below current importer resolution floor.
- **Radiopaedia:** no content imported, embedded, scraped or downloaded. No permissions assumed. References could be linked by a reviewer where appropriate.
- Journal-figure candidate rr-003 was acquired through the independently licensed Commons original. Its required publication is linked and must receive figure-specific verification before publication; no separate journal scrape was used.

## Five ordering drafts

All are original fictional scenarios, unpublished and awaiting clinical review:

1. Acute uncomplicated back pain; conservative/no-imaging pathway, red flags change branch.
2. Stable established migraine pattern with normal examination; no-imaging pathway, new warning signs change branch.
3. Acute ankle injury with missing examination information; initial “more information”, then positive/negative clinical-criteria branches.
4. Stable school-aged child with suspected appendicitis and local ultrasound capability; ultrasound-first / radiology-discussion options.
5. Possible pulmonary embolism with missing risk/test inputs; establish more information / discuss after risk assessment. No autonomous PE recommendation.

Evidence: [Choosing Wisely Canada radiology recommendations, September 2026 update](https://choosingwiselycanada.org/recommendation/radiology/) and [Canadian nuclear medicine recommendations](https://choosingwiselycanada.org/recommendation/nuclear-medicine/), accessed 2026-10-13. Guideline access dates are not clinical-review dates. No protected tables, decision algorithms or substantial text copied. Branch urgency/contrast/requisition wording requires clinician review. No supplementary international guideline content is being published.

## Actual reviews still needed

- Credentialed radiologist verifies each exact image, supplied study completeness, findings, relevant negatives, uncertainty, alternatives, clinically assessable rubric items, synonyms, error importance, hints, annotation coordinates and example report.
- Clinician verifies all ordering branches against current Canadian guidance and local context, including urgency, contrast and safety-netting.
- Rights reviewer confirms original creator/source chain and licence obligations, original journal figure attribution, ShareAlike handling and any answer-revealing mandatory attribution. Separately assess display, indexing, AI inference and training; indexing/inference are unknown and disabled, training prohibited by default.
- Authorized privacy reviewer inspects original metadata and pixels at full resolution for identifiers, dates, accession numbers and face risks; approve orientation, ordering, usability and correspondence. Clavicle needs particular review and an authorized remediation copy if identifiers are present.
- Configure actual authenticated reviewer/admin identities and durable production service before public release. Author-only local preview cannot approve or publish.
- AI evaluation set requires clinician-authored expected results and sign-off. AI grading is not implemented/released; no automated feedback is fabricated.
