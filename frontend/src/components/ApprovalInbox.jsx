import React, { useState, useEffect, useRef } from 'react';
import { getPendingApprovals, approveUser, rejectUser } from '../services/api';
import { animate, stagger } from 'animejs';
import { toast } from 'sonner';

// ─── Skeleton ─────────────────────────────────────────────────────────────

function ApprovalSkeleton() {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="space-y-2">
        <div className="skeleton h-7 w-48 rounded-[var(--radius-default)]" />
        <div className="skeleton h-4 w-64 rounded-[var(--radius-default)]" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[0,1,2].map(i => (
          <div key={i} className="card p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="skeleton w-10 h-10 rounded-full flex-shrink-0" />
              <div className="space-y-2 flex-1">
                <div className="skeleton h-4 w-3/4 rounded-[var(--radius-default)]" />
                <div className="skeleton h-3 w-1/2 rounded-[var(--radius-default)]" />
              </div>
              <div className="skeleton h-5 w-16 rounded-[var(--radius-sm)]" />
            </div>
            <div className="space-y-2">
              <div className="skeleton h-3 w-full rounded-[var(--radius-default)]" />
              <div className="skeleton h-3 w-3/4 rounded-[var(--radius-default)]" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="skeleton h-9 rounded-[var(--radius-default)]" />
              <div className="skeleton h-9 rounded-[var(--radius-default)]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────

export default function ApprovalInbox() {
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading]     = useState(true);
  const containerRef = useRef(null);

  useEffect(() => { fetchApprovals(); }, []);

  useEffect(() => {
    if (!loading && containerRef.current) {
      animate(containerRef.current.querySelectorAll('.approval-card'), {
        translateY: [16, 0],
        opacity: [0, 1],
        duration: 400,
        delay: stagger(80),
        easing: 'easeOutQuad',
      });
    }
  }, [loading, approvals]);

  const fetchApprovals = async () => {
    try {
      const response = await getPendingApprovals();
      const data = response.data || response;
      setApprovals(Array.isArray(data) ? data : []);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await approveUser(id);
      fetchApprovals();
      toast.success('User berhasil disetujui');
    } catch {
      toast.error('Gagal menyetujui user');
    }
  };

  const handleReject = async (id) => {
    toast('Tolak dan hapus user ini? Tindakan ini tidak dapat dibatalkan.', {
      action: {
        label: 'Tolak',
        onClick: async () => {
          try {
            await rejectUser(id);
            fetchApprovals();
            toast.success('User berhasil ditolak');
          } catch {
            toast.error('Gagal menolak user');
          }
        },
      },
      cancel: { label: 'Batal' },
    });
  };

  if (loading) return <ApprovalSkeleton />;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6" ref={containerRef}>

      {/* ── Header ──────────────────────────────────────────────────── */}
      <div>
        <h2 className="text-2xl font-bold text-[var(--text-main)]">Inbox Persetujuan</h2>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          Kelola permintaan pendaftaran pengguna baru
        </p>
      </div>

      {/* ── Empty State ──────────────────────────────────────────────── */}
      {approvals.length === 0 ? (
        <div className="card p-12 flex flex-col items-center gap-4 text-center">
          <div
            className="w-16 h-16 rounded-[var(--radius-card)] flex items-center justify-center"
            style={{ backgroundColor: 'var(--status-success-bg)', color: 'var(--status-success)' }}
          >
            <InboxIcon size={32} />
          </div>
          <div>
            <h3 className="text-base font-bold text-[var(--text-main)] mb-1">
              Tidak Ada Permintaan Pending
            </h3>
            <p className="text-sm text-[var(--text-muted)] max-w-sm">
              Semua permintaan telah diproses. Notifikasi akan muncul jika ada pendaftaran baru.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {approvals.map((approval) => (
            <div
              key={approval.id}
              className="approval-card card p-5 space-y-4 border-l-[3px]"
              style={{ borderLeftColor: 'var(--status-warning)', opacity: 0 }}
            >
              {/* User info */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center
                      font-bold text-sm flex-shrink-0"
                    style={{
                      backgroundColor: 'var(--status-warning-bg)',
                      color: 'var(--status-warning)',
                    }}
                  >
                    {approval.name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-[var(--text-main)] truncate">
                      {approval.name}
                    </p>
                    <p className="text-xs font-mono text-[var(--text-muted)] truncate">
                      @{approval.username}
                    </p>
                  </div>
                </div>
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded-[var(--radius-sm)] flex-shrink-0"
                  style={{
                    backgroundColor: 'var(--status-warning-bg)',
                    color: 'var(--status-warning)',
                  }}
                >
                  Pending
                </span>
              </div>

              {/* Meta */}
              <div className="space-y-1.5 text-xs text-[var(--text-muted)]">
                <div className="flex items-center gap-2">
                  <UserIcon size={12} />
                  <span className="capitalize font-medium">{approval.role}</span>
                </div>
                <div className="flex items-center gap-2">
                  <ClockIcon size={12} />
                  <span className="font-mono tabular-nums">
                    {new Date(approval.created_at).toLocaleString('id-ID', {
                      day: '2-digit', month: 'short', year: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>

              {/* Actions — ghost buttons, not solid */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={() => handleReject(approval.id)}
                  className="h-9 text-xs font-semibold rounded-[var(--radius-default)]
                    transition-colors"
                  style={{
                    backgroundColor: 'transparent',
                    color: 'var(--status-danger)',
                    border: '1px solid var(--status-danger)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--status-danger-bg)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  Tolak
                </button>
                <button
                  onClick={() => handleApprove(approval.id)}
                  className="h-9 text-xs font-semibold rounded-[var(--radius-default)]
                    transition-colors"
                  style={{
                    backgroundColor: 'transparent',
                    color: 'var(--status-success)',
                    border: '1px solid var(--status-success)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--status-success-bg)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  Setujui
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────

function InboxIcon({ size = 32 }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
      <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
    </svg>
  );
}

function UserIcon({ size = 12 }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function ClockIcon({ size = 12 }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}
