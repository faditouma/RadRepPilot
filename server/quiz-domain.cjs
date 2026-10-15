const crypto = require("node:crypto");
function learnerCase(c) {
  const {
    rubric,
    referenceDraft,
    sourceDiagnosis,
    sourceFindings,
    additionalInterpretations,
    criticalErrors,
    ...publicCase
  } = c;
  return publicCase;
}
function validateSelections(c, answers) {
  if (!answers || typeof answers !== "object" || Array.isArray(answers))
    throw Error("Structured answers required");
  for (const q of c.questions) {
    const value = answers[q.id];
    const values = Array.isArray(value) ? value : [value];
    if (
      value === undefined ||
      values.length === 0 ||
      values.some((v) => !q.options.some((o) => o.id === v))
    )
      throw Error(
        "Answer each question, using uncertain/not assessable when appropriate.",
      );
    if (q.kind !== "checkbox-group" && Array.isArray(value))
      throw Error("Single choice required");
    if (
      q.kind === "checkbox-group" &&
      values.length > 1 &&
      values.some((v) => ["none", "uncertain", "not_assessable"].includes(v))
    )
      throw Error(
        "Exclusive and positive choices conflict; reconcile your selections.",
      );
  }
  for (const rule of c.conflicts || [])
    if (Object.entries(rule.when).every(([k, v]) => answers[k] === v))
      throw Error(rule.message);
}
function compare(c, answers) {
  validateSelections(c, answers);
  return {
    items: c.rubric.map((g) => {
      const checks = Object.entries(g.expected).map(([key, accepted]) => {
        const value = answers[key];
        return {
          key,
          value,
          match: Array.isArray(value)
            ? accepted.every((v) => value.includes(v))
            : accepted.includes(value),
          uncertain: Array.isArray(value)
            ? value.some((v) => ["uncertain", "not_assessable"].includes(v))
            : ["uncertain", "not_assessable"].includes(value),
        };
      });
      return {
        ...g,
        checks,
        status: checks.every((x) => x.match)
          ? "aligned"
          : checks.some((x) => x.uncertain)
            ? "uncertain"
            : "review",
        unsupported: checks.some((x) => !x.match && !x.uncertain),
      };
    }),
    criticalErrors: (c.criticalErrors || []).filter((e) =>
      Object.entries(e.when).every(([k, v]) => answers[k] === v),
    ),
    referenceDraft: c.referenceDraft,
    sourceDiagnosis: c.sourceDiagnosis,
    sourceFindings: c.sourceFindings,
    additionalInterpretations: c.additionalInterpretations,
    clinicalReview: c.clinicalReview,
    status: c.clinicalReview ? "approved" : "editorial_draft",
    freeTextAssessed: false,
    score: null,
    rubricVersion: c.rubricVersion,
  };
}
function sign(payload, secret) {
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return (
    data +
    "." +
    crypto.createHmac("sha256", secret).update(data).digest("base64url")
  );
}
function verify(token, secret, session) {
  if (typeof token !== "string" || token.length > 90000)
    throw Error("Invalid receipt");
  const [data, sig] = token.split(".");
  const expected = crypto
    .createHmac("sha256", secret)
    .update(data || "")
    .digest("base64url");
  if (
    !sig ||
    sig.length !== expected.length ||
    !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))
  )
    throw Error("Submission receipt changed");
  const result = JSON.parse(Buffer.from(data, "base64url"));
  if (
    result.session !== crypto.createHash("sha256").update(session).digest("hex")
  )
    throw Error("Submission belongs to a different browser session");
  return result;
}
module.exports = { learnerCase, validateSelections, compare, sign, verify };
