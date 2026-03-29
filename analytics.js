(function () {
  // This site tracks with the custom /api/analytics endpoint.
  // Do not attempt to run `import { Analytics } from "@vercel/analytics/next"` in PowerShell.
  // Client-side module imports belong inside JS source files when using a bundler / framework.
  var page = typeof location !== "undefined" && location.pathname ? location.pathname : "/";
  if (!page || page === "/") page = "/";
  var referrer = typeof document !== "undefined" && document.referrer ? document.referrer : "";
  try {
    fetch("/api/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ page: page, referrer: referrer })
    }).catch(function () {});
  } catch (e) {}
})();
