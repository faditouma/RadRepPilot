import { Outlet, useLocation } from 'react-router-dom';
import { Footer } from './Footer';
import { Navbar } from './Navbar';
import { useI18n } from '../../i18n/I18nContext';

export function PublicLayout() {
  const location = useLocation();
  const { text } = useI18n();
  const showPageWarning = location.pathname !== '/' && location.pathname !== '/workspace';

  return (
    <div className="platform-layout public-layout">
      <Navbar variant="public" />
      {showPageWarning ? (
        <div className="platform-warning" role="note">
          <strong>{text('Privacy reminder:')}</strong>{' '}
          {text('Please do not enter patient-identifying information. RadRepPilot is an educational reporting-support tool and does not interpret images, provide diagnoses, or replace radiologist review.')}
        </div>
      ) : null}
      <Outlet />
      <Footer />
    </div>
  );
}
