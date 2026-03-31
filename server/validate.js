const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_STRING = 10000;
const MAX_ORDER_MESSAGE = 5000;
const MAX_ORDER_FIELD = 500;

function string(value, minLen = 0, maxLen = MAX_STRING) {
  const s = value == null ? "" : String(value).trim();
  if (minLen && s.length < minLen) return { ok: false, error: `Min length ${minLen}` };
  if (s.length > maxLen) return { ok: false, error: `Max length ${maxLen}` };
  return { ok: true, value: s };
}

function email(value) {
  const s = value == null ? "" : String(value).trim();
  if (!s) return { ok: true, value: s };
  if (s.length > 255) return { ok: false, error: "Email too long" };
  if (!EMAIL_REGEX.test(s)) return { ok: false, error: "Invalid email format" };
  return { ok: true, value: s };
}

function validateLogin(body) {
  const errors = [];
  if (!body || typeof body !== "object") {
    return { valid: false, errors: [{ field: "payload", message: "JSON object required." }] };
  }
  const username = string(body.username, 1, 255);
  if (!username.ok) errors.push({ field: "username", message: username.error });
  const password = body.password;
  if (password == null || String(password).length < 1) {
    errors.push({ field: "password", message: "Password is required." });
  }
  if (String(password).length > 500) {
    errors.push({ field: "password", message: "Password too long." });
  }
  if (errors.length) return { valid: false, errors };
  return { valid: true, data: { username: username.value, password: String(body.password) } };
}

function validateOrder(body) {
  const errors = [];
  if (!body || typeof body !== "object") {
    return { valid: false, errors: [{ field: "payload", message: "JSON object required." }] };
  }
  const name = string(body.name || "", 0, MAX_ORDER_FIELD);
  if (!name.ok) errors.push({ field: "name", message: name.error });
  const emailVal = email(body.email);
  if (!emailVal.ok) errors.push({ field: "email", message: emailVal.error });
  const phone = string(body.phone || "", 0, MAX_ORDER_FIELD);
  if (!phone.ok) errors.push({ field: "phone", message: phone.error });
  const service = string(body.service || "", 0, MAX_ORDER_FIELD);
  if (!service.ok) errors.push({ field: "service", message: service.error });
  const message = string(body.message || "", 0, MAX_ORDER_MESSAGE);
  if (!message.ok) errors.push({ field: "message", message: message.error });
  if (!(name.value || emailVal.value || message.value)) {
    errors.push({ field: "message", message: "At least one of name, email or message is required." });
  }
  if (errors.length) return { valid: false, errors };
  return {
    valid: true,
    data: {
      name: name.value || null,
      email: emailVal.value || null,
      phone: phone.value || null,
      service: service.value || null,
      message: message.value || ""
    }
  };
}

function validateContent(body) {
  const errors = [];
  if (!body || typeof body !== "object") {
    return { valid: false, errors: [{ field: "content", message: "JSON object required." }] };
  }
  const content = body.content;
  if (content == null || typeof content !== "object" || Array.isArray(content)) {
    return { valid: false, errors: [{ field: "content", message: "Content must be a non-array object." }] };
  }
  const allowedKeys = ["siteName", "siteLogo", "home", "services", "about", "contacts", "projectCategories", "projects"];
  for (const key of Object.keys(content)) {
    if (!allowedKeys.includes(key)) errors.push({ field: "content", message: `Unknown key: ${key}.` });
  }
  if (errors.length) return { valid: false, errors };
  return { valid: true, data: content };
}

function validateCredentials(body) {
  const errors = [];
  if (!body || typeof body !== "object") {
    return { valid: false, errors: [{ field: "payload", message: "JSON object required." }] };
  }
  const currentPassword = body.currentPassword;
  if (currentPassword == null || String(currentPassword).length < 1) {
    errors.push({ field: "currentPassword", message: "Current password is required." });
  }
  const newUsername = string(body.newUsername, 1, 255);
  if (!newUsername.ok) errors.push({ field: "newUsername", message: newUsername.error });
  const newPassword = body.newPassword;
  if (newPassword == null || String(newPassword).length < 6) {
    errors.push({ field: "newPassword", message: "New password must be at least 6 characters." });
  }
  if (String(newPassword).length > 500) {
    errors.push({ field: "newPassword", message: "Password too long." });
  }
  if (errors.length) return { valid: false, errors };
  return {
    valid: true,
    data: {
      currentPassword: String(body.currentPassword),
      newUsername: newUsername.value,
      newPassword: String(body.newPassword)
    }
  };
}

function validateTelegram(body) {
  const errors = [];
  if (!body || typeof body !== "object") {
    return { valid: false, errors: [{ field: "payload", message: "JSON object required." }] };
  }
  const chatId = body.chatId == null ? null : String(body.chatId).trim() || null;
  const botToken = body.botToken == null ? null : String(body.botToken).trim() || null;
  if (chatId != null && chatId.length > 100) errors.push({ field: "chatId", message: "Chat ID too long." });
  if (botToken != null && botToken.length > 200) errors.push({ field: "botToken", message: "Bot token too long." });
  if (errors.length) return { valid: false, errors };
  return { valid: true, data: { chatId, botToken } };
}

function validateBootstrap(body) {
  const errors = [];
  if (!body || typeof body !== "object") {
    return { valid: false, errors: [{ field: "payload", message: "JSON object required." }] };
  }
  const secret = String(body.secret || "").trim();
  if (!secret) errors.push({ field: "secret", message: "Secret is required." });
  const username = string(body.username, 1, 255);
  if (!username.ok) errors.push({ field: "username", message: username.error });
  const password = body.password;
  if (password == null || String(password).length < 6) {
    errors.push({ field: "password", message: "Password must be at least 6 characters." });
  }
  if (errors.length) return { valid: false, errors };
  return { valid: true, data: { secret, username: username.value, password: String(password) } };
}

module.exports = {
  validateLogin,
  validateOrder,
  validateContent,
  validateCredentials,
  validateTelegram,
  validateBootstrap
};
