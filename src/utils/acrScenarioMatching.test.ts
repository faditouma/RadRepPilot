import { describe, expect, it } from 'vitest';
import type { AppropriatenessTopic } from '../data/appropriateness';
import { deriveScenarioQuestions } from './acrScenarioQuestions';
import { rankVariants, selectedAnswerPhrases } from './acrScenarioMatching';

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

    expect(questions.map((question) => question.id)).toContain('headache-pattern');
    expect(questions[0].options.map((option) => option.label)).toContain('Sudden severe / thunderclap');
  });

  it('uses selected answers to rank the closest clinical scenario and requisition phrases', () => {
    const questions = deriveScenarioQuestions([headacheTopic], 'headache');
    const thunderclapOption = questions
      .find((question) => question.id === 'headache-pattern')
      ?.options.find((option) => option.label === 'Sudden severe / thunderclap');

    expect(thunderclapOption).toBeDefined();

    const answers = {
      'headache-pattern': [thunderclapOption!.id],
    };
    const ranked = rankVariants([headacheTopic], answers, questions);

    expect(ranked[0].variant.id).toBe('sudden-severe');
    expect(selectedAnswerPhrases(questions, answers)).toContain('sudden severe headache reaching maximal intensity within 1 hour');
  });
});
