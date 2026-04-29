import React, { useState, useEffect, useRef } from 'react';
import { login, register } from '../services/api';
import { animate } from 'animejs';
import { motion, AnimatePresence } from 'framer-motion';

export default function LoginForm({ onLogin }) {
  const [isRegister, setIsRegister]           = useState(false);
  const [username, setUsername]               = useState('');
  const [password, setPassword]               = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName]                       = useState('');
  const [role, setRole]                       = useState('staff');
  const [showPassword, setShowPassword]       = useState(false);
  const [error, setError]                     = useState('');
  const [success, setSuccess]                 = useState('');
  const cardRef = useRef(null);

  useEffect(() => {
    if (cardRef.current) {
      animate(cardRef.current, {
        translateY: [24, 0],
        opacity: [0, 1],
        duration: 500,
        easing: 'easeOutQuad',
      });
    }
  }, [isRegister]);

  const resetForm = () => {
    setUsername(''); setPassword(''); setName('');
    setRole('staff'); setError(''); setSuccess(''); setConfirmPassword('');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const response = await login(username, password);
      const { token, user } = response.data;
      onLogin({ token, ...user });
      resetForm();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Login gagal');
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) { setError('Password tidak cocok'); return; }
    try {
      const response = await register({ username, password, name, role });
      setSuccess(response.message || 'Registrasi berhasil! Menunggu persetujuan...');
      setTimeout(() => { setIsRegister(false); resetForm(); }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Registrasi gagal');
    }
  };

  const toggleMode = () => { setIsRegister(!isRegister); resetForm(); };

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{ backgroundColor: 'var(--bg-app)' }}>

      <div
        ref={cardRef}
        className="w-full max-w-[420px] card p-8 space-y-6"
        style={{ opacity: 0 }}
      >
        {/* Brand */}
        <div className="text-center space-y-1">
          <div
            className="w-12 h-12 rounded-[var(--radius-card)] flex items-center justify-center
              font-bold text-lg text-white mx-auto mb-4"
            style={{ backgroundColor: 'var(--brand)' }}
          >
            TB
          </div>
          <h2 className="text-xl font-bold text-[var(--text-main)]">
            {isRegister ? 'Daftar Akun Baru' : 'Masuk ke Sistem'}
          </h2>
          <p className="text-sm text-[var(--text-muted)]">
            {isRegister
              ? 'Pilih peran dan buat akun.'
              : 'Toko Besi Serta Guna — Sistem Manajemen'}
          </p>
        </div>

        {/* Feedback */}
        <AnimatePresence>
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
              className="flex items-center gap-2 p-3 rounded-[var(--radius-default)] text-xs font-medium"
              style={{ backgroundColor: 'var(--status-success-bg)', color: 'var(--status-success)' }}
            >
              <CheckIcon size={14} /> {success}
            </motion.div>
          )}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
              className="flex items-center gap-2 p-3 rounded-[var(--radius-default)] text-xs font-medium"
              style={{ backgroundColor: 'var(--status-danger-bg)', color: 'var(--status-danger)' }}
              role="alert"
            >
              <AlertIcon size={14} /> {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form */}
        {isRegister ? (
          <form onSubmit={handleRegister} className="space-y-4">
            <Field label="Nama Lengkap" required>
              <input
                type="text" value={name} onChange={(e) => setName(e.target.value)}
                required className="input-industrial"
                placeholder="Nama lengkap Anda"
              />
            </Field>

            <Field label="Username" required>
              <input
                type="text" value={username} onChange={(e) => setUsername(e.target.value)}
                required className="input-industrial"
                placeholder="Pilih username unik"
                autoComplete="username"
              />
            </Field>

            {/* Role selector */}
            <Field label="Daftar Sebagai" required>
              <div className="flex border border-[var(--border-subtle)] rounded-[var(--radius-default)] overflow-hidden">
                {[
                  { value: 'staff', label: 'Staff', sub: 'Langsung aktif' },
                  { value: 'admin', label: 'Admin', sub: 'Perlu approval' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setRole(opt.value)}
                    className="flex-1 py-2.5 px-3 text-left transition-colors"
                    style={
                      role === opt.value
                        ? { backgroundColor: 'var(--brand)', color: '#fff' }
                        : { backgroundColor: 'transparent', color: 'var(--text-muted)' }
                    }
                  >
                    <p className="text-xs font-bold">{opt.label}</p>
                    <p className="text-[10px] opacity-75">{opt.sub}</p>
                  </button>
                ))}
              </div>
            </Field>

            <PasswordField
              label="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              show={showPassword}
              onToggle={() => setShowPassword(!showPassword)}
              required
            />

            <PasswordField
              label="Konfirmasi Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              show={showPassword}
              onToggle={() => setShowPassword(!showPassword)}
              required
            />

            <button
              type="submit"
              className="w-full h-11 font-bold text-sm rounded-[var(--radius-default)]
                transition-colors text-white"
              style={{ backgroundColor: 'var(--brand)' }}
            >
              Daftar
            </button>
          </form>
        ) : (
          <form onSubmit={handleLogin} className="space-y-4">
            <Field label="Username" required>
              <input
                id="login-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="input-industrial"
                placeholder="Masukkan username"
                autoComplete="username"
              />
            </Field>

            <PasswordField
              label="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              show={showPassword}
              onToggle={() => setShowPassword(!showPassword)}
              required
              id="login-password"
              autoComplete="current-password"
            />

            <button
              type="submit"
              className="w-full h-11 font-bold text-sm rounded-[var(--radius-default)]
                transition-colors text-white"
              style={{ backgroundColor: 'var(--brand)' }}
            >
              Masuk
            </button>
          </form>
        )}

        {/* Toggle */}
        <p className="text-center text-xs text-[var(--text-muted)]">
          {isRegister ? 'Sudah punya akun?' : 'Belum punya akun?'}{' '}
          <button
            type="button"
            onClick={toggleMode}
            className="font-semibold transition-colors"
            style={{ color: 'var(--brand)' }}
          >
            {isRegister ? 'Login di sini' : 'Daftar di sini'}
          </button>
        </p>
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────

function Field({ label, required, children }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-medium text-[var(--text-muted)]">
        {label} {required && <span style={{ color: 'var(--status-danger)' }}>*</span>}
      </label>
      {children}
    </div>
  );
}

function PasswordField({ label, value, onChange, show, onToggle, required, id, autoComplete }) {
  return (
    <Field label={label} required={required}>
      <div className="relative">
        <input
          id={id}
          type={show ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          required={required}
          autoComplete={autoComplete}
          className="input-industrial pr-10"
          placeholder="••••••••"
        />
        <button
          type="button"
          onClick={onToggle}
          aria-label={show ? 'Sembunyikan password' : 'Tampilkan password'}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]
            hover:text-[var(--text-main)] transition-colors"
        >
          {show ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
        </button>
      </div>
    </Field>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────

function CheckIcon({ size = 14 }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

function AlertIcon({ size = 14 }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

function EyeIcon({ size = 16 }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon({ size = 16 }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}
