import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { BookOpen, Users2, BrainCircuit, Mail, User, Lock, Eye, EyeOff, GraduationCap, ShieldCheck, KeyRound, ArrowLeft, CheckCircle2 } from 'lucide-react';

type Mode = 'login' | 'register' | 'forgot';
type Role = 'student' | 'admin';
type Step = 'form' | 'verify';               // registration: details -> OTP
type ForgotStep = 'email' | 'otp' | 'newpass'; // forgot password: email -> OTP -> new password

const inputCls =
  'w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none';
const labelCls = 'block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1';
const MIN_PASSWORD = 8;
const RESEND_SECONDS = 60;
// Admin sign-up (developer approval code) is handled by the old Express server, not the Spring backend.
// Spring only has STUDENT / TEACHER roles, so the Admin option stays hidden until that is ported.
const ENABLE_ADMIN_SIGNUP = true;

export const AuthPage: React.FC = () => {
  const { completeLogin } = useAuth();

  const [mode, setMode] = useState<Mode>('login');
  const [role, setRole] = useState<Role>('student');
  const [step, setStep] = useState<Step>('form');
  const [forgotStep, setForgotStep] = useState<ForgotStep>('email');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailCode, setEmailCode] = useState('');
  const [developerCode, setDeveloperCode] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [devHint, setDevHint] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const resetCodes = () => {
    setStep('form');
    setForgotStep('email');
    setEmailCode('');
    setDeveloperCode('');
    setResetToken('');
    setNewPassword('');
    setConfirmPassword('');
    setDevHint('');
    setCooldown(0);
  };

  const switchMode = (m: Mode) => {
    setMode(m);
    setError('');
    setNotice('');
    setPassword('');
    setShowPassword(false);
    resetCodes();
  };

  const pickRole = (r: Role) => {
    setRole(r);
    setError('');
    resetCodes();
  };

  const isRegister = mode === 'register';
  const isForgot = mode === 'forgot';
  const isAdminReg = isRegister && role === 'admin';
  const verifying = isRegister && step === 'verify';

  // ---- sending codes ----
  const sendAdminCodes = async () => {
    setError(''); setBusy(true);
    try {
      const res = await api.requestAdminCodes(fullName.trim(), email.trim(), password);
      setCooldown(RESEND_SECONDS);
      setStep('verify');
    } catch (err: any) {
      setError(err.message || 'Could not send the codes. Please try again.');
    } finally { setBusy(false); }
  };

  const sendStudentCode = async () => {
    setError(''); setNotice(''); setBusy(true);
    try {
      const res = await api.register(fullName.trim(), email.trim(), password);
      setDevHint(res.devOtp || '');
      setCooldown(RESEND_SECONDS);
      setStep('verify');
    } catch (err: any) {
      // Spring blocks a second /register while the first OTP is still pending: continue to the code screen instead.
      if (/already initiated/i.test(err.message || '')) {
        setNotice('A code was already sent to this email. Enter it below, or resend a new one.');
        setStep('verify');
      } else {
        setError(err.message || 'Could not send the verification code. Please try again.');
      }
    } finally { setBusy(false); }
  };

  const resendStudentCode = async () => {
    setError(''); setNotice(''); setBusy(true);
    try {
      const res = await api.resendVerification(email.trim());
      setDevHint(res.devOtp || '');
      setEmailCode('');
      setCooldown(RESEND_SECONDS);
      setNotice('A new code has been sent.');
    } catch (err: any) {
      setError(err.message || 'Could not resend the code.');
    } finally { setBusy(false); }
  };

  const sendResetCode = async () => {
    setError(''); setNotice(''); setBusy(true);
    try {
      const res = await api.forgotPassword(email.trim());
      setDevHint(res.devOtp || '');
      setEmailCode('');
      setCooldown(RESEND_SECONDS);
      setForgotStep('otp');
      setNotice('If that email is registered, we have sent a 6-digit code.');
    } catch (err: any) {
      setError(err.message || 'Could not send the code. Please try again.');
    } finally { setBusy(false); }
  };

  const resend = () => {
    if (isForgot) return sendResetCode();
    if (isAdminReg) return sendAdminCodes();
    return resendStudentCode();
  };

  // ---- submit ----
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setNotice('');

    // Forgot password
    if (isForgot) {
      if (forgotStep === 'email') return sendResetCode();
      if (forgotStep === 'otp') {
        setBusy(true);
        try {
          const res = await api.verifyResetOtp(email.trim(), emailCode.trim());
          setResetToken(res.resetToken);
          setDevHint('');
          setForgotStep('newpass');
        } catch (err: any) {
          setError(err.message || 'Invalid code. Please try again.');
        } finally { setBusy(false); }
        return;
      }
      if (newPassword.length < MIN_PASSWORD) { setError(`Password must be at least ${MIN_PASSWORD} characters.`); return; }
      if (newPassword !== confirmPassword) { setError('Passwords do not match.'); return; }
      setBusy(true);
      try {
        await api.resetPassword(resetToken, newPassword);
        const msg = 'Password reset successfully. Please sign in with your new password.';
        switchMode('login');
        setNotice(msg);
      } catch (err: any) {
        setError(err.message || 'Could not reset your password. Please start again.');
      } finally { setBusy(false); }
      return;
    }

    // Registration, step 2: verify the OTP(s)
    
