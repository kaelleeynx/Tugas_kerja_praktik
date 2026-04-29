import React, { useState, useRef, useEffect } from 'react';
import { updateMyProfile, changeMyPassword } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { animate } from 'animejs';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Password strength ────────────────────────────────────────────────────

function getPasswordStrength(pw) {
  if (!pw) return { score: 0, label: '', pct: 0, color: 'var(--border-subtle)' };
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.match(/[a-z]/) && pw.match(/[A-Z]/)) score++;
  if (pw.match(/[0-9]/)) score++;
  if (pw.match(/[^a-zA-Z0-9]/)) score++;

  const map = [
    { label: '',          color: 'var(--border-subtle)' },
    { label: 'Lemah',     color: 'var(--status-danger)' },
    { label: 'Sedang',    color: 'var(--status-warning)' },
    { label: 'Kuat',      color: 'var(--status-info)' },
    { label: 'Sangat Kuat', color: 'var(--status-success)' },
  ];
  return { score, pct: (score / 4) * 100, ...map[score] };
}

// ─── Role badge ───────────────────────────────────────────────────────────

function getRoleBadge(role) {
  if (role === 'owner') return { label: '👑 Owner', bg: 'var(--brand-muted)', color: 'var(--brand)' };
  if (role === 'admin') return { label: '⚙️ Admin', bg: 'var(--status-info-bg)', color: 'var(--status-info)' };
  return { label: '👤 Staff', bg: 'var(--status-success-bg)', color: 'var(--status-success)' };
}

// ─── Main Component ───────────────────────────────────────────────────────

