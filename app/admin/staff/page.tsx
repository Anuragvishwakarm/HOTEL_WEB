"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { UserPlus, Phone, Mail, Shield } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import Table from "@/components/ui/Table";
import PageHeader from "@/components/ui/PageHeader";
import Badge from "@/components/ui/Badge";
import { api } from "@/lib/api";
import toast from "react-hot-toast";

const HOTEL_ID = 1;

const STAFF_ROLES = [
  { value: "front_desk",   label: "Front Desk" },
  { value: "housekeeping", label: "Housekeeping" },
  { value: "manager",      label: "Manager" },
  { value: "accountant",   label: "Accountant" },
  { value: "security",     label: "Security" },
];

const SHIFTS = [
  { value: "morning", label: "Morning (6am–2pm)" },
  { value: "evening", label: "Evening (2pm–10pm)" },
  { value: "night",   label: "Night (10pm–6am)" },
];

const ROLE_BADGE: Record<string, "success" | "info" | "warning" | "navy" | "default"> = {
  front_desk:   "info",
  housekeeping: "success",
  manager:      "navy",
  accountant:   "warning",
  security:     "default",
};

export default function StaffPage() {
  const qc = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);

  const { data: staffList = [], isLoading } = useQuery<any[]>({
    queryKey: ["staff", HOTEL_ID],
    queryFn:  () => api.get(`/hotels/${HOTEL_ID}/staff`).then(r => r.data).catch(() => []),
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<{
    full_name: string; phone: string; email: string;
    password: string; staff_role: string; shift: string; employee_id: string;
  }>();

  const createStaffMutation = useMutation({
    mutationFn: async (formData: any) => {
      // Step 1: Create user with staff role
      const { data: user } = await api.post("/auth/register", {
        full_name: formData.full_name,
        phone:     formData.phone,
        email:     formData.email || undefined,
        password:  formData.password,
        role:      "staff",
        preferred_language: "en",
      });
      // Step 2: Create staff profile
      return api.post(`/hotels/${HOTEL_ID}/staff`, {
        user_id:     user.user?.id ?? null,
        hotel_id:    HOTEL_ID,
        staff_role:  formData.staff_role,
        shift:       formData.shift,
        employee_id: formData.employee_id || null,
      });
    },
    onSuccess: () => {
      toast.success("Staff member added.");
      qc.invalidateQueries({ queryKey: ["staff", HOTEL_ID] });
      setShowAddModal(false);
      reset();
    },
    onError: (e: any) => toast.error(e?.response?.data?.detail ?? "Failed to add staff"),
  });

  const columns = [
    { key: "user", header: "Name", render: (r: any) => (
      <div>
        <p className="font-semibold text-navy-900">{r.user?.full_name ?? "—"}</p>
        <p className="text-xs text-surface-400 flex items-center gap-1">
          <Phone className="w-3 h-3" /> {r.user?.phone}
        </p>
      </div>
    )},
    { key: "staff_role", header: "Role", render: (r: any) => (
      <Badge variant={ROLE_BADGE[r.staff_role] ?? "default"} className="capitalize">
        {r.staff_role?.replace(/_/g, " ")}
      </Badge>
    )},
    { key: "employee_id", header: "Employee ID", render: (r: any) => (
      <span className="font-mono text-sm">{r.employee_id ?? "—"}</span>
    )},
    { key: "shift", header: "Shift", render: (r: any) => (
      <span className="capitalize text-sm">{r.shift ?? "—"}</span>
    )},
    { key: "is_on_duty", header: "Status", render: (r: any) => (
      <Badge variant={r.is_on_duty ? "success" : "default"}>
        {r.is_on_duty ? "On Duty" : "Off Duty"}
      </Badge>
    )},
  ];

  return (
    <div>
      <PageHeader
        title="Staff Management"
        subtitle={`${staffList.length} staff members`}
        breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Staff" }]}
        actions={
          <Button onClick={() => setShowAddModal(true)} className="gap-2">
            <UserPlus className="w-4 h-4" /> Add Staff
          </Button>
        }
      />

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="card p-4 animate-pulse">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-surface-200" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-surface-200 rounded w-40" />
                  <div className="h-3 bg-surface-100 rounded w-28" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : staffList.length === 0 ? (
        <div className="card p-16 text-center">
          <Shield className="w-12 h-12 text-surface-300 mx-auto mb-4" />
          <h3 className="font-display font-semibold text-navy-900 text-xl mb-2">No staff added yet</h3>
          <p className="text-surface-400 mb-6">Add your first staff member to manage hotel operations.</p>
          <Button onClick={() => setShowAddModal(true)} className="gap-2 mx-auto">
            <UserPlus className="w-4 h-4" /> Add First Staff Member
          </Button>
        </div>
      ) : (
        <Table data={staffList} columns={columns} keyExtractor={(r: any) => r.id} />
      )}

      {/* Add Staff Modal */}
      <Modal open={showAddModal} onClose={() => setShowAddModal(false)} title="Add Staff Member" size="md">
        <form onSubmit={handleSubmit(d => createStaffMutation.mutate(d))} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Full Name *"
              placeholder="Priya Sharma"
              error={errors.full_name?.message}
              {...register("full_name", { required: "Name is required" })}
            />
            <Input
              label="Phone *"
              type="tel"
              placeholder="9876543210"
              error={errors.phone?.message}
              {...register("phone", { required: "Phone is required", minLength: { value: 10, message: "10 digits required" } })}
            />
            <Input
              label="Email (optional)"
              type="email"
              placeholder="staff@hotel.com"
              {...register("email")}
            />
            <Input
              label="Password *"
              type="password"
              placeholder="min 8 characters"
              error={errors.password?.message}
              {...register("password", { required: "Password required", minLength: { value: 8, message: "Min 8 chars" } })}
            />
            <div>
              <label className="text-sm font-medium text-navy-900 block mb-1.5">Role *</label>
              <select className="input" {...register("staff_role", { required: true })}>
                {STAFF_ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-navy-900 block mb-1.5">Shift</label>
              <select className="input" {...register("shift")}>
                <option value="">Select shift</option>
                {SHIFTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <Input
              label="Employee ID"
              placeholder="EMP001"
              {...register("employee_id")}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" fullWidth onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button type="submit" fullWidth loading={createStaffMutation.isPending}>
              Add Staff Member
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
