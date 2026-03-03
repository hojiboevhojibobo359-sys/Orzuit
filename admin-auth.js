const ADMIN_TOKEN_KEY = "tDigitalAdminToken";

function getToken() {
  return sessionStorage.getItem(ADMIN_TOKEN_KEY) || "";
}

function setToken(token) {
  sessionStorage.setItem(ADMIN_TOKEN_KEY, token);
}

function clearToken() {
  sessionStorage.removeItem(ADMIN_TOKEN_KEY);
}

async function requestAuth(path, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  };
  return fetch(path, { ...options, headers });
}

async function isAdminAuthenticated() {
  const token = getToken();
  if (!token) return false;

  try {
    const response = await requestAuth("/api/auth/me", {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.ok;
  } catch {
    return false;
  }
}

async function protectAdminRoute() {
  const currentPage = location.pathname.split("/").pop() || "admin.html";
  if (currentPage === "admin-login.html") return;

  const authenticated = await isAdminAuthenticated();
  if (authenticated) return;

  clearToken();
  location.replace(`admin-login.html?next=${encodeURIComponent(currentPage)}`);
}

async function adminLogin(username, password) {
  const response = await requestAuth("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password })
  });

  if (!response.ok) return false;
  const payload = await response.json();
  if (!payload.token) return false;
  setToken(payload.token);
  return true;
}

async function getAdminUsername() {
  const token = getToken();
  if (!token) return "";

  const response = await requestAuth("/api/auth/me", {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) return "";
  const payload = await response.json();
  return payload.user && payload.user.username ? payload.user.username : "";
}

async function updateAdminCredentials(currentPassword, nextUsername, nextPassword) {
  const token = getToken();
  if (!token) throw new Error("Not authorized.");

  const response = await requestAuth("/api/admin/credentials", {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      currentPassword,
      newUsername: nextUsername,
      newPassword: nextPassword
    })
  });

  if (!response.ok) {
    let message = "Failed to update credentials.";
    try {
      const errorPayload = await response.json();
      if (errorPayload && errorPayload.error) {
        message = errorPayload.error;
      }
    } catch {
      // Use fallback message.
    }
    throw new Error(message);
  }

  return response.json();
}

function adminLogout() {
  clearToken();
  location.replace("admin-login.html");
}

protectAdminRoute();

window.TDigitalAdminAuth = {
  getToken,
  isAdminAuthenticated,
  adminLogin,
  adminLogout,
  getAdminUsername,
  updateAdminCredentials
};
