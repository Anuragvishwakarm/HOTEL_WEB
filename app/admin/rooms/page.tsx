"use client";
import { useState } from "react";
import { Plus, RefreshCw } from "lucide-react";
import Table from "@/components/ui/Table";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import PageHeader from "@/components/ui/PageHeader";
import { useRooms, useRoomTypes, useCreateRoom, useUpdateRoomStatus } from "@/hooks/useHotels";
import { getRoomStatusColor } from "@/lib/utils";
import type { Room, RoomType } from "@/lib/types";
import toast from "react-hot-toast";

const HOTEL_ID = 1;

const STATUS_OPTIONS = [
  { value: "available",    label: "Available" },
  { value: "maintenance",  label: "Maintenance" },
  { value: "blocked",      label: "Blocked" },
  { value: "cleaning",     label: "Cleaning" },
];

const FLOOR_COLORS: Record<number, string> = {
  1: "bg-blue-50 text-blue-700 border-blue-200",
  2: "bg-purple-50 text-purple-700 border-purple-200",
  3: "bg-teal-50 text-teal-700 border-teal-200",
  4: "bg-amber-50 text-amber-700 border-amber-200",
  5: "bg-rose-50 text-rose-700 border-rose-200",
};

export default function RoomsPage() {
  const [view, setView]       = useState<"grid" | "table">("grid");
  const [showAdd, setShowAdd] = useState(false);
  const [filterStatus, setFilterStatus] = useState("");

  const { data: rooms,     isLoading, refetch } = useRooms(HOTEL_ID);
  const { data: roomTypes } = useRoomTypes(HOTEL_ID);
  const createRoom          = useCreateRoom();
  const updateStatus        = useUpdateRoomStatus();

  // Add room form
  const [roomNumber, setRoomNumber] = useState("");
  const [floor,      setFloor]      = useState("1");
  const [roomTypeId, setRoomTypeId] = useState("");

  const filtered = rooms?.filter(r => !filterStatus || r.status === filterStatus) ?? [];

  const statusCounts = rooms?.reduce((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) ?? {};

  async function handleAddRoom() {
    if (!roomNumber || !roomTypeId) { toast.error("Room number and type are required."); return; }
    await createRoom.mutateAsync({ hotelId: HOTEL_ID, data: {
      hotel_id:     HOTEL_ID,
      room_type_id: Number(roomTypeId),
      room_number:  roomNumber,
      floor:        Number(floor),
    }});
    setRoomNumber(""); setFloor("1"); setRoomTypeId("");
    setShowAdd(false);
  }

  async function handleStatusChange(room: Room, newStatus: string) {
    if (room.status === newStatus) return;
    await updateStatus.mutateAsync({ roomId: room.id, status: newStatus, hotelId: HOTEL_ID });
  }

  const columns = [
    {
      key: "room_number",
      header: "Room",
      render: (r: Room) => <span className="font-bold font-mono text-navy-900">{r.room_number}</span>,
    },
    {
      key: "floor",
      header: "Floor",
      render: (r: Room) => (
        <span className={`badge ${FLOOR_COLORS[r.floor] || "bg-surface-100 text-surface-400"}`}>
          Floor {r.floor}
        </span>
      ),
    },
    {
      key: "room_type",
      header: "Room Type",
      render: (r: Room) => r.room_type?.name ?? "—",
    },
    {
      key: "status",
      header: "Status",
      render: (r: Room) => (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border`}>
          <span className={`w-2 h-2 rounded-full ${getRoomStatusColor(r.status)}`} />
          {r.status.replace(/_/g, " ")}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Change Status",
      render: (r: Room) => (
        <select
          value={r.status}
          onChange={e => handleStatusChange(r, e.target.value)}
          onClick={e => e.stopPropagation()}
          className="text-xs border border-surface-200 rounded-lg px-2 py-1 bg-white focus:outline-none focus:border-navy-400 cursor-pointer"
        >
          {["available","occupied","cleaning","maintenance","blocked","inspecting"].map(s => (
            <option key={s} value={s}>{s.replace(/_/g," ")}</option>
          ))}
        </select>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Room Management"
        subtitle={`${rooms?.length ?? 0} rooms total`}
        breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Rooms" }]}
        actions={
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => refetch()} className="gap-1.5">
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Button size="sm" onClick={() => setShowAdd(true)} className="gap-1.5">
              <Plus className="w-4 h-4" /> Add Room
            </Button>
          </div>
        }
      />

      {/* Status summary pills */}
      <div className="flex flex-wrap gap-3 mb-6">
        {[
          { key: "",            label: "All Rooms",   count: rooms?.length ?? 0,               color: "bg-navy-50 text-navy-900 border-navy-200"   },
          { key: "available",   label: "Available",   count: statusCounts.available ?? 0,       color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
          { key: "occupied",    label: "Occupied",    count: statusCounts.occupied ?? 0,        color: "bg-red-50 text-red-700 border-red-200"     },
          { key: "cleaning",    label: "Cleaning",    count: statusCounts.cleaning ?? 0,        color: "bg-amber-50 text-amber-700 border-amber-200"  },
          { key: "maintenance", label: "Maintenance", count: statusCounts.maintenance ?? 0,     color: "bg-orange-50 text-orange-700 border-orange-200" },
          { key: "blocked",     label: "Blocked",     count: statusCounts.blocked ?? 0,         color: "bg-surface-100 text-surface-400 border-surface-200" },
        ].map(({ key, label, count, color }) => (
          <button
            key={key}
            onClick={() => setFilterStatus(key)}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-medium transition-all ${color} ${filterStatus === key ? "ring-2 ring-offset-1 ring-navy-400" : "opacity-80 hover:opacity-100"}`}
          >
            {label}
            <span className="font-bold">{count}</span>
          </button>
        ))}
      </div>

      {/* Visual grid */}
      {view === "grid" ? (
        <div className="space-y-8">
          {Array.from(new Set(filtered.map(r => r.floor))).sort().map(floor => (
            <div key={floor}>
              <div className="flex items-center gap-3 mb-4">
                <div className="h-px flex-1 bg-surface-200" />
                <span className={`badge ${FLOOR_COLORS[floor] || "bg-surface-100 text-surface-400"} text-xs font-bold`}>
                  Floor {floor}
                </span>
                <div className="h-px flex-1 bg-surface-200" />
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
                {filtered.filter(r => r.floor === floor).map(r => (
                  <div
                    key={r.id}
                    className={`relative rounded-xl border p-2.5 text-center cursor-pointer group transition-all hover:scale-105 hover:shadow-float ${
                      r.status === "available"   ? "bg-emerald-50 border-emerald-200" :
                      r.status === "occupied"    ? "bg-red-50 border-red-200"         :
                      r.status === "cleaning"    ? "bg-amber-50 border-amber-200"     :
                      r.status === "maintenance" ? "bg-orange-50 border-orange-200"   :
                      r.status === "inspecting"  ? "bg-blue-50 border-blue-200"       :
                      "bg-surface-100 border-surface-200"
                    }`}
                  >
                    <p className="font-extrabold text-sm text-navy-900">{r.room_number}</p>
                    <p className="text-xs text-surface-400 mt-0.5">{r.room_type?.name?.split(" ")[0] ?? "—"}</p>
                    <div className={`w-2 h-2 rounded-full mx-auto mt-1 ${getRoomStatusColor(r.status)}`} />
                    {/* Hover context menu */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-col gap-1 bg-white rounded-xl shadow-float border border-surface-200 p-2 z-10 min-w-[120px]">
                      {["available","cleaning","maintenance","blocked"].map(s => (
                        <button
                          key={s}
                          onClick={() => handleStatusChange(r, s)}
                          className="text-left text-xs px-2 py-1 rounded-lg hover:bg-surface-50 text-navy-900 font-medium"
                        >
                          → {s.replace(/_/g," ")}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {filtered.length === 0 && !isLoading && (
            <div className="text-center py-16 text-surface-400">
              <p className="text-2xl mb-2">🏠</p>
              <p>No rooms match the selected filter.</p>
            </div>
          )}
        </div>
      ) : (
        <Table
          columns={columns}
          data={filtered}
          keyExtractor={r => r.id}
          loading={isLoading}
          emptyTitle="No rooms found"
        />
      )}

      {/* View toggle */}
      <div className="flex justify-center mt-6 gap-2">
        <button
          onClick={() => setView("grid")}
          className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${view === "grid" ? "bg-navy-900 text-white border-navy-900" : "bg-white text-surface-400 border-surface-200 hover:border-navy-300"}`}
        >
          Grid View
        </button>
        <button
          onClick={() => setView("table")}
          className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${view === "table" ? "bg-navy-900 text-white border-navy-900" : "bg-white text-surface-400 border-surface-200 hover:border-navy-300"}`}
        >
          Table View
        </button>
      </div>

      {/* Add Room Modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add New Room" size="sm">
        <div className="space-y-4">
          <Input label="Room Number" value={roomNumber} onChange={e => setRoomNumber(e.target.value)} placeholder="e.g. 101, 215" />
          <Input label="Floor" type="number" value={floor} onChange={e => setFloor(e.target.value)} min="1" max="50" />
          <Select
            label="Room Type"
            value={roomTypeId}
            onChange={e => setRoomTypeId(e.target.value)}
            placeholder="Select room type"
            options={(roomTypes ?? []).map(rt => ({ value: String(rt.id), label: `${rt.name}  (₹${rt.base_price}/night)` }))}
          />
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" fullWidth onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button fullWidth loading={createRoom.isPending} onClick={handleAddRoom}>Add Room</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
