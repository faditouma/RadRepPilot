import { useCallback, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import App from '../App';
import { useSupabaseSession } from '../components/auth/useSupabaseSession';
import type { PageKey } from '../radrep/types';
import { workspacePageToRoutePath, workspaceSlugToPage } from '../utils/workspaceRoutes';

export function Workspace() {
  const { session } = useSupabaseSession();
  const { workspaceSection } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const initialPage = workspaceSlugToPage(workspaceSection);
  const workspaceHeaders: Partial<Record<PageKey, { title: string; description: string }>> = {
    referral: {
      title: 'Imaging Requisition Workspace',
      description:
        'Start with a clinical complaint, answer focused questions, review educational imaging guidance, and draft a concise request.',
    },
    imagingGuide: {
      title: 'Imaging Guide',
      description:
        'Search clinical complaints, variants, procedures, and keywords across extracted appropriateness table summaries.',
    },
    modules: {
      title: 'Reporting Workflows',
      description: 'Open focused educational reporting workflows and draft structured report language.',
    },
    calculators: {
      title: 'Calculators',
      description: 'Use focused helpers and calculator-style support for educational report wording.',
    },
    builder: {
      title: 'Report Builder',
      description: 'Assemble editable report sections and draft language in one place.',
    },
    gallery: {
      title: 'Example Outputs',
      description: 'Review sample educational reports and requisitions without filling out a form.',
    },
    drafts: {
      title: 'Local Drafts',
      description: 'Review drafts saved in local browser storage on this device.',
    },
    safety: {
      title: 'Safety and Scope',
      description: 'Review what RadRepPilot does, what it does not do, and how to use it safely for education.',
    },
    dashboard: {
      title: 'Workspace Overview',
      description: 'Choose a RadRepPilot tool from the sidebar. Each tool has its own refreshable link.',
    },
  };

  const workspaceHeader = workspaceHeaders[initialPage] ?? {
    title: 'RadRepPilot Workspace',
    description: 'Choose a RadRepPilot tool from the sidebar. Each tool has its own refreshable link.',
  };

  useEffect(() => {
    if (location.pathname === '/workspace') {
      navigate(workspacePageToRoutePath(initialPage), { replace: true });
    }
  }, [initialPage, location.pathname, navigate]);

  const handleActivePageChange = useCallback(
    (page: PageKey) => {
      const nextPath = workspacePageToRoutePath(page);
      if (location.pathname !== nextPath) {
        navigate(nextPath, { replace: location.pathname === '/workspace' });
      }
    },
    [location.pathname, navigate],
  );

  return (
    <main className="workspace-route">
      <section className="workspace-route-header">
        <span className="eyebrow">Workspace</span>
        <h1>{workspaceHeader.title}</h1>
        <p>{workspaceHeader.description}</p>
        <div className="workspace-account-note">
          {session
            ? 'Signed in. Preferences and saved reports are available from your dashboard.'
            : 'You can use these tools without an account. Create a free account to save reports and preferences.'}
        </div>
      </section>

      <App embedded initialPage={initialPage} onActivePageChange={handleActivePageChange} />
    </main>
  );
}
