import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { moduleNavigationTree, type NavigationWorkflow } from '../../data/moduleNavigationTree';
import { reportingModules } from '../../data/reportingModules';
import { bodySystemIconName } from '../../data/iconMap';
import type { ModuleType } from '../../radrep/types';
import { RadIcon } from '../icons/RadIcon';
import { StatusBadge } from '../radrep/RegistryComponents';
import { Breadcrumbs } from './Breadcrumbs';

interface BranchingModuleNavigatorProps {
  renderWorkflow: (moduleType: ModuleType) => ReactNode;
  onOpenCalculators?: () => void;
  initialWorkflowId?: string;
  onInitialWorkflowOpened?: () => void;
}

function PreviewList({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <div className="preview-list">
      <span>{title}</span>
      <ul>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

function sourceBadges(names: string[] | undefined, links: string[] | undefined) {
  if (!names?.length && !links?.length) return null;
  return (
    <div className="source-badges">
      {(names ?? []).map((name, index) => {
        const link = links?.[index];
        return link ? (
          <a href={link} target="_blank" rel="noreferrer" key={`${name}-${link}`}>
            {name}
          </a>
        ) : (
          <span key={name}>{name}</span>
        );
      })}
    </div>
  );
}

export function BranchingModuleNavigator({
  renderWorkflow,
  onOpenCalculators,
  initialWorkflowId = '',
  onInitialWorkflowOpened,
}: BranchingModuleNavigatorProps) {
  const [selectedModalityName, setSelectedModalityName] = useState('');
  const [selectedBodySystemName, setSelectedBodySystemName] = useState('');
  const [selectedWorkflowId, setSelectedWorkflowId] = useState('');

  useEffect(() => {
    if (!initialWorkflowId) return;
    for (const modality of moduleNavigationTree) {
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

  const selectedModality = moduleNavigationTree.find((item) => item.name === selectedModalityName);
  const selectedBodySystem = selectedModality?.bodySystems.find((item) => item.name === selectedBodySystemName);
  const selectedWorkflow = selectedBodySystem?.workflows.find((item) => item.id === selectedWorkflowId);

  const reset = () => {
    setSelectedModalityName('');
    setSelectedBodySystemName('');
    setSelectedWorkflowId('');
  };

  const breadcrumbs = useMemo(
    () => [
      { label: 'Radiology Reporting', onClick: reset },
      selectedModalityName ? { label: selectedModalityName, onClick: () => setSelectedBodySystemName('') } : undefined,
      selectedBodySystemName ? { label: selectedBodySystemName, onClick: () => setSelectedWorkflowId('') } : undefined,
      selectedWorkflow?.title ? { label: selectedWorkflow.title } : undefined,
    ].filter((item): item is { label: string; onClick?: () => void } => Boolean(item)),
    [selectedBodySystemName, selectedModalityName, selectedWorkflow?.title],
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
      <div className="branching-topbar">
        <div>
          <Breadcrumbs items={breadcrumbs} />
          <h2>{selectedWorkflow ? selectedWorkflow.title : selectedBodySystem ? 'Select a workflow' : selectedModality ? 'Select a body system' : 'Select a modality to begin.'}</h2>
          <p>
            {selectedWorkflow
              ? 'Only the selected workflow is open. Change selection or reset to move elsewhere.'
              : 'Use the branching path to reach a focused reporting workflow in a few clicks.'}
          </p>
        </div>
        <div className="button-row">
          {selectedWorkflow ? (
            <button className="secondary-button" onClick={() => setSelectedWorkflowId('')} type="button">
              Back one step
            </button>
          ) : selectedBodySystem ? (
            <button className="secondary-button" onClick={() => setSelectedBodySystemName('')} type="button">
              Back one step
            </button>
          ) : selectedModality ? (
            <button className="secondary-button" onClick={() => setSelectedModalityName('')} type="button">
              Back one step
            </button>
          ) : null}
          {(selectedModality || selectedBodySystem || selectedWorkflow) ? (
            <button
              className="secondary-button"
              onClick={() => {
                setSelectedModalityName('');
                setSelectedBodySystemName('');
                setSelectedWorkflowId('');
              }}
              type="button"
            >
              Back to imaging modalities
            </button>
          ) : null}
          {(selectedModality || selectedBodySystem || selectedWorkflow) ? (
            <button className="ghost-button" onClick={reset} type="button">
              Reset selection
            </button>
          ) : null}
        </div>
      </div>

      {!selectedModality ? (
        <div className="branch-grid modality-grid">
          {moduleNavigationTree.map((modality) => (
            <button className="branch-card modality-card" onClick={() => selectModality(modality.name)} type="button" key={modality.name}>
              <span>Modality</span>
              <strong>
                <span className="nav-icon" aria-hidden="true">
                  <RadIcon name={modality.iconName} size={24} />
                </span>
                {modality.name}
              </strong>
              <small>{modality.description}</small>
            </button>
          ))}
        </div>
      ) : null}

      {selectedModality && !selectedBodySystem ? (
        <div className="branch-grid body-system-grid">
          {selectedModality.bodySystems.map((bodySystem) => (
            <button className="branch-card" onClick={() => selectBodySystem(bodySystem.name)} type="button" key={bodySystem.name}>
              <span>{selectedModality.name}</span>
              <strong>
                <span className="nav-icon" aria-hidden="true">
                  <RadIcon name={bodySystemIconName(bodySystem.name)} size={24} />
                </span>
                {bodySystem.name}
              </strong>
              <small>{bodySystem.description}</small>
              <em>{bodySystem.workflows.length} workflows</em>
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

      {selectedWorkflow ? (
        selectedWorkflow.moduleType ? (
          <div className="focused-workflow-shell">{renderWorkflow(selectedWorkflow.moduleType)}</div>
        ) : (
          <PlannedWorkflowPanel workflow={selectedWorkflow} onOpenCalculators={onOpenCalculators} />
        )
      ) : null}
    </section>
  );
}

function WorkflowChoiceCard({ workflow, onOpen }: { workflow: NavigationWorkflow; onOpen: () => void }) {
  return (
    <article className="workflow-choice-card">
      <div className="card-topline">
        <span>{workflow.toolBadges?.[0] ?? 'Reporting workflow'}</span>
        <div className="badge-row">
          <StatusBadge status={workflow.status} />
          <span className="content-status-badge small">Educational draft</span>
        </div>
      </div>
      <h3>{workflow.title}</h3>
      <p>{workflow.description}</p>
      {workflow.toolBadges?.length ? (
        <div className="checklist-preview">
          {workflow.toolBadges.map((badge) => (
            <span key={badge}>{badge}</span>
          ))}
        </div>
      ) : null}
      <button className={workflow.moduleType ? 'primary-button' : 'secondary-button'} onClick={onOpen} type="button">
        {workflow.moduleType ? 'Open workflow' : 'View planned workflow'}
      </button>
    </article>
  );
}

function PlannedWorkflowPanel({ workflow, onOpenCalculators }: { workflow: NavigationWorkflow; onOpenCalculators?: () => void }) {
  const preview = reportingModules.find((module) => module.id === workflow.moduleId);

  return (
    <article className="planned-workflow-panel">
      <div className="card-topline">
        <span>Planned workflow preview</span>
        <div className="badge-row">
          <StatusBadge status={workflow.status} />
          <span className="content-status-badge small">Draft content</span>
        </div>
      </div>
      <h3>{workflow.title}</h3>
      <p>{preview?.description ?? workflow.description}</p>
      <div className="planned-preview-grid">
        <PreviewList title="Clinical scenario" items={preview?.clinicalScenario ? [preview.clinicalScenario] : ['Planned structured workflow for this indication.']} />
        <PreviewList title="Key findings to report" items={preview?.keyFindings ?? ['Primary abnormality descriptors', 'Location and extent', 'Comparison']} />
        <PreviewList title="Key negatives" items={preview?.keyNegatives ?? ['Relevant acute complication absent', 'High-risk features absent if verified']} />
        <PreviewList title="Complications / red flags" items={preview?.complicationsRedFlags ?? ['Urgent or unexpected actionable feature', 'Need for comparison']} />
        <PreviewList title="Associated tools" items={[...(preview?.associatedCalculators ?? []), ...(workflow.toolBadges ?? [])]} />
        <PreviewList title="Incidental support" items={preview?.associatedIncidentalFindings ?? ['Context-aware incidental follow-up language when applicable']} />
      </div>
      {preview?.sampleImpression ? (
        <div className="sample-language">
          <span>Sample impression language</span>
          <p>{preview.sampleImpression}</p>
        </div>
      ) : null}
      {sourceBadges(preview?.sourceNames, preview?.sourceLinks)}
      <details className="preview-details">
        <summary>Source / limitations</summary>
        <p>
          Preview content is simplified prototype scaffolding. It does not interpret images, diagnose, or replace official guidelines,
          local protocols, or radiologist verification.
        </p>
      </details>
      {workflow.toolBadges?.length && onOpenCalculators ? (
        <button className="secondary-button" onClick={onOpenCalculators} type="button">
          Open related helper workspace
        </button>
      ) : null}
    </article>
  );
}
