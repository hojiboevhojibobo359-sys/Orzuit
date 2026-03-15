(function () {
  const token = window.TDigitalAdminAuth && window.TDigitalAdminAuth.getToken && window.TDigitalAdminAuth.getToken();
  if (!token) return;

  const totalEl = document.getElementById("analyticsTotal");
  const pageLoading = document.getElementById("analyticsPageLoading");
  const pageTableWrap = document.getElementById("analyticsPageTableWrap");
  const pageBody = document.getElementById("analyticsPageBody");
  const pageEmpty = document.getElementById("analyticsPageEmpty");
  const filterFrom = document.getElementById("filterFrom");
  const filterTo = document.getElementById("filterTo");
  const filterPage = document.getElementById("filterPage");
  const filterGroupBy = document.getElementById("filterGroupBy");
  const filterApply = document.getElementById("filterApply");

  let chartCountry = null;
  let chartTime = null;

  const CHART_COLORS = {
    accent: "rgba(0, 245, 255, 0.9)",
    accentDim: "rgba(0, 196, 204, 0.7)",
    grid: "rgba(0, 245, 255, 0.08)",
    text: "#e8eeff",
    muted: "#8b9dc3"
  };

  function buildParams() {
    const p = new URLSearchParams();
    if (filterFrom && filterFrom.value) p.set("from", filterFrom.value);
    if (filterTo && filterTo.value) p.set("to", filterTo.value);
    if (filterPage && filterPage.value) p.set("page", filterPage.value);
    if (filterGroupBy && filterGroupBy.value) p.set("groupBy", filterGroupBy.value);
    return p.toString();
  }

  function escapeHtml(s) {
    if (s == null || s === "") return "—";
    const div = document.createElement("div");
    div.textContent = s;
    return div.innerHTML;
  }

  function formatDateStr(dateStr) {
    if (!dateStr) return "";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "2-digit" });
    } catch {
      return dateStr;
    }
  }

  async function load() {
    const q = buildParams();
    const url = "/api/admin/analytics" + (q ? "?" + q : "");

    if (totalEl) totalEl.textContent = "…";
    if (pageLoading) pageLoading.hidden = false;
    if (pageTableWrap) pageTableWrap.hidden = true;
    if (pageEmpty) pageEmpty.hidden = true;

    try {
      const res = await fetch(url, { headers: { Authorization: "Bearer " + token } });
      const data = await res.json();

      if (!res.ok) {
        if (totalEl) totalEl.textContent = "0";
        if (pageLoading) pageLoading.textContent = data.error || "Fehler.";
        return;
      }

      if (totalEl) totalEl.textContent = (data.total || 0).toLocaleString("de-DE");

      const pageViews = data.pageViews || [];
      if (pageLoading) pageLoading.hidden = true;
      if (pageViews.length === 0) {
        if (pageEmpty) pageEmpty.hidden = false;
      } else {
        pageBody.innerHTML = pageViews
          .map(function (r) {
            return "<tr><td>" + escapeHtml(r.page) + "</td><td>" + (r.views || 0).toLocaleString("de-DE") + "</td></tr>";
          })
          .join("");
        pageTableWrap.hidden = false;
      }

      // Page filter options (from current pageViews + keep "Alle")
      if (filterPage && pageViews.length) {
        const curVal = filterPage.value;
            filterPage.innerHTML = "<option value=\"\">Alle</option>" + pageViews
              .map(function (r) { return "<option value=\"" + escapeHtml(r.page) + "\">" + escapeHtml(r.page) + "</option>"; })
              .join("");
            if (curVal) filterPage.value = curVal;
          }

      // Country chart
      const byCountry = data.byCountry || [];
      if (chartCountry) chartCountry.destroy();
      const ctxCountry = document.getElementById("chartCountry");
      if (ctxCountry) {
        chartCountry = new Chart(ctxCountry, {
          type: "doughnut",
          data: {
            labels: byCountry.map(function (r) { return r.country; }),
            datasets: [{
              data: byCountry.map(function (r) { return r.views; }),
              backgroundColor: [
                CHART_COLORS.accent,
                CHART_COLORS.accentDim,
                "rgba(168, 85, 247, 0.8)",
                "rgba(34, 197, 94, 0.7)",
                "rgba(249, 115, 22, 0.7)",
                "rgba(234, 179, 8, 0.7)",
                "rgba(236, 72, 153, 0.7)",
                "rgba(20, 184, 166, 0.7)",
                "rgba(139, 92, 246, 0.7)",
                "rgba(244, 63, 94, 0.7)"
              ],
              borderColor: "rgba(6, 8, 16, 0.9)",
              borderWidth: 2
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
              legend: { labels: { color: CHART_COLORS.text, font: { family: "Plus Jakarta Sans", size: 12 } } }
            }
          }
        });
      }

      // Time chart
      const byTime = data.byTime || [];
      if (chartTime) chartTime.destroy();
      const ctxTime = document.getElementById("chartTime");
      if (ctxTime) {
        chartTime = new Chart(ctxTime, {
          type: "line",
          data: {
            labels: byTime.map(function (r) { return formatDateStr(r.date); }),
            datasets: [{
              label: "Besuche",
              data: byTime.map(function (r) { return r.views; }),
              borderColor: CHART_COLORS.accent,
              backgroundColor: "rgba(0, 245, 255, 0.1)",
              fill: true,
              tension: 0.2
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
              x: {
                grid: { color: CHART_COLORS.grid },
                ticks: { color: CHART_COLORS.muted, maxTicksLimit: 10, font: { size: 11 } }
              },
              y: {
                beginAtZero: true,
                grid: { color: CHART_COLORS.grid },
                ticks: { color: CHART_COLORS.muted, font: { size: 11 } }
              }
            },
            plugins: {
              legend: { display: false }
            }
          }
        });
      }
    } catch (err) {
      if (totalEl) totalEl.textContent = "0";
      if (pageLoading) pageLoading.textContent = "Netzwerkfehler.";
    }
  }

  if (filterApply) filterApply.addEventListener("click", load);
  if (filterPage) filterPage.addEventListener("change", load);
  if (filterGroupBy) filterGroupBy.addEventListener("change", load);

  load();
})();
