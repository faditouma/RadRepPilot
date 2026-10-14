import { Link } from 'react-router-dom';
import { PageShell } from './PageShell';
import { PasswordChange } from '../components/auth/PasswordChange';
export function AccountSecurity() {
  return <PageShell eyebrow="Account security" title="Change your password" description="Your sign-in account and learning profile are separate. Changing your password does not erase your profile or saved attempts.">
    <PasswordChange />
    <p><Link to="/preferences">Profile and preferences</Link> · <Link to="/learn">Learning library</Link></p>
  </PageShell>;
}
