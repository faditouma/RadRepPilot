import type { ReportingWorkflowSchema, WorkflowValues } from '../data/reportingWorkflowSchemas';
import type { ReportSections } from '../radrep/types';
import { cleanLines, workflowValue } from './impressionGenerators';

export function generateIncidentalNoduleReport(schema: ReportingWorkflowSchema, values: WorkflowValues): ReportSections {
  const v = (key: string) => workflowValue(values, key);
  const measurements = [
    v('sizeMm') ? `${v('sizeMm')} mm mean/entered size` : '',
    v('longAxisMm') ? `${v('longAxisMm')} mm long axis` : '',
    v('shortAxisMm') ? `${v('shortAxisMm')} mm short axis` : '',
    v('volumeMm3') ? `${v('volumeMm3')} mm³` : '',
  ].filter(Boolean).join(', ');
  const nodule = `${v('numberOfNodules') === 'multiple' ? 'Dominant' : 'Solitary'} ${v('noduleType') || 'pulmonary'} nodule${v('location') ? ` in the ${v('location')}` : ''}${measurements ? ` measuring ${measurements}` : ''}${v('seriesImage') ? ` (${v('seriesImage')})` : ''}${v('morphology') ? ` with ${v('morphology')} morphology` : ''}.`;
  const comparison = v('priorImagingAvailable') === 'yes'
    ? `Comparison: ${v('stability') || 'not characterized'}${v('growthDetails') ? `; ${v('growthDetails')}` : ''}${v('comparisonDate') ? ` since ${v('comparisonDate')}` : ''}.`
    : 'No prior imaging is entered for comparison.';
  const limitation = [v('technicalLimitations'), v('limitationsUncertainty')].filter(Boolean).join('; ');
  const quality = v('examQuality');
  const findings = cleanLines([nodule, comparison, v('additionalNodules') ? `Additional nodules: ${v('additionalNodules')}.` : undefined, v('additionalFindings') ? `Additional findings: ${v('additionalFindings')}.` : undefined, limitation ? `Limitations: ${limitation}.` : undefined]);
  return {
    indication: v('clinicalIndication') || schema.clinicalQuestion,
    technique: cleanLines([v('modalityProtocol') || schema.techniqueDefault, quality ? `Examination quality: ${quality}.` : undefined, limitation ? `Technical limitations: ${limitation}.` : undefined]),
    findings: v('findingsOverride') || findings,
    impression: v('impressionOverride') || cleanLines([quality === 'nondiagnostic' ? 'Nondiagnostic pulmonary nodule assessment.' : quality === 'limited' ? 'Limited pulmonary nodule assessment.' : undefined, nodule, comparison, v('userFollowupSynthesis') || undefined]),
    incidentalFindings: v('incidentalFindings'),
    recommendations: 'No guideline eligibility determination, follow-up interval, surveillance, biopsy, treatment, or management recommendation is calculated. Verify clinical exclusions, technique, every nodule, dated comparison, and any user-entered follow-up synthesis.',
  };
}
