import { Outlet } from 'react-router-dom';
import { Footer } from './Footer';
import { Navbar } from './Navbar';

export function PublicLayout() {
  return (
    <div className="platform-layout public-layout">
      <Navbar variant="public" />
      <div className="platform-warning" role="note">
        <strong>No PHI:</strong> Do not enter patient-identifying information. RadRepPilot is educational and does not interpret images or diagnose.
      </div>
      <Outlet />
      <Footer />
    </div>
  );
}
