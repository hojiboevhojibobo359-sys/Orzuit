const test = require("node:test");
const assert = require("node:assert/strict");
const {
  validateOrder,
  validateLogin,
  validateContent,
  validateTelegram
} = require("../server/validate");

test("validateOrder accepts payload with name only", () => {
  const r = validateOrder({
    name: "Test Kunde",
    email: "",
    phone: "",
    service: "",
    message: ""
  });
  assert.equal(r.valid, true);
  assert.equal(r.data.name, "Test Kunde");
});

test("validateOrder accepts message with valid email", () => {
  const r = validateOrder({
    name: "",
    email: "a@b.de",
    phone: "",
    service: "Website",
    message: "Hallo"
  });
  assert.equal(r.valid, true);
});

test("validateOrder rejects when name, email and message are all empty", () => {
  const r = validateOrder({
    name: "",
    email: "",
    phone: "",
    service: "",
    message: ""
  });
  assert.equal(r.valid, false);
});

test("validateOrder rejects invalid email when provided", () => {
  const r = validateOrder({
    name: "X",
    email: "not-an-email",
    message: "y"
  });
  assert.equal(r.valid, false);
});

test("validateOrder rejects non-object body", () => {
  assert.equal(validateOrder(null).valid, false);
  assert.equal(validateOrder("x").valid, false);
});

test("validateLogin requires username and password", () => {
  assert.equal(validateLogin({ username: "u", password: "p" }).valid, true);
  assert.equal(validateLogin({ username: "", password: "p" }).valid, false);
  assert.equal(validateLogin({ username: "u", password: "" }).valid, false);
});

test("validateContent accepts minimal content object", () => {
  const r = validateContent({ content: { siteName: "T" } });
  assert.equal(r.valid, true);
});

test("validateContent rejects unknown top-level keys", () => {
  const r = validateContent({ content: { siteName: "T", extra: 1 } });
  assert.equal(r.valid, false);
});

test("validateTelegram accepts empty optional fields", () => {
  const r = validateTelegram({ chatId: null, botToken: null });
  assert.equal(r.valid, true);
});

test("validateTelegram rejects too long token", () => {
  const r = validateTelegram({ chatId: "1", botToken: "x".repeat(201) });
  assert.equal(r.valid, false);
});
