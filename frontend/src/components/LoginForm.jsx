import React, { useState, useEffect, useRef } from 'react';
import { login, register } from '../services/api';

// AnimateJS is optional - lazy load it
let animate = () => {}; // fallback no-op
try {
  import('animejs').then(module => {
    animate = module.animate;
  }).catch(() => {
    console.warn('AnimateJS not available in LoginForm');
  });
} catch (e) {
  console.warn('AnimateJS import failed in LoginForm:', e.message);
}

export default function LoginForm({ onLogin }) {
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('staff'); // Default role
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const cardRef = useRef(null);

  useEffect(() => {
    if (cardRef.current) {
      animate(cardRef.current, {
        translateY: [20, 0],
        opacity: [0, 1],
        duration: 800,
        easing: 'easeOutExpo',
        delay: 200
      });
    }
  }, [isRegister]);

  const resetForm = () => {
    setUsername('');
    setPassword('');
    setName('');
    setRole('staff');
    setError('');
    setSuccess('');
    setConfirmPassword('');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await login(username, password);
      const { token, user } = response.data;
      onLogin({ token, ...user });
      resetForm();
    } catch (error) {
      setError(error.message || 'Login gagal');
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Password tidak cocok');
      return;
    }

    try {
      const response = await register({ username, password, name, role });
      setSuccess(response.message || 'Registrasi berhasil');
      setTimeout(() => {
        setIsRegister(false);
        resetForm();
      }, 2000);
    } catch (error) {
      setError(error.message || 'Registrasi gagal');
    }
  };

  const toggleMode = () => {
    setIsRegister(!isRegister);
    resetForm();
  };

  return (
    <div className="login-container" style={{ position: 'relative', overflow: 'hidden' }}>
      <div style={{ 
        position: 'absolute', 
        top: 0, 
        left: 0, 
        width: '100%', 
        height: '100%', 
        zIndex: 0,
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        opacity: 0.1
      }}></div>
      <div className="card login-card" ref={cardRef} style={{ zIndex: 1, position: 'relative' }}>
        <div className="login-header">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-log-in"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path><polyline points="10 17 15 12 10 7"></polyline><line x1="15" y1="12" x2="3" y2="12"></line></svg>
          <h2>{isRegister ? 'Daftar Akun Baru' : 'Selamat Datang'}</h2>
          <p>{isRegister ? 'Pilih peran dan buat akun.' : 'Silakan masuk untuk melanjutkan'}</p>
        </div>

        {isRegister ? (
          <form onSubmit={handleRegister}>
            <div className="form-group">
              <label htmlFor="register-name">Nama Lengkap</label>
              <input id="register-name" name="fullname" value={name} onChange={e => setName(e.target.value)} required />
            </div>
            <div className="form-group">
              <label htmlFor="register-username">Username</label>
              <input id="register-username" name="username-reg" value={username} onChange={e => setUsername(e.target.value)} required />
            </div>
            
            <div className="form-group">
              <label>Daftar Sebagai</label>
              <div className="flex gap-4 mt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="radio" 
                    name="role" 
                    value="staff" 
                    checked={role === 'staff'} 
                    onChange={e => setRole(e.target.value)} 
                  />
                  <span>Staff (Langsung Aktif)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="radio" 
                    name="role" 
                    value="admin" 
                    checked={role === 'admin'} 
                    onChange={e => setRole(e.target.value)} 
                  />
                  <span>Admin (Perlu Approval)</span>
                </label>
              </div>
            </div>

            <div className="form-group password-wrapper">
              <label htmlFor="register-password">Password</label>
              <input id="register-password" type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required />
              <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}>
                {showPassword ? <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg> : <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>}
              </button>
            </div>
            <div className="form-group password-wrapper">
              <label htmlFor="confirm-password">Konfirmasi Password</label>
              <input id="confirm-password" type={showPassword ? 'text' : 'password'} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
            </div>
            {error && <div className="error">{error}</div>}
            <button className="btn btn-primary" type="submit">Daftar</button>
          </form>
        ) : (
          <form onSubmit={handleLogin}>
            {success && <div className="success">{success}</div>}
            <div className="form-group">
              <label htmlFor="login-username">Username</label>
              <input id="login-username" name="username-login" value={username} onChange={e => setUsername(e.target.value)} required autoComplete="username" />
            </div>
            <div className="form-group password-wrapper">
              <label htmlFor="login-password">Password</label>
              <input id="login-password" name="password-login" type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required autoComplete="current-password" />
              <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}>
                {showPassword ? <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg> : <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>}
              </button>
            </div>
            {error && <div className="error">{error}</div>}
            <button className="btn btn-primary" type="submit">Login</button>
          </form>
        )}

        <div className="toggle-form">
          {isRegister ? (
            <p>Sudah punya akun? <button onClick={toggleMode}>Login di sini</button></p>
          ) : (
            <p>Belum punya akun? <button onClick={toggleMode}>Daftar di sini</button></p>
          )}
        </div>
      </div>
    </div>
  );
}