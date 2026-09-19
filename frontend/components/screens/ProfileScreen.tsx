'use client';

import React, { useState } from 'react';
import { useSpotFree } from '@/context/SpotFreeContext';
import { Header } from '../Header';

export const ProfileScreen: React.FC = () => {
  const {
    currentUser,
    updateUserProfile,
    changeUserPassword,
    navigate,
    showToast,
  } = useSpotFree();

  // Modals state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Edit Profile Form state
  const [editName, setEditName] = useState('');
  const [editRollNumber, setEditRollNumber] = useState('');
  const [editBranch, setEditBranch] = useState('');
  const [editYear, setEditYear] = useState('');
  const [editSemester, setEditSemester] = useState('');
  const [editGroup, setEditGroup] = useState('');
  const [editError, setEditError] = useState('');

  // Change Password Form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const isStudent = currentUser.role.toLowerCase() === 'student';
  const roleDisplay = currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1).toLowerCase();

  // Open Edit Profile modal with fresh currentUser values
  const handleOpenEditModal = () => {
    setEditName(currentUser.name || '');
    setEditRollNumber(currentUser.rollNumber || '');
    setEditBranch(currentUser.branch || 'CSE (Data Science)');
    setEditYear(currentUser.year || '2nd Year');
    setEditSemester(currentUser.semester || '1st Semester');
    setEditGroup(currentUser.group || 'Group 1');
    setEditError('');
    setIsEditModalOpen(true);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) {
      setEditError('Full Name cannot be empty');
      return;
    }

    if (isStudent) {
      if (!editRollNumber.trim()) {
        setEditError('Roll Number cannot be empty');
        return;
      }
      if (!editBranch.trim()) {
        setEditError('Branch cannot be empty');
        return;
      }
      updateUserProfile({
        name: editName.trim(),
        rollNumber: editRollNumber.trim(),
        branch: editBranch.trim(),
        year: editYear,
        semester: editSemester,
        group: editGroup,
      });
    } else {
      updateUserProfile({
        name: editName.trim(),
      });
    }

    setIsEditModalOpen(false);
  };

  // Open Change Password modal
  const handleOpenPasswordModal = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError('');
    setIsPasswordModalOpen(true);
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      setPasswordError('All fields are required.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation do not match.');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters.');
      return;
    }

    const res = changeUserPassword(currentPassword, newPassword);
    if (!res.success) {
      setPasswordError(res.error || 'Failed to update password.');
      return;
    }

    setIsPasswordModalOpen(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleConfirmLogout = () => {
    setIsLoggingOut(true);
    setTimeout(() => {
      setIsLoggingOut(false);
      setIsLogoutModalOpen(false);
      navigate('login', false);
      showToast('Logged out of SpotFree session', 'logout');
    }, 500);
  };

  return (
    <div className="flex flex-col w-full min-h-screen pb-28 bg-[#f8f9ff]">
      {/* 1. HEADER */}
      <Header
        title="Profile"
        subtitle="Account Details"
        showBack={true}
      />

      <main className="flex flex-col px-4 pt-4 gap-4">
        {/* 2. PROFILE IDENTITY CARD */}
        <section
          aria-label="Profile Identity"
          className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex items-center gap-3.5"
        >
          {/* Avatar with Initials */}
          <div className="w-14 h-14 rounded-full bg-[#0f172a] text-white flex items-center justify-center font-bold text-lg shadow-sm ring-4 ring-slate-100 shrink-0">
            {currentUser.avatar || currentUser.name.slice(0, 2).toUpperCase()}
          </div>

          {/* Identity Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-bold text-sm sm:text-base text-slate-900 truncate">
                {currentUser.name}
              </h2>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold shrink-0 ${
                  currentUser.role.toLowerCase() === 'admin'
                    ? 'bg-purple-100 text-purple-800'
                    : currentUser.role.toLowerCase() === 'faculty'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                {roleDisplay}
              </span>
            </div>

            <p className="text-xs text-slate-500 mt-1 truncate break-all">
              {currentUser.email}
            </p>
          </div>
        </section>

        {/* 3. INFORMATION CARD / SECTION */}
        <section aria-label="Profile Information" className="flex flex-col gap-1.5">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">
            Information
          </h3>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 divide-y divide-slate-100 text-xs">
            {/* Name */}
            <div className="flex items-center justify-between py-2.5 first:pt-0 gap-3">
              <span className="font-medium text-slate-500 shrink-0">Name</span>
              <span className="font-semibold text-slate-900 text-right truncate max-w-[65%]">
                {currentUser.name}
              </span>
            </div>

            {/* Student-specific Fields */}
            {isStudent && (
              <>
                <div className="flex items-center justify-between py-2.5 gap-3">
                  <span className="font-medium text-slate-500 shrink-0">Roll Number</span>
                  <span className="font-semibold font-mono text-slate-900 text-right">
                    {currentUser.rollNumber || '2562014'}
                  </span>
                </div>

                <div className="flex items-center justify-between py-2.5 gap-3">
                  <span className="font-medium text-slate-500 shrink-0">Branch</span>
                  <span className="font-semibold text-slate-900 text-right truncate max-w-[65%]">
                    {currentUser.branch || 'CSE (Data Science)'}
                  </span>
                </div>

                <div className="flex items-center justify-between py-2.5 gap-3">
                  <span className="font-medium text-slate-500 shrink-0">Year</span>
                  <span className="font-semibold text-slate-900 text-right">
                    {currentUser.year || '2nd Year'}
                  </span>
                </div>

                <div className="flex items-center justify-between py-2.5 gap-3">
                  <span className="font-medium text-slate-500 shrink-0">Semester</span>
                  <span className="font-semibold text-slate-900 text-right">
                    {currentUser.semester || '1st Semester'}
                  </span>
                </div>

                <div className="flex items-center justify-between py-2.5 gap-3">
                  <span className="font-medium text-slate-500 shrink-0">Group</span>
                  <span className="font-semibold text-slate-900 text-right">
                    {currentUser.group || 'Group 1'}
                  </span>
                </div>
              </>
            )}

            {/* Email */}
            <div className="flex items-center justify-between py-2.5 gap-3">
              <span className="font-medium text-slate-500 shrink-0">Email</span>
              <span className="font-semibold text-slate-900 text-right truncate break-all max-w-[65%]">
                {currentUser.email}
              </span>
            </div>

            {/* Role */}
            <div className="flex items-center justify-between py-2.5 last:pb-0 gap-3">
              <span className="font-medium text-slate-500 shrink-0">Role</span>
              <span className="font-semibold text-slate-900 text-right">
                {roleDisplay}
              </span>
            </div>
          </div>
        </section>

        {/* 4. ACCOUNT ACTIONS */}
        <section aria-label="Account Actions" className="flex flex-col gap-1.5">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">
            Account Actions
          </h3>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm divide-y divide-slate-100 overflow-hidden">
            {/* Edit Profile */}
            <button
              type="button"
              onClick={handleOpenEditModal}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors text-left group cursor-pointer"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 group-hover:bg-slate-200 transition-colors">
                  <span className="material-symbols-outlined text-[18px]">edit</span>
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-slate-900">Edit Profile</div>
                  <div className="text-[11px] text-slate-500 truncate">
                    View and manage profile details
                  </div>
                </div>
              </div>
              <span className="material-symbols-outlined text-slate-400 text-lg group-hover:translate-x-0.5 transition-transform shrink-0">
                chevron_right
              </span>
            </button>

            {/* Change Password */}
            <button
              type="button"
              onClick={handleOpenPasswordModal}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors text-left group cursor-pointer"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 group-hover:bg-slate-200 transition-colors">
                  <span className="material-symbols-outlined text-[18px]">lock_reset</span>
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-slate-900">Change Password</div>
                  <div className="text-[11px] text-slate-500 truncate">
                    Update campus security credentials
                  </div>
                </div>
              </div>
              <span className="material-symbols-outlined text-slate-400 text-lg group-hover:translate-x-0.5 transition-transform shrink-0">
                chevron_right
              </span>
            </button>

            {/* Help & Support */}
            <button
              type="button"
              onClick={() => setIsHelpModalOpen(true)}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors text-left group cursor-pointer"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 group-hover:bg-slate-200 transition-colors">
                  <span className="material-symbols-outlined text-[18px]">support_agent</span>
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-slate-900">Help &amp; Support</div>
                  <div className="text-[11px] text-slate-500 truncate">
                    Campus guidelines &amp; IT helpdesk
                  </div>
                </div>
              </div>
              <span className="material-symbols-outlined text-slate-400 text-lg group-hover:translate-x-0.5 transition-transform shrink-0">
                chevron_right
              </span>
            </button>

            {/* Log Out */}
            <button
              type="button"
              onClick={() => setIsLogoutModalOpen(true)}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-rose-50/50 transition-colors text-left group cursor-pointer"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 group-hover:bg-rose-200 transition-colors">
                  <span className="material-symbols-outlined text-[18px]">logout</span>
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-rose-600">Log Out</div>
                  <div className="text-[11px] text-slate-500 truncate">
                    Sign out of this SpotFree session
                  </div>
                </div>
              </div>
              <span className="material-symbols-outlined text-rose-400 text-lg group-hover:translate-x-0.5 transition-transform shrink-0">
                chevron_right
              </span>
            </button>
          </div>
        </section>

        {/* Subtle Footer */}
        <div className="text-center pt-1 pb-2">
          <p className="text-[11px] text-slate-400">
            SpotFree • Heritage Institute of Technology
          </p>
        </div>
      </main>

      {/* ========================================================================= */}
      {/* 5. EDIT PROFILE MODAL */}
      {/* ========================================================================= */}
      {isEditModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-4 transition-opacity duration-200"
          onClick={() => setIsEditModalOpen(false)}
        >
          <div
            className="bg-white w-full max-w-[440px] rounded-2xl p-5 sm:p-6 shadow-2xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto transform transition-transform"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-xl">edit</span>
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-slate-900">
                    Edit Profile
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Update profile details
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Close Edit Profile"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            {/* Edit Profile Form */}
            <form onSubmit={handleSaveProfile} className="flex flex-col gap-3">
              {editError && (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
                  <span className="material-symbols-outlined text-base shrink-0">error</span>
                  <span>{editError}</span>
                </div>
              )}

              {/* Full Name */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-700">
                  Full Name
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => {
                    setEditName(e.target.value);
                    if (editError) setEditError('');
                  }}
                  placeholder="e.g. Nishant Ranjan"
                  className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 font-medium focus:bg-white focus:outline-none focus:border-slate-400 transition-colors"
                />
              </div>

              {/* Email (READ ONLY, VISIBLY DISABLED) */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700">
                    Email
                  </label>
                  <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-0.5">
                    <span className="material-symbols-outlined text-[12px]">lock</span>
                    READ ONLY
                  </span>
                </div>
                <input
                  type="email"
                  value={currentUser.email}
                  disabled
                  readOnly
                  aria-readonly="true"
                  className="w-full h-10 px-3 rounded-xl bg-slate-100 border border-slate-200 text-slate-500 font-mono text-xs cursor-not-allowed select-none opacity-85"
                />
                <p className="text-[10px] text-slate-400">
                  Campus email is permanent and cannot be changed.
                </p>
              </div>

              {/* Student-specific Editable Fields */}
              {isStudent && (
                <>
                  {/* Roll Number */}
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-slate-700">
                      Roll Number
                    </label>
                    <input
                      type="text"
                      value={editRollNumber}
                      onChange={(e) => {
                        setEditRollNumber(e.target.value);
                        if (editError) setEditError('');
                      }}
                      placeholder="e.g. 2562014"
                      className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 font-medium focus:bg-white focus:outline-none focus:border-slate-400 transition-colors"
                    />
                  </div>

                  {/* Branch */}
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-slate-700">
                      Branch
                    </label>
                    <input
                      type="text"
                      value={editBranch}
                      onChange={(e) => {
                        setEditBranch(e.target.value);
                        if (editError) setEditError('');
                      }}
                      placeholder="e.g. CSE (Data Science)"
                      className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 font-medium focus:bg-white focus:outline-none focus:border-slate-400 transition-colors"
                    />
                  </div>

                  {/* Year and Semester in 2 Columns */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-semibold text-slate-700">
                        Year
                      </label>
                      <select
                        value={editYear}
                        onChange={(e) => setEditYear(e.target.value)}
                        className="w-full h-10 px-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-400 transition-colors cursor-pointer"
                      >
                        <option value="1st Year">1st Year</option>
                        <option value="2nd Year">2nd Year</option>
                        <option value="3rd Year">3rd Year</option>
                        <option value="4th Year">4th Year</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-semibold text-slate-700">
                        Semester
                      </label>
                      <select
                        value={editSemester}
                        onChange={(e) => setEditSemester(e.target.value)}
                        className="w-full h-10 px-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-400 transition-colors cursor-pointer"
                      >
                        <option value="1st Semester">1st Semester</option>
                        <option value="2nd Semester">2nd Semester</option>
                        <option value="3rd Semester">3rd Semester</option>
                        <option value="4th Semester">4th Semester</option>
                        <option value="5th Semester">5th Semester</option>
                        <option value="6th Semester">6th Semester</option>
                        <option value="7th Semester">7th Semester</option>
                        <option value="8th Semester">8th Semester</option>
                      </select>
                    </div>
                  </div>

                  {/* Group */}
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-slate-700">
                      Group
                    </label>
                    <select
                      value={editGroup}
                      onChange={(e) => setEditGroup(e.target.value)}
                      className="w-full h-10 px-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-400 transition-colors cursor-pointer"
                    >
                      <option value="Group 1">Group 1</option>
                      <option value="Group 2">Group 2</option>
                    </select>
                  </div>
                </>
              )}

              {/* Action Buttons: Save Changes & Cancel/Back */}
              <div className="flex flex-col gap-2 pt-2">
                <button
                  type="submit"
                  className="w-full h-10 rounded-xl bg-[#0f172a] text-white font-semibold text-xs flex items-center justify-center hover:bg-slate-800 active:scale-[0.98] transition-all cursor-pointer shadow-sm"
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="w-full h-10 rounded-xl bg-slate-100 text-slate-700 font-semibold text-xs flex items-center justify-center hover:bg-slate-200 active:scale-[0.98] transition-all cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. CHANGE PASSWORD MODAL */}
      {/* ========================================================================= */}
      {isPasswordModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-4 transition-opacity duration-200"
          onClick={() => setIsPasswordModalOpen(false)}
        >
          <div
            className="bg-white w-full max-w-[400px] rounded-2xl p-5 sm:p-6 shadow-2xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto transform transition-transform"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-xl">lock_reset</span>
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-slate-900">
                    Change Password
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Update your account password
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPasswordModalOpen(false)}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Close Change Password"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            {/* Change Password Form */}
            <form onSubmit={handleChangePassword} className="flex flex-col gap-3">
              {passwordError && (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
                  <span className="material-symbols-outlined text-base shrink-0">error</span>
                  <span>{passwordError}</span>
                </div>
              )}

              {/* Current Password */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-700">
                  Current Password
                </label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-3 text-slate-400 text-lg pointer-events-none">
                    key
                  </span>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => {
                      setCurrentPassword(e.target.value);
                      if (passwordError) setPasswordError('');
                    }}
                    placeholder="Enter current password"
                    className="w-full h-10 pl-9 pr-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 font-medium focus:bg-white focus:outline-none focus:border-slate-400 transition-colors"
                  />
                </div>
              </div>

              {/* New Password */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-700">
                  New Password
                </label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-3 text-slate-400 text-lg pointer-events-none">
                    lock
                  </span>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      if (passwordError) setPasswordError('');
                    }}
                    placeholder="Enter new password (min. 6 characters)"
                    className="w-full h-10 pl-9 pr-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 font-medium focus:bg-white focus:outline-none focus:border-slate-400 transition-colors"
                  />
                </div>
              </div>

              {/* Confirm New Password */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-700">
                  Confirm New Password
                </label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-3 text-slate-400 text-lg pointer-events-none">
                    verified_user
                  </span>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (passwordError) setPasswordError('');
                    }}
                    placeholder="Confirm new password"
                    className="w-full h-10 pl-9 pr-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 font-medium focus:bg-white focus:outline-none focus:border-slate-400 transition-colors"
                  />
                </div>
              </div>

              {/* Action Buttons: Save Changes & Cancel */}
              <div className="flex flex-col gap-2 pt-2">
                <button
                  type="submit"
                  className="w-full h-10 rounded-xl bg-[#0f172a] text-white font-semibold text-xs flex items-center justify-center hover:bg-slate-800 active:scale-[0.98] transition-all cursor-pointer shadow-sm"
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="w-full h-10 rounded-xl bg-slate-100 text-slate-700 font-semibold text-xs flex items-center justify-center hover:bg-slate-200 active:scale-[0.98] transition-all cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. HELP & SUPPORT MODAL */}
      {/* ========================================================================= */}
      {isHelpModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-4 transition-opacity duration-200"
          onClick={() => setIsHelpModalOpen(false)}
        >
          <div
            className="bg-white w-full max-w-[460px] rounded-2xl p-5 sm:p-6 shadow-2xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto transform transition-transform"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-xl">support_agent</span>
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-slate-900">
                    Help &amp; Support
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Campus Contact &amp; Information Desk
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsHelpModalOpen(false)}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Close Help & Support"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            {/* Exactly Specified Contact Details */}
            <div className="bg-slate-50/80 rounded-2xl p-4 sm:p-5 border border-slate-200 text-xs text-slate-800 space-y-3 leading-relaxed">
              <div>
                <div className="font-bold text-sm text-slate-900 tracking-tight">
                  Heritage Institute of Technology
                </div>
              </div>

              <div>
                <div>994 Madurdaha, Chowbaga Road, Anandapur</div>
                <div>PO: East Kolkata Township, Kolkata 700 107</div>
              </div>

              <div>
                <div>Ph: +91 33 6627 0600 / 0609 / 0614 / 0622</div>
              </div>

              <div>
                <div>Fax: +91 33 2443 0455 / 1794</div>
              </div>

              <div>
                <div>
                  E-mail:{' '}
                  <a
                    href="mailto:admin@heritageit.edu"
                    className="text-emerald-600 hover:text-emerald-700 underline font-medium"
                  >
                    admin@heritageit.edu
                  </a>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200">
                <div className="font-semibold text-slate-900">
                  INFO DESK:{' '}
                  <a
                    href="tel:9830201234"
                    className="text-emerald-600 hover:text-emerald-700 underline font-bold"
                  >
                    9830201234
                  </a>
                </div>
              </div>
            </div>

            {/* Close / Back Action */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setIsHelpModalOpen(false)}
                className="w-full h-10 rounded-xl bg-slate-100 text-slate-700 font-semibold text-xs flex items-center justify-center hover:bg-slate-200 active:scale-[0.98] transition-all cursor-pointer"
              >
                Back to Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 8. LOGOUT CONFIRMATION MODAL */}
      {/* ========================================================================= */}
      {isLogoutModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-4 transition-opacity duration-200"
          onClick={() => !isLoggingOut && setIsLogoutModalOpen(false)}
        >
          <div
            className="bg-white w-full max-w-[380px] rounded-2xl p-5 shadow-2xl flex flex-col gap-4 transform transition-transform"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-xl">logout</span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-sm text-slate-900 leading-tight">
                  Log Out of SpotFree?
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Are you sure you want to log out? You will need your university credentials to sign back in.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-1">
              <button
                className="w-full h-10 rounded-xl bg-rose-600 text-white font-semibold text-xs flex items-center justify-center hover:bg-rose-700 active:scale-[0.98] transition-all cursor-pointer shadow-sm disabled:opacity-60"
                type="button"
                onClick={handleConfirmLogout}
                disabled={isLoggingOut}
              >
                {isLoggingOut ? (
                  <span className="material-symbols-outlined animate-spin text-base">
                    progress_activity
                  </span>
                ) : (
                  'Log Out'
                )}
              </button>
              <button
                className="w-full h-10 rounded-xl bg-slate-100 text-slate-700 font-semibold text-xs flex items-center justify-center hover:bg-slate-200 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
                type="button"
                onClick={() => setIsLogoutModalOpen(false)}
                disabled={isLoggingOut}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileScreen;
