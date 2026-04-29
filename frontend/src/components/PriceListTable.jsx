import React from 'react';
import { motion } from 'framer-motion';

// ─── Stock Status Badge ───────────────────────────────────────────────────

function StockBadge({ stock }) {
  if (stock === 0) {
    return <span className="badge-danger font-mono tabular-nums">0 Unit</span>;
  }
  if (stock < 5) {
    return <span className="badge-warning font-mono tabular-nums">{stock} Unit</span>;
  }
  return <span className="badge-success font-mono tabular-nums">{stock} Unit</span>;
}

// ─── Table ────────────────────────────────────────────────────────────────

const PriceListTable = ({
  filteredItems,
  editId,
  editStock,
  setEditStock,
  saveEdit,
  startEdit,
  handleSale,
  handleRestock,
}) => {
  if (filteredItems.length === 0) {
    return (
      <div className="card p-12 flex flex-col items-center gap-3">
        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
          className="text-[var(--text-muted)]">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
          <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
          <line x1="12" y1="22.08" x2="12" y2="12" />
        </svg>
        <p className="text-sm text-[var(--text-muted)]">Tidak ada barang yang cocok dengan filter.</p>
      </div>
    );
  }

  return (
    <motion.div
      className="card overflow-hidden"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border-subtle)] bg-[var(--bg-app)]">
              {[
                { label: 'Kode Barang', mobile: false },
                { label: 'Nama Barang', mobile: true },
                { label: 'Kategori',    mobile: false },
                { label: 'Satuan',      mobile: false },
                { label: 'Stok',        mobile: true },
                { label: 'Qty Jual',    mobile: false },
                { label: 'Qty Beli',    mobile: false },
                { label: 'Aksi',        mobile: true },
              ].map((h) => (
                <th
                  key={h.label}
                  className={`px-4 py-3 text-left text-xs font-semibold text-[var(--text-muted)]
                    uppercase tracking-wide whitespace-nowrap
                    ${h.mobile ? '' : 'hidden sm:table-cell'}`}
                >
                  {h.label}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-[var(--border-subtle)]">
            {filteredItems.map((item) => (
              <tr
                key={item.id}
                className="hover:bg-[var(--bg-app)] transition-colors group"
              >
                {/* Kode Barang — hidden on mobile */}
                <td className="hidden sm:table-cell px-4 py-3 font-mono text-xs text-[var(--text-muted)] whitespace-nowrap tabular-nums">
                  {item.product_id}
                </td>

                {/* Nama Barang */}
                <td className="px-4 py-3 font-medium text-[var(--text-main)]">
                  <span className="block truncate max-w-[120px] sm:max-w-[180px]">{item.product_name}</span>
                  {/* Show product_id below name on mobile */}
                  <span className="sm:hidden block font-mono text-[10px] text-[var(--text-muted)] mt-0.5">
                    {item.product_id}
                  </span>
                </td>

                {/* Kategori — hidden on mobile */}
                <td className="hidden sm:table-cell px-4 py-3 whitespace-nowrap">
                  <span
                    className="px-2 py-0.5 text-xs font-semibold rounded-[var(--radius-sm)]"
                    style={{
                      backgroundColor: 'var(--brand-muted)',
                      color: 'var(--brand)',
                    }}
                  >
                    {item.category}
                  </span>
                </td>

                {/* Satuan — hidden on mobile */}
                <td className="hidden sm:table-cell px-4 py-3 text-xs text-[var(--text-muted)] whitespace-nowrap">
                  {item.unit}
                </td>

                {/* Stok */}
                <td className="px-4 py-3 whitespace-nowrap">
                  {editId === item.id ? (
                    <input
                      type="number"
                      value={editStock}
                      onChange={(e) => setEditStock(e.target.value)}
                      className="input-industrial w-20 h-8 text-xs font-mono"
                      autoFocus
                    />
                  ) : (
                    <StockBadge stock={item.stock} />
                  )}
                </td>

                {/* Qty Jual — hidden on mobile */}
                <td className="hidden sm:table-cell px-4 py-3 font-mono text-xs text-[var(--text-main)] tabular-nums whitespace-nowrap">
                  {item.qty_sales ?? 0}
                </td>

                {/* Qty Beli — hidden on mobile */}
                <td className="hidden sm:table-cell px-4 py-3 font-mono text-xs text-[var(--text-main)] tabular-nums whitespace-nowrap">
                  {item.qty_purchases ?? 0}
                </td>

                {/* Aksi */}
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex items-center gap-1.5 min-w-[120px]">
                    {editId === item.id ? (
                      <>
                        <button
                          onClick={() => saveEdit(item.id)}
                          className="h-8 px-3 text-xs font-semibold rounded-[var(--radius-default)]
                            transition-colors"
                          style={{
                            backgroundColor: 'var(--status-success)',
                            color: '#fff',
                          }}
                        >
                          Simpan
                        </button>
                        <button
                          onClick={() => { setEditStock(item.stock); }}
                          className="h-8 px-2 text-xs font-medium rounded-[var(--radius-default)]
                            text-[var(--text-muted)] border border-[var(--border-subtle)]
                            hover:bg-[var(--bg-app)] transition-colors"
                        >
                          Batal
                        </button>
                      </>
                    ) : (
                      <>
                        {/* Edit icon — always visible on touch, hover-only on desktop */}
                        <button
                          onClick={() => startEdit(item)}
                          title="Edit Stok"
                          className="w-8 h-8 flex items-center justify-center rounded-[var(--radius-default)]
                            text-[var(--text-muted)] hover:text-[var(--text-main)]
                            hover:bg-[var(--bg-app)] transition-colors
                            md:opacity-0 md:group-hover:opacity-100 md:focus:opacity-100"
                        >
                          <EditIcon size={14} />
                        </button>

                        {/* Jual */}
                        <button
                          onClick={() => handleSale(item.id)}
                          disabled={item.stock === 0}
                          className="h-8 px-3 text-xs font-semibold rounded-[var(--radius-default)]
                            transition-colors disabled:opacity-40 disabled:cursor-not-allowed
                            min-w-[48px]"
                          style={{
                            backgroundColor: 'var(--brand)',
                            color: '#fff',
                          }}
                        >
                          Jual
                        </button>

                        {/* Restock */}
                        <button
                          onClick={() => handleRestock(item.id)}
                          className="h-8 px-3 text-xs font-semibold rounded-[var(--radius-default)]
                            transition-colors min-w-[60px]"
                          style={{
                            backgroundColor: 'var(--status-success-bg)',
                            color: 'var(--status-success)',
                            border: '1px solid var(--status-success)',
                          }}
                        >
                          Restock
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
};

export default PriceListTable;

// ─── Icon ─────────────────────────────────────────────────────────────────

function EditIcon({ size = 16 }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}
