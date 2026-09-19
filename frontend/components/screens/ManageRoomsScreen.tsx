'use client';

import React, { useState } from 'react';
import { useSpotFree } from '@/context/SpotFreeContext';
import { Header } from '../Header';
import { StatusBadge } from '../StatusBadge';
import { CampusBuilding, RoomType, SpaceType, RoomStatus } from '@/lib/types';

const TYPE_OPTIONS: Array<{ value: RoomType; label: string; icon: string; desc: string }> = [
  { value: 'CLASSROOM', label: 'CLASSROOM', icon: 'meeting_room', desc: 'Lecture halls & tutorial rooms' },
  { value: 'LABS', label: 'LABS', icon: 'science', desc: 'Computer & practical science labs' },
  { value: 'SEMINAR HALL', label: 'SEMINAR HALL', icon: 'co_present', desc: 'Auditoriums & conference spaces' },
  { value: 'OFFICES', label: 'OFFICES', icon: 'corporate_fare', desc: 'Faculty cabins & admin spaces' },
];

const STATUS_OPTIONS: Array<{ value: RoomStatus; label: string; dotColor: string; desc: string }> = [
  { value: 'VACANT', label: 'VACANT', dotColor: 'bg-emerald-500', desc: 'Free & available for immediate occupancy' },
  { value: 'OCCUPIED', label: 'OCCUPIED', dotColor: 'bg-rose-500', desc: 'In active use for class, lab or event' },
  { value: 'RESERVED', label: 'RESERVED', dotColor: 'bg-amber-500', desc: 'Booked / earmarked for upcoming session' },
  { value: 'NO INFORMATION', label: 'NO INFORMATION', dotColor: 'bg-slate-400', desc: 'No live occupancy status recorded' },
];

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'CLASSROOM':
      return 'meeting_room';
    case 'LABS':
      return 'science';
    case 'SEMINAR HALL':
      return 'co_present';
    case 'OFFICES':
      return 'corporate_fare';
    default:
      return 'domain';
  }
};

