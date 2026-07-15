import { useCallback, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import App from '../App';
import { useSupabaseSession } from '../components/auth/useSupabaseSession';
import { Navbar } from '../components/layout/Navbar';
import type { PageKey } from '../radrep/types';
import { workspacePageToRoutePath, workspaceSlugToPage } from '../utils/workspaceRoutes';

export function Workspace() {
  const { session } = useSupabaseSession();
  const { workspaceSection } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const initialPage = workspaceSlugToPage(workspaceSection);
  const workspaceHeaders: Partial<Record<PageKey, { title: string }>> = {
    referral: {
      title: 'Imaging Requisition Workspace',
    },
    imagingGuide: {
      title: 'Imaging Guide',
    },
    modules: {
      title: 'Reporting Workflows',
    },
    calculators: {
      title: 'Calculators',
    },
    builder: {
      title: 'Report Builder',
    },
    gallery: {
      title: 'Example Outputs',
    },
    drafts: {
      title: 'Local Drafts',
    },
    safety: {
      title: 'Safety and Scope',
    },
    dashboard: {
      title: 'Workspace Overview',
    },
  };

  const workspaceHeader = workspaceHeaders[initialPage] ?? {
    title: 'RadRepPilot Workspace',
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
    <div className="platform-layout workspace-platform">
      <Navbar variant={session ? 'app' : 'public'} />
      <main className="workspace-route">
        <section className="workspace-route-header">
          <div>
            <span className="eyebrow">Workspace</span>
            <h1>{workspaceHeader.title}</h1>
          </div>
        </section>

        <App embedded initialPage={initialPage} onActivePageChange={handleActivePageChange} />
      </main>
    </div>
  );
}
