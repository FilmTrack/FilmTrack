"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Code2, Globe } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { trackProductEvent } from "@/lib/product-events";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AuthPage() {
  const supabase = createClient();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert(error.message);
    else {
      router.push("/dashboard");
      router.refresh();
    }
    setLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    void trackProductEvent("signup_started", { method: "email" });

    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      alert(error.message);
      setLoading(false);
      return;
    }

    void trackProductEvent("signup_completed", { method: "email" });

    if (data.session) {
      router.push("/onboarding");
      router.refresh();
    } else {
      alert("ثبت‌نام انجام شد. پس از تأیید ایمیل، وارد حساب شوید تا راه‌اندازی اولیه را کامل کنید.");
      router.push("/auth");
    }
    setLoading(false);
  };

  const handleOAuthLogin = async (provider: "google" | "github") => {
    void trackProductEvent("signup_started", { method: provider });
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/onboarding` },
    });
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0e0e0e] p-4 text-white">
      <div className="w-full max-w-md space-y-6 rounded-2xl border border-gray-700 bg-[#161616] p-8 shadow-2xl">
        <div className="text-center">
          <div className="mb-4 inline-block">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg">
              <span className="text-2xl font-extrabold text-white">FT</span>
            </div>
          </div>
          <h1 className="text-3xl font-extrabold text-white">به FilmTrack خوش آمدید</h1>
          <p className="mt-2 text-sm text-gray-400">بعد از ثبت‌نام، با سه عنوان اولین لیست شخصی‌ات را می‌سازیم.</p>
        </div>

        <div className="space-y-3">
          <Button onClick={() => handleOAuthLogin("google")} variant="outline" className="w-full border-gray-300 bg-white py-6 text-black hover:bg-gray-200">
            <Globe className="ml-2 h-5 w-5" /> ورود با گوگل
          </Button>
          <Button onClick={() => handleOAuthLogin("github")} variant="outline" className="w-full border-gray-700 bg-[#161616] py-6 text-white hover:bg-[#222]">
            <Code2 className="ml-2 h-5 w-5" /> ورود با گیت‌هاب
          </Button>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-gray-700" /></div>
          <div className="relative flex justify-center text-xs uppercase"><span className="bg-[#161616] px-2 text-gray-400">یا</span></div>
        </div>

        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2 rounded-lg border border-gray-700 bg-[#0e0e0e]">
            <TabsTrigger value="login" className="rounded-md text-gray-400 data-[state=active]:bg-blue-600 data-[state=active]:text-white">ورود</TabsTrigger>
            <TabsTrigger value="signup" className="rounded-md text-gray-400 data-[state=active]:bg-blue-600 data-[state=active]:text-white">ثبت‌نام</TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="mt-6">
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email-login">ایمیل</Label>
                <Input id="email-login" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="border-gray-600 bg-[#0e0e0e] focus-visible:ring-blue-600" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pass-login">رمز عبور</Label>
                <Input id="pass-login" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="border-gray-600 bg-[#0e0e0e] focus-visible:ring-blue-600" />
              </div>
              <Button type="submit" disabled={loading} className="w-full bg-blue-600 py-6 text-lg hover:bg-blue-700">ورود</Button>
            </form>
          </TabsContent>

          <TabsContent value="signup" className="mt-6">
            <form onSubmit={handleSignUp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email-signup">ایمیل</Label>
                <Input id="email-signup" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="border-gray-600 bg-[#0e0e0e] focus-visible:ring-blue-600" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pass-signup">رمز عبور (حداقل ۶ کاراکتر)</Label>
                <Input id="pass-signup" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="border-gray-600 bg-[#0e0e0e] focus-visible:ring-blue-600" />
              </div>
              <Button type="submit" disabled={loading} className="w-full bg-blue-600 py-6 text-lg hover:bg-blue-700">ثبت‌نام رایگان</Button>
            </form>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
