const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const {
  learnerCase,
  validateSelections,
  compare,
  sign,
  verify,
} = require("./quiz-domain.cjs");
const cases = JSON.parse(
  fs.readFileSync(path.join(__dirname, "quiz-content/cases.json"), "utf8"),
);
const buckets = new Map();
module.exports = async function (req, res) {
  const json = (status, value) => {
    res.writeHead(status, {
      "Content-Type": "application/json",
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    });
    res.end(JSON.stringify(value));
  };
  // Draft testing admission is the Vercel project's authenticated protected preview.
  // This is a read-only team editorial sandbox, never a public learner/editor grant.
  if (
    process.env.VERCEL_ENV !== "preview" ||
    process.env.QUIZ_EDITORIAL_PREVIEW !== "1"
  )
    return json(403, {
      error:
        "Unapproved quiz content is available only in the protected editorial preview.",
    });
  const secret = process.env.QUIZ_SIGNING_SECRET;
  if (!secret) return json(503, { error: "Quiz signing is not configured" });
  const protocol = process.env.QUIZ_LOCAL_TEST === "1" ? "http:" : "https:";
  const url = new URL(req.url, protocol + "//" + req.headers.host);
  const allowedOrigin =
    process.env.QUIZ_LOCAL_TEST === "1"
      ? process.env.QUIZ_LOCAL_ORIGIN
      : url.origin;
  if (req.headers.origin && req.headers.origin !== allowedOrigin)
    return json(403, { error: "Origin not permitted" });
  const cookies = Object.fromEntries(
    (req.headers.cookie || "").split(";").map((s) => s.trim().split("=")),
  );
  let session = cookies["radrep-quiz-session"];
  if (!/^[a-f0-9]{64}$/.test(session || "")) {
    session = crypto.randomBytes(32).toString("hex");
    res.setHeader(
      "Set-Cookie",
      `radrep-quiz-session=${session}; Path=/; HttpOnly; ${protocol === "https:" ? "Secure; " : ""}SameSite=Strict; Max-Age=2592000`,
    );
  }
  const window = Math.floor(Date.now() / 60000),
    bucket = buckets.get(session);
  if (bucket?.window === window && bucket.count > 60)
    return json(429, { error: "Please wait before trying again." });
  buckets.set(session, {
    window,
    count: bucket?.window === window ? bucket.count + 1 : 1,
  });
  if (buckets.size > 1000) buckets.clear();
  try {
    const action = url.searchParams.get("action") || "catalog";
    if (req.method === "GET") {
      if (action === "capabilities")
        return json(200, { editorialPreview: true, contentEditing: false });
      if (action === "catalog")
        return json(200, {
          cases: cases
            .filter((c) => c.status !== "retired")
            .map((c) => ({
              id: c.id,
              title: c.title,
              modality: c.modality,
              bodySystem: c.bodySystem,
              difficulty: c.difficulty,
              minutes: c.minutes,
              version: c.version,
              status: c.status,
            })),
        });
      const c = cases.find(
        (c) => c.id === url.searchParams.get("case") && c.status !== "retired",
      );
      if (!c) return json(404, { error: "Case unavailable" });
      if (action === "case") return json(200, learnerCase(c));
      return json(403, {
        error:
          "Reference access requires an owned submitted attempt and clinical approval; draft comparison is a separate editorial action.",
      });
    }
    if (req.method !== "POST")
      return json(405, { error: "Method not allowed" });
    if (!req.headers["content-type"]?.startsWith("application/json"))
      return json(415, { error: "JSON required" });
    let size = 0,
      parts = [];
    for await (const b of req) {
      size += b.length;
      if (size > 65536) return json(413, { error: "Request too large" });
      parts.push(b);
    }
    const body = JSON.parse(Buffer.concat(parts));
    if (action === "submit") {
      const c = cases.find(
        (c) =>
          c.id === body.caseId &&
          c.version === body.version &&
          c.status !== "retired",
      );
      if (!c) return json(404, { error: "Case version unavailable" });
      validateSelections(c, body.answers);
      if (
        typeof body.generatedReport !== "string" ||
        typeof body.editedReport !== "string" ||
        body.generatedReport.length > 16000 ||
        body.editedReport.length > 16000
      )
        return json(400, { error: "Report exceeds supported size" });
      if (
        body.confidence !== undefined &&
        body.confidence !== "" &&
        (!Number.isFinite(Number(body.confidence)) ||
          Number(body.confidence) < 0 ||
          Number(body.confidence) > 100)
      )
        return json(400, { error: "Confidence must be between 0 and 100" });
      if (
        body.hintsUsed !== undefined &&
        (!Number.isInteger(body.hintsUsed) ||
          body.hintsUsed < 0 ||
          body.hintsUsed > c.hints.length)
      )
        return json(400, { error: "Invalid hint count" });
      const snapshot = {
        id: crypto.randomUUID(),
        caseId: c.id,
        version: c.version,
        rubricVersion: c.rubricVersion,
        answers: body.answers,
        generatedReport: body.generatedReport,
        editedReport: body.editedReport,
        confidence: body.confidence,
        hintsUsed: body.hintsUsed,
        submittedAt: new Date().toISOString(),
        session: crypto.createHash("sha256").update(session).digest("hex"),
      };
      return json(200, {
        receipt: sign(snapshot, secret),
        submittedAt: snapshot.submittedAt,
        id: snapshot.id,
      });
    }
    if (action === "feedback") {
      const snapshot = verify(body.receipt, secret, session);
      const c = cases.find(
        (c) => c.id === snapshot.caseId && c.version === snapshot.version,
      );
      if (!c) return json(404, { error: "Case version unavailable" });
      if (!c.clinicalReview && body.editorialDraft !== true)
        return json(403, {
          error:
            "Clinical approval pending; approved learner feedback is unavailable.",
        });
      return json(200, compare(c, snapshot.answers));
    }
    return json(404, { error: "Action unavailable" });
  } catch (e) {
    return json(400, { error: e.message || "Invalid request" });
  }
};
