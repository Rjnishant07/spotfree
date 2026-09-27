'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
  const [error, setError] = useState('');

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/users', { cache: 'no-store' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not load users.');
      setUsers(Array.isArray(data.users) ? data.users : []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not load users.';
      setError(message);
      showToast(message, 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((u) => {
      const roleMatch =
        filter === 'All' ||
        (filter === 'Students' && u.role.toLowerCase() === 'student') ||
        (filter === 'Faculty' && u.role.toLowerCase() === 'faculty') ||
        (filter === 'Admins' && u.role.toLowerCase() === 'admin');

      const text = [
        u.name, u.email, u.public_id, u.role, u.dept, u.branch, u.roll_number, u.year, u.semester,
      ].filter(Boolean).join(' ').toLowerCase();

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
    return 'bg-blue-50 text-blue-700 border-blue-200';
  };

  const filterItems: Array<{ key: Filter; label: string; icon: string }> = [
    { key: 'All', label: 'All users', icon: 'groups' },
    { key: 'Students', label: 'Students', icon: 'school' },
    { key: 'Faculty', label: 'Faculty', icon: 'badge' },
    { key: 'Admins', label: 'Admins', icon: 'admin_panel_settings' },
  ];

  return (
    <div className="flex flex-col w-full min-h-screen pb-24 bg-[#fafaf9]">
      <Header title="User Management" subtitle="SpotFree Administration" showBack />

      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 lg:py-8 flex flex-col gap-5">
        <section className="rounded-3xl bg-[#1c1917] text-white p-5 sm:p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-1.5 bg-emerald-400 text-slate-950 text-[10px] font-extrabold px-2 py-1 rounded-md">
                <span className="material-symbols-outlined text-xs">shield</span>
                ADMIN
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight mt-2">Campus user directory</h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-1">
                {users.length} live records from the SpotFree database
              </p>
            </div>
            <div className="hidden sm:flex w-12 h-12 rounded-2xl bg-white/10 border border-white/10 items-center justify-center text-emerald-300 shrink-0">
              <span className="material-symbols-outlined text-2xl">manage_accounts</span>
            </div>
          </div>
        </section>

        <section aria-label="User counts" className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {filterItems.map((item) => {
            const active = filter === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setFilter(item.key)}
                className={`rounded-2xl border p-3.5 text-left transition-all active:scale-[0.99] ${
                  active
                    ? 'bg-emerald-50 border-emerald-400 ring-2 ring-emerald-500/10'
                    : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className={`w-8 h-8 rounded-xl flex items-center justify-center ${active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                    <span className="material-symbols-outlined text-base">{item.icon}</span>
                  </span>
                  <span className={`text-2xl font-black ${active ? 'text-emerald-800' : 'text-slate-900'}`}>
                    {counts[item.key]}
                  </span>
                </div>
                <div className="text-[10px] font-bold text-slate-500 mt-2">{item.label}</div>
              </button>
            );
          })}
        </section>

        <section className="flex flex-col gap-3">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
              search
            </span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, ID, department or branch"
              aria-label="Search users"
              className="w-full h-12 bg-white border border-slate-200 rounded-2xl pl-11 pr-10 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 shadow-xs"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                aria-label="Clear search"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="px-4 sm:px-5 py-3.5 border-b border-slate-100 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <h3 className="text-sm font-extrabold text-slate-900">{filter === 'All' ? 'All users' : filter}</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {filteredUsers.length} shown{search ? ` for “${search}”` : ''}
                </p>
              </div>
              <span className="hidden sm:block text-[10px] font-medium text-slate-400 truncate max-w-[45%]">
                {currentUser.dept}
              </span>
            </div>

            {loading ? (
              <div className="p-8 sm:p-12 flex flex-col items-center gap-3 text-center">
                <span className="w-8 h-8 rounded-full border-2 border-emerald-200 border-t-emerald-600 animate-spin" />
                <span className="text-xs text-slate-500">Loading campus users…</span>
              </div>
            ) : error ? (
              <div className="p-8 sm:p-12 flex flex-col items-center gap-3 text-center">
                <span className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center">
                  <span className="material-symbols-outlined">cloud_off</span>
                </span>
                <div>
                  <p className="text-sm font-bold text-slate-800">Couldn’t load the directory</p>
                  <p className="text-xs text-slate-500 mt-1">{error}</p>
                </div>
                <button
                  type="button"
                  onClick={loadUsers}
                  className="px-3.5 py-2 rounded-xl bg-[#1c1917] text-white text-xs font-bold hover:bg-slate-800 transition-colors"
                >
                  Try again
                </button>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="p-8 sm:p-12 flex flex-col items-center gap-3 text-center">
                <span className="w-10 h-10 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center">
                  <span className="material-symbols-outlined">person_search</span>
                </span>
                <div>
                  <p className="text-sm font-bold text-slate-800">No matching users</p>
                  <p className="text-xs text-slate-500 mt-1">Try a different name, email, ID or filter.</p>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredUsers.map((u) => (
                  <div
                    key={u.id}
                    className="p-4 sm:px-5 flex items-center gap-3 sm:gap-4 hover:bg-slate-50/80 transition-colors"
                  >
                    <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold shrink-0">
                      {(u.name || '?').split(/\s+/).map((p) => p[0]).slice(0, 2).join('').toUpperCase()}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-extrabold text-sm text-slate-900 truncate max-w-full">{u.name}</span>
                        <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full border ${roleStyle(u.role)}`}>
                          {u.role}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 truncate mt-0.5">{u.email}</div>
                      <div className="text-[10px] sm:text-[11px] text-slate-400 mt-1 truncate">
                        {[u.public_id, u.branch, u.dept].filter(Boolean).join(' • ')}
                      </div>
                    </div>

                    {u.role.toLowerCase() === 'student' && (u.year || u.semester) && (
                      <div className="text-right shrink-0 hidden xs:block">
                        <div className="text-[11px] font-bold text-slate-700">{u.year || 'Student'}</div>
                        <div className="text-[10px] text-slate-400">{u.semester || ''}</div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};
