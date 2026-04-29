import React, { useEffect, useState, useRef } from 'react';
import { getTransactions } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { animate, stagger } from 'animejs';

// ─── Helpers ──────────────────────────────────────────────────────────────

function formatIDR(n) {
  return Number(n).toLocaleString('id-ID', {
    style: 'currency', currency: 'IDR', maximumFractionDigits: 0,
  });
}

function formatDate(d) {
  return new Date(d).toLocaleDateString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

// ─── Skeleton ─────────────────────────────────────────────────────────────

function ReportSkeleton() {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="space-y-2">
        <div className="skeleton h-7 w-44 rounded-[var(--radius-default)]" />
        <div className="skeleton h-4 w-60 rounded-[var(--radius-default)]" />
      </div>
      <div className="card p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="skeleton h-3 w-24 rounded-[var(--radius-default)]" />
            <div className="skeleton h-10 w-full rounded-[var(--radius-default)]" />
          </div>
          <div className="space-y-2">
            <div className="skeleton h-3 w-24 rounded-[var(--radius-default)]" />
            <div className="skeleton h-10 w-full rounded-[var(--radius-default)]" />
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {[0,1,2,3,4,5].map(i => (
            <div key={i} className="skeleton h-8 w-20 rounded-[var(--radius-default)]" />
          ))}
        </div>
        <div className="flex gap-3">
          <div className="skeleton h-10 w-36 rounded-[var(--radius-default)]" />
          <div className="skeleton h-10 w-28 rounded-[var(--radius-default)]" />
        </div>
      </div>
    </div>
  );
}

// ─── Stats Card ───────────────────────────────────────────────────────────

function ReportStatCard({ label, value, accentColor, icon }) {
  return (
    <div className="report-card card p-5 flex items-center gap-4" style={{ opacity: 0 }}>
      <div
        className="w-10 h-10 rounded-[var(--radius-card)] flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: `${accentColor}18`, color: accentColor }}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide mb-0.5">
          {label}
        </p>
        <p className="text-xl font-bold font-mono tabular-nums text-[var(--text-main)] truncate">
          {formatIDR(value)}
        </p>
      </div>
    </div>
  );
}

// ─── Preset Button ────────────────────────────────────────────────────────

