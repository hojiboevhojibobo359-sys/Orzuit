const ADMIN_AUTH_KEY = "tDigitalAdminAuth";
const ADMIN_CREDENTIALS_KEY = "tDigitalAdminCredentials";
const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "tdigital2026";

function getStoredCredentials() {
  const raw = localStorage.getItem(ADMIN_CREDENTIALS_KEY);
  if (!raw) {
    return { username: ADMIN_USERNAME, password: ADMIN_PASSWORD };
  }
  try {
    const parsed = JSON.parse(raw);
    const username = String(parsed.username || "").trim();
    const password = String(parsed.password || "");
    if (!username || !password) {
      return { username: ADMIN_USERNAME, password: ADMIN_PASSWORD };
    }
    return { username, password };
  } catch {
    return { username: ADMIN_USERNAME, password: ADMIN_PASSWORD };
  }
}

function isAdminAuthenticated() {
  return sessionStorage.getItem(ADMIN_AUTH_KEY) === "1";
}

function protectAdminRoute() {
  const currentPage = location.pathname.split("/").pop() || "admin.html";
  if (currentPage === "admin-login.html") return;
  if (isAdminAuthenticated()) return;
  location.replace(`admin-login.html?next=${encodeURIComponent(currentPage)}`);
}

function adminLogin(username, password) {
  const creds = getStoredCredentials();
  const isValid = username === creds.username && password === creds.password;
  if (!isValid) return false;
  sessionStorage.setItem(ADMIN_AUTH_KEY, "1");
  return true;
}

function updateAdminCredentials(nextUsername, nextPassword) {
  const username = String(nextUsername || "").trim();
  const password = String(nextPassword || "");
  if (!username || !password) return false;
  localStorage.setItem(
    ADMIN_CREDENTIALS_KEY,
    JSON.stringify({
      username,
      password
    })
  );
  return true;
}

function getAdminUsername() {
  return getStoredCredentials().username;
}

function adminLogout() {
  sessionStorage.removeItem(ADMIN_AUTH_KEY);
  location.replace("admin-login.html");
}

protectAdminRoute();

window.TDigitalAdminAuth = {
  ADMIN_USERNAME,
  isAdminAuthenticated,
  adminLogin,
  adminLogout,
  getAdminUsername,
  updateAdminCredentials
};
