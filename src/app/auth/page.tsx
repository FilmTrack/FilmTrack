"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Code2, Globe, ShieldCheck, Sparkles } from "lucide-react";

import Logo from "@/components/Logo";
import { createClient } from "@/lib/supabase/client";
import { trackProductEvent } from "@/lib/product-events";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type AuthErrorLike = {
  code?: string;
  message?: string;
};

function authErrorMessage(error: AuthErrorLike) {
  switch (error.code) {
    case "invalid_credentials":
      return "ایمیل یا رمز عبور درست نیست. اگر رمز را به خاطر ندارید، از بازیابی رمز عبور استفاده کنید.";
    case "email_not_confirmed":
      return "ایمیل شما هنوز تأیید نشده است. ایمیل تأیید را باز کنید یا دوباره آن را ارسال کنید.";
    case "over_email_send_rate_limit":
    case "over_request_rate_limit":
      return "ارسال ایمیل موقتاً محدود شده است. چند دقیقه بعد دوباره تلاش کنید.";
    case "email_address_invalid":
      return "آدرس ایمیل معتبر نیست.";
    default:
      return "در انجام عملیات ورود یا ثبت‌نام مشکلی پیش آمد. دوباره تلاش کنید.";
  }
}

export default function AuthPage() {
  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const recoveryMode = searchParams.get("recovery") === "1";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingEmail, setPendingEmail] = useState("");
  const [notice, setNotice] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const confirmationRedirect = () => `${window.location.origin}/auth?confirmed=1`;
  const recoveryRedirect = () => `${window.location.origin}/auth?recovery=1`;

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setNotice("");
    setErrorMessage("");

    const normalizedEmail = email.trim().toLowerCase();
    const { error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });

    if (error) {
      setErrorMessage(authErrorMessage(error));
    } else {
      router.push("/dashboard");
      router.refresh();
    }
    setLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setNotice("");
    setErrorMessage("");

    const normalizedEmail = email.trim().toLowerCase();
    void trackProductEvent("signup_started", { method: "email" });

    const { data, error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        emailRedirectTo: confirmationRedirect(),
      },
    });

    if (error) {
      setErrorMessage(authErrorMessage(error));
      setLoading(false);
      return;
    }

    if (data.session) {
      void trackProductEvent("signup_completed", { method: "email" });
      router.push("/onboarding");
      router.refresh();
    } else {
      void trackProductEvent("signup_confirmation_pending", { method: "email" });
      setPendingEmail(normalizedEmail);
      setNotice(
        "درخواست ثبت‌نام دریافت شد. برای تکمیل حساب، ایمیل تأیید را بررسی کنید. اگر پیام را نمی‌بینید پوشه Spam را هم بررسی کنید یا از دکمه ارسال دوباره استفاده کنید.",
      );
    }
    setLoading(false);
  };

  const handleResendConfirmation = async () => {
    const normalizedEmail = (pendingEmail || email).trim().toLowerCase();
    if (!normalizedEmail) {
      setErrorMessage("ابتدا ایمیل خود را وارد کنید.");
      return;
    }

    setLoading(true);
    setNotice("");
    setErrorMessage("");

    const { error } = await supabase.auth.resend({
      type: "signup",
      email: normalizedEmail,
      options: {
        emailRedirectTo: confirmationRedirect(),
      },
    });

    if (error) {
      setErrorMessage(authErrorMessage(error));
    } else {
      setPendingEmail(normalizedEmail);
      setNotice("درخواست ارسال دوباره ثبت شد. لطفاً Inbox و Spam ایمیل خود را بررسی کنید.");
    }
    setLoading(false);
  };

  const handlePasswordRecovery = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      setErrorMessage("برای بازیابی رمز عبور ابتدا ایمیل خود را وارد کنید.");
      return;
    }

    setLoading(true);
    setNotice("");
    setErrorMessage("");

    const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
      redirectTo: recoveryRedirect(),
    });

    if (error) {
      setErrorMessage(authErrorMessage(error));
    } else {
      setNotice("اگر این ایمیل در FilmTrack حساب داشته باشد، لینک بازیابی رمز برای آن ارسال شد. Inbox و Spam را بررسی کنید.");
    }
    setLoading(false);
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setErrorMessage("رمز جدید باید حداقل ۶ کاراکتر باشد.");
      return;
    }

    setLoading(true);
    setNotice("");
    setErrorMessage("");

    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      setErrorMessage(authErrorMessage(error));
      setLoading(false);
      return;
    }

    setNotice("رمز عبور با موفقیت تغییر کرد. در حال ورود به حساب شما...");
    setNewPassword("");
    router.push("/dashboard");
    router.refresh();
    setLoading(false);
  };

  const handleOAuthLogin = async (provider: "google" | "github") => {
    setErrorMessage("");
    void trackProductEvent("signup_started", { method: provider });
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/onboarding` },
    });
    if (error) setErrorMessage(authErrorMessage(error));
  };

  const inputClass =
    "min-h-12 rounded-xl border-white/10 bg-black/20 text-white placeholder:text-slate-600 focus-visible:border-blue-500/50 focus-visible:ring-blue-500/20";

  return (
    <main className="relative min-h-[calc(100vh-72px)] overflow-hidden bg-[#050914] px-4 py-10 text-white sm:px-6 sm:py-14" dir="rtl">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_78%_12%,rgba(37,99,235,.16),transparent_32%),radial-gradient(circle_at_22%_8%,rgba(124,58,237,.13),transparent_30%)]" />

      <div className="relative mx-auto grid w-full max-w-5xl gap-8 lg:grid-cols-[minmax(0,1fr)_460px] lg:items-center">
        <section className="hidden lg:block">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-500/10 px-3 py-1.5 text-xs font-bold text-blue-200">
            <Sparkles className="h-4 w-4" /> تجربه شخصی تماشای تو
          </div>
          <h1 className="mt-6 max-w-xl text-5xl font-black leading-[1.2]">
            حساب تو، مرکز همه فیلم‌ها و سریال‌هایی که دنبال می‌کنی
          </h1>
          <p className="mt-5 max-w-xl text-base leading-8 text-slate-400">
            فهرست شخصی بساز، امتیاز بده، تاریخ تماشا را ثبت کن و مسیر سینمایی خودت را در یک حساب امن نگه دار.
          </p>
          <div className="mt-8 grid max-w-xl grid-cols-2 gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <ShieldCheck className="h-5 w-5 text-emerald-300" />
              <p className="mt-3 text-sm font-bold">فهرست‌های خصوصی پیش‌فرض</p>
              <p className="mt-1 text-xs leading-6 text-slate-500">انتشار هر مورد فقط با انتخاب خودت انجام می‌شود.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <Sparkles className="h-5 w-5 text-violet-300" />
              <p className="mt-3 text-sm font-bold">شروع سریع</p>
              <p className="mt-1 text-xs leading-6 text-slate-500">بعد از ثبت‌نام با چند عنوان، حساب شخصی‌ات آماده می‌شود.</p>
            </div>
          </div>
        </section>

        <section className="w-full rounded-3xl border border-white/10 bg-[#0b1220]/90 p-5 shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-7">
          <div className="flex flex-col items-center text-center">
            <Logo />
            <h2 className="mt-5 text-2xl font-black sm:text-3xl">{recoveryMode ? "تنظیم رمز عبور جدید" : "به FilmTrack خوش آمدی"}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              {recoveryMode ? "رمز جدید حساب را وارد کن تا دوباره به FilmTrack دسترسی داشته باشی." : "وارد شو یا در کمتر از یک دقیقه حساب شخصی بساز."}
            </p>
          </div>

          {notice ? (
            <div className="mt-6 rounded-xl border border-emerald-400/20 bg-emerald-500/10 p-3 text-sm leading-7 text-emerald-100" role="status">
              {notice}
            </div>
          ) : null}
          {errorMessage ? (
            <div className="mt-6 rounded-xl border border-rose-400/20 bg-rose-500/10 p-3 text-sm leading-7 text-rose-100" role="alert">
              {errorMessage}
            </div>
          ) : null}

          {recoveryMode ? (
            <form onSubmit={handleUpdatePassword} className="mt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">رمز عبور جدید، حداقل ۶ کاراکتر</Label>
                <Input id="new-password" type="password" dir="ltr" autoComplete="new-password" required minLength={6} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className={inputClass} />
              </div>
              <Button type="submit" disabled={loading} className="min-h-12 w-full rounded-xl bg-gradient-to-l from-violet-600 to-blue-500 text-base font-black text-white hover:opacity-95">
                {loading ? "در حال ذخیره..." : "ذخیره رمز جدید"}
              </Button>
            </form>
          ) : (
            <>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <Button onClick={() => handleOAuthLogin("google")} variant="outline" className="min-h-12 rounded-xl border-white/10 bg-white text-black hover:bg-slate-100">
                  <Globe className="ml-2 h-5 w-5" /> ادامه با گوگل
                </Button>
                <Button onClick={() => handleOAuthLogin("github")} variant="outline" className="min-h-12 rounded-xl border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.08]">
                  <Code2 className="ml-2 h-5 w-5" /> ادامه با گیت‌هاب
                </Button>
              </div>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-white/10" /></div>
                <div className="relative flex justify-center text-xs"><span className="bg-[#0b1220] px-3 text-slate-600">یا با ایمیل</span></div>
              </div>

              <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2 rounded-xl border border-white/10 bg-black/20 p-1">
                  <TabsTrigger value="login" className="min-h-10 rounded-lg text-slate-400 data-[state=active]:bg-blue-600 data-[state=active]:text-white">ورود</TabsTrigger>
                  <TabsTrigger value="signup" className="min-h-10 rounded-lg text-slate-400 data-[state=active]:bg-violet-600 data-[state=active]:text-white">ثبت‌نام</TabsTrigger>
                </TabsList>

                <TabsContent value="login" className="mt-6">
                  <form onSubmit={handleSignIn} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email-login">ایمیل</Label>
                      <Input id="email-login" type="email" dir="ltr" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pass-login">رمز عبور</Label>
                      <Input id="pass-login" type="password" dir="ltr" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} />
                    </div>
                    <Button type="submit" disabled={loading} className="min-h-12 w-full rounded-xl bg-gradient-to-l from-violet-600 to-blue-500 text-base font-black text-white hover:opacity-95">
                      {loading ? "در حال ورود..." : "ورود به حساب"}
                    </Button>
                    <Button type="button" variant="ghost" disabled={loading} onClick={handlePasswordRecovery} className="min-h-11 w-full rounded-xl text-sm font-bold text-violet-300 hover:bg-violet-500/10 hover:text-violet-200">
                      رمز عبورم را فراموش کرده‌ام
                    </Button>
                    <Button type="button" variant="ghost" disabled={loading} onClick={handleResendConfirmation} className="min-h-11 w-full rounded-xl text-sm font-bold text-blue-300 hover:bg-blue-500/10 hover:text-blue-200">
                      ارسال دوباره ایمیل تأیید
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="signup" className="mt-6">
                  <form onSubmit={handleSignUp} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email-signup">ایمیل</Label>
                      <Input id="email-signup" type="email" dir="ltr" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pass-signup">رمز عبور، حداقل ۶ کاراکتر</Label>
                      <Input id="pass-signup" type="password" dir="ltr" autoComplete="new-password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} />
                    </div>
                    <Button type="submit" disabled={loading} className="min-h-12 w-full rounded-xl bg-gradient-to-l from-violet-600 to-blue-500 text-base font-black text-white hover:opacity-95">
                      {loading ? "در حال ساخت حساب..." : "ساخت حساب رایگان"}
                    </Button>
                    {pendingEmail ? (
                      <Button type="button" variant="outline" disabled={loading} onClick={handleResendConfirmation} className="min-h-11 w-full rounded-xl border-white/10 bg-white/[0.03] text-sm font-bold text-blue-200 hover:bg-white/[0.06]">
                        ارسال دوباره ایمیل تأیید
                      </Button>
                    ) : null}
                  </form>
                </TabsContent>
              </Tabs>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
