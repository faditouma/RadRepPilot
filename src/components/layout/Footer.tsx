import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="platform-footer">
      <div>
        <strong>RadRepPilot</strong>
        <span>Educational prototype. User-entered findings only.</span>
      </div>
      <nav aria-label="Footer navigation">
        <Link to="/about">About</Link>
        <Link to="/disclaimer">Disclaimer</Link>
        <Link to="/feedback">Feedback</Link>
      </nav>
    </footer>
  );
}
