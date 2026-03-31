(function () {
  // Custom analytics: POST /api/analytics (see api/analytics.js).
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
