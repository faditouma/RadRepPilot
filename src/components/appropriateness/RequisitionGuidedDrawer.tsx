import { useEffect, useMemo, useState } from 'react';
import type {
  AppropriatenessCategory,
  AppropriatenessTopic,
  AppropriatenessVariant,
  ImagingOption,
} from '../../data/appropriateness';
import { deriveScenarioQuestions } from '../../utils/acrScenarioQuestions';
import type { ScenarioAnswerMap } from '../../utils/acrScenarioMatching';
import { rankVariants, selectedAnswerPhrases } from '../../utils/acrScenarioMatching';
import { cleanVariantTitle } from '../../utils/requisitionTopicMatching';

interface RequisitionGuidedSelection {
  topic: AppropriatenessTopic;
  variant: AppropriatenessVariant;
  option: ImagingOption;
  answerPhrases: string[];
}

interface RequisitionGuidedDrawerProps {
  open: boolean;
  clinicalProblem: string;
  age?: string;
  sex?: string;
  topicMatches: AppropriatenessTopic[];
  onClose: () => void;
  onSelect: (selection: RequisitionGuidedSelection) => void;
}

const categoryOrder: AppropriatenessCategory[] = [
  'Usually Appropriate',
  'May Be Appropriate',
  'May Be Appropriate (Disagreement)',
  'Usually Not Appropriate',
];

function categoryClass(category: AppropriatenessCategory) {
  if (category === 'Usually Appropriate') return 'usually';
  if (category === 'Usually Not Appropriate') return 'not-appropriate';
  if (category === 'May Be Appropriate (Disagreement)') return 'disagreement';
  return 'may';
}

function groupedOptions(variant?: AppropriatenessVariant): Record<AppropriatenessCategory, ImagingOption[]> {
  const grouped: Record<AppropriatenessCategory, ImagingOption[]> = {
    'Usually Appropriate': [],
    'May Be Appropriate': [],
    'May Be Appropriate (Disagreement)': [],
    'Usually Not Appropriate': [],
  };

  variant?.imagingOptions.forEach((option) => {
    grouped[option.appropriatenessCategory].push(option);
  });

  return grouped;
}

