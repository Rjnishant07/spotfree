'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Header } from '../Header';
import { useSpotFree } from '@/context/SpotFreeContext';

type UserRow = {
  id: number;
  public_id: string;
  email: string;
  name: string;
  role: 'Student' | 'Faculty' | 'Admin' | string;
  dept?: string | null;
  roll_number?: string | null;
  branch?: string | null;
  year?: string | null;
  semester?: string | null;
  grp?: string | null;
};

type Filter = 'All' | 'Students' | 'Faculty' | 'Admins';

export const UserManagementScreen: React.FC = () => {
  const { currentUser, navigate, showToast } = useSpotFree();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [filter, setFilter] = useState<Filter>('All');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch('/api/admin/users')
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || 'Could not load users.');
        return data;
      })
      .then((data) => {
        if (!cancelled) setUsers(Array.isArray(data.users) ? data.users : []);
      })
      .catch((err) => {
        if (!cancelled) showToast(err.message || 'Could not load users.', 'error');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [showToast]);

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((u) => {
      const roleMatch =
        filter === 'All' ||
        (filter === 'Students' && u.role.toLowerCase() === 'student') ||
        (filter === 'Faculty' && u.role.toLowerCase() === 'faculty') ||
        (filter === 'Admins' && u.role.toLowerCase() === 'admin');
      const text = [u.name, u.email, u.public_id, u.role, u.dept, u.branch, u.roll_number]
        .filter(Boolean).join(' ').toLowerCase();
      return roleMatch && (!q || text.includes(q));
    });
  }, [users, filter, search]);

  const counts = {
    All: users.length,
    Students: users.filter((u) => u.role.toLowerCase() === 'student').length,
    Faculty: users.filter((u) => u.role.toLowerCase() === 'faculty').length,
    Admins: users.filter((u) => u.role.toLowerCase() === 'admin').length,
  };

  const roleStyle = (role: string) => {
    const r = role.toLowerCase();
    if (r === 'admin') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (r === 'faculty') return 'bg-purple-50 text-purple-700 border-purple-200';
    return 'bg-sky-50 text-sky-700 border-sky-200';
  };

  return (
    <div className="flex flex-col w-full min-h-screen pb-24 bg-[#fafaf9]">
      <Header title="User Management" subtitle="SpotFree Administration" showBack onBack={() => navigate('admin-dashboard')} />
      <main className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-5">
        <div className="bg-[#1c1917] text-white p-5 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <span className="inline-flex bg-emerald-500 text-slate-950 text-[10px] font-extrabold px-2 py-1 rounded">ADMIN</span>
            <h2 className="text-lg font-bold mt-2">Campus User Directory</h2>
            <p className="text-xs text-slate-400">Live users from the SpotFree database</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-slate-800 flex items-center justify-center text-emerald-400">
            <span className="material-symbols-outlined">manage_accounts</span>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {(['All', 'Students', 'Faculty', 'Admins'] as Filter[]).map((item) => (
            <button
              key={item}
              onClick={() => setFilter(item)}
              className={`rounded-xl border px-2 py-3 text-center transition-all ${filter === item ? 'border-emerald-500 bg-emerald-50 text-emerald-800' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'}`}
            >
              <div className="text-lg font-black">{counts[item]}</div>
              <div className="text-[10px] font-bold">{item}</div>
            </button>
          ))}
        </div>

        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email, ID, department..."
            className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm outline-none focus:border-emerald-500"
          />
        </div>

        <section className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">{filter}</h3>
              <p className="text-[11px] text-slate-400">{filteredUsers.length} user{filteredUsers.length === 1 ? '' : 's'} shown</p>
            </div>
            <span className="text-[11px] text-slate-400">{currentUser.dept}</span>
          </div>

          {loading ? (
            <div className="p-10 text-center text-sm text-slate-500">Loading users...</div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-10 text-center text-sm text-slate-500">No users match your search.</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredUsers.map((u) => (
                <div key={u.id} className="p-4 flex flex-col sm:flex-row sm:items-center gap-3 hover:bg-slate-50">
                  <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold shrink-0">
                    {(u.name || '?').split(/\s+/).map((p) => p[0]).slice(0, 2).join('').toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">{u.name}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${roleStyle(u.role)}`}>{u.role}</span>
                    </div>
                    <div className="text-xs text-slate-500 truncate mt-0.5">{u.email}</div>
                    <div className="text-[11px] text-slate-400 mt-1">
                      {[u.public_id, u.branch, u.dept].filter(Boolean).join(' • ')}
                    </div>
                  </div>
                  {u.role.toLowerCase() === 'student' && u.year && (
                    <div className="text-right text-[11px] text-slate-500 shrink-0">
                      <div className="font-semibold">{u.year}</div>
                      <div>{u.semester || ''}</div>
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
