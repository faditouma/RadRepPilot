import { describe, it, expect } from 'vitest';
import { isRecoveryLocation } from './authRecovery';
describe('password recovery routing', () => {
  it('recognizes a recovery link falling back to the home page without a mode query', () => {
    expect(isRecoveryLocation('', '#type=recovery&access_token=test-only')).toBe(true);
  });
  it('recognizes the intended callback and does not intercept normal signup/sign-in', () => {
    expect(isRecoveryLocation('?mode=recovery', '')).toBe(true);
    expect(isRecoveryLocation('', '#type=signup')).toBe(false);
    expect(isRecoveryLocation('', '#/learn')).toBe(false);
  });
});
