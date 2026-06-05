import { describe, expect, it } from 'vitest';
import {
  calculateAspects,
  calculateRvLvRatio,
  generateCtpaReport,
  generateFleischnerRecommendation,
  generateStrokeReport,
} from './reportLogic';
import { generateReferralText, getMissingReferralFields } from './referralLogic';
import type { CtpaFormState, NoduleFormState, ReferralFormState, StrokeFormState } from './types';
import { reportingWorkflowSchemas } from '../data/reportingWorkflowSchemas';
import { generateReportingWorkflowReport } from '../utils/reportGenerators';

describe('RadRepPilot clinical text helpers', () => {
  it('calculates RV/LV ratio safely', () => {
    expect(calculateRvLvRatio('42', '35')).toBe(1.2);
    expect(calculateRvLvRatio('', '35')).toBeNull();
    expect(calculateRvLvRatio('42', '0')).toBeNull();
  });

  it('generates a CTPA impression with PE level and RV/LV language', () => {
    const form: CtpaFormState = {
      clinicalIndication: 'Pleuritic chest pain.',
      examType: 'CT pulmonary angiogram',
      pePresent: 'yes',
      laterality: 'bilateral',
      proximalLevel: 'lobar',
      clotBurden: 'moderate',
      saddleEmbolus: 'no',
      rvDiameterMm: '45',
      lvDiameterMm: '35',
      pulmonaryInfarct: 'yes',
      pleuralEffusion: 'small',
      alternativeDiagnosis: '',
      incidentalFindings: '',
      additionalFindings: '',
      limitationsUncertainty: '',
    };

    const report = generateCtpaReport(form);
    expect(report.impression).toContain('Acute pulmonary embolism involving the lobar pulmonary arteries bilaterally.');
    expect(report.impression).toContain('with CT evidence of right heart strain');
  });

  it('applies simplified solid nodule follow-up logic', () => {
    const form: NoduleFormState = {
      patientAge: '65',
      knownMalignancy: 'no',
      immunocompromised: 'no',
      noduleType: 'solid',
      numberOfNodules: 'solitary',
      sizeMm: '7',
      location: 'right upper lobe',
      morphology: 'smooth',
      patientRisk: 'high risk',
      priorImagingAvailable: 'no',
      stability: 'unknown',
      additionalFindings: '',
      limitationsUncertainty: '',
    };

    expect(generateFleischnerRecommendation(form)).toContain('6-12 months');
  });

  it('calculates ASPECTS and stroke impression text', () => {
    expect(calculateAspects(['Insula', 'M2'])).toBe(8);

    const form: StrokeFormState = {
      clinicalIndication: 'Left-sided weakness.',
      side: 'right',
      hemorrhagePresent: 'no',
      largeVesselOcclusionSuspected: 'unknown',
      earlyIschemicChangePresent: 'yes',
      aspectsRegions: ['Insula', 'M2'],
      massEffect: 'none',
      midlineShiftMm: '',
      chronicFindings: '',
      additionalFindings: '',
      limitationsUncertainty: '',
    };

    const report = generateStrokeReport(form);
    expect(report.impression).toContain('ASPECTS score is 8');
    expect(report.impression).toContain('No acute intracranial hemorrhage identified');
  });

  it('generates referral optimization text and missing-field warnings', () => {
    const form: ReferralFormState = {
      requestType: 'ct-head-headache',
      generatedText: '',
      values: {
        age: '62-year-old',
        duration: '24 hours',
        positiveSymptoms: 'new severe headache',
        examFindings: 'neurologic exam without focal deficit',
        thunderclap: 'no',
        neuroDeficit: 'no',
        anticoagulation: 'no',
        trauma: 'no',
        clinicalQuestion: 'assess for acute intracranial abnormality, including hemorrhage or mass effect',
      },
    };

    expect(getMissingReferralFields(form)).toHaveLength(0);
    expect(generateReferralText(form)).toContain('Please assess for acute intracranial abnormality');
    expect(generateReferralText(form)).not.toContain('Please assess for/rule out assess for');
  });

  it('generates report-ready text for the new schema-driven workflows', () => {
    const appendicitis = generateReportingWorkflowReport('appendicitis', {
      ...reportingWorkflowSchemas.appendicitis.defaultValues,
      ...reportingWorkflowSchemas.appendicitis.quickFills.find((item) => item.id === 'uncomplicated')?.values,
    });
    expect(appendicitis.impression).toContain('Acute uncomplicated appendicitis');

    const obstruction = generateReportingWorkflowReport('bowelObstruction', {
      ...reportingWorkflowSchemas.bowelObstruction.defaultValues,
      ...reportingWorkflowSchemas.bowelObstruction.quickFills.find((item) => item.id === 'ischemia')?.values,
    });
    expect(obstruction.impression).toContain('concerning for ischemia');

    const renalColic = generateReportingWorkflowReport('renalColic', {
      ...reportingWorkflowSchemas.renalColic.defaultValues,
      ...reportingWorkflowSchemas.renalColic.quickFills.find((item) => item.id === 'uvj')?.values,
    });
    expect(renalColic.impression).toContain('UVJ calculus');

    const ruq = generateReportingWorkflowReport('ruqUltrasound', {
      ...reportingWorkflowSchemas.ruqUltrasound.defaultValues,
      ...reportingWorkflowSchemas.ruqUltrasound.quickFills.find((item) => item.id === 'acute-chole')?.values,
    });
    expect(ruq.impression).toContain('acute calculous cholecystitis');

    const dvt = generateReportingWorkflowReport('dvtUltrasound', {
      ...reportingWorkflowSchemas.dvtUltrasound.defaultValues,
      ...reportingWorkflowSchemas.dvtUltrasound.quickFills.find((item) => item.id === 'femoropopliteal')?.values,
    });
    expect(dvt.impression).toContain('DVT involving');
  });
});
