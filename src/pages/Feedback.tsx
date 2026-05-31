import { PageShell } from './PageShell';

export function Feedback() {
  return (
    <PageShell
      eyebrow="Feedback"
      title="Feedback"
      description="A future feedback form can collect comments from radiologists, residents, referrers, and reviewers."
    >
      <p>Feedback submission is not connected yet. Supabase or another backend can be added in a later phase.</p>
    </PageShell>
  );
}
