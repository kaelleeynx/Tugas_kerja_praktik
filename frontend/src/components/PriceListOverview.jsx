import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

// ─── Brand-aligned chart colors ───────────────────────────────────────────
// Using a palette that works in both light and dark mode
const CHART_COLORS = [
  '#FF6F3C', // brand orange
  '#10B981', // success green
  '#3B82F6', // info blue
  '#F59E0B', // warning amber
  '#8B5CF6', // purple
  '#EC4899', // pink
];

// ─── Custom Tooltip ───────────────────────────────────────────────────────

function PieTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="surface-card px-3 py-2 text-xs">
      <p className="font-semibold text-[var(--text-main)]">{payload[0].name}</p>
      <p className="font-mono tabular-nums text-[var(--text-muted)] mt-0.5">
        {payload[0].value} unit
      </p>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────

const PriceListOverview = ({ items }) => {
  // Stock distribution by category
  const chartData = items.reduce((acc, item) => {
    const existing = acc.find((x) => x.name === item.category);
    if (existing) {
      existing.value += item.stock;
    } else {
      acc.push({ name: item.category, value: item.stock });
    }
    return acc;
  }, []);

  const totalStock   = items.reduce((s, i) => s + i.stock, 0);
  const lowStockCount = items.filter((i) => i.stock < 5).length;
  const outOfStock   = items.filter((i) => i.stock === 0).length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

      {/* ── Pie Chart ─────────────────────────────────────────────── */}
      <div className="card p-5">
        <h3 className="text-sm font-bold text-[var(--text-main)] mb-4">
          Distribusi Stok per Kategori
        </h3>

        {chartData.length === 0 ? (
          <div className="h-52 flex items-center justify-center">
            <p className="text-sm text-[var(--text-muted)]">Belum ada data</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={3}
                dataKey="value"
              >
                {chartData.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<PieTooltip />} />
              <Legend
                iconType="circle"
                iconSize={8}
                formatter={(value) => (
                  <span className="text-xs text-[var(--text-muted)]">{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ── Stock Summary ─────────────────────────────────────────── */}
      <div className="card p-5 flex flex-col gap-4">
        <h3 className="text-sm font-bold text-[var(--text-main)]">Ringkasan Stok</h3>

        {/* Total stock */}
        <div className="flex items-center justify-between py-3
          border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-[var(--radius-card)] flex items-center justify-center
              bg-[var(--brand-muted)] text-[var(--brand)]">
              <PackageIcon size={16} />
            </div>
            <div>
              <p className="text-xs text-[var(--text-muted)]">Total Stok</p>
              <p className="text-sm font-semibold text-[var(--text-main)]">Semua Barang</p>
            </div>
          </div>
          <span className="font-mono text-lg font-bold text-[var(--text-main)] tabular-nums">
            {totalStock.toLocaleString('id-ID')}
          </span>
        </div>

        {/* Low stock */}
        <div className="flex items-center justify-between py-3
          border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-[var(--radius-card)] flex items-center justify-center"
              style={{ backgroundColor: 'var(--status-warning-bg)', color: 'var(--status-warning)' }}>
              <AlertIcon size={16} />
            </div>
            <div>
              <p className="text-xs text-[var(--text-muted)]">Stok Menipis</p>
              <p className="text-sm font-semibold text-[var(--text-main)]">Di bawah 5 unit</p>
            </div>
          </div>
          <span className="font-mono text-lg font-bold tabular-nums"
            style={{ color: lowStockCount > 0 ? 'var(--status-warning)' : 'var(--text-muted)' }}>
            {lowStockCount}
          </span>
        </div>

        {/* Out of stock */}
        <div className="flex items-center justify-between py-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-[var(--radius-card)] flex items-center justify-center"
              style={{ backgroundColor: 'var(--status-danger-bg)', color: 'var(--status-danger)' }}>
              <XCircleIcon size={16} />
            </div>
            <div>
              <p className="text-xs text-[var(--text-muted)]">Stok Habis</p>
              <p className="text-sm font-semibold text-[var(--text-main)]">0 unit tersisa</p>
            </div>
          </div>
          <span className="font-mono text-lg font-bold tabular-nums"
            style={{ color: outOfStock > 0 ? 'var(--status-danger)' : 'var(--text-muted)' }}>
            {outOfStock}
          </span>
        </div>
      </div>
    </div>
  );
};

export default PriceListOverview;

// ─── Icons ────────────────────────────────────────────────────────────────

function PackageIcon({ size = 16 }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  );
}

function AlertIcon({ size = 16 }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

function XCircleIcon({ size = 16 }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  );
}
