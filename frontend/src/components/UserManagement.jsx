import React, { useState, useEffect, useRef } from 'react';
import { getUsers, deleteUser } from '../services/api';
import { animate, stagger } from 'animejs';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const containerRef = useRef(null);

  const avatarColors = {
    'admin': 'from-purple-400 to-purple-600',
    'owner': 'from-orange-400 to-orange-600',
    'staff': 'from-green-400 to-green-600'
  };

  const getRoleColor = (role) => {
    const lowerRole = role.toLowerCase();
    return avatarColors[lowerRole] || 'from-blue-400 to-blue-600';
  };

  const getRoleBadgeColor = (role) => {
    const lowerRole = role.toLowerCase();
    if (lowerRole === 'admin') return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
    if (lowerRole === 'owner') return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
    return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
  };

  const formatJoinDate = (dateString) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Bergabung tidak diketahui';
      }
      return date.toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch (e) {
      return 'Bergabung tidak diketahui';
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (!loading && containerRef.current) {
      animate(containerRef.current.querySelectorAll('.user-card'), {
        translateY: [20, 0],
        opacity: [0, 1],
        duration: 600,
        delay: stagger(100),
        easing: 'easeOutQuad'
      });
    }
  }, [loading, users]);

  const fetchUsers = async () => {
    try {
      const data = await getUsers();
      setUsers(data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch users', error);
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await deleteUser(id);
      fetchUsers();
    } catch (error) {
      alert('Failed to delete user');
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(search.toLowerCase()) || 
                          user.username.toLowerCase().includes(search.toLowerCase());
    // Normalize role comparison - handle both 'admin' and 'owner' from backend
    const userRole = user.role.toLowerCase();
    const filterRole = roleFilter === 'All' ? null : roleFilter.toLowerCase();
    const matchesRole = !filterRole || userRole === filterRole || 
                        (filterRole === 'owner' && userRole === 'admin');
    return matchesSearch && matchesRole;
  });

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  );

  return (
    <div className="container mx-auto p-8 max-w-7xl" ref={containerRef}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-4xl font-bold text-gray-800 dark:text-white leading-tight">Anggota Tim</h1>
          <p className="text-base text-gray-700 dark:text-gray-300 mt-3 font-medium">Kelola akses dan peran pengguna</p>
        </div>
      </div>

      <div className="card bg-white dark:bg-gray-800 p-6 mb-8 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col md:flex-row gap-6 items-center justify-between">
        <div className="relative w-full md:w-96">
          <svg className="absolute left-3 top-3 text-gray-400" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          <input 
            placeholder="Cari nama atau username..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
          />
        </div>
        
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">Filter:</span>
          <button 
            onClick={() => setRoleFilter('All')}
            style={roleFilter === 'All' ? { boxShadow: '0 0 12px rgba(59, 130, 246, 0.5)' } : {}}
            className={`px-4 py-2 rounded-full font-medium text-sm transition-all shadow-sm hover:shadow-md ${
              roleFilter === 'All' 
                ? 'bg-blue-500 !text-white ring-2 ring-blue-300 dark:ring-blue-700' 
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            <span className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle></svg>
              Semua
            </span>
          </button>
          <button 
            onClick={() => setRoleFilter('admin')}
            style={roleFilter === 'admin' ? { boxShadow: '0 0 12px rgba(168, 85, 247, 0.5)' } : {}}
            className={`px-4 py-2 rounded-full font-medium text-sm transition-all shadow-sm hover:shadow-md ${
              roleFilter === 'admin' 
                ? 'bg-purple-500 !text-white ring-2 ring-purple-300 dark:ring-purple-700' 
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            <span className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
              Admin
            </span>
          </button>
          <button 
            onClick={() => setRoleFilter('owner')}
            style={roleFilter === 'owner' ? { boxShadow: '0 0 12px rgba(249, 115, 22, 0.5)' } : {}}
            className={`px-4 py-2 rounded-full font-medium text-sm transition-all shadow-sm hover:shadow-md ${
              roleFilter === 'owner' 
                ? 'bg-orange-500 !text-white ring-2 ring-orange-300 dark:ring-orange-700' 
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            <span className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"></path></svg>
              Owner
            </span>
          </button>
          <button 
            onClick={() => setRoleFilter('staff')}
            style={roleFilter === 'staff' ? { boxShadow: '0 0 12px rgba(34, 197, 94, 0.5)' } : {}}
            className={`px-4 py-2 rounded-full font-medium text-sm transition-all shadow-sm hover:shadow-md ${
              roleFilter === 'staff' 
                ? 'bg-green-500 !text-white ring-2 ring-green-300 dark:ring-green-700' 
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            <span className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
              Staff
            </span>
          </button>
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {filteredUsers.map((user) => (
          <div
            key={user.id}
            className="user-card card bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden relative group hover:shadow-lg hover:border-gray-200 dark:hover:border-gray-600 transition-all duration-300 opacity-0"
          >
            {/* Header Background with Gradient */}
            <div className={`h-16 bg-gradient-to-r ${getRoleColor(user.role)} opacity-90`}></div>
            
            {/* Content */}
            <div className="px-6 pb-6">
              {/* Avatar */}
              <div className="-mt-8 mb-4 flex items-end justify-between">
                <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${getRoleColor(user.role)} flex items-center justify-center text-white font-bold text-2xl shadow-lg border-4 border-white dark:border-gray-800`}>
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <button 
                  onClick={() => handleDelete(user.id)}
                  className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-gray-400 hover:text-red-600 transition-all opacity-0 group-hover:opacity-100"
                  title="Hapus User"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                </button>
              </div>

              {/* Name & Username */}
              <div className="mb-3">
                <h3 className="font-bold text-lg text-gray-900 dark:text-white">{user.name}</h3>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">@{user.username}</p>
              </div>

              {/* Role & Status Badges */}
              <div className="flex items-center gap-2 mb-4 flex-wrap">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getRoleBadgeColor(user.role)}`}>
                  {user.role}
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                  <span className="w-2 h-2 rounded-full bg-green-500 mr-1.5"></span>
                  Active
                </span>
              </div>

              {/* Joined Date */}
              <div className="pt-3 border-t border-gray-100 dark:border-gray-700">
                <p className="text-xs font-medium text-gray-700 dark:text-gray-300">Bergabung {formatJoinDate(user.created_at)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
