"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { User, Phone, Lock, Mail, Eye, EyeOff, Check } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import toast from "react-hot-toast";

const schema = z.object({
  full_name:          z.string().min(2, "Name must be at least 2 characters"),
  phone:              z.string().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number"),
  email:              z.string().email("Invalid email").or(z.literal("")),
  password:           z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword:    z.string(),
  preferred_language: z.enum(["en","hi"]),
}).refine(d => d.password === d.confirmPassword, { message: "Passwords do not match", path: ["confirmPassword"] });

type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const router = useRouter();
  const { register: registerUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [showPw,  setShowPw]  = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { preferred_language: "en" },
  });

  const password = watch("password", "");
  const pwStrength = password.length === 0 ? 0
    : password.length < 6 ? 1
    : password.length < 8 ? 2
    : /[A-Z]/.test(password) && /[0-9]/.test(password) ? 4 : 3;
  const pwLabels = ["", "Weak", "Fair", "Good", "Strong"];
  const pwColors = ["", "bg-red-400", "bg-amber-400", "bg-blue-400", "bg-emerald-500"];

  async function onSubmit(data: FormData) {
    setLoading(true);
    try {
      await registerUser({
        full_name: data.full_name,
        phone:     data.phone,
        email:     data.email || undefined,
        password:  data.password,
        preferred_language: data.preferred_language,
      });
      toast.success("Account created! Welcome to HotelBook.");
      router.push("/");
    } catch (e: any) {
      toast.error(e?.response?.data?.detail ?? "Registration failed. Please try again.");
    } finally { setLoading(false); }
  }

  const Field = ({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) => (
    <div>
      <label className="block text-sm font-semibold text-navy-900 mb-1.5">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );

  const inputClass = (hasError?: boolean) =>
    `w-full border rounded-lg pl-9 pr-4 py-3 text-sm text-navy-900 focus:outline-none focus:ring-1 transition-colors ${
      hasError ? "border-red-400 focus:border-red-400 focus:ring-red-100" : "border-surface-200 focus:border-[#0071c2] focus:ring-[#0071c2]"
    }`;

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

      <div className="flex-1 flex items-start justify-center py-10 px-4">
        <div className="w-full max-w-[440px]">
          <div className="bg-white rounded-2xl border border-surface-200 shadow-md">
            <div className="px-8 pt-8 pb-5 border-b border-surface-100">
              <h1 className="text-2xl font-bold text-navy-900 mb-1">Create your account</h1>
              <p className="text-sm text-surface-400">Book hotels faster and manage your trips in one place</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="px-8 py-6 space-y-4">
              {/* Full name */}
              <Field label="Full name" error={errors.full_name?.message}>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                  <input type="text" className={inputClass(!!errors.full_name)}
                    placeholder="Enter your full name" {...register("full_name")} />
                </div>
              </Field>

              {/* Phone */}
              <Field label="Phone number" error={errors.phone?.message}>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                    <Phone className="w-4 h-4 text-surface-400" />
                    <span className="text-sm text-navy-900 font-medium border-r border-surface-200 pr-2">+91</span>
                  </div>
                  <input type="tel" className={`w-full border rounded-lg pl-16 pr-4 py-3 text-sm text-navy-900 focus:outline-none focus:ring-1 ${errors.phone ? "border-red-400 focus:border-red-400 focus:ring-red-100" : "border-surface-200 focus:border-[#0071c2] focus:ring-[#0071c2]"}`}
                    placeholder="10-digit mobile number" {...register("phone")} maxLength={10} />
                </div>
              </Field>

              {/* Email */}
              <Field label="Email address (optional)" error={errors.email?.message}>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                  <input type="email" className={inputClass(!!errors.email)}
                    placeholder="your@email.com" {...register("email")} />
                </div>
              </Field>

              {/* Password */}
              <Field label="Password" error={errors.password?.message}>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                  <input type={showPw ? "text" : "password"} className={`${inputClass(!!errors.password)} pr-10`}
                    placeholder="Min. 8 characters" {...register("password")} />
                  <button type="button" onClick={() => setShowPw(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-navy-900">
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {/* Strength indicator */}
                {password.length > 0 && (
                  <div className="mt-2 flex gap-1 items-center">
                    {[1,2,3,4].map(i => (
                      <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= pwStrength ? pwColors[pwStrength] : "bg-surface-100"}`} />
                    ))}
                    <span className={`text-xs ml-1 font-medium ${pwStrength >= 3 ? "text-emerald-600" : pwStrength === 2 ? "text-amber-600" : "text-red-500"}`}>
                      {pwLabels[pwStrength]}
                    </span>
                  </div>
                )}
              </Field>

              {/* Confirm password */}
              <Field label="Confirm password" error={errors.confirmPassword?.message}>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                  <input type="password" className={inputClass(!!errors.confirmPassword)}
                    placeholder="Re-enter your password" {...register("confirmPassword")} />
                </div>
              </Field>

              {/* Language */}
              <Field label="Preferred language">
                <div className="flex gap-2">
                  {[{ value:"en", label:"🇬🇧 English" }, { value:"hi", label:"🇮🇳 हिंदी" }].map(({ value, label }) => {
                    const current = watch("preferred_language");
                    return (
                      <label key={value}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border-2 cursor-pointer text-sm font-medium transition-colors ${
                          current === value ? "border-[#0071c2] bg-blue-50 text-[#0071c2]" : "border-surface-200 text-surface-400 hover:border-surface-300"
                        }`}
                      >
                        <input type="radio" value={value} {...register("preferred_language")} className="hidden" />
                        {current === value && <Check className="w-3.5 h-3.5" />}
                        {label}
                      </label>
                    );
                  })}
                </div>
              </Field>

              {/* Terms */}
              <p className="text-xs text-surface-400 leading-relaxed">
                By creating an account you agree to HotelBook's{" "}
                <Link href="#" className="text-[#0071c2] hover:underline">Terms of Service</Link>
                {" "}and{" "}
                <Link href="#" className="text-[#0071c2] hover:underline">Privacy Policy</Link>.
              </p>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#0071c2] hover:bg-[#005999] text-white font-bold py-3.5 rounded-lg text-sm transition-colors disabled:opacity-60"
              >
                {loading ? "Creating account…" : "Create account"}
              </button>

              <p className="text-center text-sm text-surface-400">
                Already have an account?{" "}
                <Link href="/auth/login" className="text-[#0071c2] font-semibold hover:underline">Sign in</Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}