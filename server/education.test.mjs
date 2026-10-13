import test from "node:test";
import assert from "node:assert/strict";
import { openStore, saveContent, content } from "./store.mjs";
import { createApp } from "./app.mjs";
import {
  publicationProblems,
  learnerCase,
  assessmentSummary,
} from "./domain.mjs";
import { validateUrl, publicAddress } from "../scripts/education/import.mjs";
const fixture = () => ({
  id: "rr-test",
  version: 1,
  kind: "ordering",
  status: "published",
  title: "Neutral task",
  audience: ["resident"],
  modality: "Selection",
  bodySystem: "Clinical reasoning",
  difficulty: "Foundation",
  objectives: ["Use context"],
  vignette: { text: "Fictional example", provenance: "Original" },
  assessmentEligible: true,
  clinicalReferences: [{ url: "https://example.org" }],
  clinicalReview: {
    approved: true,
    reviewer: "fixture-clinician",
    date: "2026-10-13",
  },
  rightsReview: {
    approved: true,
    reviewer: "fixture-reviewer",
    date: "2026-10-13",
  },
  answer: {
    rubricVersion: "1",
    referenceReport: "SECRET_EXAMPLE",
    hints: ["SECRET_HINT"],
    annotations: [],
    rubric: [
      {
        id: "f1",
        expectedConcept: "Normal or acceptable alternate wording",
        importance: "major",
        assessable: true,
        anatomy: "Chest",
        laterality: "none",
        acceptedSynonyms: ["clear"],
        presence: "absent",
      },
    ],
  },
});
async function setup(t) {
  const db = openStore(":memory:");
  saveContent(db, fixture());
  const server = createApp({
    db,
    authenticate: async (req) => {
      const token = req.headers.authorization;
      return token
        ? {
            id: token.slice(7),
            role:
              token === "Bearer author"
                ? "author"
                : token === "Bearer reviewer"
                  ? "reviewer"
                  : token === "Bearer admin"
                    ? "administrator"
                    : "learner",
          }
        : null;
    },
  });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  t.after(() => {
    server.close();
    db.close();
  });
  const base = `http://127.0.0.1:${server.address().port}/api/education/`;
  return {
    db,
    call: async (path, { user = "alice", method = "GET", data } = {}) => {
      const r = await fetch(base + path, {
        method,
        headers: {
          ...(user ? { Authorization: `Bearer ${user}` } : {}),
          ...(data ? { "Content-Type": "application/json" } : {}),
        },
        body: data ? JSON.stringify(data) : undefined,
      });
      return { status: r.status, data: await r.json() };
    },
  };
}
test("learner projection contains no answer, rubric, diagnosis, hints or annotations", () => {
  const f = fixture();
  f.sourceSupported = { diagnosis: "SECRET_DIAGNOSIS" };
  const projected = JSON.stringify(learnerCase(f));
  for (const secret of [
    "SECRET",
    "answer",
    "rubric",
    "hints",
    "annotations",
    "sourceSupported",
  ])
    assert.ok(!projected.includes(secret));
});
test("rights and clinical gates fail closed; normal unsupported negatives not invented", () => {
  const f = fixture();
  assert.deepEqual(publicationProblems(f, []), []);
  f.clinicalReview = null;
  assert.ok(publicationProblems(f, []).includes("Clinical approval required"));
  f.kind = "report";
  f.series = [{ assetIds: ["image"] }];
  const a = { id: "image", rights: {}, privacyReview: null };
  assert.ok(
    publicationProblems(f, [a]).some((s) =>
      s.includes("commercial rights unresolved"),
    ),
  );
});
test("SSRF, credentials, noncommercial paths and unsafe addresses are rejected", () => {
  for (const url of [
    "http://commons.wikimedia.org/a",
    "https://127.0.0.1/a",
    "https://commons.wikimedia.org.evil.test/a",
    "https://u:p@commons.wikimedia.org/a",
    "https://commons.wikimedia.org:8443/a",
    "https://radiopaedia.org/a",
  ])
    assert.throws(() => validateUrl(url));
  for (const ip of [
    "127.0.0.1",
    "10.0.0.2",
    "169.254.169.254",
    "172.16.0.1",
    "192.168.1.1",
    "100.64.0.1",
    "::1",
    "::ffff:127.0.0.1",
  ])
    assert.equal(publicAddress(ip), false);
  assert.equal(publicAddress("208.80.154.224"), true);
});
test("authentication, editorial permissions and pre-submission answer enforcement", async (t) => {
  const { call, db } = await setup(t);
  assert.equal((await call("cases", { user: null })).status, 401);
  const bank = await call("cases");
  assert.ok(!JSON.stringify(bank).includes("SECRET"));
  assert.equal((await call("cases/rr-test/1/answer")).status, 404);
  assert.equal((await call("editor/inventory")).status, 403);
  const d = fixture();
  d.id = "rr-draft";
  d.status = "draft";
  saveContent(db, d);
  assert.equal((await call("cases/rr-draft/1")).status, 404);
  assert.equal(
    (await call("cases/rr-draft/1", { user: "author" })).status,
    200,
  );
});
test("draft autosave/resume is owned, submission reveals exact snapshot, fallback and retirement work", async (t) => {
  const { call, db } = await setup(t);
  await call("cases/rr-test/1/draft?mode=learning", {
    method: "PUT",
    data: { findings: "No focal opacity; wording differs", confidence: 80 },
  });
  assert.equal(
    (await call("cases/rr-test/1/draft?mode=learning")).data.findings,
    "No focal opacity; wording differs",
  );
  assert.equal(
    (await call("cases/rr-test/1/draft?mode=learning", { user: "bob" })).data
      .findings,
    undefined,
  );
  const submission = await call("cases/rr-test/1/submit", {
    method: "POST",
    data: { findings: "No focal opacity; wording differs", confidence: 80 },
  });
  assert.equal(submission.status, 201);
  assert.equal(submission.data.answer.referenceReport, "SECRET_EXAMPLE");
  assert.equal(submission.data.ai.status, "disabled");
  const id = submission.data.id;
  assert.equal((await call(`attempts/${id}`, { user: "bob" })).status, 404);
  assert.equal(
    (
      await call(`attempts/${id}/assessment`, {
        user: "bob",
        method: "POST",
        data: { ratings: { f1: "identified" } },
      })
    ).status,
    404,
  );
  const assessment = await call(`attempts/${id}/assessment`, {
    method: "POST",
    data: { ratings: { f1: "identified" } },
  });
  assert.equal(assessment.data.score, 100);
  const c = content(db, "rr-test", 1);
  c.answer.referenceReport = "CHANGED";
  c.status = "retired";
  saveContent(db, c);
  assert.equal((await call("cases")).data.length, 0);
  assert.equal(
    (
      await call("cases/rr-test/1/submit", {
        method: "POST",
        data: { findings: "repeat" },
      })
    ).status,
    404,
  );
  assert.equal(
    (await call(`attempts/${id}`)).data.answer.referenceReport,
    "SECRET_EXAMPLE",
  );
});
test("hints recorded server-side; assessment hint request forbidden; critical misses prominent", async (t) => {
  const { call } = await setup(t);
  assert.equal(
    (await call("cases/rr-test/1/hints?mode=assessment")).status,
    403,
  );
  await call("cases/rr-test/1/hints?mode=learning");
  await call("cases/rr-test/1/draft?mode=learning", {
    method: "PUT",
    data: { findings: "Report", hintsUsed: 0 },
  });
  assert.equal(
    (await call("cases/rr-test/1/draft?mode=learning")).data.hintsUsed,
    1,
  );
  await call("cases/rr-test/1/submit", {
    method: "POST",
    data: { findings: "Report" },
  });
  assert.equal((await call("attempts")).data[0].assisted, 1);
  const summary = assessmentSummary(
    [
      { id: "critical", importance: "critical", assessable: true },
      { id: "minor", importance: "minor", assessable: true },
    ],
    { critical: "missed", minor: "identified" },
  );
  assert.deepEqual(summary.criticalMisses, ["critical"]);
  assert.throws(() => assessmentSummary([{ id: "x", assessable: true }], {}));
});
test("publication requires actual reviewer, reviews and immutable versions", async (t) => {
  const { call, db } = await setup(t);
  const c = fixture();
  c.id = "rr-new";
  c.status = "draft";
  c.clinicalReview = null;
  c.rightsReview = null;
  saveContent(db, c);
  await call("editor/cases/rr-new/1/transition", {
    user: "author",
    method: "POST",
    data: { status: "clinical_review" },
  });
  assert.equal(
    (
      await call("editor/cases/rr-new/1/transition", {
        user: "author",
        method: "POST",
        data: {
          status: "rights_review",
          comment: "test",
          clinicalAttestation: true,
        },
      })
    ).status,
    403,
  );
  assert.equal(
    (
      await call("editor/cases/rr-new/1/transition", {
        user: "reviewer",
        method: "POST",
        data: { status: "rights_review", comment: "test" },
      })
    ).status,
    400,
  );
  assert.equal(
    (
      await call("editor/cases/rr-new/1/transition", {
        user: "reviewer",
        method: "POST",
        data: {
          status: "rights_review",
          comment: "Test fixture clinical review",
          clinicalAttestation: true,
        },
      })
    ).status,
    200,
  );
  assert.equal(
    (
      await call("editor/cases/rr-new/1/transition", {
        user: "reviewer",
        method: "POST",
        data: { status: "published", comment: "Test fixture rights review" },
      })
    ).status,
    200,
  );
  assert.throws(() =>
    db
      .prepare("UPDATE published_versions SET snapshot=? WHERE id=?")
      .run("{}", "rr-new"),
  );
  assert.equal(
    (
      await call("editor/cases/rr-new/1", {
        user: "author",
        method: "PUT",
        data: { title: "Changed" },
      })
    ).status,
    409,
  );
  assert.equal(
    (
      await call("editor/cases/rr-new/1/revise", {
        user: "author",
        method: "POST",
        data: {},
      })
    ).data.version,
    2,
  );
});
test("unknown individual asset rights and answer-revealing attribution cannot pass publication", () => {
  const c = fixture();
  c.kind = "report";
  c.series = [{ assetIds: ["a"] }];
  const a = {
    id: "a",
    rights: Object.fromEntries(
      ["commercial", "adaptation", "redistribution", "display"].map((k) => [
        k,
        { status: "allowed", evidence: "https://example.org/licence" },
      ]),
    ),
    rightsReviewStatus: "approved",
    deliveryChecksum: "sha256",
    privacyReview: {
      approved: true,
      reviewer: "fixture",
      date: "2026-10-13",
      metadata: true,
      burnedIn: true,
      facialRisk: true,
      orientation: true,
      sequence: true,
      resolution: true,
      findingsCorrespondence: true,
    },
    attributionRevealsAnswer: true,
  };
  assert.ok(
    publicationProblems(c, [a]).includes(
      "Required attribution reveals the answer; exclude from assessment",
    ),
  );
  a.rights.commercial.status = "unknown";
  assert.ok(
    publicationProblems(c, [a]).some((s) =>
      s.includes("commercial rights unresolved"),
    ),
  );
});