function PresetBtn({ label, onClick, active }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="px-3 py-1.5 text-xs font-semibold rounded-[var(--radius-default)]
        transition-colors whitespace-nowrap"
      style={
        active
          ? { backgroundColor: 'var(--brand)', color: '#fff' }
          : {
              backgroundColor: 'var(--bg-app)',
              color: 'var(--text-muted)',
              border: '1px solid var(--border-subtle)',
            }
      }
    >
      {label}
    </button>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────

export default function ReportView() {
  const [transactions, setTransactions] = useState([]);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activePreset, setActivePreset] = useState(null);
  const cardsRef = useRef(null);

  useEffect(() => {
    getTransactions()
      .then((res) => setTransactions(Array.isArray(res) ? res : (res.data || [])))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Animate stats cards when report is generated
  useEffect(() => {
    if (report && cardsRef.current) {
      animate(cardsRef.current.querySelectorAll('.report-card'), {
        translateY: [12, 0],
        opacity: [0, 1],
        duration: 350,
        delay: stagger(70),
        easing: 'easeOutQuad',
      });
    }
  }, [report]);

  const setDatePreset = (days, label) => {
    const end = new Date();
    const start = new Date();
    if (days === 0) {
      setFrom(''); setTo(''); setActivePreset('all');
    } else {
      start.setDate(end.getDate() - days);
      setFrom(start.toISOString().slice(0, 10));
      setTo(end.toISOString().slice(0, 10));
      setActivePreset(label);
    }
  };

  const generate = () => {
    const f = from || '1970-01-01';
    const t = to || '9999-12-31';

    const filtered = transactions.filter((trx) => {
      const d = trx.date || trx.created_at;
      return d >= f && d <= t;
    });

    if (filtered.length === 0) {
      setReport({ filtered: [], totals: { sales: 0, expense: 0 } });
      return;
    }

    const totals = filtered.reduce(
      (acc, t) => {
        const amount = Number(t.total);
        if (t.type === 'penjualan') acc.sales += amount;
        else acc.expense += amount;
        return acc;
      },
      { sales: 0, expense: 0 }
    );

    setReport({ filtered, totals });
  };

  const exportCSV = () => {
    if (!report?.filtered.length) return;
    const rows = [['ID', 'Tanggal', 'Jenis', 'Produk', 'Qty', 'Harga', 'Total', 'Catatan']];
    report.filtered.forEach((r) =>
      rows.push([
        r.id, r.date, r.type,
        r.price_list?.product_name || r.note || '-',
        r.quantity, r.price, r.total, r.note || '',
      ])
    );
    const csv = rows
      .map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `laporan_${from || 'semua'}_${to || 'semua'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <ReportSkeleton />;

  const presets = [
    { label: 'Harian',  days: 1 },
    { label: '7 Hari',  days: 7 },
    { label: '14 Hari', days: 14 },
    { label: '30 Hari', days: 30 },
    { label: '3 Bulan', days: 90 },
    { label: 'Semua',   days: 0 },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">

      {/* ── Header ──────────────────────────────────────────────────── */}
      <div>
        <h2 className="text-2xl font-bold text-[var(--text-main)]">Generate Laporan</h2>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          Pilih rentang tanggal lalu generate laporan transaksi.
        </p>
      </div>

      {/* ── Filter Panel ────────────────────────────────────────────── */}
      <div className="card p-5 space-y-4">

        {/* Date range */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">
              Dari Tanggal
            </label>
            <input
              type="date"
              value={from}
              onChange={(e) => { setFrom(e.target.value); setActivePreset(null); }}
              className="input-industrial font-mono text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">
              Sampai Tanggal
            </label>
            <input
              type="date"
              value={to}
              onChange={(e) => { setTo(e.target.value); setActivePreset(null); }}
              className="input-industrial font-mono text-sm"
            />
          </div>
        </div>

        {/* Preset quick-select */}
        <div>
          <p className="text-xs font-medium text-[var(--text-muted)] mb-2">Periode Cepat</p>
          <div className="flex flex-wrap gap-2">
            {presets.map((p) => (
              <PresetBtn
                key={p.label}
                label={p.label}
                active={activePreset === (p.days === 0 ? 'all' : p.label)}
                onClick={() => setDatePreset(p.days, p.label)}
              />
            ))}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-3 pt-1">
          <button
            type="button"
            onClick={generate}
            className="h-10 px-5 flex items-center gap-2 text-sm font-semibold
              rounded-[var(--radius-default)] transition-colors"
            style={{ backgroundColor: 'var(--brand)', color: '#fff' }}
          >
            <FilterIcon size={16} />
            Generate Laporan
          </button>

          <button
            type="button"
            onClick={exportCSV}
            disabled={!report?.filtered.length}
            className="h-10 px-5 flex items-center gap-2 text-sm font-semibold
              rounded-[var(--radius-default)] transition-colors
              disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              backgroundColor: 'var(--status-success-bg)',
              color: 'var(--status-success)',
              border: '1px solid var(--status-success)',
            }}
          >
            <DownloadIcon size={16} />
            Export CSV
          </button>
        </div>
      </div>

      {/* ── Report Results ───────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {report ? (
          <motion.div
            key="report"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-5"
            ref={cardsRef}
          >
            {/* Period label + count */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <p className="text-sm font-semibold text-[var(--text-main)]">
                Laporan: <span className="font-mono">{from || 'Awal'}</span>
                {' '}s/d{' '}
                <span className="font-mono">{to || 'Akhir'}</span>
              </p>
              <span
                className="text-xs font-semibold px-2.5 py-1 rounded-[var(--radius-sm)]"
                style={{
                  backgroundColor: 'var(--brand-muted)',
                  color: 'var(--brand)',
                }}
              >
                {report.filtered.length} transaksi
              </span>
            </div>

            {/* Stats cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <ReportStatCard
                label="Total Penjualan"
                value={report.totals.sales}
                accentColor="var(--status-success)"
                icon={<TrendUpIcon size={18} />}
              />
              <ReportStatCard
                label="Total Pengeluaran"
                value={report.totals.expense}
                accentColor="var(--status-danger)"
                icon={<TrendDownIcon size={18} />}
              />
              <ReportStatCard
                label="Laba Bersih"
                value={report.totals.sales - report.totals.expense}
                accentColor={
                  report.totals.sales - report.totals.expense >= 0
                    ? 'var(--status-success)'
                    : 'var(--status-danger)'
                }
                icon={<CheckIcon size={18} />}
              />
            </div>

            {/* Transaction table */}
            {report.filtered.length === 0 ? (
              <div className="card p-10 flex flex-col items-center gap-3">
                <FileIcon size={36} className="text-[var(--text-muted)]" />
                <p className="text-sm text-[var(--text-muted)]">
                  Tidak ada transaksi dalam rentang tanggal ini.
                </p>
              </div>
            ) : (
              <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[var(--border-subtle)] bg-[var(--bg-app)]">
                        {['Tanggal', 'Jenis', 'Produk', 'Qty', 'Total'].map((h) => (
                          <th
                            key={h}
                            className="px-4 py-3 text-left text-xs font-semibold
                              text-[var(--text-muted)] uppercase tracking-wide whitespace-nowrap"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-subtle)]">
                      {report.filtered.map((r) => (
                        <tr key={r.id} className="hover:bg-[var(--bg-app)] transition-colors">
                          <td className="px-4 py-3 font-mono text-xs text-[var(--text-muted)] whitespace-nowrap tabular-nums">
                            {formatDate(r.date)}
                          </td>
                          <td className="px-4 py-3">
                            {r.type === 'penjualan' ? (
                              <span className="badge-success text-[10px]">Jual</span>
                            ) : (
                              <span className="badge-danger text-[10px]">Keluar</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-xs font-medium text-[var(--text-main)] max-w-[200px] truncate">
                            {r.price_list?.product_name || r.note || '—'}
                          </td>
                          <td className="px-4 py-3 font-mono text-xs text-[var(--text-main)] tabular-nums">
                            {r.quantity}
                          </td>
                          <td className="px-4 py-3 font-mono text-xs font-semibold text-[var(--text-main)] tabular-nums whitespace-nowrap">
                            {formatIDR(r.total)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    {/* Total row */}
                    <tfoot>
                      <tr className="border-t-2 border-[var(--border-subtle)] bg-[var(--bg-app)]">
                        <td colSpan={4} className="px-4 py-3 text-xs font-bold text-[var(--text-main)] uppercase tracking-wide">
                          Total Keseluruhan
                        </td>
                        <td className="px-4 py-3 font-mono text-sm font-bold tabular-nums whitespace-nowrap"
                          style={{
                            color: report.totals.sales - report.totals.expense >= 0
                              ? 'var(--status-success)' : 'var(--status-danger)',
                          }}>
                          {formatIDR(report.totals.sales - report.totals.expense)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}
          </motion.div>
        ) : (
          /* Empty state */
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="card p-12 flex flex-col items-center gap-4 text-center"
          >
            <div
              className="w-16 h-16 rounded-[var(--radius-card)] flex items-center justify-center"
              style={{ backgroundColor: 'var(--brand-muted)', color: 'var(--brand)' }}
            >
              <FileIcon size={32} />
            </div>
            <div>
              <h4 className="text-base font-bold text-[var(--text-main)] mb-1">
                Belum Ada Laporan
              </h4>
              <p className="text-sm text-[var(--text-muted)] max-w-xs">
                Pilih rentang tanggal atau gunakan tombol periode cepat, lalu klik Generate Laporan.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────

function FilterIcon({ size = 16 }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  );
}

function DownloadIcon({ size = 16 }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function TrendUpIcon({ size = 18 }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  );
}

function TrendDownIcon({ size = 18 }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
      <polyline points="17 18 23 18 23 12" />
    </svg>
  );
}

function CheckIcon({ size = 18 }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

function FileIcon({ size = 32 }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}
