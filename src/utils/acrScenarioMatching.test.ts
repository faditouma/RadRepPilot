import { describe, expect, it } from 'vitest';
import type { AppropriatenessTopic } from '../data/appropriateness';
import { deriveScenarioQuestions } from './acrScenarioQuestions';
import { rankVariants, selectedAnswerPhrases } from './acrScenarioMatching';
import { buildClinicalQuestion, findRequisitionTopicMatches } from './requisitionTopicMatching';

const headacheTopic: AppropriatenessTopic = {
  id: 'headache',
  title: 'Headache',
  year: '2026',
  clinicalArea: 'Neuro',
  keywords: ['headache', 'thunderclap', 'trauma'],
  sourceLabel: 'ACR Appropriateness Criteria',
  sourceNote: 'Test topic',
  reviewStatus: 'extracted',
  variants: [
    {
      id: 'sudden-severe',
      title: 'Sudden severe headache reaching maximal intensity within 1 hour. Initial imaging.',
      clinicalScenario: 'Thunderclap headache with concern for acute intracranial hemorrhage.',
      missingInformationPrompts: [],
      imagingOptions: [
        {
          procedure: 'CT head without IV contrast',
          appropriatenessCategory: 'Usually Appropriate',
          radiationLevel: '☢☢☢',
          shortRationale: 'CT head without IV contrast is listed as Usually Appropriate for this scenario.',
        },
      ],
      requisitionSuggestions: ['Please assess for acute intracranial hemorrhage.'],
      reportingPearls: [],
      cautions: [],
    },
    {
      id: 'chronic-stable',
      title: 'Chronic stable headache. Initial imaging.',
      clinicalScenario: 'Chronic stable headache without red flags.',
      missingInformationPrompts: [],
      imagingOptions: [
        {
          procedure: 'MRI head without IV contrast',
          appropriatenessCategory: 'May Be Appropriate',
          radiationLevel: 'O',
          shortRationale: 'MRI head without IV contrast is listed as May Be Appropriate for this scenario.',
        },
      ],
      requisitionSuggestions: ['Please assess for structural cause if clinically indicated.'],
      reportingPearls: [],
      cautions: [],
    },
  ],
};

describe('ACR guided scenario utilities', () => {
  it('derives focused question groups from matching topic text', () => {
    const questions = deriveScenarioQuestions([headacheTopic], 'headache');

    expect(questions.map((question) => question.id)).toContain('acr-scenario');
    expect(questions[0].options.map((option) => option.label)).toContain('Sudden severe headache reaching maximal intensity within 1 hour');
  });

  it('uses the selected extracted ACR scenario rather than loose keyword guessing', () => {
    const questions = deriveScenarioQuestions([headacheTopic], 'headache');
    const suddenScenario = questions
      .find((question) => question.id === 'acr-scenario')
      ?.options.find((option) => option.id === 'sudden-severe');

    expect(suddenScenario).toBeDefined();

    const answers = {
      'acr-scenario': [suddenScenario!.id],
    };
    const ranked = rankVariants([headacheTopic], answers, questions);

    expect(ranked[0].variant.id).toBe('sudden-severe');
    expect(selectedAnswerPhrases(questions, answers)).toEqual([]);
    expect(buildClinicalQuestion(headacheTopic, ranked[0].variant)).toContain('acute intracranial hemorrhage');
  });

  it('keeps exact complaint mappings isolated from unrelated ACR topics', () => {
    expect(findRequisitionTopicMatches('headache').topics.map((topic) => topic.id)).toEqual(['headache']);

    const abdominalTopics = findRequisitionTopicMatches('abdominal pain attached').topics.map((topic) => topic.id);
    expect(abdominalTopics).toContain('acute-nonlocalized-abdominal-pain');
    expect(abdominalTopics).toContain('right-lower-quadrant-pain');
    expect(abdominalTopics).not.toContain('headache');
    expect(abdominalTopics).not.toContain('low-back-pain');
    expect(abdominalTopics).not.toContain('suspected-pulmonary-embolism');

    expect(findRequisitionTopicMatches('renal colic').topics.map((topic) => topic.id)).toContain(
      'acute-onset-flank-pain-suspicion-of-stone-disease-urolithiasis',
    );
  });
});