export const ManageRoomsScreen: React.FC = () => {
  const {
    rooms,
    addRoom,
    editRoom,
    setSelectedRoomId,
    navigate,
    activeFilterBuilding,
    setActiveFilterBuilding,
  } = useSpotFree();

  const [search, setSearch] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');

  // Modal states
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [editingRoomId, setEditingRoomId] = useState<string | null>(null);

  // New room form state
  const [newId, setNewId] = useState<string>('CME-205');
  const [newBldg, setNewBldg] = useState<CampusBuilding>('CME');
  const [newFloor, setNewFloor] = useState<number>(2);
  const [newType, setNewType] = useState<RoomType>('CLASSROOM');
  const [newCapacity, setNewCapacity] = useState<number>(60);

  // Edit room form state
  const [editCapacity, setEditCapacity] = useState<number>(60);
  const [editType, setEditType] = useState<RoomType>('CLASSROOM');
  const [editStatus, setEditStatus] = useState<RoomStatus>('VACANT');
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState<boolean>(false);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState<boolean>(false);

  const editingRoom = rooms.find((r) => r.id === editingRoomId);

  const filtered = rooms.filter((r) => {
    if (search) {
      const q = search.trim().toLowerCase();
      const qClean = q.replace(/[^a-zA-Z0-9]/g, '');
      const idClean = r.id.toLowerCase().replace(/[^a-zA-Z0-9]/g, '');
      const numClean = (r.roomNumber || '').toLowerCase().replace(/[^a-zA-Z0-9]/g, '');
      const bldgNumClean = `${r.building}${r.roomNumber}`.toLowerCase().replace(/[^a-zA-Z0-9]/g, '');
      const matches =
        r.id.toLowerCase().includes(q) ||
        (r.roomNumber && r.roomNumber.toLowerCase().includes(q)) ||
        idClean.includes(qClean) ||
        numClean.includes(qClean) ||
        bldgNumClean.includes(qClean) ||
        (r.qrId && r.qrId.toLowerCase().includes(q));
      if (!matches) return false;
    }
    if (activeFilterBuilding !== 'All' && r.building !== activeFilterBuilding) return false;
    if (selectedType !== 'All' && r.type !== selectedType) return false;
    if (selectedStatus !== 'All' && r.status !== selectedStatus) return false;
    return true;
  });

  const handleOpenEdit = (roomId: string) => {
    const target = rooms.find((r) => r.id === roomId);
    if (!target) return;
    setEditingRoomId(roomId);
    setEditCapacity(target.capacity);
    setEditType(target.type as RoomType);
    setEditStatus(target.status);
    setIsTypeDropdownOpen(false);
    setIsStatusDropdownOpen(false);
  };

  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    addRoom({
      id: newId.trim().toUpperCase(),
      building: newBldg,
      floor: Number(newFloor),
      type: newType,
      capacity: Number(newCapacity),
    });
    setShowAddModal(false);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRoomId) return;
    editRoom(editingRoomId, {
      capacity: Number(editCapacity),
      type: editType,
      status: editStatus,
    });
    setEditingRoomId(null);
    setIsTypeDropdownOpen(false);
    setIsStatusDropdownOpen(false);
  };

  return (
    <div className="flex flex-col w-full pb-24 bg-[#f8f9ff]">
      <Header title="Manage Rooms" subtitle="Campus Space Allocation" showBack={true} />

      <main className="flex flex-col px-4 pt-3 pb-8 gap-3.5">
        {/* Sub-header Strip */}
        <section className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="bg-slate-200 text-slate-800 text-[10px] font-extrabold px-2 py-0.5 rounded uppercase tracking-wider">
              ROLE: ADMIN
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-semibold border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Sync
            </span>
          </div>
          <span className="text-[11px] text-slate-400">Total: {rooms.length} Rooms</span>
        </section>

        {/* Primary Action Banner */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xs font-bold text-slate-900">Space Allocation</h2>
            <p className="text-[11px] text-slate-500">Configure room capacity & status</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="h-10 px-3.5 bg-[#0f172a] hover:bg-slate-800 active:scale-95 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm transition-all shrink-0"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            <span>Add Room</span>
          </button>
        </div>

        {/* Search Field */}
        <div className="relative w-full">
          <span className="material-symbols-outlined absolute left-3 top-2.5 text-lg text-slate-400 pointer-events-none">
            search
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search room (e.g. CME-104)..."
            className="w-full h-11 pl-9 pr-3 rounded-xl bg-white border border-slate-200 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-400 shadow-xs"
          />
        </div>

        {/* Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
          {['All', 'CME', 'CB', 'ICT'].map((bldg) => (
            <button
              key={bldg}
              onClick={() => setActiveFilterBuilding(bldg)}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                activeFilterBuilding === bldg
                  ? 'bg-[#0f172a] text-white shadow-xs'
                  : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
              }`}
            >
              {bldg === 'All' ? 'All Wings' : `${bldg} Wing`}
            </button>
          ))}
        </div>

        {/* Room Feed */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs text-slate-500 px-0.5">
            <span>Showing {filtered.length} of {rooms.length} rooms</span>
          </div>

          {filtered.map((room) => (
            <div
              key={room.id}
              className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs flex items-center justify-between gap-2"
            >
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-xs text-slate-900">{room.id}</span>
                  <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-semibold">
                    {room.building} • Fl {room.floor}
                  </span>
                  <StatusBadge status={room.status} size="sm" />
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {room.type} • {room.capacity} seats capacity
                </p>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => {
                    setSelectedRoomId(room.id);
                    navigate('room-details');
                  }}
                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-lg transition-colors"
                >
                  View
                </button>
                <button
                  onClick={() => handleOpenEdit(room.id)}
                  className="px-2.5 py-1.5 bg-[#0f172a] hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition-colors"
                >
                  Edit
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Add Room Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-[340px] rounded-2xl p-5 shadow-2xl flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-sm text-slate-900">Add New Campus Room</h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-slate-400 hover:text-slate-700"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <form onSubmit={handleSaveAdd} className="flex flex-col gap-2.5">
                <div>
                  <label className="text-[10px] font-bold text-slate-600 uppercase">
                    Room Designation
                  </label>
                  <input
                    type="text"
                    value={newId}
                    onChange={(e) => setNewId(e.target.value)}
                    placeholder="e.g. CME-205"
                    className="w-full text-xs p-2 rounded-lg border border-slate-200 font-bold uppercase"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 uppercase">Building</label>
                    <select
                      value={newBldg}
                      onChange={(e) => setNewBldg(e.target.value as CampusBuilding)}
                      className="w-full text-xs p-2 rounded-lg border border-slate-200"
                    >
                      <option value="CME">CME</option>
                      <option value="CB">CB</option>
                      <option value="ICT">ICT</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 uppercase">Floor</label>
                    <input
                      type="number"
                      value={newFloor}
                      onChange={(e) => setNewFloor(Number(e.target.value))}
                      className="w-full text-xs p-2 rounded-lg border border-slate-200"
                      min={0}
                      max={8}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 uppercase">Space Type</label>
                    <select
                      value={newType}
                      onChange={(e) => setNewType(e.target.value as RoomType)}
                      className="w-full text-xs p-2 rounded-lg border border-slate-200"
                    >
                      <option value="CLASSROOM">CLASSROOM</option>
                      <option value="LABS">LABS</option>
                      <option value="SEMINAR HALL">SEMINAR HALL</option>
                      <option value="OFFICES">OFFICES</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 uppercase">Capacity</label>
                    <input
                      type="number"
                      value={newCapacity}
                      onChange={(e) => setNewCapacity(Number(e.target.value))}
                      className="w-full text-xs p-2 rounded-lg border border-slate-200"
                      min={5}
                      max={200}
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 py-2 bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 bg-[#0f172a] text-white text-xs font-bold rounded-lg shadow-sm"
                  >
                    Save Room
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Room Modal */}
        {editingRoomId && (
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-[60] flex items-center justify-center p-4 animate-in fade-in duration-150"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setEditingRoomId(null);
                setIsTypeDropdownOpen(false);
                setIsStatusDropdownOpen(false);
              }
            }}
          >
            <div className="bg-white w-full max-w-[390px] rounded-2xl shadow-2xl border border-slate-100 flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-150">
              {/* Modal Header */}
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-lg">edit_square</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 leading-tight">
                      Edit Room: {editingRoomId}
                    </h3>
                    <p className="text-[11px] text-slate-500 font-medium">
                      {editingRoom ? `${editingRoom.building} Building • Floor ${editingRoom.floor}` : 'Campus Room Configuration'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEditingRoomId(null);
                    setIsTypeDropdownOpen(false);
                    setIsStatusDropdownOpen(false);
                  }}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors active:scale-95"
                  aria-label="Close"
                >
                  <span className="material-symbols-outlined text-lg">close</span>
                </button>
              </div>

              {/* Scrollable Form Body */}
              <form onSubmit={handleSaveEdit} className="flex flex-col flex-1 overflow-hidden">
                <div className="p-5 overflow-y-auto flex flex-col gap-4 max-h-[calc(90vh-140px)]">
                  {/* Field 1: Capacity (Seats) */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center justify-between">
                      <span>Capacity (Seats)</span>
                      <span className="text-[10px] text-slate-400 font-normal lowercase">max 300</span>
                    </label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg pointer-events-none">
                        groups
                      </span>
                      <input
                        type="number"
                        value={editCapacity}
                        onChange={(e) => setEditCapacity(Number(e.target.value))}
                        className="w-full h-11 pl-10 pr-12 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-slate-800 focus:bg-white focus:ring-2 focus:ring-slate-800/10 transition-all"
                        min={5}
                        max={300}
                        required
                      />
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-semibold uppercase pointer-events-none">
                        seats
                      </span>
                    </div>
                  </div>

                  {/* Field 2: Space Type */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                      Space Type
                    </label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => {
                          setIsTypeDropdownOpen(!isTypeDropdownOpen);
                          setIsStatusDropdownOpen(false);
                        }}
                        className={`w-full h-11 px-3.5 rounded-xl border flex items-center justify-between transition-all text-xs font-bold ${
                          isTypeDropdownOpen
                            ? 'border-slate-800 ring-2 ring-slate-800/10 bg-white shadow-xs'
                            : 'border-slate-200 bg-slate-50 hover:bg-slate-100/70 text-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="material-symbols-outlined text-base text-slate-600 shrink-0">
                            {getTypeIcon(editType)}
                          </span>
                          <span className="text-slate-900 font-bold truncate">{editType}</span>
                        </div>
                        <span
                          className={`material-symbols-outlined text-lg text-slate-400 transition-transform shrink-0 ${
                            isTypeDropdownOpen ? 'rotate-180 text-slate-800' : ''
                          }`}
                        >
                          expand_more
                        </span>
                      </button>

                      {/* In-App Space Type Dropdown Menu */}
                      {isTypeDropdownOpen && (
                        <div className="mt-1.5 p-1.5 bg-slate-50 border border-slate-200 rounded-xl flex flex-col gap-1 shadow-xs animate-in fade-in duration-150">
                          {TYPE_OPTIONS.map((opt) => {
                            const isSelected = editType === opt.value;
                            return (
                              <button
                                key={opt.value}
                                type="button"
                                onClick={() => {
                                  setEditType(opt.value);
                                  setIsTypeDropdownOpen(false);
                                }}
                                className={`w-full p-2.5 rounded-lg flex items-center justify-between text-left transition-all active:scale-[0.99] ${
                                  isSelected
                                    ? 'bg-white border border-slate-300 shadow-xs'
                                    : 'hover:bg-white/60 text-slate-700 border border-transparent'
                                }`}
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <span className={`material-symbols-outlined text-base shrink-0 ${
                                    isSelected ? 'text-slate-900' : 'text-slate-500'
                                  }`}>
                                    {opt.icon}
                                  </span>
                                  <div className="truncate">
                                    <div className="flex items-center gap-1.5">
                                      <span className={`text-xs font-bold ${
                                        isSelected ? 'text-slate-900' : 'text-slate-700'
                                      }`}>
                                        {opt.label}
                                      </span>
                                      {isSelected && (
                                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-800">
                                          Current
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-[10.5px] text-slate-500 leading-tight truncate mt-0.5">
                                      {opt.desc}
                                    </p>
                                  </div>
                                </div>
                                <div
                                  className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ml-2 ${
                                    isSelected
                                      ? 'border-slate-800 bg-slate-900 text-white'
                                      : 'border-slate-300'
                                  }`}
                                >
                                  {isSelected && (
                                    <span className="material-symbols-outlined text-[11px]">
                                      check
                                    </span>
                                  )}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Field 3: Live Status */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                      Live Status
                    </label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => {
                          setIsStatusDropdownOpen(!isStatusDropdownOpen);
                          setIsTypeDropdownOpen(false);
                        }}
                        className={`w-full h-11 px-3.5 rounded-xl border flex items-center justify-between transition-all text-xs font-bold ${
                          isStatusDropdownOpen
                            ? 'border-emerald-600 ring-2 ring-emerald-500/20 bg-white shadow-xs'
                            : 'border-slate-200 bg-slate-50 hover:bg-slate-100/70 text-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                              editStatus === 'VACANT'
                                ? 'bg-emerald-500 animate-pulse'
                                : editStatus === 'OCCUPIED'
                                ? 'bg-rose-500'
                                : editStatus === 'RESERVED'
                                ? 'bg-amber-500'
                                : 'bg-slate-400'
                            }`}
                          />
                          <span className="text-slate-900 font-bold truncate">{editStatus}</span>
                        </div>
                        <span
                          className={`material-symbols-outlined text-lg text-slate-400 transition-transform shrink-0 ${
                            isStatusDropdownOpen ? 'rotate-180 text-emerald-600' : ''
                          }`}
                        >
                          expand_more
                        </span>
                      </button>

                      {/* In-App Live Status Dropdown Menu */}
                      {isStatusDropdownOpen && (
                        <div className="mt-1.5 p-1.5 bg-slate-50 border border-slate-200 rounded-xl flex flex-col gap-1 shadow-xs animate-in fade-in duration-150">
                          {STATUS_OPTIONS.map((opt) => {
                            const isSelected = editStatus === opt.value;
                            return (
                              <button
                                key={opt.value}
                                type="button"
                                onClick={() => {
                                  setEditStatus(opt.value);
                                  setIsStatusDropdownOpen(false);
                                }}
                                className={`w-full p-2.5 rounded-lg flex items-center justify-between text-left transition-all active:scale-[0.99] ${
                                  isSelected
                                    ? 'bg-white border border-emerald-300 shadow-xs'
                                    : 'hover:bg-white/60 text-slate-700 border border-transparent'
                                }`}
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${opt.dotColor}`} />
                                  <div className="truncate">
                                    <div className="flex items-center gap-1.5">
                                      <span className={`text-xs font-bold ${
                                        isSelected ? 'text-slate-900' : 'text-slate-700'
                                      }`}>
                                        {opt.label}
                                      </span>
                                      {isSelected && (
                                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800">
                                          Selected
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-[10.5px] text-slate-500 leading-tight truncate mt-0.5">
                                      {opt.desc}
                                    </p>
                                  </div>
                                </div>
                                <div
                                  className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ml-2 ${
                                    isSelected
                                      ? 'border-emerald-600 bg-emerald-600 text-white'
                                      : 'border-slate-300'
                                  }`}
                                >
                                  {isSelected && (
                                    <span className="material-symbols-outlined text-[11px]">
                                      check
                                    </span>
                                  )}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bottom Action Buttons */}
                <div className="p-4 border-t border-slate-100 bg-slate-50/90 shrink-0 flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingRoomId(null);
                      setIsTypeDropdownOpen(false);
                      setIsStatusDropdownOpen(false);
                    }}
                    className="flex-1 h-11 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold rounded-xl active:scale-[0.98] transition-all flex items-center justify-center gap-1"
                  >
                    <span>Cancel</span>
                  </button>
                  <button
                    type="submit"
                    className="flex-1 h-11 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-base">check_circle</span>
                    <span>Save Changes</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
