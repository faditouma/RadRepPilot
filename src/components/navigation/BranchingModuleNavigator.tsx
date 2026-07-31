import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { publicModuleNavigationTree, type NavigationWorkflow } from '../../data/moduleNavigationTree';
import { bodySystemIconName } from '../../data/iconMap';
import type { ModuleType } from '../../radrep/types';
import { RadIcon } from '../icons/RadIcon';
import { Breadcrumbs } from './Breadcrumbs';
import { useI18n } from '../../i18n/I18nContext';

interface BranchingModuleNavigatorProps {
  renderWorkflow: (moduleType: ModuleType) => ReactNode;
  initialWorkflowId?: string;
  onInitialWorkflowOpened?: () => void;
  onWorkflowSelectionChange?: (selected: boolean) => void;
}

export function BranchingModuleNavigator({
  renderWorkflow,
  initialWorkflowId = '',
  onInitialWorkflowOpened,
  onWorkflowSelectionChange,
}: BranchingModuleNavigatorProps) {
  const { text } = useI18n();
  const [selectedModalityName, setSelectedModalityName] = useState('');
  const [selectedBodySystemName, setSelectedBodySystemName] = useState('');
  const [selectedWorkflowId, setSelectedWorkflowId] = useState('');

  useEffect(() => {
    if (!initialWorkflowId) return;
    for (const modality of publicModuleNavigationTree) {
      for (const bodySystem of modality.bodySystems) {
        const workflow = bodySystem.workflows.find((item) => item.id === initialWorkflowId || item.moduleType === initialWorkflowId);
        if (workflow) {
          setSelectedModalityName(modality.name);
          setSelectedBodySystemName(bodySystem.name);
          setSelectedWorkflowId(workflow.id);
          onInitialWorkflowOpened?.();
          return;
        }
      }
    }
  }, [initialWorkflowId, onInitialWorkflowOpened]);

  const selectedModality = publicModuleNavigationTree.find((item) => item.name === selectedModalityName);
  const selectedBodySystem = selectedModality?.bodySystems.find((item) => item.name === selectedBodySystemName);
  const selectedWorkflow = selectedBodySystem?.workflows.find((item) => item.id === selectedWorkflowId);

  useEffect(() => {
    onWorkflowSelectionChange?.(Boolean(selectedWorkflow));
  }, [onWorkflowSelectionChange, selectedWorkflow]);

  const reset = () => {
    setSelectedModalityName('');
    setSelectedBodySystemName('');
    setSelectedWorkflowId('');
  };

  const breadcrumbs = useMemo(
    () => [
      { label: text('Radiology Reporting'), onClick: reset },
      selectedModalityName ? { label: text(selectedModalityName), onClick: () => setSelectedBodySystemName('') } : undefined,
      selectedBodySystemName ? { label: text(selectedBodySystemName), onClick: () => setSelectedWorkflowId('') } : undefined,
      selectedWorkflow?.title ? { label: selectedWorkflow.title } : undefined,
    ].filter((item): item is { label: string; onClick?: () => void } => Boolean(item)),
    [selectedBodySystemName, selectedModalityName, selectedWorkflow?.title, text],
  );

  const selectModality = (name: string) => {
    setSelectedModalityName(name);
    setSelectedBodySystemName('');
    setSelectedWorkflowId('');
  };

  const selectBodySystem = (name: string) => {
    setSelectedBodySystemName(name);
    setSelectedWorkflowId('');
  };

  return (
    <section className="branching-navigator">
      {selectedWorkflow ? (
        <div className="selected-workflow-bar">
          <div>
            <Breadcrumbs items={breadcrumbs} />
            <h2>{selectedWorkflow.title}</h2>
          </div>
          <div className="button-row">
            <button className="secondary-button" onClick={() => setSelectedWorkflowId('')} type="button">
              {text('Back one step')}
            </button>
            <button className="secondary-button" onClick={() => setSelectedBodySystemName('')} type="button">
              {text('Change workflow')}
            </button>
            <button className="ghost-button" onClick={reset} type="button">
              {text('Reset selection')}
            </button>
          </div>
        </div>
      ) : (
        <div className="branching-topbar">
          <div>
            <Breadcrumbs items={breadcrumbs} />
            <h2>{text(selectedBodySystem ? 'Select a workflow' : selectedModality ? 'Select a body system' : 'Select a modality to begin.')}</h2>
          </div>
          <div className="button-row">
            {selectedBodySystem ? (
              <button className="secondary-button" onClick={() => setSelectedBodySystemName('')} type="button">
                {text('Back one step')}
              </button>
            ) : selectedModality ? (
              <button className="secondary-button" onClick={() => setSelectedModalityName('')} type="button">
                {text('Back one step')}
              </button>
            ) : null}
            {(selectedModality || selectedBodySystem) ? (
              <button
                className="secondary-button"
                onClick={() => {
                  setSelectedModalityName('');
                  setSelectedBodySystemName('');
                  setSelectedWorkflowId('');
                }}
                type="button"
              >
                {text('Back to imaging modalities')}
              </button>
            ) : null}
            {(selectedModality || selectedBodySystem) ? (
              <button className="ghost-button" onClick={reset} type="button">
                {text('Reset selection')}
              </button>
            ) : null}
          </div>
        </div>
      )}

      {!selectedModality ? (
        <div className="branch-grid modality-grid">
          {publicModuleNavigationTree.map((modality) => (
            <button className="branch-card modality-card" onClick={() => selectModality(modality.name)} type="button" key={modality.name}>
              <span>{text('Modality')}</span>
              <strong>
                <span className="nav-icon" aria-hidden="true">
                  <RadIcon name={modality.iconName} size={24} />
                </span>
                {text(modality.name)}
              </strong>
            </button>
          ))}
        </div>
      ) : null}

      {selectedModality && !selectedBodySystem ? (
        <div className="branch-grid body-system-grid">
          {selectedModality.bodySystems.map((bodySystem) => (
            <button className="branch-card" onClick={() => selectBodySystem(bodySystem.name)} type="button" key={bodySystem.name}>
              <span>{text(selectedModality.name)}</span>
              <strong>
                <span className="nav-icon" aria-hidden="true">
                  <RadIcon name={bodySystemIconName(bodySystem.name)} size={24} />
                </span>
                {text(bodySystem.name)}
              </strong>
              <em>{bodySystem.workflows.length} {text('workflows')}</em>
            </button>
          ))}
        </div>
      ) : null}

      {selectedBodySystem && !selectedWorkflow ? (
        <div className="workflow-choice-grid">
          {selectedBodySystem.workflows.map((workflow) => (
            <WorkflowChoiceCard workflow={workflow} onOpen={() => setSelectedWorkflowId(workflow.id)} key={workflow.id} />
          ))}
        </div>
      ) : null}

      {selectedWorkflow?.moduleType ? (
        <div className="focused-workflow-shell">{renderWorkflow(selectedWorkflow.moduleType)}</div>
      ) : null}
    </section>
  );
}

function WorkflowChoiceCard({ workflow, onOpen }: { workflow: NavigationWorkflow; onOpen: () => void }) {
  const { text } = useI18n();
  return (
    <button className="workflow-choice-card interactive-choice-card" onClick={onOpen} type="button">
      <div className="card-topline">
        <span>{workflow.description}</span>
        <RadIcon name="report" size={20} />
      </div>
      <h3>{workflow.title}</h3>
      {workflow.toolBadges?.length ? (
        <p className="workflow-supporting-copy">{workflow.toolBadges.join(' · ')}</p>
      ) : null}
      <span className="card-action">
        {text('Open workflow')}
        <span aria-hidden="true">→</span>
      </span>
    </button>
  );
}
