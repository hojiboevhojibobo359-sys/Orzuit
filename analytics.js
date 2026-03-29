(function () {
  // Custom site analytics using endpoint /api/analytics.
  // 
  // NOTE: Do NOT run these in PowerShell or any command shell:
  //   - import { Analytics } from "@vercel/analytics/next"
  //   - import { SpeedInsights } from "@vercel/speed-insights/next"
  // 
  // JS module imports belong in script files (.js, .ts) within your project,
  // executed by a bundler (webpack, Vite, Next.js, etc.), NOT in shell terminals.
  //
  // If adding Vercel Analytics or SpeedInsights, add them to your project's JS files,
  // not in PowerShell.
  
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
