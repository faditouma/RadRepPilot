export type WorkflowToolId = 'clinicalContext' | 'incidental' | 'helpers' | 'freeText' | 'limitations' | 'teaching';

export interface WorkflowToolItem {
  id: WorkflowToolId;
  label: string;
  description: string;
  available?: boolean;
}

interface WorkflowToolDockProps {
  tools: WorkflowToolItem[];
  activeTool: WorkflowToolId | null;
  onSelect: (toolId: WorkflowToolId) => void;
}

export function WorkflowToolDock({ tools, activeTool, onSelect }: WorkflowToolDockProps) {
  const visibleTools = tools.filter((tool) => tool.available !== false);

  return (
    <section className="workflow-tool-dock" aria-label="Workflow tools">
      <div>
        <span className="eyebrow">Tools</span>
        <h3>Open optional support only when needed</h3>
      </div>
      <div className="workflow-tool-grid">
        {visibleTools.map((tool) => (
          <button
            className={activeTool === tool.id ? 'workflow-tool-button active' : 'workflow-tool-button'}
            onClick={() => onSelect(tool.id)}
            type="button"
            aria-pressed={activeTool === tool.id}
            key={tool.id}
          >
            <strong>{tool.label}</strong>
            <span>{tool.description}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
