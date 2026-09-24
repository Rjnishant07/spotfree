'use client';

import React, { useState, useEffect } from 'react';
import { useSpotFree } from '@/context/SpotFreeContext';
import { UserProfile } from '@/lib/types';

export const SignUpScreen: React.FC = () => {
  const { registerUser, loginWithProfile, navigate, showToast } = useSpotFree();

  const [selectedRole, setSelectedRole] = useState<'Student'>('Student');
  const [fullName, setFullName] = useState<string>('');
  const [email, setEmail] = useState<string>('');

  // Student-specific fields
  const [rollNumber, setRollNumber] = useState<string>('');
  const [branch, setBranch] = useState<string>('CSE (Data Science)');
  const [year, setYear] = useState<string>('2nd Year');
  const [semester, setSemester] = useState<string>('1st Semester');
  const [group, setGroup] = useState<string>('Group 1');

  // Errors & Multi-Step Verification states
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [signupStep, setSignupStep] = useState<'details' | 'otp' | 'success'>('details');
  const [registeredName, setRegisteredName] = useState<string>('');
  const [createdUser, setCreatedUser] = useState<UserProfile | null>(null);
  const [busy, setBusy] = useState<boolean>(false);

  // OTP Verification state
  const [otpValue, setOtpValue] = useState<string>('');
  const [otpError, setOtpError] = useState<string>('');
  const [resendCountdown, setResendCountdown] = useState<number>(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendCountdown > 0) {
      timer = setTimeout(() => setResendCountdown((c) => c - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCountdown]);

  const validate = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    if (!email.trim()) {
      newErrors.email = 'Campus email is required';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        newErrors.email = 'Please enter a valid email format';
      }
    }

    if (selectedRole === 'Student') {
      if (!rollNumber.trim()) {
        newErrors.rollNumber = 'Roll number is required';
      }
      if (!branch.trim()) {
        newErrors.branch = 'Branch is required';
      }
      if (!year.trim()) {
        newErrors.year = 'Year is required';
      }
      if (!semester.trim()) {
        newErrors.semester = 'Semester is required';
      }
      if (!group.trim()) {
        newErrors.group = 'Group is required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const sendCode = async (isResend: boolean) => {
    if (busy) return;
    setBusy(true);
    setOtpError('');
    try {
      const res = await fetch('/api/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = data.error || 'Could not send code. Try again.';
        if (isResend) setOtpError(msg);
        else setErrors((prev) => ({ ...prev, email: msg }));
        showToast(msg, 'error');
        return;
      }
      setOtpValue('');
      setResendCountdown(30);
      setSignupStep('otp');
      showToast(
        data.mailed
          ? `${isResend ? 'New code' : 'Code'} sent to ${email.trim()}`
          : 'Email service not configured: OTP printed in backend console',
        'mark_email_read'
      );
    } catch {
      showToast('Network error. Try again.', 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleProceedToOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      showToast('Please fix the errors in the form', 'error');
      return;
    }
    sendCode(false);
  };

  const handleResendOtp = () => {
    if (resendCountdown > 0) return;
    sendCode(true);
  };

  const handleVerifyAndCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(otpValue.trim())) {
      setOtpError('Please enter the 6-digit verification code');
      return;
    }
    if (busy) return;
    setBusy(true);
    try {
      const vr = await fetch('/api/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), otp: otpValue.trim(), role: 'student' }),
      });
      const vd = await vr.json().catch(() => ({}));
      if (!vr.ok) {
        setOtpError(vd.error || 'Invalid verification code.');
        showToast(vd.error || 'Invalid verification code', 'error');
        return;
      }
      if (vd.registered) {
        showToast('You already have an account. Logging you in.', 'info');
        loginWithProfile(vd.user);
        return;
      }

      const res = await registerUser({
        name: fullName.trim(),
        email: email.trim(),
        rollNumber: rollNumber.trim(),
        branch: branch.trim(),
        year: year.trim(),
        semester: semester.trim(),
        group: group.trim(),
      });
      if (!res.success || !res.user) {
        setOtpError(res.error || 'Registration failed');
        showToast(res.error || 'Registration failed', 'error');
        return;
      }
      setCreatedUser(res.user);
      setRegisteredName(res.user.name);
      setSignupStep('success');
    } catch {
      setOtpError('Network error. Try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col w-full px-5 py-6 min-h-screen bg-[#f8f9ff]">
      {/* Top Header Logo */}
      <div className="flex flex-col items-center text-center mt-3 mb-5">
        <div className="w-16 h-16 rounded-2xl bg-[#0f172a] flex items-center justify-center shadow-md mb-3 relative overflow-hidden">
          <div className="absolute -right-2 -bottom-2 w-8 h-8 rounded-full bg-emerald-400/20" />
          <span className="material-symbols-outlined text-emerald-400 text-3xl">how_to_reg</span>
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
          Create Your Campus Space Account
        </p>
      </div>

      {signupStep === 'success' ? (
        /* Success Card */
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col items-center text-center gap-4">
          <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
            <span className="material-symbols-outlined text-3xl">check_circle</span>
          </div>

          <div>
            <h2 className="font-bold text-lg text-slate-900">Account Created!</h2>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              Welcome, <span className="font-bold text-slate-800">{registeredName}</span>! Your{' '}
              <span className="font-bold text-emerald-700">{selectedRole}</span> account has been registered for{' '}
              <span className="font-semibold text-slate-700">{email}</span>.
            </p>
          </div>

          <div className="w-full pt-2">
            <button
              onClick={() => createdUser && loginWithProfile(createdUser)}
              className="w-full h-12 rounded-xl bg-[#0f172a] hover:bg-slate-800 active:scale-[0.98] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
            >
              <span>Go to Dashboard</span>
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          </div>
        </div>
      ) : signupStep === 'otp' ? (
        /* OTP Verification Card */
        <form onSubmit={handleVerifyAndCreate} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
              <span className="material-symbols-outlined text-xl">mark_email_read</span>
            </div>
            <div>
              <h2 className="font-bold text-sm text-slate-900">Verify Campus Email</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                We sent a 6-digit code to <strong className="text-slate-800">{email}</strong>
              </p>
            </div>
          </div>

          {/* OTP Input Field */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-700" htmlFor="signup-otp">
              Enter 6-Digit Verification Code
            </label>
            <div className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-3 text-slate-400 text-lg pointer-events-none">
                pin
              </span>
              <input
                id="signup-otp"
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

          {/* Verify & Create Account Button */}
          <button
            type="submit"
            disabled={busy}
            className="disabled:opacity-60 w-full h-12 rounded-xl bg-[#0f172a] hover:bg-slate-800 active:scale-[0.98] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all mt-1 cursor-pointer"
          >
            <span className="material-symbols-outlined text-base text-emerald-400">how_to_reg</span>
            <span>VERIFY OTP & CREATE ACCOUNT</span>
          </button>

          {/* Resend OTP & Back */}
          <div className="flex items-center justify-between text-xs pt-1 text-slate-500 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                setSignupStep('details');
                setOtpError('');
              }}
              className="text-slate-500 hover:text-slate-800 flex items-center gap-1 font-semibold cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">arrow_back</span>
              <span>Edit Details</span>
            </button>

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
      ) : (
        /* Sign Up Form Card (Details Step) */
        <form onSubmit={handleProceedToOtp} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 flex flex-col gap-3.5">
          <div className="flex items-start gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-500 leading-snug">
            <span className="material-symbols-outlined text-base text-emerald-600 shrink-0">school</span>
            <span>Student sign-up with your campus email. Faculty and admin accounts are created by campus admins.</span>
          </div>

          {/* Full Name */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-700" htmlFor="signup-name">
              Full Name
            </label>
            <div className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-3 text-slate-400 text-lg pointer-events-none">
                person
              </span>
              <input
                id="signup-name"
                type="text"
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  if (errors.fullName) setErrors(prev => ({ ...prev, fullName: '' }));
                }}
                placeholder="e.g. Nishant Ranjan"
                className={`w-full h-11 pl-9 pr-3 rounded-lg bg-slate-50 border text-xs text-slate-900 font-medium focus:bg-white focus:outline-none transition-colors ${
                  errors.fullName ? 'border-rose-400 focus:border-rose-500' : 'border-slate-200 focus:border-slate-400'
                }`}
              />
            </div>
            {errors.fullName && (
              <span className="text-[11px] text-rose-600 font-medium">{errors.fullName}</span>
            )}
          </div>

          {/* Student Fields: Roll Number */}
          {selectedRole === 'Student' && (
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-700" htmlFor="signup-roll">
                Roll Number
              </label>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-3 text-slate-400 text-lg pointer-events-none">
                  badge
                </span>
                <input
                  id="signup-roll"
                  type="text"
                  value={rollNumber}
                  onChange={(e) => {
                    setRollNumber(e.target.value);
                    if (errors.rollNumber) setErrors(prev => ({ ...prev, rollNumber: '' }));
                  }}
                  placeholder="e.g. 2562014"
                  className={`w-full h-11 pl-9 pr-3 rounded-lg bg-slate-50 border text-xs text-slate-900 font-medium focus:bg-white focus:outline-none transition-colors ${
                    errors.rollNumber ? 'border-rose-400 focus:border-rose-500' : 'border-slate-200 focus:border-slate-400'
                  }`}
                />
              </div>
              {errors.rollNumber && (
                <span className="text-[11px] text-rose-600 font-medium">{errors.rollNumber}</span>
              )}
            </div>
          )}

          {/* Email */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-700" htmlFor="signup-email">
              Email
            </label>
            <div className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-3 text-slate-400 text-lg pointer-events-none">
                mail
              </span>
              <input
                id="signup-email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors(prev => ({ ...prev, email: '' }));
                }}
                placeholder="e.g. nishant.ranjan.ds29@heritageit.edu.in"
                className={`w-full h-11 pl-9 pr-3 rounded-lg bg-slate-50 border text-xs text-slate-900 font-medium focus:bg-white focus:outline-none transition-colors ${
                  errors.email ? 'border-rose-400 focus:border-rose-500' : 'border-slate-200 focus:border-slate-400'
                }`}
              />
            </div>
            {errors.email && (
              <span className="text-[11px] text-rose-600 font-medium">{errors.email}</span>
            )}
          </div>

          {/* Student Fields: Branch, Year, Semester, Group */}
          {selectedRole === 'Student' && (
            <>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-700">Branch</label>
                  <select
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    className="w-full h-11 px-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:bg-white focus:outline-none"
                  >
                    <option value="CSE (Data Science)">CSE (Data Science)</option>
                    <option value="Computer Science & Engg">Computer Science & Engg</option>
                    <option value="Information Technology">Information Technology</option>
                    <option value="Electronics & Comm">Electronics & Comm</option>
                    <option value="Applied Electronics">Applied Electronics</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-700">Year</label>
                  <select
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    className="w-full h-11 px-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:bg-white focus:outline-none"
                  >
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-700">Semester</label>
                  <select
                    value={semester}
                    onChange={(e) => setSemester(e.target.value)}
                    className="w-full h-11 px-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:bg-white focus:outline-none"
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

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-700">Group</label>
                  <select
                    value={group}
                    onChange={(e) => setGroup(e.target.value)}
                    className="w-full h-11 px-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:bg-white focus:outline-none"
                  >
                    <option value="Group 1">Group 1</option>
                    <option value="Group 2">Group 2</option>
                  </select>
                </div>
              </div>
            </>
          )}

          {/* Continue to OTP Verification Button */}
          <button
            type="submit"
            disabled={busy}
            className="disabled:opacity-60 w-full h-12 rounded-xl bg-[#0f172a] hover:bg-slate-800 active:scale-[0.98] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all mt-2 cursor-pointer"
          >
            <span>CONTINUE TO VERIFICATION (OTP)</span>
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </button>

          {/* Already have an account? Login */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-center gap-1 text-xs">
            <span className="text-slate-500">Already have an account?</span>
            <button
              type="button"
              onClick={() => navigate('login')}
              className="text-emerald-600 font-bold hover:underline cursor-pointer"
            >
              Login
            </button>
          </div>
        </form>
      )}

      {/* Footer Info */}
      <div className="mt-6 flex flex-col items-center text-center gap-2.5">
        <div className="flex items-center gap-1.5 bg-slate-200/70 px-3 py-1.5 rounded-full text-[11px] text-slate-600">
          <span className="material-symbols-outlined text-emerald-600 text-sm">verified_user</span>
          <span>Heritage Institute of Technology • Account Portal</span>
        </div>
      </div>
    </div>
  );
};

export default SignUpScreen;
