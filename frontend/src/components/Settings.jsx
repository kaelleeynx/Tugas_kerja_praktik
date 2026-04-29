import React, { useState, useRef, useEffect } from 'react';
import { updateMyProfile, changeMyPassword } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { animate } from 'animejs';
import { motion } from 'framer-motion';

const Settings = () => {
  const { user, updateUser: authUpdateUser } = useAuth();
  const [name, setName] = useState(user.name);
  const [currentPassword, setCurrentPassword] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [profilePicture, setProfilePicture] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(user.profile_picture || null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);
  const settingsRef = useRef(null);

  useEffect(() => {
    if (settingsRef.current) {
      animate(settingsRef.current, {
        translateY: [20, 0],
        opacity: [0, 1],
        duration: 600,
        easing: 'easeOutQuad'
      });
    }
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError('Ukuran file maksimal 2MB');
        return;
      }
      setProfilePicture(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const getPasswordStrength = (password) => {
    if (!password) return { score: 0, label: '', color: 'bg-gray-200' };
    let score = 0;
    if (password.length >= 8) score++;
    if (password.match(/[a-z]/) && password.match(/[A-Z]/)) score++;
    if (password.match(/[0-9]/)) score++;
    if (password.match(/[^a-zA-Z0-9]/)) score++;
    
    if (score === 0) return { score: 0, label: '', color: 'bg-gray-200' };
    if (score === 1) return { score: 1, label: 'Lemah', color: 'bg-red-500' };
    if (score === 2) return { score: 2, label: 'Sedang', color: 'bg-yellow-500' };
    if (score === 3) return { score: 3, label: 'Kuat', color: 'bg-blue-500' };
    return { score: 4, label: 'Sangat Kuat', color: 'bg-green-500' };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setLoading(true);

    if (password && password !== confirmPassword) {
      setError('Password baru tidak cocok');
      setLoading(false);
      return;
    }

    if (password && !currentPassword) {
      setError('Masukkan password lama untuk mengubah password');
      setLoading(false);
      return;
    }

    try {
      // Update profile (name + photo) via /auth/me
      const formData = new FormData();
      formData.append('name', name);
      if (profilePicture) formData.append('profile_picture', profilePicture);

      const updatedUser = await updateMyProfile(formData);
      authUpdateUser({ ...user, ...updatedUser.data });

      // Change password separately via /auth/me/password
      if (password) {
        await changeMyPassword(currentPassword, password);
      }

      setMessage('Profil berhasil diperbarui');
      setPassword('');
      setCurrentPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Gagal memperbarui profil');
    } finally {
      setLoading(false);
    }
  };

  const passwordStrength = getPasswordStrength(password);

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50/20 to-white dark:from-gray-900 dark:via-blue-900/10 dark:to-gray-900 p-8" ref={settingsRef} style={{ opacity: 0 }}>
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 dark:from-cyan-400 dark:to-blue-400 bg-clip-text text-transparent mb-2 leading-tight">
            Pengaturan
          </h1>
          <p className="text-base text-gray-600 dark:text-gray-400">Kelola profil dan keamanan akun Anda</p>
        </div>

        {/* Alert Messages */}
        {message && (
          <motion.div 
            className="mb-6 p-6 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 text-green-700 dark:text-green-300 rounded-xl border border-green-200 dark:border-green-800/50 flex items-center gap-3 shadow-sm"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
            {message}
          </motion.div>
        )}

        {error && (
          <motion.div 
            className="mb-6 p-6 bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 text-red-700 dark:text-red-300 rounded-xl border border-red-200 dark:border-red-800/50 flex items-center gap-3 shadow-sm"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
            {error}
          </motion.div>
        )}

        {/* Profile Card Section */}
        <div className="card bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden mb-6 hover:shadow-md transition-shadow duration-300">
          {/* Gradient Hero */}
          <div className="h-40 bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-purple-500/20 dark:from-cyan-900/20 dark:via-blue-900/20 dark:to-purple-900/20 relative">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white/50 dark:to-gray-800/50"></div>
          </div>

          {/* Profile Content */}
          <div className="px-8 pb-8">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 -mt-20 relative z-10 mb-8">
              {/* Avatar Section */}
              <div className="flex items-end gap-4">
                <div className="relative group">
                  <div className="w-24 h-24 rounded-2xl border-4 border-white dark:border-gray-800 overflow-hidden bg-gradient-to-br from-cyan-400 to-blue-600 shadow-lg flex items-center justify-center">
                    {previewUrl ? (
                      <img src={previewUrl} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white text-2xl font-bold">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <button 
                    onClick={() => fileInputRef.current.click()}
                    className="absolute -bottom-2 -right-2 bg-gradient-to-br from-cyan-500 to-blue-600 p-2.5 rounded-full shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-200 text-white"
                    title="Ganti Foto Profil"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>
                  </button>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    className="hidden" 
                    accept="image/*"
                  />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{user.name}</h2>
                  <p className="text-gray-700 dark:text-gray-300 font-medium">@{user.username}</p>
                </div>
              </div>

              {/* Role Badge */}
              <div className="flex items-center gap-2">
                <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
                  user.role === 'owner' 
                    ? 'bg-gradient-to-r from-purple-100 to-purple-50 dark:from-purple-900/30 dark:to-purple-800/20 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-700/50' 
                    : user.role === 'admin'
                    ? 'bg-gradient-to-r from-blue-100 to-blue-50 dark:from-blue-900/30 dark:to-blue-800/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700/50'
                    : 'bg-gradient-to-r from-green-100 to-green-50 dark:from-green-900/30 dark:to-green-800/20 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-700/50'
                }`}>
                  {user.role === 'owner' ? '👑 Owner' : user.role === 'admin' ? '⚙️ Admin' : '👤 Staff'}
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Profile Information Section */}
              <div className="bg-gradient-to-br from-blue-50/50 to-cyan-50/50 dark:from-blue-900/10 dark:to-cyan-900/10 rounded-xl p-6 border border-blue-100 dark:border-blue-800/30">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-cyan-600 dark:text-cyan-400"><circle cx="12" cy="12" r="1"></circle><path d="M12 1v6m6.16-1.86l-4.24 4.24m6 6l-4.24-4.24M23 12h-6m-6.16 6.16l-4.24-4.24m-6 6l4.24 4.24M1 12h6M2.84 19.16l4.24-4.24"></path></svg>
                  Informasi Profil
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nama Lengkap</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200 bg-white placeholder:text-gray-600 dark:placeholder:text-gray-400"
                      placeholder="Masukkan nama lengkap"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Username</label>
                    <div className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium flex items-center cursor-not-allowed">
                      @{user.username}
                    </div>
                    <p className="mt-2 text-xs font-medium text-gray-700 dark:text-gray-300">Username tidak dapat diubah</p>
                  </div>
                </div>
              </div>

              {/* Security Section */}
              <div className="bg-gradient-to-br from-red-50/50 to-rose-50/50 dark:from-red-900/10 dark:to-rose-900/10 rounded-xl p-6 border border-red-100 dark:border-red-800/30">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-600 dark:text-red-400"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                  Ubah Password
                </h3>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Password Lama</label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Masukkan password saat ini"
                      className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 bg-white placeholder:text-gray-600 dark:placeholder:text-gray-400"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Password Baru</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Kosongkan jika tidak ingin mengubah"
                      className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 bg-white placeholder:text-gray-600 dark:placeholder:text-gray-400"
                    />
                    
                    {/* Password Strength Indicator */}
                    {password && (
                      <div className="mt-3 space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                            <div 
                              className={`h-full transition-all duration-300 ${passwordStrength.color}`}
                              style={{ width: `${(passwordStrength.score / 4) * 100}%` }}
                            ></div>
                          </div>
                          <span className={`text-xs font-semibold ${
                            passwordStrength.score === 1 ? 'text-red-600 dark:text-red-400' :
                            passwordStrength.score === 2 ? 'text-yellow-600 dark:text-yellow-400' :
                            passwordStrength.score === 3 ? 'text-blue-600 dark:text-blue-400' :
                            'text-green-600 dark:text-green-400'
                          }`}>
                            {passwordStrength.label}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Sandi yang kuat menggunakan huruf besar, kecil, angka, dan simbol
                        </p>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Konfirmasi Password</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Ulangi password baru"
                      className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 bg-white placeholder:text-gray-600 dark:placeholder:text-gray-400"
                    />
                    {confirmPassword && password && confirmPassword !== password && (
                      <p className="mt-2 text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                        Password tidak cocok
                      </p>
                    )}
                    {confirmPassword && password && confirmPassword === password && (
                      <p className="mt-2 text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                        Password cocok
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4">
                <button
                  type="reset"
                  onClick={() => {
                    setName(user.name);
                    setCurrentPassword('');
                    setPassword('');
                    setConfirmPassword('');
                    setMessage('');
                    setError('');
                  }}
                  className="px-6 py-3 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all duration-200"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className={`px-8 py-3 rounded-lg font-medium text-white transition-all duration-200 flex items-center gap-2 ${
                    loading 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:shadow-lg hover:shadow-cyan-500/30 active:scale-95'
                  }`}
                >
                  {loading && (
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  )}
                  {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Info Card */}
        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl p-6 border border-blue-100 dark:border-blue-800/30">
          <p className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
            <span>
              Pastikan password Anda aman dan tidak dibagikan kepada orang lain. Anda dapat mengubah password kapan saja untuk menjaga keamanan akun.
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Settings;
