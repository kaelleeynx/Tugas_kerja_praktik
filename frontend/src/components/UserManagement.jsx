import React, { useState, useEffect, useRef } from 'react';
import { getUsers, deleteUser } from '../services/api';
import { animate, stagger } from 'animejs';
import { toast } from 'sonner';

// ─── Helpers ──────────────────────────────────────────────────────────────

function formatJoinDate(dateString) {
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return '—';
  }
}

// Role badge config — industrial, bukan warna-warni
function getRoleBadge(role) {
  const r = role?.toLowerCase();
  if (r === 'owner') return { label: 'Owner', bg: 'var(--brand-muted)', color: 'var(--brand)' };
  if (r === 'admin') return { label: 'Admin', bg: 'var(--status-info-bg)', color: 'var(--status-info)' };
  return { label: 'Staff', bg: 'var(--status-success-bg)', color: 'var(--status-success)' };
}

// ─── Skeleton ─────────────────────────────────────────────────────────────

function UserManagementSkeleton() {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="space-y-2">
        <div className="skeleton h-7 w-36 rounded-[var(--radius-default)]" />
        <div className="skeleton h-4 w-52 rounded-[var(--radius-default)]" />
      </div>
      <div className="card p-4 flex gap-4">
        <div className="skeleton h-10 flex-1 max-w-sm rounded-[var(--radius-default)]" />
        <div className="flex gap-2">
          {[0,1,2,3].map(i => (
            <div key={i} className="skeleton h-8 w-16 rounded-[var(--radius-default)]" />
          ))}
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[0,1,2,3,4,5].map(i => (
          <div key={i} className="card p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="skeleton w-12 h-12 rounded-full flex-shrink-0" />
              <div className="space-y-2 flex-1">
                <div className="skeleton h-4 w-3/4 rounded-[var(--radius-default)]" />
                <div className="skeleton h-3 w-1/2 rounded-[var(--radius-default)]" />
              </div>
            </div>
            <div className="flex gap-2">
              <div className="skeleton h-5 w-14 rounded-[var(--radius-sm)]" />
              <div className="skeleton h-5 w-14 rounded-[var(--radius-sm)]" />
            </div>
            <div className="skeleton h-3 w-32 rounded-[var(--radius-default)]" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Employee Card ────────────────────────────────────────────────────────

function EmployeeCard({ user, onDelete }) {
  const badge = getRoleBadge(user.role);
  const initial = user.name?.charAt(0).toUpperCase() || '?';

  return (
    <div className="user-card card p-5 flex flex-col gap-4 group hover:shadow-[var(--shadow-elevated)] transition-shadow"
      style={{ opacity: 0 }}>

      {/* Top row: avatar + delete */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          {/* Avatar — circular, no gradient */}
          <div className="relative flex-shrink-0">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center
                font-bold text-lg select-none"
              style={{
                backgroundColor: 'var(--brand-muted)',
                color: 'var(--brand)',
                border: '2px solid var(--border-subtle)',
              }}
            >
              {initial}
            </div>
            {/* Online dot */}
            <span
              className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2"
              style={{
                backgroundColor: 'var(--status-success)',
                borderColor: 'var(--bg-surface)',
              }}
            />
          </div>

          {/* Name + username */}
          <div className="min-w-0">
            <p className="text-sm font-bold text-[var(--text-main)] truncate leading-tight">
              {user.name}
            </p>
            <p className="text-xs text-[var(--text-muted)] font-mono truncate mt-0.5">
              @{user.username}
            </p>
          </div>
        </div>

        {/* Delete — visible on hover */}
        <button
          onClick={() => onDelete(user.id)}
          title="Hapus User"
          className="p-1.5 rounded-[var(--radius-default)] flex-shrink-0
            text-[var(--text-muted)] hover:text-[var(--status-danger)]
            hover:bg-[var(--status-danger-bg)] transition-colors
            opacity-0 group-hover:opacity-100"
        >
          <TrashIcon size={14} />
        </button>
      </div>

      {/* Badges */}
      <div className="flex items-center gap-2 flex-wrap">
        <span
          className="text-[10px] font-bold px-2 py-0.5 rounded-[var(--radius-sm)] capitalize"
          style={{ backgroundColor: badge.bg, color: badge.color }}
        >
          {badge.label}
        </span>
        <span
          className="text-[10px] font-semibold px-2 py-0.5 rounded-[var(--radius-sm)]
            flex items-center gap-1"
          style={{
            backgroundColor: 'var(--status-success-bg)',
            color: 'var(--status-success)',
          }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--status-success)]" />
          Aktif
        </span>
      </div>

      {/* Join date */}
      <div className="pt-3 border-t border-[var(--border-subtle)]">
        <p className="text-xs text-[var(--text-muted)]">
          Bergabung {formatJoinDate(user.created_at)}
        </p>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────

export default function UserManagement() {
  const [users, setUsers]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const containerRef = useRef(null);

  useEffect(() => { fetchUsers(); }, []);

  useEffect(() => {
    if (!loading && containerRef.current) {
      animate(containerRef.current.querySelectorAll('.user-card'), {
        translateY: [16, 0],
        opacity: [0, 1],
        duration: 400,
        delay: stagger(80),
        easing: 'easeOutQuad',
      });
    }
  }, [loading, users]);

  const fetchUsers = async () => {
    try {
      const data = await getUsers();
      setUsers(data);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    toast('Hapus user ini? Tindakan ini tidak dapat dibatalkan.', {
      action: {
        label: 'Hapus',
        onClick: async () => {
          try {
            await deleteUser(id);
            fetchUsers();
            toast.success('User berhasil dihapus');
          } catch {
            toast.error('Gagal menghapus user');
          }
        },
      },
      cancel: { label: 'Batal' },
    });
  };

  const filteredUsers = users.filter((u) => {
    const q = search.toLowerCase();
    const matchSearch =
      u.name.toLowerCase().includes(q) ||
      u.username.toLowerCase().includes(q);
    const matchRole =
      roleFilter === 'All' || u.role.toLowerCase() === roleFilter.toLowerCase();
    return matchSearch && matchRole;
  });

  const roles = ['All', 'owner', 'admin', 'staff'];

  if (loading) return <UserManagementSkeleton />;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6" ref={containerRef}>

      {/* ── Header ──────────────────────────────────────────────────── */}
      <div>
        <h2 className="text-2xl font-bold text-[var(--text-main)]">Anggota Tim</h2>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          Kelola akses dan peran pengguna
        </p>
      </div>

      {/* ── Toolbar ─────────────────────────────────────────────────── */}
      <div className="card p-4 flex flex-col md:flex-row gap-3 items-start md:items-center">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
            xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Cari nama atau username..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-industrial pl-9"
          />
        </div>

        {/* Role filter pills */}
        <div className="flex items-center gap-2 flex-wrap">
          {roles.map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className="px-3 py-1 text-xs font-semibold rounded-[var(--radius-default)]
                transition-colors capitalize whitespace-nowrap"
              style={
                roleFilter === r
                  ? { backgroundColor: 'var(--brand)', color: '#fff' }
                  : {
                      backgroundColor: 'var(--bg-app)',
                      color: 'var(--text-muted)',
                      border: '1px solid var(--border-subtle)',
                    }
              }
            >
              {r === 'All' ? 'Semua' : r}
            </button>
          ))}
        </div>

        {/* Count */}
        <span className="ml-auto text-xs text-[var(--text-muted)] whitespace-nowrap">
          {filteredUsers.length} dari {users.length} anggota
        </span>
      </div>

      {/* ── Grid ────────────────────────────────────────────────────── */}
      {filteredUsers.length === 0 ? (
        <div className="card p-12 flex flex-col items-center gap-3">
          <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
            className="text-[var(--text-muted)]">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          <p className="text-sm text-[var(--text-muted)]">Tidak ada anggota yang cocok.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredUsers.map((user) => (
            <EmployeeCard key={user.id} user={user} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Icon ─────────────────────────────────────────────────────────────────

function TrashIcon({ size = 14 }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}
