import { Link } from 'react-router-dom';
import { useI18n } from '../../i18n/I18nContext';

export function Footer() {
  const { text } = useI18n();
  return (
    <footer className="platform-footer">
      <div>
        <strong>RadRepPilot</strong>
        <span>{text('Free educational platform for radiology reporting practice. User-entered content only.')}</span>
      </div>
      <nav aria-label={text('Footer navigation')}>
        <Link to="/about">{text('About')}</Link>
        <Link to="/disclaimer">{text('Disclaimer')}</Link>
        <Link to="/feedback">{text('Feedback')}</Link>
        <a href="mailto:radreppilot@gmail.com">radreppilot@gmail.com</a>
      </nav>
    </footer>
  );
}