const Settings = () => {
  const { user, updateUser: authUpdateUser } = useAuth();
  const [name, setName]                       = useState(user.name);
  const [currentPassword, setCurrentPassword] = useState('');
  const [password, setPassword]               = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [profilePicture, setProfilePicture]   = useState(null);
  const [previewUrl, setPreviewUrl]           = useState(user.profile_picture || null);
  const [message, setMessage]                 = useState('');
  const [error, setError]                     = useState('');
  const [loading, setLoading]                 = useState(false);
  const fileInputRef = useRef(null);
  const settingsRef  = useRef(null);

  useEffect(() => {
    if (settingsRef.current) {
      animate(settingsRef.current, {
        translateY: [16, 0],
        opacity: [0, 1],
        duration: 400,
        easing: 'easeOutQuad',
      });
    }
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { setError('Ukuran file maksimal 2MB'); return; }
    setProfilePicture(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(''); setError(''); setLoading(true);

    if (password && password !== confirmPassword) {
      setError('Password baru tidak cocok'); setLoading(false); return;
    }
    if (password && !currentPassword) {
      setError('Masukkan password lama untuk mengubah password'); setLoading(false); return;
    }

    try {
      const formData = new FormData();
      formData.append('name', name);
      if (profilePicture) formData.append('profile_picture', profilePicture);

      const updatedUser = await updateMyProfile(formData);
      authUpdateUser({ ...user, ...updatedUser.data });

      if (password) await changeMyPassword(currentPassword, password);

      setMessage('Profil berhasil diperbarui');
      setPassword(''); setCurrentPassword(''); setConfirmPassword('');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Gagal memperbarui profil');
    } finally {
      setLoading(false);
    }
  };

  const pwStrength = getPasswordStrength(password);
  const roleBadge  = getRoleBadge(user.role);

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6" ref={settingsRef} style={{ opacity: 0 }}>

      {/* ── Header ──────────────────────────────────────────────────── */}
      <div>
        <h2 className="text-2xl font-bold text-[var(--text-main)]">Pengaturan</h2>
        <p className="text-sm text-[var(--text-muted)] mt-1">Kelola profil dan keamanan akun Anda</p>
      </div>

      {/* ── Feedback ────────────────────────────────────────────────── */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
            className="flex items-center gap-2 p-3 rounded-[var(--radius-default)] text-sm font-medium"
            style={{ backgroundColor: 'var(--status-success-bg)', color: 'var(--status-success)' }}
          >
            <CheckIcon size={16} /> {message}
          </motion.div>
        )}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
            className="flex items-center gap-2 p-3 rounded-[var(--radius-default)] text-sm font-medium"
            style={{ backgroundColor: 'var(--status-danger-bg)', color: 'var(--status-danger)' }}
          >
            <AlertIcon size={16} /> {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Profile Card ────────────────────────────────────────────── */}
      <div className="card overflow-hidden">
        {/* Subtle header bar — brand color, not gradient */}
        <div className="h-20" style={{ backgroundColor: 'var(--brand-muted)' }} />

        <div className="px-6 pb-6">
          {/* Avatar + name row */}
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 -mt-10 mb-6">
            <div className="flex items-end gap-4">
              {/* Avatar */}
              <div className="relative">
                <div
                  className="w-20 h-20 rounded-[var(--radius-card)] overflow-hidden flex items-center justify-center
                    font-bold text-2xl border-4 text-white"
                  style={{
                    backgroundColor: 'var(--brand)',
                    borderColor: 'var(--bg-surface)',
                  }}
                >
                  {previewUrl ? (
                    <img src={previewUrl} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    user.name.charAt(0).toUpperCase()
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current.click()}
                  title="Ganti Foto Profil"
                  className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center
                    text-white transition-colors"
                  style={{ backgroundColor: 'var(--brand)' }}
                >
                  <CameraIcon size={14} />
                </button>
                <input
                  type="file" ref={fileInputRef} onChange={handleFileChange}
                  className="hidden" accept="image/*"
                />
              </div>

              <div>
                <h3 className="text-lg font-bold text-[var(--text-main)]">{user.name}</h3>
                <p className="text-sm font-mono text-[var(--text-muted)]">@{user.username}</p>
              </div>
            </div>

            {/* Role badge */}
            <span
              className="self-start sm:self-auto text-xs font-bold px-3 py-1.5 rounded-[var(--radius-sm)]"
              style={{ backgroundColor: roleBadge.bg, color: roleBadge.color }}
            >
              {roleBadge.label}
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">

            {/* ── Profile Info ─────────────────────────────────────── */}
            <section className="space-y-4 p-4 rounded-[var(--radius-card)]"
              style={{ backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-subtle)' }}>
              <h4 className="text-sm font-bold text-[var(--text-main)] flex items-center gap-2">
                <InfoIcon size={16} className="text-[var(--brand)]" />
                Informasi Profil
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-[var(--text-muted)]">
                    Nama Lengkap <span style={{ color: 'var(--status-danger)' }}>*</span>
                  </label>
                  <input
                    type="text" value={name} onChange={(e) => setName(e.target.value)}
                    required className="input-industrial"
                    placeholder="Masukkan nama lengkap"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-[var(--text-muted)]">Username</label>
                  <div
                    className="input-industrial flex items-center cursor-not-allowed opacity-60 font-mono"
                  >
                    @{user.username}
                  </div>
                  <p className="text-[10px] text-[var(--text-muted)]">Username tidak dapat diubah</p>
                </div>
              </div>
            </section>

            {/* ── Security ─────────────────────────────────────────── */}
            <section className="space-y-4 p-4 rounded-[var(--radius-card)]"
              style={{ backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-subtle)' }}>
              <h4 className="text-sm font-bold text-[var(--text-main)] flex items-center gap-2">
                <ShieldIcon size={16} />
                Ubah Password
              </h4>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-[var(--text-muted)]">Password Lama</label>
                <input
                  type="password" value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="input-industrial" placeholder="Masukkan password saat ini"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-[var(--text-muted)]">Password Baru</label>
                <input
                  type="password" value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-industrial" placeholder="Kosongkan jika tidak ingin mengubah"
                />
                {password && (
                  <div className="space-y-1 mt-2">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full overflow-hidden"
                        style={{ backgroundColor: 'var(--border-subtle)' }}>
                        <div
                          className="h-full transition-all duration-300 rounded-full"
                          style={{ width: `${pwStrength.pct}%`, backgroundColor: pwStrength.color }}
                        />
                      </div>
                      <span className="text-[10px] font-semibold w-20 text-right"
                        style={{ color: pwStrength.color }}>
                        {pwStrength.label}
                      </span>
                    </div>
                    <p className="text-[10px] text-[var(--text-muted)]">
                      Gunakan huruf besar, kecil, angka, dan simbol untuk password yang kuat.
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-[var(--text-muted)]">Konfirmasi Password</label>
                <input
                  type="password" value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="input-industrial" placeholder="Ulangi password baru"
                />
                {confirmPassword && password && (
                  <p className="text-[10px] flex items-center gap-1 mt-1"
                    style={{
                      color: confirmPassword === password
                        ? 'var(--status-success)' : 'var(--status-danger)',
                    }}>
                    {confirmPassword === password
                      ? <><CheckIcon size={10} /> Password cocok</>
                      : <><AlertIcon size={10} /> Password tidak cocok</>
                    }
                  </p>
                )}
              </div>
            </section>

            {/* ── Actions ──────────────────────────────────────────── */}
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setName(user.name); setCurrentPassword('');
                  setPassword(''); setConfirmPassword('');
                  setMessage(''); setError('');
                }}
                className="h-10 px-5 text-sm font-medium rounded-[var(--radius-default)]
                  transition-colors text-[var(--text-muted)]"
                style={{ border: '1px solid var(--border-subtle)' }}
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={loading}
                className="h-10 px-6 text-sm font-bold rounded-[var(--radius-default)]
                  transition-colors text-white flex items-center gap-2
                  disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: 'var(--brand)' }}
              >
                {loading && (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                )}
                {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* ── Info note ───────────────────────────────────────────────── */}
      <div className="flex items-start gap-3 p-4 rounded-[var(--radius-card)]"
        style={{ backgroundColor: 'var(--brand-muted)', border: '1px solid rgba(255,111,60,0.2)' }}>
        <InfoIcon size={16} style={{ color: 'var(--brand)', flexShrink: 0, marginTop: 1 }} />
        <p className="text-xs text-[var(--text-muted)]">
          Pastikan password Anda aman dan tidak dibagikan kepada orang lain.
          Anda dapat mengubah password kapan saja untuk menjaga keamanan akun.
        </p>
      </div>
    </div>
  );
};

export default Settings;

// ─── Icons ────────────────────────────────────────────────────────────────

function CheckIcon({ size = 16 }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

function AlertIcon({ size = 16 }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

function CameraIcon({ size = 14 }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}

function InfoIcon({ size = 16, style, className }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      style={style} className={className}>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  );
}

function ShieldIcon({ size = 16 }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}
