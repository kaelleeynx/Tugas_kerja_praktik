import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createTransaction } from '../services/api';
import priceListService from '../services/priceListService';
import { motion, AnimatePresence } from 'framer-motion';
import useDebounce from '../hooks/useDebounce';

// ─── Helpers ──────────────────────────────────────────────────────────────

function getNowDate() {
  return new Date().toISOString().slice(0, 10);
}

function formatIDR(n) {
  return Number(n).toLocaleString('id-ID', {
    style: 'currency', currency: 'IDR', maximumFractionDigits: 0,
  });
}

// ─── Skeleton ─────────────────────────────────────────────────────────────

function POSSkeleton() {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="space-y-2 mb-6">
        <div className="skeleton h-7 w-48 rounded-[var(--radius-default)]" />
        <div className="skeleton h-4 w-64 rounded-[var(--radius-default)]" />
      </div>
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left skeleton */}
        <div className="flex-1 space-y-4">
          <div className="skeleton h-10 w-full rounded-[var(--radius-default)]" />
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[0,1,2,3,4,5].map(i => (
              <div key={i} className="card p-4 space-y-2">
                <div className="skeleton h-4 w-3/4 rounded-[var(--radius-default)]" />
                <div className="skeleton h-3 w-1/2 rounded-[var(--radius-default)]" />
                <div className="skeleton h-3 w-1/3 rounded-[var(--radius-default)]" />
              </div>
            ))}
          </div>
        </div>
        {/* Right skeleton */}
        <div className="w-full lg:w-80 space-y-4">
          <div className="card p-5 space-y-3">
            <div className="skeleton h-4 w-32 rounded-[var(--radius-default)]" />
            <div className="skeleton h-10 w-full rounded-[var(--radius-default)]" />
            <div className="skeleton h-10 w-full rounded-[var(--radius-default)]" />
            <div className="skeleton h-24 w-full rounded-[var(--radius-card)]" />
            <div className="skeleton h-10 w-full rounded-[var(--radius-default)]" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Product Card ─────────────────────────────────────────────────────────

