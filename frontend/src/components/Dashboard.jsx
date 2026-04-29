import React, { useEffect, useState, useRef } from 'react';
import { getTransactions, deleteTransaction, updateTransaction } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { animate, stagger } from 'animejs';
import { toast } from 'sonner';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts';

// ─── Helpers ──────────────────────────────────────────────────────────────

function formatIDR(n) {
  return Number(n).toLocaleString('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ─── Stats Card ───────────────────────────────────────────────────────────

function StatsCard({ label, value, prevValue, change, isPositiveGood = true, icon, accentColor }) {
  const isUp = change >= 0;
  const isGood = isPositiveGood ? isUp : !isUp;

  return (
    <div className="card p-5 flex flex-col gap-4">
      <div className="flex items-start justify-between">
        {/* Icon */}
        <div
          className="w-10 h-10 rounded-[var(--radius-card)] flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${accentColor}18`, color: accentColor }}
        >
          {icon}
        </div>

        {/* Trend badge */}
        <span
          className="text-xs font-semibold px-2 py-1 rounded-[var(--radius-sm)]"
          style={{
            backgroundColor: isGood ? 'var(--status-success-bg)' : 'var(--status-danger-bg)',
            color: isGood ? 'var(--status-success)' : 'var(--status-danger)',
          }}
        >
          {isUp ? '↑' : '↓'} {Math.abs(change)}%
        </span>
      </div>

      <div>
        <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide mb-1">
          {label}
        </p>
        <p className="text-2xl font-bold font-mono text-[var(--text-main)] tabular-nums">
          {formatIDR(value)}
        </p>
        <p className="text-xs text-[var(--text-muted)] mt-1.5 font-mono tabular-nums">
          vs {formatIDR(prevValue)} periode lalu
        </p>
      </div>
    </div>
  );
}

// ─── Net Profit Card ──────────────────────────────────────────────────────

function NetProfitCard({ sales, expense, recapType }) {
  const net = sales - expense;
  const margin = sales > 0 ? ((net / sales) * 100).toFixed(1) : '0.0';
  const isProfit = net >= 0;

  return (
    <div className="card p-5 flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <div className="w-10 h-10 rounded-[var(--radius-card)] flex items-center justify-center flex-shrink-0
          bg-[var(--brand-muted)] text-[var(--brand)]">
          <CheckIcon size={20} />
        </div>
        <span className="text-xs font-semibold text-[var(--text-muted)]">Laba Bersih</span>
      </div>

      <div>
        <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide mb-1">
          Laba Bersih ({recapType})
        </p>
        <p
          className="text-2xl font-bold font-mono tabular-nums"
          style={{ color: isProfit ? 'var(--status-success)' : 'var(--status-danger)' }}
        >
          {formatIDR(net)}
        </p>
        <p
          className="text-xs font-mono mt-1.5"
          style={{ color: isProfit ? 'var(--status-success)' : 'var(--status-danger)' }}
        >
          Margin: {margin}%
        </p>
      </div>
    </div>
  );
}

// ─── Period Segmented Control ─────────────────────────────────────────────

function PeriodControl({ value, onChange }) {
  const options = ['harian', 'bulanan', 'tahunan'];
  return (
    <div className="flex gap-0 border border-[var(--border-subtle)] rounded-[var(--radius-default)] overflow-hidden">
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          /* min touch target 44px height on mobile */
          className="px-3 py-2 min-h-[44px] md:min-h-0 md:py-1.5 text-xs font-semibold transition-colors capitalize"
          style={
            value === opt
              ? { backgroundColor: 'var(--brand)', color: '#fff' }
              : { backgroundColor: 'transparent', color: 'var(--text-muted)' }
          }
        >
          {opt.charAt(0).toUpperCase() + opt.slice(1)}
        </button>
      ))}
    </div>
  );
}

// ─── Custom Chart Tooltip ─────────────────────────────────────────────────

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="surface-card px-3 py-2 text-xs">
      <p className="font-semibold text-[var(--text-main)] mb-1">{label}</p>
      <p className="font-mono tabular-nums text-[var(--text-muted)]">
        {formatIDR(payload[0].value)}
      </p>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────

