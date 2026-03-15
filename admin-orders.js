(function () {
  const token = window.TDigitalAdminAuth && window.TDigitalAdminAuth.getToken && window.TDigitalAdminAuth.getToken();
  if (!token) return;

  const loadingEl = document.getElementById("ordersLoading");
  const errorEl = document.getElementById("ordersError");
  const tableWrap = document.getElementById("ordersTableWrap");
  const tableBody = document.getElementById("ordersBody");
  const emptyEl = document.getElementById("ordersEmpty");

  function showLoading(show) {
    if (loadingEl) loadingEl.hidden = !show;
  }
  function showError(text) {
    if (errorEl) {
      errorEl.textContent = text || "";
      errorEl.hidden = !text;
    }
  }
  function formatDate(iso) {
    if (!iso) return "—";
    try {
      const d = new Date(iso);
      return d.toLocaleString("de-DE", { dateStyle: "short", timeStyle: "short" });
    } catch {
      return iso;
    }
  }
  function escapeHtml(s) {
    if (s == null || s === "") return "—";
    const div = document.createElement("div");
    div.textContent = s;
    return div.innerHTML;
  }

  async function loadOrders() {
    showLoading(true);
    showError("");
    tableWrap.hidden = true;
    if (emptyEl) emptyEl.hidden = true;

    try {
      const res = await fetch("/api/admin/orders", {
        headers: { Authorization: "Bearer " + token }
      });
      const data = await res.json();

      if (!res.ok) {
        showError(data.error || "Laden fehlgeschlagen.");
        showLoading(false);
        return;
      }

      const orders = data.orders || [];
      showLoading(false);

      if (orders.length === 0) {
        if (emptyEl) emptyEl.hidden = false;
        return;
      }

      tableBody.innerHTML = orders
        .map(
          (o) =>
            `<tr>
              <td>${escapeHtml(formatDate(o.created_at))}</td>
              <td>${escapeHtml(o.name)}</td>
              <td>${escapeHtml(o.email)}</td>
              <td>${escapeHtml(o.phone)}</td>
              <td>${escapeHtml(o.service)}</td>
              <td>${escapeHtml(o.message)}</td>
            </tr>`
        )
        .join("");
      tableWrap.hidden = false;
    } catch (err) {
      showLoading(false);
      showError("Netzwerkfehler.");
    }
  }

  loadOrders();
})();
