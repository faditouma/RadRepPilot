import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useSupabaseSession } from './useSupabaseSession';

export function ProtectedRoute() {
  const location = useLocation();
  const { isLoading, session } = useSupabaseSession();

  if (isLoading) {
    return (
      <main className="route-page">
        <section className="route-panel">
          <span className="eyebrow">Account</span>
          <h1>Checking access</h1>
          <p>Preparing the RadRepPilot workspace.</p>
        </section>
      </main>
    );
  }

  if (!session) {
    return <Navigate replace state={{ from: location }} to="/login" />;
  }

  return <Outlet />;
}
