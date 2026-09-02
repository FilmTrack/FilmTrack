import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const authPage = await readFile(new URL("../src/app/auth/page.tsx", import.meta.url), "utf8");

test("email signup uses a production-safe confirmation redirect", () => {
  assert.match(authPage, /emailRedirectTo:\s*confirmationRedirect\(\)/);
  assert.match(authPage, /window\.location\.origin\/auth\?confirmed=1/);
});

test("pending email confirmation is not tracked as completed signup", () => {
  const pendingBranch = authPage.slice(authPage.indexOf("if (data.session)"), authPage.indexOf("const handleResendConfirmation"));
  assert.match(pendingBranch, /signup_completed/);
  assert.match(pendingBranch, /signup_confirmation_pending/);
  assert.ok(pendingBranch.indexOf("signup_completed") < pendingBranch.indexOf("signup_confirmation_pending"));
});

test("auth page supports resending signup confirmation", () => {
  assert.match(authPage, /supabase\.auth\.resend\(\{/);
  assert.match(authPage, /type:\s*"signup"/);
  assert.match(authPage, /ارسال دوباره ایمیل تأیید/);
});

test("raw invalid credentials are replaced with Persian UX", () => {
  assert.match(authPage, /case "invalid_credentials"/);
  assert.match(authPage, /ایمیل یا رمز عبور درست نیست/);
  assert.doesNotMatch(authPage, /alert\(error\.message\)/);
});

test("email rate limits get an explicit Persian message", () => {
  assert.match(authPage, /case "over_email_send_rate_limit"/);
  assert.match(authPage, /ارسال ایمیل موقتاً محدود شده است/);
});
