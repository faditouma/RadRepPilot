import { useState } from 'react';
import { anatomyNavigationMap } from '../../data/anatomyNavigationMap';
import { bodySystemIconName } from '../../data/iconMap';
import { RadIcon } from '../icons/RadIcon';

interface InteractiveAnatomyNavigatorProps {
  onOpenReporting: (workflowId?: string) => void;
  onOpenHelper: (helperId: string) => void;
  onOpenIncidental: (helperId?: string) => void;
}

export function InteractiveAnatomyNavigator({
  onOpenReporting,
  onOpenHelper,
  onOpenIncidental,
}: InteractiveAnatomyNavigatorProps) {
  const [selectedId, setSelectedId] = useState(anatomyNavigationMap[1].id);
  const selected = anatomyNavigationMap.find((region) => region.id === selectedId) ?? anatomyNavigationMap[0];

  return (
    <section className="anatomy-navigator anatomy-cockpit">
      <div className="section-heading">
        <span className="eyebrow">Anatomy cockpit</span>
        <h2>Choose a body system, then jump into the right workflow</h2>
        <p>Premium navigation for reporting workflows, helpers, and embedded incidental follow-up support.</p>
      </div>

      <div className="anatomy-cockpit-layout">
        <div className="body-system-card-grid" aria-label="Body system navigation cards">
          {anatomyNavigationMap.map((region) => (
            <button
              className={`body-system-card ${selected.id === region.id ? 'active' : ''}`}
              onClick={() => setSelectedId(region.id)}
              type="button"
              key={region.id}
            >
              <span className="body-system-icon" aria-hidden="true">
                <RadIcon name={region.iconName} size={28} />
              </span>
              <span className="body-system-copy">
                <strong>{region.title}</strong>
                <small>{region.subtitle}</small>
              </span>
              <span className="body-system-badges" aria-label={`${region.title} tools`}>
                <em>{region.reporting.length} workflows</em>
                <em>{region.helpers.length} helpers</em>
                <em>{region.incidentalFindings.length} follow-up</em>
              </span>
            </button>
          ))}
        </div>

        <article className="navigation-hub-card">
          <div className="card-topline">
            <span className="icon-label">
              <RadIcon name={selected.iconName} size={16} />
              Navigation hub
            </span>
            <span className="status-badge partial">Selected</span>
          </div>
          <h3>{selected.title}</h3>
          <p>{selected.description}</p>

          <div className="navigation-hub-grid">
            <div>
              <span className="mini-heading">Reporting workflows</span>
              {selected.reporting.map((item) => (
                <button className="link-card" onClick={() => onOpenReporting(item.workflowId)} type="button" key={item.label}>
                  <RadIcon name={bodySystemIconName(item.path)} size={18} />
                  <strong>{item.label}</strong>
                  <small>{item.path}</small>
                </button>
              ))}
            </div>
            <div>
              <span className="mini-heading">Helpers / calculators</span>
              {selected.helpers.map((item) => (
                <button className="link-card" onClick={() => onOpenHelper(item.helperId)} type="button" key={item.helperId}>
                  <RadIcon name="calculator" size={18} />
                  <strong>{item.label}</strong>
                  <small>Open interactive helper</small>
                </button>
              ))}
            </div>
            <div>
              <span className="mini-heading">Incidental follow-up</span>
              {selected.incidentalFindings.map((item) => (
                <button className="link-card" onClick={() => onOpenIncidental(item.helperId)} type="button" key={item.label}>
                  <RadIcon name="followUp" size={18} />
                  <strong>{item.label}</strong>
                  <small>{item.helperId ? 'Open related helper drawer' : 'Open reporting workflows'}</small>
                </button>
              ))}
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}