if (verifying) {
  setBusy(true);

  try {
    if (isAdminReg) {
      await api.verifyAdminRegistration(
        email.trim(),
        emailCode.trim(),
        developerCode.trim()
      );

      // Admin account is created after both OTPs are verified.
      // Verification endpoint does not return a login session.
      setBusy(false);
      // Redirect to your login page here using your existing navigation.
      return;
    }

    const res = await api.verifyEmail(
      email.trim(),
      emailCode.trim(),
      password
    );

    completeLogin(res);
  } catch (err: any) {
    setError(err.message || 'Verification failed. Please try again.');
    setBusy(false);
  }

  return;
}


    // Registration, step 1: validate + send the OTP
    if (isRegister) {
      if (password.length < MIN_PASSWORD) { setError(`Password must be at least ${MIN_PASSWORD} characters.`); return; }
      return isAdminReg ? sendAdminCodes() : sendStudentCode();
    }

    // Sign in
    setBusy(true);
    try {
      const res = await api.login(email.trim(), password);
      completeLogin(res);
    } catch (err: any) {
      setError(err.message || 'Sign in failed. Please try again.');
      setBusy(false);
    }
  };

  // ---- copy ----
  let heading = 'Welcome back';
  let sub = 'Sign in with your email and password.';
  if (isForgot) {
    heading = forgotStep === 'email' ? 'Forgot password?' : forgotStep === 'otp' ? 'Enter the code' : 'Set a new password';
    sub = forgotStep === 'email'
      ? "Enter your account email and we'll send you a 6-digit code."
      : forgotStep === 'otp'
      ? `We sent a 6-digit code to ${email.trim() || 'your email'}.`
      : 'Choose a new password for your account.';
  } else if (verifying) {
    heading = isAdminReg ? 'Verify admin access' : 'Verify your email';
    sub = isAdminReg
      ? 'Enter the code emailed to you and the approval code from the developer.'
      : `We sent a 6-digit code to ${email.trim()}. Enter it to finish creating your account.`;
  } else if (isRegister) {
    heading = isAdminReg ? 'Create Admin Account' : 'Create Student Account';
    sub = isAdminReg ? 'Admin accounts need two verification codes.' : 'Join your university peer community.';
  }

  const showBack = verifying || (isForgot && forgotStep !== 'email');
  const goBack = () => {
    setError(''); setNotice(''); setDevHint('');
    if (isForgot) { setForgotStep(forgotStep === 'newpass' ? 'otp' : 'email'); setEmailCode(''); return; }
    resetCodes();
  };

  const codeInput = (id: string, label: string, value: string, set: (v: string) => void, placeholder: string, Icon: React.ElementType, autoComplete = 'one-time-code') => (
    <div>
      <label className={labelCls} htmlFor={id}>{label}</label>
      <div className="relative">
        <Icon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          id={id}
          type="text"
          inputMode="numeric"
          autoComplete={autoComplete}
          required
          maxLength={6}
          placeholder={placeholder}
          value={value}
          onChange={e => set(e.target.value.replace(/\D/g, ''))}
          className={`${inputCls} tracking-[0.3em] font-mono`}
        />
      </div>
    </div>
  );

  const passwordInput = (id: string, label: string, value: string, set: (v: string) => void, placeholder: string, autoComplete: string, withToggle = true) => (
    <div>
      <label className={labelCls} htmlFor={id}>{label}</label>
      <div className="relative">
        <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          id={id}
          type={showPassword ? 'text' : 'password'}
          required
          minLength={autoComplete === 'current-password' ? undefined : MIN_PASSWORD}
          autoComplete={autoComplete}
          placeholder={placeholder}
          value={value}
          onChange={e => set(e.target.value)}
          className={`${inputCls} pr-9`}
        />
        {withToggle && (
          <button
            type="button"
            onClick={() => setShowPassword(v => !v)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>
    </div>
  );

  const showOtpStep = verifying || (isForgot && forgotStep === 'otp');
  const submitDisabled =
    busy ||
    (showOtpStep && emailCode.length !== 6) ||
    (verifying && isAdminReg && developerCode.length !== 6);

  const submitLabel = busy
    ? (isForgot
        ? (forgotStep === 'email' ? 'Sending code...' : forgotStep === 'otp' ? 'Verifying...' : 'Saving...')
        : verifying ? 'Verifying...' : isRegister ? 'Sending code...' : 'Signing in...')
    : (isForgot
        ? (forgotStep === 'email' ? 'Send reset code' : forgotStep === 'otp' ? 'Verify code' : 'Reset password')
        : verifying ? (isAdminReg ? 'Verify & create admin account' : 'Verify & create account')
        : isRegister ? (isAdminReg ? 'Send verification codes' : 'Send verification code')
        : 'Sign In to Campus');

  const handleGoogleLogin = () => {
    // Starts Spring Security's OAuth2 authorization flow.
    window.location.assign('http://localhost:8080/oauth2/authorization/google');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
        {/* Left Side: Brand and Value Propositions */}
        <div className="p-8 sm:p-10 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="space-y-6 relative z-10">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-extrabold text-xl shadow-sm">
                S
              </div>
              <span className="text-xl font-extrabold tracking-tight">Study Buddy</span>
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight">
                The AI-Powered Campus Learning Ecosystem
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                Connect with classmates, share verified course materials, practice with AI quizzes, and collaborate on real-world projects.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-3 text-xs text-slate-300">
                <BookOpen className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>Verified notes for every branch and semester</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-300">
                <Users2 className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>Collaborative study sprint workspaces</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-300">
                <BrainCircuit className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>AI exam quizzes & flashcards</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Sign-in / Register / Forgot password */}
        <div className="p-8 sm:p-10 flex flex-col justify-center">
          {showBack && (
            <button
              type="button"
              onClick={goBack}
              className="self-start mb-4 inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>
          )}
          <div className="mb-6">
            <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">{heading}</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">{sub}</p>
          </div>

          {error && (
            <div role="alert" className="mb-4 px-3 py-2 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg">
              {error}
            </div>
          )}
          {notice && !error && (
            <div role="status" className="mb-4 px-3 py-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-px" /> <span>{notice}</span>
            </div>
          )}

          {isRegister && !verifying && ENABLE_ADMIN_SIGNUP && (
            <div className="mb-4">
              <span className={labelCls}>Register as</span>
              <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Account type">
                {([
                  { id: 'student', label: 'Student', Icon: GraduationCap },
                  { id: 'admin', label: 'Admin', Icon: ShieldCheck },
                ] as const).map(({ id, label, Icon }) => (
                  <button
                    key={id}
                    type="button"
                    role="radio"
                    aria-checked={role === id}
                    onClick={() => pickRole(id)}
                    className={`flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg border transition-colors ${
                      role === id
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                        : 'border-slate-300 text-slate-600 hover:border-indigo-300'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <form onSubmit={submit} className="space-y-3.5">
            {/* OTP entry (registration verify / forgot-password code) */}
            {showOtpStep && (
              <>
                {codeInput('auth-email-code', 'Code sent to your email *', emailCode, setEmailCode, '6-digit code', KeyRound)}
                {verifying && isAdminReg &&
                  codeInput('auth-dev-code', 'Developer approval code *', developerCode, setDeveloperCode, 'Ask the developer for this code', ShieldCheck, 'off')}
                {devHint && (
                  <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                    Email is not set up on this server, so your code is shown here: <span className="font-mono font-bold">{devHint}</span>
                  </p>
                )}
              </>
            )}

            {/* Name (register form only) */}
            {isRegister && !verifying && (
              <div>
                <label className={labelCls} htmlFor="auth-name">Full Name *</label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    id="auth-name"
                    type="text"
                    required
                    autoComplete="name"
                    placeholder="e.g. Alex Morgan"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    className={inputCls}
                  />
                </div>
              </div>
            )}

            {/* Email (login, register form, forgot step 1) */}
            {((!isForgot && !verifying) || (isForgot && forgotStep === 'email')) && (
              <div>
                <label className={labelCls} htmlFor="auth-email">Email Address *</label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    id="auth-email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className={inputCls}
                  />
                </div>
              </div>
            )}

            {/* Password (login + register form) */}
            {!isForgot && !verifying && (
              <div>
                {passwordInput('auth-password', 'Password *', password, setPassword,
                  isRegister ? 'At least 8 characters' : 'Your password',
                  isRegister ? 'new-password' : 'current-password')}
                {!isRegister && (
                  <div className="text-right mt-1.5">
                    <button
                      type="button"
                      onClick={() => { const e = email; switchMode('forgot'); setEmail(e); }}
                      className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800"
                    >
                      Forgot password?
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* New password (forgot step 3) */}
            {isForgot && forgotStep === 'newpass' && (
              <>
                {passwordInput('auth-new-password', 'New password *', newPassword, setNewPassword, 'At least 8 characters', 'new-password')}
                {passwordInput('auth-confirm-password', 'Confirm new password *', confirmPassword, setConfirmPassword, 'Re-enter new password', 'new-password', false)}
              </>
            )}

            <button
              type="submit"
              disabled={submitDisabled}
              className="w-full py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-xs mt-2 disabled:opacity-50"
            >
              {submitLabel}
            </button>

            {/* Google sign-in is only available on the normal login screen. */}
            {!isRegister && !isForgot && !verifying && (
              <>
                <div className="flex items-center gap-3 py-1" aria-hidden="true">
                  <div className="h-px flex-1 bg-slate-200" />
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">or</span>
                  <div className="h-px flex-1 bg-slate-200" />
                </div>

                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  className="w-full flex items-center justify-center gap-3 py-2.5 px-4 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 transition-colors"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  Continue with Google
                </button>
              </>
            )}

            {showOtpStep && (
              <div className="text-center">
                <button
                  type="button"
                  onClick={resend}
                  disabled={busy || cooldown > 0}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 disabled:text-slate-400"
                >
                  {cooldown > 0 ? `Resend code in ${cooldown}s` : (isAdminReg ? 'Resend codes' : 'Resend code')}
                </button>
              </div>
            )}
          </form>

          {!verifying && (
            <div className="border-t border-slate-100 mt-6 pt-5 text-center text-xs text-indigo-600 font-medium">
              {isForgot ? (
                <>
                  Remembered it?{' '}
                  <button type="button" onClick={() => switchMode('login')} className="font-bold underline underline-offset-2 hover:text-indigo-800">
                    Back to sign in
                  </button>
                </>
              ) : isRegister ? (
                <>
                  Already have an account?{' '}
                  <button type="button" onClick={() => switchMode('login')} className="font-bold underline underline-offset-2 hover:text-indigo-800">
                    Sign in
                  </button>
                </>
              ) : (
                <>
                  Don't have an account? {' '}
                  <button type="button" onClick={() => switchMode('register')} className="font-bold underline underline-offset-2 hover:text-indigo-800">
                    Register here
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
