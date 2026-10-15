// Loopback-only editorial software preview; never used as a production server.
process.env.VERCEL_ENV = "preview";
process.env.QUIZ_EDITORIAL_PREVIEW = "1";
process.env.QUIZ_LOCAL_TEST = "1";
process.env.QUIZ_LOCAL_ORIGIN = "http://127.0.0.1:5178";
process.env.QUIZ_SIGNING_SECRET = require("node:crypto")
  .randomBytes(48)
  .toString("hex");
const http = require("node:http"),
  fs = require("node:fs"),
  path = require("node:path"),
  handler = require("./quiz-handler.cjs");
http
  .createServer((req, res) => {
    if (/^\/quiz-images\/[a-f0-9]{32}\.png(?:\?.*)?$/.test(req.url)) {
      const file = path.join(
        __dirname,
        "../.quiz-images",
        req.url.split("?")[0].split("/").pop(),
      );
      fs.readFile(file, (error, bytes) => {
        if (error) {
          res.writeHead(404);
          return res.end();
        }
        res.writeHead(200, { "Content-Type": "image/png" });
        res.end(bytes);
      });
      return;
    }
    handler(req, res);
  })
  .listen(8788, "127.0.0.1", () =>
    console.log("Editorial quiz API ready on loopback 8788"),
  );
