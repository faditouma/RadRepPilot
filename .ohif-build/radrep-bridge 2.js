// An observable loading boundary; does not establish clinical approval or rendering truth.
(() => {
  const key = new URLSearchParams(location.search).get("caseKey");
  const completed = new Set();
  const send = (type, detail = {}) =>
    parent.postMessage({ type, caseKey: key, ...detail }, location.origin);
  const originalOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function (method, url, ...args) {
    const u = String(url);
    if (u.includes("/imaging/") && /\.dcm(?:[?#]|$)/.test(u))
      this.addEventListener("loadend", () => {
        if (this.status >= 200 && this.status < 300) {
          completed.add(u);
          send("radrep:ohif:progress", { completed: completed.size });
        }
        else
          send("radrep:ohif:error", {
            message: `Imaging request failed (HTTP ${this.status || "network error"}). Reload the study or sign in again.`,
          });
      });
    return originalOpen.call(this, method, url, ...args);
  };
  addEventListener("error", () =>
    send("radrep:ohif:error", {
      message:
        "The viewer encountered an error. Check the displayed OHIF error and reload.",
    }),
  );
  addEventListener("unhandledrejection", () =>
    send("radrep:ohif:error", {
      message:
        "The viewer could not finish loading a resource. Reload or verify browser WebGL support.",
    }),
  );
  addEventListener("load", () => send("radrep:ohif:booted"));
})();
