'use client';

import React, { useState, useEffect } from 'react';
import { useSpotFree } from '@/context/SpotFreeContext';
import { UserRole } from '@/lib/types';

export const LoginScreen: React.FC = () => {
  const { currentRole, loginWithProfile, navigate, showToast } = useSpotFree();
  const [selectedRole, setSelectedRole] = useState<UserRole>(currentRole || 'Student');
  const [email, setEmail] = useState<string>('');
  const [emailError, setEmailError] = useState<string>('');

  // OTP Login states
  const [otpSent, setOtpSent] = useState<boolean>(false);
  const [otpValue, setOtpValue] = useState<string>('');
  const [otpLoading, setOtpLoading] = useState<boolean>(false);
  const [otpError, setOtpError] = useState<string>('');
  const [resendCountdown, setResendCountdown] = useState<number>(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendCountdown > 0) {
      timer = setTimeout(() => setResendCountdown((c) => c - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCountdown]);

  const handleRoleChange = (role: UserRole) => {
    setSelectedRole(role);
    setEmailError('');
    setOtpError('');
  };

  const validateEmail = (): boolean => {
    if (!email.trim()) {
      setEmailError('Please enter your email address');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setEmailError('Please enter a valid email format');
      return false;
    }
    setEmailError('');
    return true;
  };

  const requestOtp = async (isResend = false) => {
    if (!validateEmail() || otpLoading) return;
    setOtpLoading(true);
    setOtpError('');
    try {
      const res = await fetch('/api/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setOtpError(data.error || 'Could not send OTP. Try again.');
        showToast(data.error || 'Could not send OTP', 'error');
        return;
      }
      setOtpSent(true);
      setOtpValue('');
      setResendCountdown(30);
      showToast(
        data.mailed
          ? `${isResend ? 'New OTP' : 'OTP'} sent to ${email.trim()}`
          : 'Email service not configured: OTP printed in backend console',
        'mark_email_read'
      );
    } catch {
      setOtpError('Network error. Try again.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleSendOtp = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    requestOtp(false);
  };

  const handleResendOtp = () => {
    if (resendCountdown > 0) return;
    requestOtp(true);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(otpValue.trim())) {
      setOtpError('Please enter the 6-digit OTP');
      return;
    }
    setOtpLoading(true);
    try {
      const res = await fetch('/api/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), otp: otpValue.trim(), role: selectedRole.toLowerCase() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setOtpError(data.error || 'Invalid OTP code.');
        showToast(data.error || 'Invalid OTP entered', 'error');
        return;
      }
      setOtpError('');
      if (!data.registered) {
        showToast('No account for this email yet. Create one to continue.', 'info');
        navigate('signup');
        return;
      }
      showToast('OTP verified successfully!', 'verified');
      loginWithProfile(data.user);
    } catch {
      setOtpError('Network error. Try again.');
    } finally {
      setOtpLoading(false);
    }
  };

  return (
    <div className="flex flex-col w-full px-5 py-6 min-h-screen bg-[#f8f9ff]">
      {/* Top Header Logo */}
      <div className="flex flex-col items-center text-center mt-3 mb-6">
        <div className="w-16 h-16 rounded-2xl bg-[#0f172a] flex items-center justify-center shadow-md mb-3 relative overflow-hidden">
          <div className="absolute -right-2 -bottom-2 w-8 h-8 rounded-full bg-emerald-400/20" />
          <span className="material-symbols-outlined text-emerald-400 text-3xl">meeting_room</span>
        </div>
        <div className="flex items-center gap-1.5 justify-center">
          <span className="font-extrabold text-2xl tracking-tight text-slate-900">
            Spot<span className="text-emerald-600">Free</span>
          </span>
          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">
            HIT
          </span>
        </div>
        <p className="text-xs font-semibold text-slate-600 mt-1">Heritage Institute of Technology</p>
        <p className="text-[11px] text-slate-400 italic mt-0.5 tracking-wide">
          Find. Learn. Use. Better Spaces.
        </p>
      </div>

      {/* Login Card */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 flex flex-col gap-4">
        {/* Role Selector */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Select Role
          </label>
          <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => handleRoleChange('student')}
              className={`flex items-center justify-center py-2 px-1 rounded-lg text-center transition-all cursor-pointer ${
                selectedRole.toLowerCase() === 'student'
                  ? 'bg-white text-slate-900 shadow-sm font-bold'
                  : 'text-slate-500 hover:text-slate-800 font-medium'
              }`}
            >
              <div className="flex items-center gap-1">
                {selectedRole.toLowerCase() === 'student' && (
                  <span className="material-symbols-outlined text-sm text-emerald-600">check_circle</span>
                )}
                <span className="text-xs">Student</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleRoleChange('faculty')}
              className={`flex items-center justify-center py-2 px-1 rounded-lg text-center transition-all cursor-pointer ${
                selectedRole.toLowerCase() === 'faculty'
                  ? 'bg-white text-slate-900 shadow-sm font-bold'
                  : 'text-slate-500 hover:text-slate-800 font-medium'
              }`}
            >
              <div className="flex items-center gap-1">
                {selectedRole.toLowerCase() === 'faculty' && (
                  <span className="material-symbols-outlined text-sm text-emerald-600">check_circle</span>
                )}
                <span className="text-xs">Faculty</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleRoleChange('admin')}
              className={`flex items-center justify-center py-2 px-1 rounded-lg text-center transition-all cursor-pointer ${
                selectedRole.toLowerCase() === 'admin'
                  ? 'bg-white text-slate-900 shadow-sm font-bold'
                  : 'text-slate-500 hover:text-slate-800 font-medium'
              }`}
            >
              <div className="flex items-center gap-1">
                {selectedRole.toLowerCase() === 'admin' && (
                  <span className="material-symbols-outlined text-sm text-emerald-600">check_circle</span>
                )}
                <span className="text-xs">Admin</span>
              </div>
            </button>
          </div>
        </div>

        {(
          /* OTP LOGIN FLOW */
          <div className="flex flex-col gap-3.5">
            {/* Email Field */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-700" htmlFor="otp-email">
                Campus Email
              </label>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-3 text-slate-400 text-lg pointer-events-none">
                  mail
                </span>
                <input
                  id="otp-email"
                  type="email"
                  value={email}
                  disabled={otpSent}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (emailError) setEmailError('');
                  }}
                  placeholder="Enter your campus email"
                  className={`w-full h-11 pl-9 pr-3 rounded-lg border text-xs text-slate-900 font-medium focus:outline-none transition-colors ${
                    otpSent ? 'bg-slate-100 text-slate-500 cursor-not-allowed border-slate-200' : 'bg-slate-50 border-slate-200 focus:bg-white focus:border-slate-400'
                  } ${emailError ? 'border-rose-400 focus:border-rose-500' : ''}`}
                />
              </div>
              {emailError && (
                <span className="text-[11px] text-rose-600 font-medium">{emailError}</span>
              )}
            </div>

            {!otpSent ? (
              /* State 1: Send OTP */
              <div className="flex flex-col gap-3 pt-1">
                <p className="text-[11px] text-slate-500 leading-normal">
                  A 6-digit one-time passcode will be dispatched to your registered campus email to authenticate instantly.
                </p>

                <button
                  type="button"
                  onClick={() => handleSendOtp()}
                  disabled={otpLoading}
                  className="disabled:opacity-60 w-full h-12 rounded-xl bg-[#0f172a] hover:bg-slate-800 active:scale-[0.98] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-base text-emerald-400">send</span>
                  <span>{otpLoading ? 'SENDING...' : 'SEND OTP TO EMAIL'}</span>
                </button>
              </div>
            ) : (
              /* State 2: OTP Verification */
              <form onSubmit={handleVerifyOtp} className="flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-semibold text-slate-700" htmlFor="otp-input">
                      Enter 6-Digit OTP
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setOtpSent(false);
                        setOtpValue('');
                        setOtpError('');
                      }}
                      className="text-[11px] text-emerald-600 hover:underline cursor-pointer"
                    >
                      Change Email
                    </button>
                  </div>
                  <div className="relative flex items-center">
                    <span className="material-symbols-outlined absolute left-3 text-slate-400 text-lg pointer-events-none">
                      pin
                    </span>
                    <input
                      id="otp-input"
                      type="text"
                      maxLength={6}
                      value={otpValue}
                      onChange={(e) => {
                        setOtpValue(e.target.value.replace(/\D/g, ''));
                        if (otpError) setOtpError('');
                      }}
                      placeholder="e.g. 123456"
                      autoFocus
                      className={`w-full h-11 pl-9 pr-3 rounded-lg bg-slate-50 border text-sm text-slate-900 font-mono tracking-widest font-bold focus:bg-white focus:outline-none transition-colors ${
                        otpError ? 'border-rose-400 focus:border-rose-500' : 'border-slate-200 focus:border-slate-400'
                      }`}
                    />
                  </div>
                  {otpError && (
                    <span className="text-[11px] text-rose-600 font-medium flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">error</span>
                      {otpError}
                    </span>
                  )}
                </div>

                {/* Verify Button */}
                <button
                  type="submit"
                  disabled={otpLoading}
                  className="disabled:opacity-60 w-full h-12 rounded-xl bg-[#0f172a] hover:bg-slate-800 active:scale-[0.98] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all mt-1 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-base text-emerald-400">verified</span>
                  <span>{otpLoading ? 'VERIFYING...' : 'VERIFY OTP & LOGIN'}</span>
                </button>

                {/* Resend OTP */}
                <div className="flex items-center justify-between text-xs pt-1 text-slate-500">
                  <span>Didn't receive code?</span>
                  <button
                    type="button"
                    disabled={resendCountdown > 0}
                    onClick={handleResendOtp}
                    className={`font-bold transition-colors cursor-pointer ${
                      resendCountdown > 0
                        ? 'text-slate-400 cursor-not-allowed'
                        : 'text-emerald-700 hover:text-emerald-800 hover:underline'
                    }`}
                  >
                    {resendCountdown > 0 ? `Resend in ${resendCountdown}s` : 'Resend OTP'}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Don't have an account? Sign Up */}
        <div className="pt-2.5 border-t border-slate-100 flex items-center justify-center gap-1 text-xs">
          <span className="text-slate-500">Don't have an account?</span>
          <button
            type="button"
            onClick={() => navigate('signup')}
            className="text-emerald-600 font-bold hover:underline cursor-pointer"
          >
            Sign Up
          </button>
        </div>
      </div>

      {/* Footer Info */}
      <div className="mt-6 flex flex-col items-center text-center gap-2.5">
        <div className="flex items-center gap-1.5 bg-slate-200/70 px-3 py-1.5 rounded-full text-[11px] text-slate-600">
          <span className="material-symbols-outlined text-emerald-600 text-sm">verified_user</span>
          <span>Institutional campus authentication enabled for HIT accounts</span>
        </div>
        <div className="flex gap-3 text-[11px] text-slate-500 mt-1">
          <button
            type="button"
            onClick={() => showToast('Campus Buildings: CME, CB, and ICT Buildings')}
            className="hover:underline cursor-pointer"
          >
            Campus Map
          </button>
          <span>•</span>
          <button
            type="button"
            onClick={() => showToast('HIT Help Desk: IT Admin Cell (CME 2nd Floor)')}
            className="hover:underline cursor-pointer"
          >
            Help Desk
          </button>
          <span>•</span>
          <button
            type="button"
            onClick={() => showToast('HIT Campus Security Protocol active')}
            className="hover:underline cursor-pointer"
          >
            Security
          </button>
        </div>
      </div>

    </div>
  );
};

export default LoginScreen;
