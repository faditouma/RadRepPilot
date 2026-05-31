import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';

export function AppLayout() {
  return (
    <div className="platform-layout app-layout">
      <Navbar variant="app" />
      <Outlet />
    </div>
  );
}
