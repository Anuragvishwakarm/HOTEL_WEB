"use client";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { User, Phone, Mail, MapPin, Globe, Hash } from "lucide-react";
import { useMe, useGuestProfile, useUpdateProfile, useUpdateGuestProfile } from "@/hooks/useApi";
import Button from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { INDIAN_STATES } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";

const ID_TYPES = ["aadhaar","passport","pan","voter_id","driving_license"];

export default function ProfilePage() {
  const { user, isAuthenticated } = useAuthStore();
  const { data: profile, isLoading } = useGuestProfile();
  const updateUser    = useUpdateProfile();
  const updateGuest   = useUpdateGuestProfile();

  const userForm  = useForm({ defaultValues: { full_name:"", email:"", preferred_language:"en" }});
  const guestForm = useForm({ defaultValues: { nationality:"Indian", city:"", state:"", id_type:"aadhaar", id_number:"" }});

  useEffect(() => { if (user) userForm.reset({ full_name: user.full_name, email: user.email||"", preferred_language: user.preferred_language }); }, [user]);
  useEffect(() => { if (profile) guestForm.reset({ nationality: profile.nationality, city: profile.city||"", state: profile.state||"", id_type: profile.id_type||"aadhaar", id_number:"" }); }, [profile]);

  if (!isAuthenticated) return <div className="page-container py-20 text-center text-surface-400">Please log in to view your profile.</div>;

  return (
    <div className="page-container py-8 max-w-3xl mx-auto">
      <h1 className="font-display text-2xl font-bold text-navy-900 mb-8">My Profile</h1>

      {isLoading ? (
        <div className="grid grid-cols-3 gap-4 mb-8">{[1,2,3].map(i=><Skeleton key={i} className="h-24 rounded-2xl" />)}</div>
      ) : profile && (
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label:"Loyalty Points", value: profile.loyalty_points, icon:"⭐" },
            { label:"Total Stays",    value: profile.total_stays,    icon:"🏨" },
            { label:"Member Since",   value: profile.is_vip ? "VIP ✦" : "Member", icon:"🌟" },
          ].map(({ label, value, icon }) => (
            <div key={label} className="card p-4 text-center">
              <p className="text-2xl mb-2">{icon}</p>
              <p className="font-display font-bold text-xl text-navy-900">{value}</p>
              <p className="text-xs text-surface-400 mt-1">{label}</p>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={userForm.handleSubmit(data => updateUser.mutate(data))} className="card p-6 mb-6">
        <h2 className="font-display font-semibold text-navy-900 mb-5 flex items-center gap-2">
          <User className="w-4 h-4" /> Account Information
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
          <div>
            <label className="text-sm font-medium text-navy-900 block mb-1.5">Full Name</label>
            <input className="input" {...userForm.register("full_name")} placeholder="Your full name" />
          </div>
          <div>
            <label className="text-sm font-medium text-navy-900 block mb-1.5">Phone (read-only)</label>
            <input className="input bg-surface-50" value={user?.phone || ""} disabled />
          </div>
          <div>
            <label className="text-sm font-medium text-navy-900 block mb-1.5">Email</label>
            <input className="input" type="email" {...userForm.register("email")} placeholder="your@email.com" />
          </div>
          <div>
            <label className="text-sm font-medium text-navy-900 block mb-1.5">Language</label>
            <select className="input" {...userForm.register("preferred_language")}>
              <option value="en">English</option>
              <option value="hi">हिंदी (Hindi)</option>
            </select>
          </div>
        </div>
        <Button type="submit" loading={updateUser.isPending}>Save Account</Button>
      </form>

      <form onSubmit={guestForm.handleSubmit(data => updateGuest.mutate(data))} className="card p-6">
        <h2 className="font-display font-semibold text-navy-900 mb-5 flex items-center gap-2">
          <MapPin className="w-4 h-4" /> Travel Profile & ID Document
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
          <div><label className="text-sm font-medium text-navy-900 block mb-1.5">Nationality</label><input className="input" {...guestForm.register("nationality")} /></div>
          <div><label className="text-sm font-medium text-navy-900 block mb-1.5">City</label><input className="input" {...guestForm.register("city")} placeholder="Your city" /></div>
          <div><label className="text-sm font-medium text-navy-900 block mb-1.5">State</label>
            <select className="input" {...guestForm.register("state")}><option value="">Select state</option>{INDIAN_STATES.map(s=><option key={s} value={s}>{s}</option>)}</select>
          </div>
          <div><label className="text-sm font-medium text-navy-900 block mb-1.5">ID Type</label>
            <select className="input capitalize" {...guestForm.register("id_type")}>{ID_TYPES.map(t=><option key={t} value={t}>{t.replace(/_/g," ")}</option>)}</select>
          </div>
          <div className="sm:col-span-2"><label className="text-sm font-medium text-navy-900 block mb-1.5">ID Number</label>
            <input className="input" {...guestForm.register("id_number")} placeholder="e.g. 1234-5678-9012 (Aadhaar)" />
            <p className="text-xs text-surface-400 mt-1.5">Required for hotel check-in in India. Stored securely.</p>
          </div>
        </div>
        <Button type="submit" loading={updateGuest.isPending}>Save Profile</Button>
      </form>
    </div>
  );
}
