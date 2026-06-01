import { Outlet, useLocation } from 'react-router-dom';
import { Footer } from './Footer';
import { Navbar } from './Navbar';

export function PublicLayout() {
  const location = useLocation();
  const showPageWarning = location.pathname !== '/';

  return (
    <div className="platform-layout public-layout">
      <Navbar variant="public" />
      {showPageWarning ? (
        <div className="platform-warning" role="note">
          <strong>Privacy reminder:</strong> Please do not enter patient-identifying information. RadRepPilot is an educational
          reporting-support tool and does not interpret images, provide diagnoses, or replace radiologist review.
        </div>
      ) : null}
      <Outlet />
      <Footer />
    </div>
  );
}
