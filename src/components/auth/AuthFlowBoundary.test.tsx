// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
const mock = vi.hoisted(() => ({ listener: undefined as undefined | ((event: string) => void), update: vi.fn(), unsubscribe: vi.fn() }));
vi.mock('../../lib/supabaseClient', () => ({ supabase: { auth: {
  onAuthStateChange: (listener: (event: string) => void) => { mock.listener = listener; return { data: { subscription: { unsubscribe: mock.unsubscribe } } }; },
  updateUser: mock.update,
} } }));
vi.mock('./useSupabaseSession', () => ({ useSupabaseSession: () => ({ session: { user: { id: 'software-test-only' } }, isLoading: false }) }));
import { AuthFlowBoundary } from './AuthFlowBoundary';
(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
let root: Root, host: HTMLDivElement;
beforeEach(() => { sessionStorage.clear(); host = document.createElement('div'); document.body.appendChild(host); root = createRoot(host); });
afterEach(() => { act(() => root.unmount()); host.remove(); vi.clearAllMocks(); });
it('ordinary sign-in retains navigation and does not change a password', async () => {
  await act(async () => root.render(<AuthFlowBoundary><p>Learning library fixture</p></AuthFlowBoundary>));
  await act(async () => mock.listener?.('SIGNED_IN'));
  expect(host.textContent).toContain('Learning library fixture');
  expect(mock.update).not.toHaveBeenCalled();
});
it('recovery event opens password entry even on the home page with no recovery query', async () => {
  await act(async () => root.render(<AuthFlowBoundary><p>Learning library fixture</p></AuthFlowBoundary>));
  await act(async () => mock.listener?.('PASSWORD_RECOVERY'));
  expect(host.textContent).toContain('Set a new password');
  expect(host.querySelectorAll('input[type=password]')).toHaveLength(2);
  expect(host.textContent).not.toContain('Learning library fixture');
  expect(mock.update).not.toHaveBeenCalled();
  await act(async () => mock.listener?.('SIGNED_OUT'));
  expect(host.textContent).toContain('Learning library fixture');
});
