import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="platform-footer">
      <div>
        <strong>RadRepPilot</strong>
        <span>Free educational platform for radiology reporting practice. User-entered content only.</span>
      </div>
      <nav aria-label="Footer navigation">
        <Link to="/about">About</Link>
        <Link to="/disclaimer">Disclaimer</Link>
        <Link to="/feedback">Feedback</Link>
        <a href="mailto:radreppilot@gmail.com">radreppilot@gmail.com</a>
      </nav>
    </footer>
  );
}