function ProductCard({ product, onSelect, isSelected }) {
  const isOutOfStock = product.stock === 0;

  return (
    <motion.button
      type="button"
      onClick={() => !isOutOfStock && onSelect(product)}
      disabled={isOutOfStock}
      whileTap={!isOutOfStock ? { scale: 0.97 } : {}}
      className="w-full text-left p-4 rounded-[var(--radius-card)] border transition-all
        disabled:opacity-50 disabled:cursor-not-allowed"
      style={
        isSelected
          ? {
              backgroundColor: 'var(--brand-muted)',
              borderColor: 'var(--brand)',
              borderWidth: '2px',
            }
          : {
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-subtle)',
            }
      }
    >
      <p className="text-sm font-semibold text-[var(--text-main)] leading-tight line-clamp-2 mb-2">
        {product.product_name}
      </p>
      <p className="font-mono text-xs text-[var(--text-muted)] tabular-nums mb-1">
        {product.product_id}
      </p>
      <div className="flex items-center justify-between mt-2">
        <span className="font-mono text-xs font-bold tabular-nums" style={{ color: 'var(--brand)' }}>
          {formatIDR(product.price)}
        </span>
        <span
          className="text-[10px] font-semibold px-1.5 py-0.5 rounded-[var(--radius-sm)] font-mono tabular-nums"
          style={
            product.stock === 0
              ? { backgroundColor: 'var(--status-danger-bg)', color: 'var(--status-danger)' }
              : product.stock < 5
              ? { backgroundColor: 'var(--status-warning-bg)', color: 'var(--status-warning)' }
              : { backgroundColor: 'var(--status-success-bg)', color: 'var(--status-success)' }
          }
        >
          {product.stock} unit
        </span>
      </div>
    </motion.button>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────

export default function TransactionForm() {
  const [type, setType]               = useState('penjualan');
  const [date, setDate]               = useState(getNowDate());
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [qty, setQty]                 = useState(1);
  const [price, setPrice]             = useState(0);
  const [note, setNote]               = useState('');
  const [search, setSearch]           = useState('');
  const [products, setProducts]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [submitting, setSubmitting]   = useState(false);
  const [msg, setMsg]                 = useState('');
  const [error, setError]             = useState('');
  const [sheetOpen, setSheetOpen]     = useState(false);

  const debouncedSearch = useDebounce(search, 250);

  useEffect(() => {
    priceListService.getPriceList()
      .then(setProducts)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const selectProduct = useCallback((p) => {
    setSelectedProduct(p);
    setPrice(p.price);
    setError('');
    if (window.innerWidth < 1024) setSheetOpen(true);
  }, []);

  // Refresh product list from API — called after successful transaction
  const refreshProducts = useCallback(async () => {
    try {
      const fresh = await priceListService.getPriceList();
      setProducts(fresh);
      // If selected product is now out of stock, deselect it
      if (selectedProduct) {
        const updated = fresh.find((p) => p.id === selectedProduct.id);
        if (updated && updated.stock === 0) {
          setSelectedProduct(null);
          setPrice(0);
        } else if (updated) {
          setSelectedProduct(updated);
        }
      }
    } catch {
      // Non-critical — silently fail
    }
  }, [selectedProduct]);

  const filteredProducts = products.filter((p) => {
    const q = debouncedSearch.toLowerCase();
    return (
      p.product_name.toLowerCase().includes(q) ||
      p.product_id.toLowerCase().includes(q)
    );
  });

  const total = Number(qty) * Number(price);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!selectedProduct) {
      setError('Pilih produk terlebih dahulu.');
      return;
    }
    if (Number(qty) < 1) {
      setError('Jumlah minimal 1.');
      return;
    }

    // Optimistic stock update — immediately reflect in UI
    if (type === 'penjualan') {
      setProducts((prev) =>
        prev.map((p) =>
          p.id === selectedProduct.id
            ? { ...p, stock: Math.max(0, p.stock - Number(qty)) }
            : p
        )
      );
    }

    setSubmitting(true);
    try {
      await createTransaction({
        date,
        type,
        price_list_id: selectedProduct.id,
        quantity: Number(qty),
        price: Number(price),
        note,
      });

      setMsg('Transaksi berhasil disimpan!');
      setSelectedProduct(null);
      setQty(1);
      setPrice(0);
      setNote('');
      setSearch('');
      setTimeout(() => setMsg(''), 3000);

      // Refresh product list to get accurate stock from server
      refreshProducts();
    } catch (err) {
      // Revert optimistic update on failure
      if (type === 'penjualan') {
        setProducts((prev) =>
          prev.map((p) =>
            p.id === selectedProduct.id
              ? { ...p, stock: p.stock + Number(qty) }
              : p
          )
        );
      }
      setError(err.response?.data?.message || err.message || 'Gagal menyimpan transaksi');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <POSSkeleton />;

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">

      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-[var(--text-main)]">Input Transaksi</h2>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          Pilih produk, atur jumlah, lalu simpan transaksi.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        {/* On mobile: single column. On lg: side-by-side */}
        <div className="flex flex-col lg:flex-row gap-6 items-start">

          {/* ── LEFT: Product Selector ─────────────────────────────── */}
          {/* Extra bottom padding on mobile so content isn't hidden behind sticky panel */}
          <div className="flex-1 min-w-0 space-y-4 pb-[200px] lg:pb-0">

            {/* Search */}
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
                xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                placeholder="Cari nama atau kode barang..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input-industrial pl-9"
              />
            </div>

            {/* Product Grid */}
            {filteredProducts.length === 0 ? (
              <div className="card p-10 flex flex-col items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24"
                  fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                  className="text-[var(--text-muted)]">
                  <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <p className="text-sm text-[var(--text-muted)]">Produk tidak ditemukan.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
                {filteredProducts.map((p) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    onSelect={selectProduct}
                    isSelected={selectedProduct?.id === p.id}
                  />
                ))}
              </div>
            )}
          </div>

          {/* ── Desktop: Sticky Sidebar ──────────────────────────────── */}
          <div className="hidden lg:block w-80 sticky top-20">
            <div className="card p-5 space-y-4">
              <h3 className="text-sm font-bold text-[var(--text-main)]">Detail Transaksi</h3>
              <TransactionPanelContent
                type={type} setType={setType}
                date={date} setDate={setDate}
                selectedProduct={selectedProduct} setSelectedProduct={setSelectedProduct}
                setPrice={setPrice} qty={qty} setQty={setQty}
                price={price} setError={setError}
                note={note} setNote={setNote}
                total={total} msg={msg} error={error}
                submitting={submitting}
                onClose={null}
              />
            </div>
          </div>
        </div>
      </form>

      {/* ── Mobile: FAB + Bottom Sheet ───────────────────────────────── */}
      <div className="lg:hidden">
        {/* FAB — cart icon, shows badge when product selected */}
        <AnimatePresence>
          {!sheetOpen && (
            <motion.button
              type="button"
              onClick={() => setSheetOpen(true)}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              className="fixed bottom-6 right-6 z-30 w-14 h-14 rounded-full
                flex items-center justify-center shadow-lg"
              style={{ backgroundColor: 'var(--brand)', color: '#fff' }}
              title="Buka Detail Transaksi"
            >
              <div className="relative">
                <CartIcon size={22} />
                {selectedProduct && (
                  <span className="absolute -top-2 -right-2 w-4 h-4 rounded-full
                    bg-white text-[var(--brand)] text-[9px] font-bold
                    flex items-center justify-center leading-none">
                    1
                  </span>
                )}
              </div>
            </motion.button>
          )}
        </AnimatePresence>

        {/* Backdrop */}
        <AnimatePresence>
          {sheetOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-30 bg-black/40"
              onClick={() => setSheetOpen(false)}
            />
          )}
        </AnimatePresence>

        {/* Bottom Sheet */}
        <AnimatePresence>
          {sheetOpen && (
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-40
                bg-[var(--bg-surface)] rounded-t-[var(--radius-modal)]
                shadow-[var(--shadow-elevated)] max-h-[85vh] overflow-y-auto"
            >
              {/* Drag handle */}
              <div className="flex justify-center pt-3 pb-1 sticky top-0 bg-[var(--bg-surface)]">
                <div className="w-10 h-1 rounded-full bg-[var(--border-subtle)]" />
              </div>

              <form onSubmit={handleSubmit} className="px-4 pb-8 pt-2 space-y-4">
                {/* Sheet header */}
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-[var(--text-main)]">Detail Transaksi</h3>
                  <button type="button" onClick={() => setSheetOpen(false)}
                    className="p-1.5 rounded-[var(--radius-default)] text-[var(--text-muted)]
                      hover:bg-[var(--bg-app)] transition-colors">
                    <XIcon size={18} />
                  </button>
                </div>

                <TransactionPanelContent
                  type={type} setType={setType}
                  date={date} setDate={setDate}
                  selectedProduct={selectedProduct} setSelectedProduct={setSelectedProduct}
                  setPrice={setPrice} qty={qty} setQty={setQty}
                  price={price} setError={setError}
                  note={note} setNote={setNote}
                  total={total} msg={msg} error={error}
                  submitting={submitting}
                  onClose={() => setSheetOpen(false)}
                />
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── Transaction Panel Content (reused in desktop sidebar & mobile sheet) ────

function TransactionPanelContent({
  type, setType, date, setDate,
  selectedProduct, setSelectedProduct, setPrice,
  qty, setQty, price, setError,
  note, setNote, total, msg, error, submitting,
}) {
  return (
    <>
      {/* Transaction type */}
      <div>
        <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Jenis Transaksi</label>
        <div className="flex border border-[var(--border-subtle)] rounded-[var(--radius-default)] overflow-hidden">
          {[{ value: 'penjualan', label: 'Penjualan' }, { value: 'pengeluaran', label: 'Pengeluaran' }].map((opt) => (
            <button key={opt.value} type="button" onClick={() => setType(opt.value)}
              className="flex-1 py-2 text-xs font-semibold transition-colors min-h-[40px]"
              style={type === opt.value ? { backgroundColor: 'var(--brand)', color: '#fff' } : { backgroundColor: 'transparent', color: 'var(--text-muted)' }}>
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Date */}
      <div>
        <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">
          Tanggal <span style={{ color: 'var(--status-danger)' }}>*</span>
        </label>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
          required className="input-industrial font-mono text-sm" />
      </div>

      {/* Selected product */}
      <div>
        <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">
          Produk <span style={{ color: 'var(--status-danger)' }}>*</span>
        </label>
        {selectedProduct ? (
          <div className="p-3 rounded-[var(--radius-default)] border"
            style={{ backgroundColor: 'var(--brand-muted)', borderColor: 'var(--brand)' }}>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[var(--text-main)] truncate">{selectedProduct.product_name}</p>
                <p className="font-mono text-xs text-[var(--text-muted)] tabular-nums mt-0.5">{selectedProduct.product_id}</p>
              </div>
              <button type="button" onClick={() => { setSelectedProduct(null); setPrice(0); setError(''); }}
                className="flex-shrink-0 p-1 rounded-[var(--radius-default)] text-[var(--text-muted)]
                  hover:text-[var(--status-danger)] hover:bg-[var(--status-danger-bg)] transition-colors">
                <XIcon size={14} />
              </button>
            </div>
          </div>
        ) : (
          <div className="p-3 rounded-[var(--radius-default)] border border-dashed border-[var(--border-subtle)] text-center">
            <p className="text-xs text-[var(--text-muted)]">Pilih produk dari grid</p>
          </div>
        )}
      </div>

      {/* Qty + Price */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">
            Jumlah <span style={{ color: 'var(--status-danger)' }}>*</span>
          </label>
          <input type="number" min="1" value={qty} onChange={(e) => setQty(e.target.value)}
            required className="input-industrial font-mono text-sm tabular-nums"
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); document.getElementById('pos-price')?.focus(); } }} />
        </div>
        <div>
          <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">
            Harga Satuan <span style={{ color: 'var(--status-danger)' }}>*</span>
          </label>
          <input id="pos-price" type="number" min="0" value={price} onChange={(e) => setPrice(e.target.value)}
            required className="input-industrial font-mono text-sm tabular-nums" />
        </div>
      </div>

      {/* Note */}
      <div>
        <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Catatan (Opsional)</label>
        <input type="text" value={note} onChange={(e) => setNote(e.target.value)}
          placeholder="Misal: stok bulanan" className="input-industrial text-sm" />
      </div>

      {/* Summary */}
      <div className="summary-box-brand">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-bold uppercase tracking-wide text-[var(--text-muted)]">Total Bayar</span>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-[var(--radius-sm)] capitalize"
            style={{ backgroundColor: type === 'penjualan' ? 'var(--status-success-bg)' : 'var(--status-danger-bg)', color: type === 'penjualan' ? 'var(--status-success)' : 'var(--status-danger)' }}>
            {type}
          </span>
        </div>
        <p className="text-2xl lg:text-3xl font-bold font-mono tabular-nums leading-tight" style={{ color: 'var(--brand)' }}>
          {formatIDR(total)}
        </p>
        {selectedProduct && (
          <p className="text-xs text-[var(--text-muted)] font-mono tabular-nums mt-1">{qty} × {formatIDR(price)}</p>
        )}
      </div>

      {/* Feedback */}
      <AnimatePresence>
        {msg && (
          <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }}
            className="flex items-center gap-2 p-3 rounded-[var(--radius-default)] text-xs font-medium"
            style={{ backgroundColor: 'var(--status-success-bg)', color: 'var(--status-success)' }}>
            <CheckIcon size={14} />{msg}
          </motion.div>
        )}
        {error && (
          <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }}
            className="flex items-center gap-2 p-3 rounded-[var(--radius-default)] text-xs font-medium"
            style={{ backgroundColor: 'var(--status-danger-bg)', color: 'var(--status-danger)' }}>
            <AlertIcon size={14} />{error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Submit */}
      <button type="submit" disabled={submitting || !selectedProduct}
        className="w-full h-11 flex items-center justify-center gap-2 text-sm font-bold
          rounded-[var(--radius-default)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ backgroundColor: 'var(--brand)', color: '#fff' }}>
        {submitting ? (
          <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Menyimpan...</>
        ) : (
          <><SaveIcon size={16} />Simpan Transaksi</>
        )}
      </button>
    </>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────

function XIcon({ size = 16 }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function CheckIcon({ size = 16 }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
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

function SaveIcon({ size = 16 }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
      <polyline points="17 21 17 13 7 13 7 21" />
      <polyline points="7 3 7 8 15 8" />
    </svg>
  );
}

function CartIcon({ size = 22 }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
  );
}