export function RequisitionGuidedDrawer({
  open,
  clinicalProblem,
  age,
  sex,
  topicMatches,
  onClose,
  onSelect,
}: RequisitionGuidedDrawerProps) {
  const [step, setStep] = useState<'clarify' | 'recommend'>('clarify');
  const [answers, setAnswers] = useState<ScenarioAnswerMap>({});
  const [manualScenarioKey, setManualScenarioKey] = useState('');
  const [selectedTopicId, setSelectedTopicId] = useState('');

  const selectedTopic =
    topicMatches.find((topic) => topic.id === selectedTopicId) ??
    (topicMatches.length === 1 ? topicMatches[0] : undefined);

  const scenarioContext = useMemo(() => ({ age, sex }), [age, sex]);

  const questions = useMemo(
    () => deriveScenarioQuestions(selectedTopic ? [selectedTopic] : [], clinicalProblem, scenarioContext),
    [clinicalProblem, scenarioContext, selectedTopic]
  );

  const ranked = useMemo(
    () => rankVariants(selectedTopic ? [selectedTopic] : [], answers, questions, scenarioContext),
    [answers, questions, scenarioContext, selectedTopic]
  );

  const selectedScenario = useMemo(() => {
    const manual = ranked.find((item) => `${item.topic.id}:${item.variant.id}` === manualScenarioKey);
    return manual ?? ranked[0];
  }, [manualScenarioKey, ranked]);

  const optionsByCategory = useMemo(
    () => groupedOptions(selectedScenario?.variant),
    [selectedScenario?.variant]
  );

  const answerPhrases = useMemo(
    () => selectedAnswerPhrases(questions, answers),
    [answers, questions]
  );

  const requiredAnswersComplete = questions
    .filter((question) => question.required)
    .every((question) => Boolean(answers[question.id]?.length));

  useEffect(() => {
    if (!open) return;

    setStep('clarify');
    setManualScenarioKey('');
    setAnswers({});
    setSelectedTopicId(topicMatches.length === 1 ? topicMatches[0].id : '');
  }, [open, clinicalProblem, topicMatches]);

  const setSingleOption = (questionId: string, optionId: string) => {
    setAnswers((existing) => ({
      ...existing,
      [questionId]: optionId ? [optionId] : [],
    }));
  };

  const toggleOption = (questionId: string, optionId: string, mode: 'single' | 'multi' | 'boolean') => {
    setAnswers((existing) => {
      const current = existing[questionId] ?? [];

      if (mode === 'single' || mode === 'boolean') {
        return {
          ...existing,
          [questionId]: current.includes(optionId) ? [] : [optionId],
        };
      }

      return {
        ...existing,
        [questionId]: current.includes(optionId)
          ? current.filter((item) => item !== optionId)
          : [...current, optionId],
      };
    });
  };

  if (!open) return null;

  return (
    <div className="guided-drawer-layer" role="dialog" aria-modal="true" aria-label="Clinical imaging questions">
      <button
        className="guided-drawer-scrim"
        type="button"
        onClick={onClose}
        aria-label="Close guided imaging drawer"
      />

      <aside className="guided-drawer-panel">
        <div className="guided-drawer-header">
          <div>
            <span className="eyebrow">{step === 'clarify' ? 'Clinical details' : 'Recommended imaging'}</span>
            <h3>{step === 'clarify' ? 'Answer focused questions' : 'Choose an imaging option'}</h3>
            <p>
              {clinicalProblem || 'Clinical problem not entered'}
              {age || sex ? ` · ${[age, sex].filter(Boolean).join('')}` : ''}
            </p>
          </div>

          <button className="ghost-button compact-panel-toggle" type="button" onClick={onClose}>
            Close
          </button>
        </div>

        {step === 'clarify' ? (
          <div className="guided-drawer-body">
            {topicMatches.length > 1 ? (
              <section className="guided-question-card">
                <h4>Clinical focus</h4>
                <select
                  className="guided-question-select"
                  value={selectedTopic?.id ?? ''}
                  onChange={(event) => {
                    setSelectedTopicId(event.target.value);
                    setAnswers({});
                    setManualScenarioKey('');
                  }}
                >
                  <option value="">Choose focus...</option>
                  {topicMatches.map((topic) => (
                    <option value={topic.id} key={topic.id}>
                      {topic.title}
                    </option>
                  ))}
                </select>
              </section>
            ) : null}

            {selectedTopic ? (
              questions.map((question) => (
                <section className="guided-question-card" key={question.id}>
                  <h4>{question.label}</h4>
                  {question.type === 'single' || question.type === 'boolean' ? (
                    <select
                      className="guided-question-select"
                      value={answers[question.id]?.[0] ?? ''}
                      onChange={(event) => setSingleOption(question.id, event.target.value)}
                    >
                      <option value="">Choose one...</option>
                      {question.options.map((item) => (
                        <option value={item.id} key={item.id}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="guided-checkbox-list">
                      {question.options.map((item) => {
                        const active = Boolean(answers[question.id]?.includes(item.id));

                        return (
                          <label className={`guided-checkbox-row ${active ? 'active' : ''}`} key={item.id}>
                            <input
                              checked={active}
                              onChange={() => toggleOption(question.id, item.id, question.type)}
                              type="checkbox"
                            />
                            <span>{item.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </section>
              ))
            ) : (
              <div className="inline-note">Choose the closest focus before continuing.</div>
            )}

            <div className="guided-drawer-actions">
              <button
                className="primary-button"
                onClick={() => setStep('recommend')}
                type="button"
                disabled={!selectedTopic || !requiredAnswersComplete}
              >
                Show recommendations
              </button>

              <button className="secondary-button" onClick={onClose} type="button">
                Cancel
              </button>
            </div>

            {!topicMatches.length ? (
              <div className="inline-note">
                No imaging recommendation set was found for this search. Try a different complaint or diagnosis.
              </div>
            ) : null}
          </div>
        ) : (
          <div className="guided-drawer-body">
            {selectedScenario ? (
              <>
                <section className="guided-selected-scenario">
                  <span className="eyebrow">Clinical fit</span>
                  <h4>Recommendations based on the entered clinical details</h4>
                  <small>Source: ACR Appropriateness Criteria table summary. Confirm with local protocol and radiologist judgment.</small>
                </section>

                {ranked.length > 1 ? (
                  <details className="guide-section compact">
                    <summary>Other possible matches</summary>
                    <div className="guided-alternative-list">
                      {ranked.slice(1, 4).map((item) => (
                        <button
                          className="requisition-match-card"
                          onClick={() => setManualScenarioKey(`${item.topic.id}:${item.variant.id}`)}
                          type="button"
                          key={`${item.topic.id}:${item.variant.id}`}
                        >
                          <span>Clinical fit</span>
                          <strong>{cleanVariantTitle(item.variant.title)}</strong>
                        </button>
                      ))}
                    </div>
                  </details>
                ) : null}

                <div className="requisition-recommendation-groups">
                  {categoryOrder.map((category) => {
                    const options = optionsByCategory[category];
                    if (!options.length) return null;

                    return (
                      <details
                        className="requisition-recommendation-group"
                        open={category === 'Usually Appropriate'}
                        key={category}
                      >
                        <summary>
                          <span className={`guide-category-badge ${categoryClass(category)}`}>{category}</span>
                          <small>
                            {options.length} option{options.length === 1 ? '' : 's'}
                          </small>
                        </summary>

                        <div className="requisition-option-list">
                          {options.map((optionToSelect) => (
                            <article
                              className="requisition-option-card"
                              key={`${category}-${optionToSelect.procedure}`}
                            >
                              <div>
                                <strong>{optionToSelect.procedure}</strong>
                              </div>

                              <div className="requisition-option-badges">
                                <span
                                  className={`guide-category-badge ${categoryClass(
                                    optionToSelect.appropriatenessCategory
                                  )}`}
                                >
                                  {optionToSelect.appropriatenessCategory}
                                </span>
                                <span className="guide-radiation-badge">
                                  {optionToSelect.radiationLevel}
                                </span>
                              </div>

                              <button
                                className="secondary-button"
                                type="button"
                                onClick={() => {
                                  onSelect({
                                    topic: selectedScenario.topic,
                                    variant: selectedScenario.variant,
                                    option: optionToSelect,
                                    answerPhrases,
                                  });
                                  onClose();
                                }}
                              >
                                Use this imaging
                              </button>
                            </article>
                          ))}
                        </div>
                      </details>
                    );
                  })}
                </div>

                <details className="guide-section compact">
                  <summary>Source summary</summary>
                  <p>
                    {selectedScenario.topic.sourceLabel}. Structured appropriateness table summary; verify against the source document,
                    local protocols, and radiologist judgment.
                  </p>
                </details>

                <div className="guided-drawer-actions">
                  <button className="secondary-button" onClick={() => setStep('clarify')} type="button">
                    Back to questions
                  </button>
                </div>
              </>
            ) : (
              <div className="inline-note">
                No matching presentation found. Go back and adjust the clinical problem.
              </div>
            )}
          </div>
        )}
      </aside>
    </div>
  );
}
