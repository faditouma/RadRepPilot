// Capture only recovery intent before the SDK consumes the URL fragment.
// No credentials or session tokens are stored here.
const key = 'radrep:password-recovery-pending';
export function isRecoveryLocation(search: string, hash: string) {
  return new URLSearchParams(search).get('mode') === 'recovery' ||
    new URLSearchParams(hash.replace(/^#/, '')).get('type') === 'recovery';
}
export function recoveryPending() {
  if (typeof window === 'undefined') return false;
  if (isRecoveryLocation(window.location.search, window.location.hash)) return true;
  try { return sessionStorage.getItem(key) === 'true'; } catch { return false; }
}
export function setRecoveryPending(pending: boolean) {
  try { if (pending) sessionStorage.setItem(key, 'true'); else sessionStorage.removeItem(key); } catch { /* in-memory flow still works */ }
}
export const initialRecoveryPending = recoveryPending();
if (initialRecoveryPending) setRecoveryPending(true);
