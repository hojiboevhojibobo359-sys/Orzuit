document.addEventListener("DOMContentLoaded", () => {
  const { isAdminAuthenticated, adminLogin } = window.TDigitalAdminAuth;

  if (isAdminAuthenticated()) {
    location.replace("admin.html");
    return;
  }

  const form = document.getElementById("adminLoginForm");
  const username = document.getElementById("username");
  const password = document.getElementById("password");
  const error = document.getElementById("loginError");

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const ok = adminLogin(username.value.trim(), password.value);
    if (!ok) {
      error.textContent = "Falscher Login oder falsches Passwort.";
      return;
    }
    const params = new URLSearchParams(location.search);
    const next = params.get("next") || "admin.html";
    location.replace(next);
  });
});
