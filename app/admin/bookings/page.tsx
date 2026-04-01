"use client";
import { useState } from "react";
import { format } from "date-fns";
import {
  CheckCircle, XCircle, LogIn, LogOut,
  Search, Filter, Download, Eye, Plus,
} from "lucide-react";
import Table from "@/components/ui/Table";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Modal from "@/components/ui/Modal";
import PageHeader from "@/components/ui/PageHeader";
import { useAllBookings, useBooking, useFolio, useCheckin, useCheckout, useCancelBooking, useAddFolioCharge, useRecordCashPayment } from "@/hooks/useBookings";
import { formatCurrency, formatDate, getStatusColor, mealPlanLabel } from "@/lib/utils";
import type { Booking } from "@/lib/types";
import toast from "react-hot-toast";

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "pending",     label: "Pending" },
  { value: "confirmed",   label: "Confirmed" },
  { value: "checked_in",  label: "Checked In" },
  { value: "checked_out", label: "Checked Out" },
  { value: "cancelled",   label: "Cancelled" },
];

const HOTEL_ID = 1; // In production load from auth context

export default function BookingsPage() {
  const [search, setSearch]       = useState("");
  const [status, setStatus]       = useState("");
  const [page, setPage]           = useState(1);
  const [selected, setSelected]   = useState<Booking | null>(null);
  const [activeModal, setModal]   = useState<"detail" | "checkin" | "checkout" | "folio" | "charge" | "payment" | null>(null);

  const { data: bookings, isLoading } = useAllBookings({
    hotel_id: HOTEL_ID,
    booking_status: status || undefined,
    search:    search || undefined,
    page,
    size: 20,
  });

  const { data: selectedBooking } = useBooking(selected?.id ?? null);
  const { data: folio }           = useFolio(activeModal === "folio" || activeModal === "payment" ? selected?.id ?? null : null);

  const checkin  = useCheckin();
  const checkout = useCheckout();
  const cancel   = useCancelBooking();
  const addCharge= useAddFolioCharge();
  const cashPay  = useRecordCashPayment();

  // Charge form state
  const [chargeDesc, setChargeDesc]  = useState("");
  const [chargeCat,  setChargeCat]   = useState("others");
  const [chargeQty,  setChargeQty]   = useState("1");
  const [chargeRate, setChargeRate]  = useState("");
  const [chargeDate, setChargeDate]  = useState(format(new Date(), "yyyy-MM-dd"));

  // Payment form state
  const [payAmount, setPayAmount]    = useState("");
  const [payMethod, setPayMethod]    = useState("cash");
  const [payRef,    setPayRef]       = useState("");

  function closeModal() { setModal(null); }

  async function handleCheckin() {
    if (!selected) return;
    await checkin.mutateAsync({ id: selected.id });
    closeModal();
  }

  async function handleCheckout() {
    if (!selected) return;
    await checkout.mutateAsync(selected.id);
    closeModal();
  }

  async function handleCancel() {
    if (!selected) return;
    await cancel.mutateAsync({ id: selected.id, reason: "Cancelled by admin" });
    closeModal();
  }

  async function handleAddCharge() {
    if (!selected || !chargeDesc || !chargeRate) {
      toast.error("Fill in description and rate."); return;
    }
    await addCharge.mutateAsync({
      bookingId: selected.id,
      data: {
        description: chargeDesc,
        category:    chargeCat,
        quantity:    Number(chargeQty),
        unit_price:  Number(chargeRate),
        date:        chargeDate,
      },
    });
    setChargeDesc(""); setChargeRate(""); setChargeQty("1");
    closeModal();
  }

  async function handlePayment() {
    if (!selected || !payAmount) { toast.error("Enter payment amount."); return; }
    await cashPay.mutateAsync({
      booking_id: selected.id,
      amount:     Number(payAmount),
      method:     payMethod,
      bank_reference: payRef || undefined,
      upi_transaction_id: payMethod === "upi" ? payRef : undefined,
    });
    setPayAmount(""); setPayRef("");
    closeModal();
  }

  const columns = [
    {
      key: "booking_ref",
      header: "Booking Ref",
      render: (b: Booking) => (
        <span className="font-mono text-xs font-bold text-navy-900">{b.booking_ref}</span>
      ),
    },
    {
      key: "guest",
      header: "Guest",
      render: (b: Booking) => (
        <div>
          <p className="font-medium text-navy-900 text-sm">{(b as any).guest_user?.full_name ?? "—"}</p>
          <p className="text-xs text-surface-400">{(b as any).guest_user?.phone ?? ""}</p>
        </div>
      ),
    },
    {
      key: "check_in_date",
      header: "Check-in",
      render: (b: Booking) => (
        <div>
          <p className="text-sm">{formatDate(b.check_in_date)}</p>
          <p className="text-xs text-surface-400">{b.num_nights}n · {b.adults}A{b.children > 0 ? `+${b.children}C` : ""}</p>
        </div>
      ),
    },
    {
      key: "check_out_date",
      header: "Check-out",
      render: (b: Booking) => <span className="text-sm">{formatDate(b.check_out_date)}</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (b: Booking) => (
        <span className={`badge ${getStatusColor(b.status)}`}>
          {b.status.replace(/_/g, " ")}
        </span>
      ),
    },
    {
      key: "total_amount",
      header: "Amount",
      render: (b: Booking) => (
        <span className="font-semibold text-sm">{formatCurrency(b.total_amount)}</span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (b: Booking) => (
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); setSelected(b); setModal("detail"); }}
            className="p-1.5 rounded-lg hover:bg-surface-100 text-surface-400 hover:text-navy-900 transition-colors"
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </button>
          {b.status === "confirmed" && (
            <button
              onClick={(e) => { e.stopPropagation(); setSelected(b); setModal("checkin"); }}
              className="p-1.5 rounded-lg hover:bg-emerald-50 text-surface-400 hover:text-emerald-600 transition-colors"
              title="Check In"
            >
              <LogIn className="w-4 h-4" />
            </button>
          )}
          {b.status === "checked_in" && (
            <button
              onClick={(e) => { e.stopPropagation(); setSelected(b); setModal("checkout"); }}
              className="p-1.5 rounded-lg hover:bg-blue-50 text-surface-400 hover:text-blue-600 transition-colors"
              title="Check Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
          {["pending","confirmed"].includes(b.status) && (
            <button
              onClick={(e) => { e.stopPropagation(); setSelected(b); cancel.mutate({ id: b.id }); }}
              className="p-1.5 rounded-lg hover:bg-red-50 text-surface-400 hover:text-red-600 transition-colors"
              title="Cancel"
            >
              <XCircle className="w-4 h-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Booking Management"
        subtitle={`${bookings?.length ?? 0} bookings`}
        breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Bookings" }]}
        actions={
          <Button variant="secondary" size="sm" onClick={() => {}} className="gap-1.5">
            <Download className="w-4 h-4" /> Export
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
          <input
            className="input pl-9"
            placeholder="Search by booking ref, guest name, phone…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <Select
          options={STATUS_OPTIONS}
          value={status}
          onChange={e => { setStatus(e.target.value); setPage(1); }}
          className="w-48"
        />
      </div>

      <Table
        columns={columns}
        data={bookings ?? []}
        keyExtractor={b => b.id}
        loading={isLoading}
        onRowClick={b => { setSelected(b); setModal("detail"); }}
        emptyTitle="No bookings found"
        emptyMessage="Try adjusting your filters."
      />

      {/* Pagination */}
      <div className="flex items-center justify-between mt-6">
        <Button variant="secondary" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
          ← Previous
        </Button>
        <span className="text-sm text-surface-400">Page {page}</span>
        <Button variant="secondary" size="sm" disabled={(bookings?.length ?? 0) < 20} onClick={() => setPage(p => p + 1)}>
          Next →
        </Button>
      </div>

      {/* ── Detail Modal ──────────────────────────────────────────────────────── */}
      <Modal open={activeModal === "detail"} onClose={closeModal} title="Booking Details" size="lg">
        {selected && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4 text-sm">
              {[
                ["Booking Ref",  selected.booking_ref],
                ["Status",       selected.status.replace(/_/g," ")],
                ["Check-in",     formatDate(selected.check_in_date)],
                ["Check-out",    formatDate(selected.check_out_date)],
                ["Nights",       selected.num_nights],
                ["Guests",       `${selected.adults}A + ${selected.children}C`],
                ["Meal Plan",    mealPlanLabel(selected.meal_plan)],
                ["Total",        formatCurrency(selected.total_amount)],
              ].map(([k,v]) => (
                <div key={String(k)}>
                  <p className="text-xs text-surface-400 mb-0.5">{k}</p>
                  <p className="font-semibold text-navy-900">{String(v)}</p>
                </div>
              ))}
            </div>
            {selected.special_requests && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
                <p className="font-semibold mb-1">Special Requests</p>
                <p>{selected.special_requests}</p>
              </div>
            )}
            <div className="flex flex-wrap gap-2 pt-2 border-t border-surface-100">
              {selected.status === "confirmed" && (
                <Button size="sm" onClick={() => setModal("checkin")} className="gap-1.5">
                  <LogIn className="w-3.5 h-3.5" /> Check In
                </Button>
              )}
              {selected.status === "checked_in" && (
                <>
                  <Button size="sm" onClick={() => setModal("folio")} variant="secondary" className="gap-1.5">
                    <Eye className="w-3.5 h-3.5" /> View Folio
                  </Button>
                  <Button size="sm" onClick={() => setModal("charge")} variant="secondary" className="gap-1.5">
                    <Plus className="w-3.5 h-3.5" /> Add Charge
                  </Button>
                  <Button size="sm" onClick={() => setModal("payment")} variant="secondary" className="gap-1.5 text-emerald-700 border-emerald-200 hover:bg-emerald-50">
                    💳 Record Payment
                  </Button>
                  <Button size="sm" onClick={() => setModal("checkout")} className="gap-1.5">
                    <LogOut className="w-3.5 h-3.5" /> Check Out
                  </Button>
                </>
              )}
              {["pending","confirmed"].includes(selected.status) && (
                <Button size="sm" variant="danger" onClick={handleCancel} loading={cancel.isPending}>
                  Cancel
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* ── Check-in Modal ────────────────────────────────────────────────────── */}
      <Modal open={activeModal === "checkin"} onClose={closeModal} title="Confirm Check-In" size="sm">
        <p className="text-sm text-surface-400 mb-4">
          Check in guest for booking <strong className="text-navy-900">{selected?.booking_ref}</strong>?
        </p>
        <div className="flex gap-3">
          <Button variant="secondary" fullWidth onClick={closeModal}>Cancel</Button>
          <Button fullWidth loading={checkin.isPending} onClick={handleCheckin} className="gap-1.5">
            <CheckCircle className="w-4 h-4" /> Confirm Check-In
          </Button>
        </div>
      </Modal>

      {/* ── Check-out Modal ───────────────────────────────────────────────────── */}
      <Modal open={activeModal === "checkout"} onClose={closeModal} title="Confirm Check-Out" size="sm">
        <p className="text-sm text-surface-400 mb-4">
          Check out guest for booking <strong className="text-navy-900">{selected?.booking_ref}</strong>?
        </p>
        <div className="flex gap-3">
          <Button variant="secondary" fullWidth onClick={closeModal}>Cancel</Button>
          <Button fullWidth loading={checkout.isPending} onClick={handleCheckout} className="gap-1.5">
            <LogOut className="w-4 h-4" /> Confirm Check-Out
          </Button>
        </div>
      </Modal>

      {/* ── Folio Modal ───────────────────────────────────────────────────────── */}
      <Modal open={activeModal === "folio"} onClose={closeModal} title="Folio / Bill" size="lg">
        {folio ? (
          <div className="space-y-4">
            <div className="overflow-auto rounded-xl border border-surface-200">
              <table className="w-full text-sm">
                <thead><tr className="bg-surface-50 text-surface-400 text-xs uppercase">
                  <th className="py-2 px-3 text-left">Description</th>
                  <th className="py-2 px-3 text-left">Category</th>
                  <th className="py-2 px-3 text-right">Qty</th>
                  <th className="py-2 px-3 text-right">Rate</th>
                  <th className="py-2 px-3 text-right">Amount</th>
                </tr></thead>
                <tbody className="divide-y divide-surface-100">
                  {folio.items.map(item => (
                    <tr key={item.id}>
                      <td className="py-2 px-3">{item.description}</td>
                      <td className="py-2 px-3 text-surface-400">{item.category}</td>
                      <td className="py-2 px-3 text-right">{item.quantity}</td>
                      <td className="py-2 px-3 text-right">{formatCurrency(item.unit_price)}</td>
                      <td className="py-2 px-3 text-right font-medium">{formatCurrency(item.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="bg-surface-50 rounded-xl p-4 space-y-2 text-sm">
              <div className="flex justify-between text-surface-400"><span>Subtotal</span><span>{formatCurrency(folio.subtotal)}</span></div>
              <div className="flex justify-between text-surface-400"><span>GST</span><span>{formatCurrency(folio.gst_amount)}</span></div>
              <div className="flex justify-between font-bold text-base text-navy-900 pt-2 border-t border-surface-200"><span>Total</span><span>{formatCurrency(folio.total)}</span></div>
              <div className="flex justify-between text-emerald-600"><span>Paid</span><span>{formatCurrency(folio.paid)}</span></div>
              <div className={`flex justify-between font-bold ${folio.balance > 0 ? "text-red-600" : "text-emerald-600"}`}>
                <span>Balance</span><span>{folio.balance > 0 ? formatCurrency(folio.balance) : "✓ Fully Paid"}</span>
              </div>
            </div>
          </div>
        ) : <div className="text-center py-8 text-surface-400">Loading folio…</div>}
      </Modal>

      {/* ── Add Charge Modal ──────────────────────────────────────────────────── */}
      <Modal open={activeModal === "charge"} onClose={closeModal} title="Add Extra Charge" size="sm">
        <div className="space-y-4">
          <Input label="Description" value={chargeDesc} onChange={e => setChargeDesc(e.target.value)} placeholder="e.g. Room Service – Dinner" />
          <Select label="Category" value={chargeCat} onChange={e => setChargeCat(e.target.value)}
            options={[
              { value:"room",label:"Room" },{ value:"food_beverage",label:"Food & Beverage" },
              { value:"laundry",label:"Laundry" },{ value:"spa",label:"Spa" },
              { value:"minibar",label:"Minibar" },{ value:"others",label:"Others" },
            ]}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Quantity" type="number" value={chargeQty} onChange={e => setChargeQty(e.target.value)} min="1" />
            <Input label="Unit Price (₹)" type="number" value={chargeRate} onChange={e => setChargeRate(e.target.value)} placeholder="0.00" />
          </div>
          <Input label="Date" type="date" value={chargeDate} onChange={e => setChargeDate(e.target.value)} />
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" fullWidth onClick={closeModal}>Cancel</Button>
            <Button fullWidth loading={addCharge.isPending} onClick={handleAddCharge}>Add Charge</Button>
          </div>
        </div>
      </Modal>

      {/* ── Payment Modal ─────────────────────────────────────────────────────── */}
      <Modal open={activeModal === "payment"} onClose={closeModal} title="Record Payment" size="sm">
        <div className="space-y-4">
          {folio && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm">
              <span className="text-amber-700 font-medium">Balance due: </span>
              <span className="font-bold text-amber-900">{formatCurrency(folio.balance)}</span>
            </div>
          )}
          <Input label="Amount (₹)" type="number" value={payAmount} onChange={e => setPayAmount(e.target.value)} placeholder={String(folio?.balance ?? "")} />
          <Select label="Payment Method" value={payMethod} onChange={e => setPayMethod(e.target.value)}
            options={[
              { value:"cash",label:"Cash" },{ value:"card",label:"Card" },
              { value:"upi",label:"UPI" },{ value:"net_banking",label:"Net Banking" },
            ]}
          />
          <Input label="Reference / Transaction ID" value={payRef} onChange={e => setPayRef(e.target.value)} placeholder="Optional" />
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" fullWidth onClick={closeModal}>Cancel</Button>
            <Button fullWidth loading={cashPay.isPending} onClick={handlePayment} className="bg-emerald-600 hover:bg-emerald-700">
              Record Payment
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
