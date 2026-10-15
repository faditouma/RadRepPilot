const { test } = require("node:test"),
  assert = require("node:assert/strict"),
  crypto = require("node:crypto");
const {
  learnerCase,
  compare,
  sign,
  verify,
  validateSelections,
} = require("./quiz-domain.cjs");
const c = {
  questions: [
    {
      id: "finding",
      options: [{ id: "positive" }, { id: "none" }, { id: "uncertain" }],
    },
  ],
  rubric: [
    {
      id: "one-concept",
      expected: { finding: ["positive"] },
      wording: "Software fixture correction",
    },
  ],
  referenceDraft: { findings: "Software fixture reference" },
  sourceDiagnosis: "Software-only diagnosis",
  sourceFindings: [],
  additionalInterpretations: "fixture",
  clinicalReview: null,
  rubricVersion: "fixture-1",
  conflicts: [],
};
test("pre-submission case data excludes rubrics and references", () => {
  const visible = learnerCase(c);
  assert.equal(visible.rubric, undefined);
  assert.equal(visible.referenceDraft, undefined);
  assert.equal(visible.sourceDiagnosis, undefined);
});
test("structured corrections preserve uncertainty and provide no free-text score", () => {
  assert.equal(compare(c, { finding: "positive" }).items[0].status, "aligned");
  const f = compare(c, { finding: "uncertain" });
  assert.equal(f.items[0].status, "uncertain");
  assert.equal(f.score, null);
  assert.equal(f.freeTextAssessed, false);
  assert.equal(f.status, "editorial_draft");
});
test("unknown/missing options and contradictory multi-select answers are rejected", () => {
  assert.throws(() => validateSelections(c, {}));
  assert.throws(() => validateSelections(c, { finding: "injected" }));
  assert.throws(() =>
    validateSelections(
      {
        ...c,
        questions: [
          {
            id: "finding",
            kind: "checkbox-group",
            options: [{ id: "positive" }, { id: "none" }],
          },
        ],
      },
      { finding: ["positive", "none"] },
    ),
  );
});
test("immutable receipts reject changed reports and other sessions", () => {
  const secret = "software-fixture-secret",
    session = "software-fixture-session";
  const snapshot = {
    session: crypto.createHash("sha256").update(session).digest("hex"),
    report: "Original QA report",
  };
  const token = sign(snapshot, secret);
  assert.equal(verify(token, secret, session).report, "Original QA report");
  assert.throws(() => verify(token, secret, "another-session"));
  const [data, sig] = token.split(".");
  const changed = JSON.parse(Buffer.from(data, "base64url"));
  changed.report = "Changed QA report";
  assert.throws(() =>
    verify(
      Buffer.from(JSON.stringify(changed)).toString("base64url") + "." + sig,
      secret,
      session,
    ),
  );
});

test("HTTP workflow enforces preview-only admission, submitted ownership and clinical review", async () => {
  const http = require("node:http");
  process.env.VERCEL_ENV = "production";
  process.env.QUIZ_EDITORIAL_PREVIEW = "1";
  process.env.QUIZ_LOCAL_TEST = "1";
  process.env.QUIZ_SIGNING_SECRET = "software-http-fixture";
  const handler = require("./quiz-handler.cjs");
  const server = http.createServer(handler);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const base = "http://127.0.0.1:" + server.address().port;
  process.env.QUIZ_LOCAL_ORIGIN = base;
  try {
    const closed = await fetch(base + "/?action=catalog");
    assert.equal(closed.status, 403);
    process.env.VERCEL_ENV = "preview";
    const cResponse = await fetch(base + "/?action=case&case=xr-001");
    assert.equal(cResponse.status, 200);
    const cookie = cResponse.headers.get("set-cookie").split(";")[0];
    const visible = await cResponse.json();
    assert.equal(visible.rubric, undefined);
    assert.equal(visible.referenceDraft, undefined);
    const denied = await fetch(base + "/?action=reference&case=xr-001", {
      headers: { cookie },
    });
    assert.equal(denied.status, 403);
    const request = {
      caseId: "xr-001",
      version: 1,
      answers: {
        scope: "selected",
        limits: "uncalibrated",
        finding: "fracture",
        location: "left_clavicle",
        impression: "fracture",
      },
      generatedReport: "Software generated wording",
      editedReport: "Software edited wording",
    };
    const submitted = await fetch(base + "/?action=submit", {
      method: "POST",
      headers: { cookie, "Content-Type": "application/json", origin: base },
      body: JSON.stringify(request),
    });
    assert.equal(submitted.status, 200);
    const receipt = (await submitted.json()).receipt;
    const feedback = (editorialDraft, otherCookie = cookie) =>
      fetch(base + "/?action=feedback", {
        method: "POST",
        headers: {
          cookie: otherCookie,
          "Content-Type": "application/json",
          origin: base,
        },
        body: JSON.stringify({ receipt, editorialDraft }),
      });
    assert.equal((await feedback(false)).status, 403);
    assert.equal(
      (await feedback(true, "radrep-quiz-session=" + "f".repeat(64))).status,
      400,
    );
    const draft = await feedback(true);
    assert.equal(draft.status, 200);
    const body = await draft.json();
    assert.equal(body.status, "editorial_draft");
    assert.equal(body.clinicalReview, null);
    assert.equal(body.freeTextAssessed, false);
    assert.equal(
      body.items.filter((i) => i.id === "clavicle-fracture").length,
      1,
    );
    assert.equal(
      body.items.find((i) => i.id === "clavicle-fracture").status,
      "review",
    );
    const badOrigin = await fetch(base + "/?action=submit", {
      method: "POST",
      headers: {
        cookie,
        "Content-Type": "application/json",
        origin: "https://untrusted.example",
      },
      body: JSON.stringify(request),
    });
    assert.equal(badOrigin.status, 403);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    delete process.env.QUIZ_LOCAL_TEST;
    delete process.env.QUIZ_LOCAL_ORIGIN;
    delete process.env.QUIZ_SIGNING_SECRET;
    delete process.env.VERCEL_ENV;
    delete process.env.QUIZ_EDITORIAL_PREVIEW;
  }
});
