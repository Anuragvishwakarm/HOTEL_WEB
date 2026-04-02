"use client";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import {
  Building2, Clock, Phone, Mail, MapPin,
  FileText, Save, RefreshCw,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import PageHeader from "@/components/ui/PageHeader";
import { hotelsApi } from "@/lib/api";
import { INDIAN_STATES } from "@/lib/utils";
import type { Hotel } from "@/lib/types";
import toast from "react-hot-toast";

const HOTEL_ID = 1;

const AMENITY_OPTIONS = [
  "WiFi", "Swimming Pool", "Gym", "Spa", "Restaurant", "Bar",
  "Parking", "24hr Room Service", "Laundry", "Conference Room",
  "Business Centre", "Kids Club", "Pet Friendly", "Airport Shuttle",
  "EV Charging", "Rooftop",
];

export default function SettingsPage() {
  const qc = useQueryClient();
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);

  const { data: hotel, isLoading } = useQuery<Hotel>({
    queryKey: ["hotel", HOTEL_ID],
    queryFn:  () => hotelsApi.get(HOTEL_ID).then(r => r.data),
  });

  const updateMutation = useMutation({
    mutationFn: (data: object) => hotelsApi.update(HOTEL_ID, data).then(r => r.data),
    onSuccess: () => {
      toast.success("Hotel settings saved.");
      qc.invalidateQueries({ queryKey: ["hotel", HOTEL_ID] });
    },
    onError: () => toast.error("Failed to save settings."),
  });

  const { register, handleSubmit, reset, formState: { isDirty } } = useForm<Partial<Hotel>>();

  useEffect(() => {
    if (hotel) {
      reset({
        name:           hotel.name,
        description:    hotel.description ?? "",
        star_rating:    hotel.star_rating,
        address:        hotel.address,
        city:           hotel.city,
        state:          hotel.state,
        pincode:        hotel.pincode,
        phone:          hotel.phone,
        email:          hotel.email ?? "",
        check_in_time:  hotel.check_in_time,
        check_out_time: hotel.check_out_time,
        gst_number:     hotel.gst_number ?? "",
        pan_number:     hotel.pan_number ?? "",
      });
      setSelectedAmenities(hotel.amenities ?? []);
    }
  }, [hotel, reset]);

  function toggleAmenity(a: string) {
    setSelectedAmenities(prev =>
      prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a]
    );
  }

  function onSubmit(data: Partial<Hotel>) {
    updateMutation.mutate({ ...data, amenities: selectedAmenities });
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="card p-6 animate-pulse">
            <div className="h-5 bg-surface-200 rounded w-48 mb-4" />
            <div className="grid grid-cols-2 gap-4">
              <div className="h-10 bg-surface-100 rounded" />
              <div className="h-10 bg-surface-100 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <PageHeader
        title="Hotel Settings"
        subtitle={`Managing: ${hotel?.name ?? ""}`}
        breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Settings" }]}
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Info */}
        <div className="card p-6">
          <h2 className="font-display font-semibold text-navy-900 mb-5 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-navy-600" /> Basic Information
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Input label="Hotel Name" {...register("name")} placeholder="Grand Palace Hotel" />
            </div>
            <div className="sm:col-span-2">
              <label className="text-sm font-medium text-navy-900 block mb-1.5">Description</label>
              <textarea
                className="input min-h-[90px] resize-none"
                placeholder="Brief description of the hotel…"
                {...register("description")}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-navy-900 block mb-1.5">Star Rating</label>
              <select className="input" {...register("star_rating", { valueAsNumber: true })}>
                {[1, 2, 3, 4, 5].map(n => (
                  <option key={n} value={n}>{n} Star{n > 1 ? "s" : ""}</option>
                ))}
              </select>
            </div>
            <div>
              <Input label="GST Number" {...register("gst_number")} placeholder="07AABCU9603R1ZX" />
            </div>
            <div>
              <Input label="PAN Number" {...register("pan_number")} placeholder="AABCU9603R" />
            </div>
          </div>
        </div>

        {/* Contact */}
        <div className="card p-6">
          <h2 className="font-display font-semibold text-navy-900 mb-5 flex items-center gap-2">
            <Phone className="w-4 h-4 text-navy-600" /> Contact & Location
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Phone Number" {...register("phone")} placeholder="01123456789" leftIcon={<Phone className="w-4 h-4" />} />
            <Input label="Email" type="email" {...register("email")} placeholder="info@hotel.com" leftIcon={<Mail className="w-4 h-4" />} />
            <div className="sm:col-span-2">
              <Input label="Address" {...register("address")} placeholder="Street address" leftIcon={<MapPin className="w-4 h-4" />} />
            </div>
            <Input label="City" {...register("city")} placeholder="New Delhi" />
            <div>
              <label className="text-sm font-medium text-navy-900 block mb-1.5">State</label>
              <select className="input" {...register("state")}>
                <option value="">Select state</option>
                {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <Input label="Pincode" {...register("pincode")} placeholder="110001" maxLength={6} />
          </div>
        </div>

        {/* Timings */}
        <div className="card p-6">
          <h2 className="font-display font-semibold text-navy-900 mb-5 flex items-center gap-2">
            <Clock className="w-4 h-4 text-navy-600" /> Check-in / Check-out Timings
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-navy-900 block mb-1.5">Check-in From</label>
              <input type="time" className="input" {...register("check_in_time")} />
            </div>
            <div>
              <label className="text-sm font-medium text-navy-900 block mb-1.5">Check-out By</label>
              <input type="time" className="input" {...register("check_out_time")} />
            </div>
          </div>
        </div>

        {/* Amenities */}
        <div className="card p-6">
          <h2 className="font-display font-semibold text-navy-900 mb-5">Hotel Amenities</h2>
          <div className="flex flex-wrap gap-2">
            {AMENITY_OPTIONS.map(a => (
              <button
                key={a}
                type="button"
                onClick={() => toggleAmenity(a)}
                className={`px-3 py-2 rounded-xl border text-sm font-medium transition-all ${
                  selectedAmenities.includes(a)
                    ? "bg-navy-900 text-white border-navy-900"
                    : "bg-white text-surface-400 border-surface-200 hover:border-navy-300 hover:text-navy-900"
                }`}
              >
                {selectedAmenities.includes(a) ? "✓ " : ""}{a}
              </button>
            ))}
          </div>
          <p className="text-xs text-surface-400 mt-3">
            {selectedAmenities.length} amenities selected
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pb-8">
          <Button
            type="submit"
            loading={updateMutation.isPending}
            disabled={!isDirty && selectedAmenities.join() === (hotel?.amenities ?? []).join()}
            className="gap-2"
          >
            <Save className="w-4 h-4" /> Save Settings
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              reset();
              setSelectedAmenities(hotel?.amenities ?? []);
            }}
            className="gap-2"
          >
            <RefreshCw className="w-4 h-4" /> Reset
          </Button>
        </div>
      </form>
    </div>
  );
}
