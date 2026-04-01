"use client";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Download, X, CreditCard, Receipt, BedDouble, QrCode } from "lucide-react";
import { useBooking, useFolio, usePaymentHistory, useCancelBooking, useRecordCashPayment } from "@/hooks/useApi";
import { BookingStatusBadge } from "@/components/ui/StatusBadge";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatCurrency, formatDate, formatDateTime, mealPlanLabel, sourceLabel } from "@/lib/utils";
import { paymentsApi } from "@/lib/api";

export default function BookingDetailPage() {
  const { id }    = useParams<{ id: string }>();
  const router    = useRouter();
  const bookingId = Number(id);

  const [showCancel,   setShowCancel]   = useState(false);
  const [showPayment,  setShowPayment]  = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [payForm, setPayForm]           = useState({ amount:"", method:"cash", upi_transaction_id:"", notes:"" });

  const { data: booking, isLoading } = useBooking(bookingId);
  const { data: folio }              = useFolio(bookingId);
  const { data: payments }           = usePaymentHistory(bookingId);
  const cancelMutation               = useCancelBooking();
  const payMutation                  = useRecordCashPayment();

  function downloadInvoice() {
    const url   = paymentsApi.getInvoiceUrl(bookingId);
    const token = document.cookie.split(";").find(c=>c.trim().startsWith("access_token="))?.split("=")[1];
    window.open(`${url}?access_token=${token}`, "_blank");
  }

  if (isLoading) return (
    <div className="page-container py-8 space-y-5">
      <Skeleton className="h-8 w-64" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5"><Skeleton className="h-64" /><Skeleton className="h-64" /></div>
        <div className="space-y-4"><Skeleton className="h-48" /></div>
      </div>
    </div>
  );
  if (!booking) return <div className="page-container py-20 text-center text-surface-400">Booking not found.</div>;

  const canCancel  = ["pending","confirmed"].includes(booking.status);
  const canPay     = ["confirmed","checked_in","checked_out"].includes(booking.status) && (folio?.balance ?? 0) > 0;
  const canInvoice = ["checked_out","checked_in","cancelled"].includes(booking.status);

  return (
    <div className="page-container py-8">
      <div className="flex items-center gap-3 mb-7">
        <button onClick={() => router.back()} className="p-2 rounded-xl hover:bg-surface-100 transition-colors">
          <ArrowLeft className="w-5 h-5 text-surface-400" />
        </button>
        <div className="flex-1">
          <h1 className="font-display text-2xl font-bold text-navy-900">{booking.booking_ref}</h1>
          <p className="text-sm text-surface-400 mt-0.5">ID #{booking.id} · {sourceLabel(booking.source)}</p>
        </div>
        <BookingStatusBadge status={booking.status} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          {/* Stay details */}
          <div className="card p-6">
            <h2 className="font-display font-semibold text-navy-900 mb-5 flex items-center gap-2">
              <BedDouble className="w-5 h-5 text-navy-600" /> Stay Details
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                ["Check-in",    formatDate(booking.check_in_date)],
                ["Check-out",   formatDate(booking.check_out_date)],
                ["Nights",      String(booking.num_nights)],
                ["Guests",      `${booking.adults}A${booking.children > 0 ? `+${booking.children}C` : ""}`],
                ["Room Type",   booking.room_type?.name ?? "—"],
                ["Room No.",    booking.room?.room_number ?? "Unassigned"],
                ["Meal Plan",   mealPlanLabel(booking.meal_plan)],
                ["Rate/night",  formatCurrency(booking.room_rate_per_night)],
              ].map(([label, value]) => (
                <div key={label}>
                  <p className="text-xs text-surface-400 mb-1">{label}</p>
                  <p className="font-semibold text-navy-900 text-sm">{value}</p>
                </div>
              ))}
            </div>
            {booking.special_requests && (
              <div className="mt-4 pt-4 border-t border-surface-100">
                <p className="text-xs text-surface-400 mb-1">Special Requests</p>
                <p className="text-sm text-navy-900">{booking.special_requests}</p>
              </div>
            )}
            {booking.actual_check_in && (
              <div className="mt-4 pt-4 border-t border-surface-100 grid grid-cols-2 gap-4">
                <div><p className="text-xs text-surface-400 mb-1">Actual Check-in</p><p className="text-sm font-semibold text-navy-900">{formatDateTime(booking.actual_check_in)}</p></div>
                {booking.actual_check_out && <div><p className="text-xs text-surface-400 mb-1">Actual Check-out</p><p className="text-sm font-semibold text-navy-900">{formatDateTime(booking.actual_check_out)}</p></div>}
              </div>
            )}
          </div>

          {/* Folio */}
          {folio && (
            <div className="card p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-display font-semibold text-navy-900 flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-navy-600" /> Bill / Folio
                  <span className="text-xs font-mono text-surface-400">#{folio.folio_number}</span>
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-surface-100">
                      {["Description","Category","Qty","Rate","Amount"].map(h=>(
                        <th key={h} className="text-left py-2 px-3 text-xs text-surface-400 font-semibold uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {folio.items.map((item, i) => (
                      <tr key={i} className="border-b border-surface-50 hover:bg-surface-50 transition-colors">
                        <td className="py-2.5 px-3 text-navy-900">{item.description}</td>
                        <td className="py-2.5 px-3 capitalize text-surface-400 text-xs">{item.category.replace(/_/g," ")}</td>
                        <td className="py-2.5 px-3 text-surface-400">{item.quantity}</td>
                        <td className="py-2.5 px-3">{formatCurrency(item.unit_price)}</td>
                        <td className="py-2.5 px-3 font-semibold">{formatCurrency(item.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-5 ml-auto max-w-xs space-y-1.5 text-sm">
                <div className="flex justify-between text-surface-400"><span>Subtotal</span><span>{formatCurrency(folio.subtotal)}</span></div>
                <div className="flex justify-between text-surface-400"><span>GST</span><span>{formatCurrency(folio.gst_amount)}</span></div>
                <div className="flex justify-between font-bold text-navy-900 text-base pt-2 border-t border-surface-100"><span>Total</span><span>{formatCurrency(folio.total)}</span></div>
                <div className="flex justify-between text-emerald-600"><span>Paid</span><span>{formatCurrency(folio.paid)}</span></div>
                {folio.balance > 0
                  ? <div className="flex justify-between font-bold text-red-600"><span>Balance Due</span><span>{formatCurrency(folio.balance)}</span></div>
                  : <div className="flex justify-between font-bold text-emerald-600"><span>Fully Paid ✓</span><span>—</span></div>}
              </div>
            </div>
          )}

          {/* Payments */}
          {(payments as any[])?.length > 0 && (
            <div className="card p-6">
              <h2 className="font-display font-semibold text-navy-900 mb-4">Payment History</h2>
              <div className="space-y-2">
                {(payments as any[]).map((p,i) => (
                  <div key={i} className="flex justify-between items-center p-3 bg-surface-50 rounded-xl text-sm">
                    <div>
                      <p className="font-semibold capitalize">{p.method?.replace(/_/g," ")}</p>
                      <p className="text-xs text-surface-400">{p.paid_at ? formatDateTime(p.paid_at) : "—"}{p.upi_transaction_id ? ` · ${p.upi_transaction_id}` : ""}</p>
                    </div>
                    <p className="font-bold text-emerald-700">{formatCurrency(p.amount)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right sidebar */}
        <aside className="space-y-4">
          <div className="card p-5 space-y-3">
            <h3 className="font-display font-semibold text-navy-900">Actions</h3>
            {canInvoice && <Button variant="primary" fullWidth onClick={downloadInvoice} className="gap-2"><Download className="w-4 h-4" /> Download Invoice</Button>}
            {canPay  && <Button variant="gold" fullWidth onClick={() => setShowPayment(true)} className="gap-2"><CreditCard className="w-4 h-4" /> Record Payment</Button>}
            {canCancel && <Button variant="danger" fullWidth onClick={() => setShowCancel(true)} className="gap-2"><X className="w-4 h-4" /> Cancel Booking</Button>}
          </div>

          <div className="card p-5">
            <h3 className="font-display font-semibold text-navy-900 mb-3">Price Breakdown</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-surface-400"><span>{formatCurrency(booking.room_rate_per_night)} × {booking.num_nights}n</span><span>{formatCurrency(booking.subtotal)}</span></div>
              <div className="flex justify-between text-surface-400"><span>GST</span><span>{formatCurrency(booking.gst_amount)}</span></div>
              <div className="flex justify-between font-bold text-navy-900 text-base border-t border-surface-100 pt-2"><span>Total</span><span>{formatCurrency(booking.total_amount)}</span></div>
            </div>
          </div>

          <div className="card p-5">
            <h3 className="font-display font-semibold text-navy-900 mb-3">Booking Ref (QR)</h3>
            <p className="font-mono text-lg font-bold text-navy-900 text-center tracking-widest bg-surface-50 rounded-xl p-4 border border-surface-200">
              {booking.booking_ref}
            </p>
            <p className="text-xs text-surface-400 text-center mt-2">Show this at hotel check-in</p>
          </div>
        </aside>
      </div>

      {/* Cancel Modal */}
      <Modal open={showCancel} onClose={() => setShowCancel(false)} title="Cancel Booking" size="sm">
        <p className="text-surface-400 text-sm mb-4">Cancel <strong>{booking.booking_ref}</strong>? This cannot be undone.</p>
        <textarea className="input min-h-[80px] resize-none mb-5 text-sm" placeholder="Reason (optional)" value={cancelReason} onChange={e=>setCancelReason(e.target.value)} />
        <div className="flex gap-3">
          <Button variant="secondary" fullWidth onClick={() => setShowCancel(false)}>Keep It</Button>
          <Button variant="danger" fullWidth loading={cancelMutation.isPending}
            onClick={() => cancelMutation.mutate({ id: bookingId, reason: cancelReason }, { onSuccess: () => { setShowCancel(false); router.push("/guest/dashboard"); }})}>
            Confirm Cancel
          </Button>
        </div>
      </Modal>

      {/* Payment Modal */}
      <Modal open={showPayment} onClose={() => setShowPayment(false)} title="Record Payment" size="sm">
        <div className="space-y-4">
          <div><label className="text-sm font-medium text-navy-900 block mb-1.5">Amount (₹)</label>
            <input className="input" type="number" min="1" max={folio?.balance} placeholder={`Balance: ${formatCurrency(folio?.balance ?? 0)}`} value={payForm.amount} onChange={e=>setPayForm(p=>({...p,amount:e.target.value}))} /></div>
          <div><label className="text-sm font-medium text-navy-900 block mb-1.5">Method</label>
            <select className="input" value={payForm.method} onChange={e=>setPayForm(p=>({...p,method:e.target.value}))}>
              <option value="cash">Cash</option><option value="upi">UPI</option>
              <option value="card">Card</option><option value="net_banking">Net Banking</option>
            </select></div>
          {payForm.method==="upi" && <div><label className="text-sm font-medium text-navy-900 block mb-1.5">UPI Transaction ID</label>
            <input className="input" placeholder="TXN1234..." value={payForm.upi_transaction_id} onChange={e=>setPayForm(p=>({...p,upi_transaction_id:e.target.value}))} /></div>}
          <div><label className="text-sm font-medium text-navy-900 block mb-1.5">Notes</label>
            <input className="input" value={payForm.notes} onChange={e=>setPayForm(p=>({...p,notes:e.target.value}))} placeholder="Optional" /></div>
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" fullWidth onClick={() => setShowPayment(false)}>Cancel</Button>
            <Button variant="gold" fullWidth loading={payMutation.isPending}
              onClick={() => payMutation.mutate({ booking_id: bookingId, amount: Number(payForm.amount), method: payForm.method, upi_transaction_id: payForm.upi_transaction_id||null, notes: payForm.notes||null },
                { onSuccess: () => setShowPayment(false) })}>
              Record
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
