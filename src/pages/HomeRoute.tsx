import { Navigate } from 'react-router-dom';
import { useSupabaseSession } from '../components/auth/useSupabaseSession';
import { PublicHome } from './PublicHome';

export function HomeRoute() {
  const { isLoading, session } = useSupabaseSession();

  if (!isLoading && session) {
    return <Navigate replace to="/dashboard" />;
  }

  return <PublicHome />;
}
