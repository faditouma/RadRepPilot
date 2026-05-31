import { Outlet } from 'react-router-dom';
import { Footer } from './Footer';
import { Navbar } from './Navbar';

export function PublicLayout() {
  return (
    <div className="platform-layout public-layout">
      <Navbar variant="public" />
      <div className="platform-warning" role="note">
        <strong>Privacy reminder:</strong> Please do not enter patient-identifying information. RadRepPilot is an educational
        reporting-support tool and does not interpret images, provide diagnoses, or replace radiologist review.
      </div>
      <Outlet />
      <Footer />
    </div>
  );
}
