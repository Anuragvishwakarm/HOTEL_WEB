"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Phone, Lock, Eye, EyeOff, MessageSquare } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { authApi } from "@/lib/api";
import toast from "react-hot-toast";

export default function LoginPage() {
  const router   = useRouter();
  const params   = useSearchParams();
  const redirect = params.get("redirect") || "/";
  const { login, loginOTP } = useAuthStore();

  const [mode,     setMode]     = useState<"password"|"otp">("password");
  const [phone,    setPhone]    = useState("");
  const [password, setPassword] = useState("");
  const [showPw,   setShowPw]   = useState(false);
  const [otp,      setOtp]      = useState("");
  const [otpSent,  setOtpSent]  = useState(false);
  const [loading,  setLoading]  = useState(false);

  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault();
    if (phone.length < 10) { toast.error("Enter a valid 10-digit phone number"); return; }
    if (!password)          { toast.error("Password is required"); return; }
    setLoading(true);
    try {
      await login(phone, password);
      toast.success("Welcome back!");
      router.push(redirect);
    } catch { toast.error("Invalid phone or password"); }
    finally { setLoading(false); }
  }

  async function handleSendOTP() {
    if (phone.length < 10) { toast.error("Enter a valid 10-digit phone number"); return; }
    setLoading(true);
    try {
      await authApi.sendOTP(phone);
      setOtpSent(true);
      toast.success(`OTP sent to +91 ${phone}`);
    } catch { toast.error("Could not send OTP. Try again."); }
    finally { setLoading(false); }
  }

  async function handleVerifyOTP(e: React.FormEvent) {
    e.preventDefault();
    if (otp.length < 6) { toast.error("Enter the 6-digit OTP"); return; }
    setLoading(true);
    try {
      await loginOTP(phone, otp);
      toast.success("Logged in successfully!");
      router.push(redirect);
    } catch { toast.error("Invalid or expired OTP"); }
    finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen bg-[#f2f6fa] flex flex-col">
      {/* Top bar */}
      <div className="bg-[#003580] h-14 flex items-center px-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 bg-white rounded-lg flex items-center justify-center">
            <span className="text-[#003580] text-xs font-black">H</span>
          </div>
          <span className="font-bold text-white text-base">HotelBook</span>
        </Link>
      </div>

      {/* Form */}
      <div className="flex-1 flex items-start justify-center py-12 px-4">
        <div className="w-full max-w-[400px]">
          <div className="bg-white rounded-2xl border border-surface-200 shadow-md overflow-hidden">
            {/* Header */}
            <div className="px-8 pt-8 pb-6">
              <h1 className="text-2xl font-bold text-navy-900 mb-1">Sign in</h1>
              <p className="text-sm text-surface-400">Get the best hotel deals when you sign in</p>
            </div>

            {/* Mode tabs */}
            <div className="flex border-b border-surface-100 px-8">
              {[
                { key: "password", label: "Password" },
                { key: "otp",      label: "One-time password" },
              ].map(t => (
                <button
                  key={t.key}
                  onClick={() => { setMode(t.key as "password"|"otp"); setOtpSent(false); setOtp(""); }}
                  className={`pb-3 mr-6 text-sm font-semibold border-b-2 transition-colors ${
                    mode === t.key
                      ? "border-[#0071c2] text-[#0071c2]"
                      : "border-transparent text-surface-400 hover:text-navy-900"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="px-8 py-6">
              {mode === "password" ? (
                <form onSubmit={handlePasswordLogin} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-navy-900 mb-1.5">
                      Phone number
                    </label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-surface-400">
                        <Phone className="w-4 h-4" />
                        <span className="text-sm text-navy-900 font-medium border-r border-surface-200 pr-2">+91</span>
                      </div>
                      <input
                        type="tel"
                        className="w-full border border-surface-200 rounded-lg pl-16 pr-4 py-3 text-sm text-navy-900 focus:outline-none focus:border-[#0071c2] focus:ring-1 focus:ring-[#0071c2]"
                        placeholder="10-digit mobile number"
                        value={phone}
                        onChange={e => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                        maxLength={10}
                        autoFocus
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-sm font-semibold text-navy-900">Password</label>
                      <button type="button" className="text-xs text-[#0071c2] hover:underline">
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                      <input
                        type={showPw ? "text" : "password"}
                        className="w-full border border-surface-200 rounded-lg pl-9 pr-10 py-3 text-sm text-navy-900 focus:outline-none focus:border-[#0071c2] focus:ring-1 focus:ring-[#0071c2]"
                        placeholder="Enter your password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                      />
                      <button type="button" onClick={() => setShowPw(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-navy-900">
                        {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#0071c2] hover:bg-[#005999] text-white font-bold py-3 rounded-lg text-sm transition-colors disabled:opacity-60"
                  >
                    {loading ? "Signing in…" : "Sign in"}
                  </button>
                </form>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-navy-900 mb-1.5">Phone number</label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-surface-400">
                        <Phone className="w-4 h-4" />
                        <span className="text-sm text-navy-900 font-medium border-r border-surface-200 pr-2">+91</span>
                      </div>
                      <input
                        type="tel"
                        className="w-full border border-surface-200 rounded-lg pl-16 pr-4 py-3 text-sm text-navy-900 focus:outline-none focus:border-[#0071c2] focus:ring-1 focus:ring-[#0071c2]"
                        placeholder="10-digit mobile number"
                        value={phone}
                        onChange={e => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                        disabled={otpSent}
                      />
                    </div>
                  </div>

                  {!otpSent ? (
                    <button
                      type="button"
                      onClick={handleSendOTP}
                      disabled={loading}
                      className="w-full bg-[#0071c2] hover:bg-[#005999] text-white font-bold py-3 rounded-lg text-sm transition-colors disabled:opacity-60"
                    >
                      {loading ? "Sending…" : "Send OTP"}
                    </button>
                  ) : (
                    <form onSubmit={handleVerifyOTP} className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-navy-900 mb-1.5">
                          Enter OTP sent to +91 {phone}
                        </label>
                        <div className="relative">
                          <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                          <input
                            type="tel"
                            className="w-full border border-surface-200 rounded-lg pl-9 pr-4 py-3 text-sm text-navy-900 focus:outline-none focus:border-[#0071c2] focus:ring-1 focus:ring-[#0071c2] tracking-widest font-mono text-center text-lg"
                            placeholder="• • • • • •"
                            value={otp}
                            onChange={e => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                            maxLength={6}
                            autoFocus
                          />
                        </div>
                        <button type="button" onClick={() => { setOtpSent(false); setOtp(""); }}
                          className="mt-1 text-xs text-[#0071c2] hover:underline">
                          Change number or resend OTP
                        </button>
                      </div>
                      <button
                        type="submit"
                        disabled={loading || otp.length < 6}
                        className="w-full bg-[#0071c2] hover:bg-[#005999] text-white font-bold py-3 rounded-lg text-sm transition-colors disabled:opacity-60"
                      >
                        {loading ? "Verifying…" : "Verify & Sign in"}
                      </button>
                    </form>
                  )}
                </div>
              )}

              {/* Divider */}
              <div className="flex items-center gap-3 my-5">
                <hr className="flex-1 border-surface-100" />
                <span className="text-xs text-surface-400">or</span>
                <hr className="flex-1 border-surface-100" />
              </div>

              <p className="text-center text-sm text-surface-400">
                Don't have an account?{" "}
                <Link href="/auth/register" className="text-[#0071c2] font-semibold hover:underline">
                  Create account
                </Link>
              </p>
            </div>
          </div>

          {/* Demo credentials */}
          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-xl p-4 text-xs">
            <p className="font-semibold text-[#003580] mb-2">Demo credentials:</p>
            {[
              ["Guest",       "9876543210", "Guest@1234"],
              ["Hotel Admin", "9000000002", "Admin@1234"],
              ["Staff",       "9000000003", "Staff@1234"],
            ].map(([role, phone, pw]) => (
              <div key={role} className="flex justify-between text-surface-400 mb-1">
                <span className="font-medium text-navy-900">{role}</span>
                <span className="font-mono">{phone} / {pw}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}