import { Navigate } from 'react-router-dom';
import App from '../App';
import { useSupabaseSession } from '../components/auth/useSupabaseSession';

export function HomeRoute() {
  const { isLoading, session } = useSupabaseSession();

  if (!isLoading && session) {
    return <Navigate replace to="/dashboard" />;
  }

  return <App />;
}

