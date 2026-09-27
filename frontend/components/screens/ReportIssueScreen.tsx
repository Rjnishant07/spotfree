'use client';

import React, { useEffect, useState } from 'react';
import { useSpotFree } from '@/context/SpotFreeContext';
import { useUIPrefs } from '@/context/UIPrefsContext';
import { Header } from '../Header';

type Issue = {
  id: number;
  room_id: string;
  category: string;
  priority: string;
  description: string;
  status: 'Open' | 'In Progress' | 'Resolved';
  created_at: string;
  reporter_name?: string;
  reporter_email?: string;
};

const categories = ['AC','Projector','Lights','Furniture','Cleanliness','Network','Other'];
const priorities = ['Low','Normal','High','Urgent'];

export const ReportIssueScreen: React.FC = () => {
  const { rooms, currentUser, currentRole, showToast } = useSpotFree();
  const { effectiveView } = useUIPrefs();
  const isAdmin = String(currentRole).toLowerCase() === 'admin';
  const isWeb = effectiveView === 'web';

  const [roomId, setRoomId] = useState('');
  const [category, setCategory] = useState('AC');
  const [priority, setPriority] = useState('Normal');
  const [description, setDescription] = useState('');
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/issues');
      const data = await res.json().catch(() => ({}));
      if (res.ok) setIssues(data.issues || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const submit = async () => {
    if (!roomId || description.trim().length < 5) {
      showToast('Select a room and describe the issue', 'error');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId, category, priority, description: description.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast(data.error || 'Could not submit issue', 'error');
        return;
      }
      setDescription('');
      showToast('Issue reported to campus operations', 'report_problem');
      await load();
    } catch {
      showToast('Network error. Try again.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (issue: Issue, status: Issue['status']) => {
    const res = await fetch(`/api/issues/${issue.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      showToast(`Issue marked ${status}`);
      load();
    } else {
      showToast('Could not update issue', 'error');
    }
  };

  return (
    <div className="flex flex-col w-full min-h-screen pb-24 bg-[#fafaf9]">
      <Header title="Report an Issue" subtitle={isAdmin ? 'Campus issue management' : 'Report a room problem'} showBack />
      <main className={isWeb ? 'w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 flex flex-col gap-5' : 'px-4 pt-3 pb-8 flex flex-col gap-4'}>
        <section className="bg-white border border-slate-200 rounded-3xl p-5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center shrink-0"><span className="material-symbols-outlined">report_problem</span></div>
            <div><h2 className="font-black text-slate-900">Room problem?</h2><p className="text-xs text-slate-500 mt-1">Report it so campus operations can track and resolve it.</p></div>
          </div>
          <div className="grid sm:grid-cols-2 gap-3 mt-5">
            <label className="text-xs font-bold text-slate-700">Room
              <select value={roomId} onChange={e => setRoomId(e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm bg-white">
                <option value="">Select room</option>
                {rooms.map(r => <option key={r.id} value={r.id}>{r.id} • {r.building} • {r.capacity} seats</option>)}
              </select>
            </label>
            <label className="text-xs font-bold text-slate-700">Issue type
              <select value={category} onChange={e => setCategory(e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm bg-white">
                {categories.map(c => <option key={c}>{c}</option>)}
              </select>
            </label>
            <label className="text-xs font-bold text-slate-700">Priority
              <select value={priority} onChange={e => setPriority(e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm bg-white">
                {priorities.map(p => <option key={p}>{p}</option>)}
              </select>
            </label>
            <div className="text-xs font-bold text-slate-700">
              Reporter
              <div className="mt-1.5 rounded-xl bg-slate-50 border border-slate-100 px-3 py-2.5 text-sm font-medium text-slate-700">{currentUser.name}</div>
            </div>
          </div>
          <label className="block text-xs font-bold text-slate-700 mt-3">Description
            <textarea value={description} onChange={e => setDescription(e.target.value)} maxLength={1000} rows={4} placeholder="Example: Projector is not turning on." className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
          </label>
          <div className="flex items-center justify-between mt-2">
            <span className="text-[10px] text-slate-400">{description.length}/1000</span>
            <button disabled={saving} onClick={submit} className="px-5 py-2.5 rounded-xl bg-[#1c1917] text-white text-xs font-bold disabled:opacity-50">{saving ? 'Submitting…' : 'Submit Report'}</button>
          </div>
        </section>

        <section className="bg-white border border-slate-200 rounded-3xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div><h3 className="text-sm font-extrabold text-slate-900">{isAdmin ? 'All reported issues' : 'My reported issues'}</h3><p className="text-[10px] text-slate-500">Live from the production database</p></div>
            <button onClick={load} className="text-[11px] font-bold text-emerald-700">Refresh</button>
          </div>
          {loading ? <p className="text-xs text-slate-400 py-6">Loading reports…</p> : issues.length === 0 ? <p className="text-xs text-slate-400 py-6">No issue reports yet.</p> : (
            <div className="space-y-2.5">
              {issues.map(issue => (
                <div key={issue.id} className="border border-slate-200 rounded-2xl p-3.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-black text-xs text-slate-900">{issue.room_id}</span>
                    <span className="text-[10px] px-2 py-1 rounded-full bg-slate-100 text-slate-700 font-bold">{issue.category}</span>
                    <span className="text-[10px] px-2 py-1 rounded-full bg-amber-50 text-amber-700 font-bold">{issue.priority}</span>
                    <span className={`text-[10px] px-2 py-1 rounded-full font-bold ${issue.status === 'Resolved' ? 'bg-emerald-50 text-emerald-700' : issue.status === 'In Progress' ? 'bg-blue-50 text-blue-700' : 'bg-rose-50 text-rose-700'}`}>{issue.status}</span>
                  </div>
                  <p className="text-xs text-slate-700 mt-2">{issue.description}</p>
                  {isAdmin && <p className="text-[10px] text-slate-400 mt-1">Reported by {issue.reporter_name || issue.reporter_email}</p>}
                  {isAdmin && issue.status !== 'Resolved' && (
                    <div className="flex gap-2 mt-3">
                      {issue.status === 'Open' && <button onClick={() => updateStatus(issue, 'In Progress')} className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 text-[10px] font-bold">Start work</button>}
                      <button onClick={() => updateStatus(issue, 'Resolved')} className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-[10px] font-bold">Mark resolved</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};
