import { Outlet } from 'react-router-dom';
import { Footer } from './Footer';
import { Navbar } from './Navbar';

export function AppLayout() {
  return (
    <div className="platform-layout app-layout">
      <Navbar variant="app" />
      <div className="platform-warning" role="note">
        <strong>Prototype workspace:</strong> Do not enter patient-identifying information. All draft reports and follow-up wording require clinician/radiologist verification.
      </div>
      <Outlet />
      <Footer />
    </div>
  );
}