export default function Dashboard() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recapType, setRecapType] = useState('harian');
  const cardsRef = useRef(null);

  useEffect(() => {
    const controller = new AbortController();
    fetchData(controller.signal);
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!loading && cardsRef.current) {
      animate(cardsRef.current.querySelectorAll('.card'), {
        translateY: [16, 0],
        opacity: [0, 1],
        duration: 400,
        delay: stagger(80),
        easing: 'easeOutQuad',
      });
    }
  }, [loading]);

  const fetchData = async (signal, retryCount = 0) => {
    try {
      const response = await getTransactions();
      if (signal?.aborted) return;
      setTransactions(Array.isArray(response) ? response : (response.data || []));
    } catch (error) {
      if (error.name === 'AbortError' || error.name === 'CanceledError') return;
      // Auto-retry once on timeout
      if (retryCount === 0 && (error.code === 'ECONNABORTED' || !error.response)) {
        setTimeout(() => fetchData(signal, 1), 1500);
        return;
      }
      console.error('Failed to fetch transactions', error);
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    // Optimistic delete — remove from UI immediately
    const txToDelete = transactions.find((t) => t.id === id);
    if (!txToDelete) return;

    setTransactions((prev) => prev.filter((t) => t.id !== id));

    let undone = false;
    // After 5s, actually call the API
    const deleteTimer = setTimeout(async () => {
      if (undone) return;
      try {
        await deleteTransaction(id);
        fetchData();
      } catch (error) {
        // Restore on API failure
        setTransactions((prev) => {
          const copy = [...prev, txToDelete];
          return copy.sort((a, b) => new Date(b.date) - new Date(a.date));
        });
        toast.error('Gagal menghapus: ' + (error.response?.data?.message || error.message));
      }
    }, 5000);

    toast('Transaksi dihapus', {
      duration: 5000,
      action: {
        label: 'Batal',
        onClick: () => {
          undone = true;
          clearTimeout(deleteTimer);
          // Restore the transaction
          setTransactions((prev) => {
            const copy = [...prev, txToDelete];
            return copy.sort((a, b) => new Date(b.date) - new Date(a.date));
          });
          toast.success('Penghapusan dibatalkan');
        },
      },
    });
  };

  const handleUpdateQuantity = async (id, currentQty, change) => {
    const newQty = currentQty + change;
    if (newQty < 1) return;
    try {
      await updateTransaction(id, { quantity: newQty });
      fetchData();
    } catch (error) {
      toast.error('Gagal update: ' + (error.response?.data?.message || error.message));
    }
  };

  // ─── Filter logic ────────────────────────────────────────────────────

  const filterByPeriod = (txList, period, offset = 0) => {
    const now = new Date();
    return txList.filter((t) => {
      // Use date string directly to avoid timezone issues
      const dateStr = t.date?.slice(0, 10); // "YYYY-MM-DD"
      if (period === 'harian') {
        const target = new Date(now);
        target.setDate(target.getDate() - offset);
        const targetStr = target.toISOString().slice(0, 10);
        return dateStr === targetStr;
      }
      const d = new Date(dateStr + 'T12:00:00'); // noon to avoid DST issues
      if (period === 'bulanan') {
        const target = new Date(now);
        target.setMonth(target.getMonth() - offset);
        return d.getMonth() === target.getMonth() && d.getFullYear() === target.getFullYear();
      }
      if (period === 'tahunan') {
        return d.getFullYear() === now.getFullYear() - offset;
      }
      return true;
    });
  };

  const sumTotals = (txList) =>
    txList.reduce(
      (acc, t) => {
        if (t.type === 'penjualan') acc.sales += Number(t.total);
        else acc.expense += Number(t.total);
        return acc;
      },
      { sales: 0, expense: 0 }
    );

  const calcChange = (current, previous) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  const filtered = filterByPeriod(transactions, recapType, 0);
  const prev     = filterByPeriod(transactions, recapType, 1);
  const totals   = sumTotals(filtered);
  const prevTotals = sumTotals(prev);

  const salesChange   = calcChange(totals.sales, prevTotals.sales);
  const expenseChange = calcChange(totals.expense, prevTotals.expense);

  const chartData = [
    { name: 'Penjualan',   amount: totals.sales,   color: 'var(--status-success)' },
    { name: 'Pengeluaran', amount: totals.expense,  color: 'var(--status-danger)' },
  ];

  // ─── Loading — Skeleton Screen ───────────────────────────────────────

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Header skeleton */}
        <div className="space-y-2">
          <div className="skeleton h-7 w-36 rounded-[var(--radius-default)]" />
          <div className="skeleton h-4 w-64 rounded-[var(--radius-default)]" />
        </div>

        {/* Stats cards skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="card p-5 space-y-4">
              <div className="flex items-start justify-between">
                <div className="skeleton w-10 h-10 rounded-[var(--radius-card)]" />
                <div className="skeleton h-6 w-14 rounded-[var(--radius-sm)]" />
              </div>
              <div className="space-y-2">
                <div className="skeleton h-3 w-32 rounded-[var(--radius-default)]" />
                <div className="skeleton h-7 w-40 rounded-[var(--radius-default)]" />
                <div className="skeleton h-3 w-28 rounded-[var(--radius-default)]" />
              </div>
            </div>
          ))}
        </div>

        {/* Chart + Table skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Chart skeleton */}
          <div className="card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="skeleton h-4 w-36 rounded-[var(--radius-default)]" />
              <div className="skeleton h-7 w-44 rounded-[var(--radius-default)]" />
            </div>
            <div className="skeleton h-[260px] w-full rounded-[var(--radius-card)]" />
          </div>

          {/* Table skeleton */}
          <div className="card p-5 space-y-4">
            <div className="skeleton h-4 w-32 rounded-[var(--radius-default)]" />
            <div className="space-y-3">
              {/* Table header */}
              <div className="flex gap-3 pb-2 border-b border-[var(--border-subtle)]">
                {[60, 48, 80, 32, 64].map((w, i) => (
                  <div key={i} className="skeleton h-3 rounded-[var(--radius-default)]" style={{ width: w }} />
                ))}
              </div>
              {/* Table rows */}
              {[0, 1, 2, 3, 4].map((i) => (
                <div key={i} className="flex gap-3 items-center py-1">
                  <div className="skeleton h-3 w-16 rounded-[var(--radius-default)]" />
                  <div className="skeleton h-5 w-10 rounded-[var(--radius-sm)]" />
                  <div className="skeleton h-3 flex-1 rounded-[var(--radius-default)]" />
                  <div className="skeleton h-3 w-6 rounded-[var(--radius-default)]" />
                  <div className="skeleton h-3 w-16 rounded-[var(--radius-default)]" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── Render ───────────────────────────────────────────────────────────

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6" ref={cardsRef}>

      {/* ── Header ──────────────────────────────────────────────────── */}
      <div>
        <h2 className="text-2xl font-bold text-[var(--text-main)]">Dashboard</h2>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          Selamat datang,{' '}
          <span className="font-semibold text-[var(--text-main)]">{user?.name}</span>
          {' '}—{' '}
          <span
            className="inline-flex items-center px-2 py-0.5 rounded-[var(--radius-sm)]
              text-xs font-semibold capitalize"
            style={{
              backgroundColor: 'var(--brand-muted)',
              color: 'var(--brand)',
            }}
          >
            {user?.role}
          </span>
        </p>
      </div>

      {/* ── Stats Cards ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatsCard
          label={`Total Penjualan (${recapType})`}
          value={totals.sales}
          prevValue={prevTotals.sales}
          change={salesChange}
          isPositiveGood={true}
          accentColor="var(--status-success)"
          icon={<TrendUpIcon size={20} />}
        />
        <StatsCard
          label={`Total Pengeluaran (${recapType})`}
          value={totals.expense}
          prevValue={prevTotals.expense}
          change={expenseChange}
          isPositiveGood={false}
          accentColor="var(--status-danger)"
          icon={<TrendDownIcon size={20} />}
        />
        <NetProfitCard
          sales={totals.sales}
          expense={totals.expense}
          recapType={recapType}
        />
      </div>

      {/* ── Chart + Table ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Chart */}
        <div className="card p-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
            <h3 className="text-sm font-bold text-[var(--text-main)]">Statistik Keuangan</h3>
            <PeriodControl value={recapType} onChange={setRecapType} />
          </div>

          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--border-subtle)"
                vertical={false}
              />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tickFormatter={(v) => `${(v / 1000000).toFixed(0)}jt`}
                tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                tickLine={false}
                axisLine={false}
                width={40}
              />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: 'var(--bg-app)' }} />
              <Bar dataKey="amount" radius={[4, 4, 0, 0]} barSize={52}>
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Recent Transactions */}
        <div className="card p-5">
          <h3 className="text-sm font-bold text-[var(--text-main)] mb-4">Transaksi Terbaru</h3>

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-52 gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                className="text-[var(--text-muted)]">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <p className="text-sm text-[var(--text-muted)]">Tidak ada transaksi untuk ditampilkan.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border-subtle)]">
                    <th className="pb-2 text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">Tanggal</th>
                    <th className="pb-2 text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">Jenis</th>
                    <th className="pb-2 text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">Produk</th>
                    <th className="pb-2 text-right text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">Qty</th>
                    <th className="pb-2 text-right text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">Total</th>
                    {user?.role === 'owner' && (
                      <th className="pb-2 text-center text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">Aksi</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)]">
                  {filtered.slice(0, 5).map((t) => (
                    <tr key={t.id} className="group hover:bg-[var(--bg-app)] transition-colors">
                      <td className="py-2.5 pr-3 text-xs font-mono text-[var(--text-muted)] whitespace-nowrap">
                        {formatDate(t.date)}
                      </td>
                      <td className="py-2.5 pr-3">
                        {t.type === 'penjualan' ? (
                          <span className="badge-success text-[10px]">Jual</span>
                        ) : (
                          <span className="badge-danger text-[10px]">Keluar</span>
                        )}
                      </td>
                      <td className="py-2.5 pr-3 text-xs font-medium text-[var(--text-main)] max-w-[120px] truncate">
                        {t.price_list?.product_name || t.note || '—'}
                      </td>
                      <td className="py-2.5 pr-3 text-right">
                        {user?.role === 'owner' ? (
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleUpdateQuantity(t.id, t.quantity, -1)}
                              aria-label="Kurangi"
                              className="w-7 h-7 flex items-center justify-center rounded-[var(--radius-sm)]
                                text-[var(--text-muted)] hover:bg-[var(--border-subtle)]
                                hover:text-[var(--text-main)] transition-colors text-sm font-bold"
                            >−</button>
                            <span className="font-mono text-xs text-[var(--text-main)] w-6 text-center tabular-nums">
                              {t.quantity}
                            </span>
                            <button
                              onClick={() => handleUpdateQuantity(t.id, t.quantity, 1)}
                              aria-label="Tambah"
                              className="w-7 h-7 flex items-center justify-center rounded-[var(--radius-sm)]
                                text-[var(--text-muted)] hover:bg-[var(--border-subtle)]
                                hover:text-[var(--text-main)] transition-colors text-sm font-bold"
                            >+</button>
                          </div>
                        ) : (
                          <span className="font-mono text-xs text-[var(--text-main)] tabular-nums">
                            {t.quantity}
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 text-right font-mono text-xs font-semibold text-[var(--text-main)] tabular-nums whitespace-nowrap">
                        {formatIDR(t.total)}
                      </td>
                      {user?.role === 'owner' && (
                        <td className="py-2.5 text-center">
                          <button
                            onClick={() => handleDelete(t.id)}
                            aria-label="Hapus transaksi"
                            title="Hapus Transaksi"
                            className="w-8 h-8 flex items-center justify-center rounded-[var(--radius-default)]
                              text-[var(--text-muted)] hover:text-[var(--status-danger)]
                              hover:bg-[var(--status-danger-bg)] transition-colors"
                          >
                            <TrashIcon size={15} />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────

function TrendUpIcon({ size = 20 }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  );
}

function TrendDownIcon({ size = 20 }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
      <polyline points="17 18 23 18 23 12" />
    </svg>
  );
}

function CheckIcon({ size = 20 }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

function TrashIcon({ size = 16 }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}
