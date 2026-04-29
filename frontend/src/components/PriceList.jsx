import React, { useState, useEffect } from 'react';
import priceListService from '../services/priceListService';
import PriceListOverview from './PriceListOverview';
import PriceListTable from './PriceListTable';
import useDebounce from '../hooks/useDebounce';
import { animate } from 'animejs';
import { toast } from 'sonner';

// ─── Skeleton ─────────────────────────────────────────────────────────────

function PriceListSkeleton() {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="skeleton h-7 w-40 rounded-[var(--radius-default)]" />
        <div className="skeleton h-4 w-56 rounded-[var(--radius-default)]" />
      </div>

      {/* Overview cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[0, 1].map((i) => (
          <div key={i} className="card p-5 space-y-3">
            <div className="skeleton h-4 w-40 rounded-[var(--radius-default)]" />
            <div className="skeleton h-48 w-full rounded-[var(--radius-card)]" />
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="card p-4 flex gap-4">
        <div className="skeleton h-10 flex-1 max-w-sm rounded-[var(--radius-default)]" />
        <div className="flex gap-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-8 w-16 rounded-[var(--radius-default)]" />
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-[var(--border-subtle)] flex gap-4">
          {[80, 120, 80, 60, 60, 60, 60, 80].map((w, i) => (
            <div key={i} className="skeleton h-3 rounded-[var(--radius-default)]" style={{ width: w }} />
          ))}
        </div>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="px-4 py-3 border-b border-[var(--border-subtle)] flex gap-4 items-center">
            <div className="skeleton h-3 w-20 rounded-[var(--radius-default)]" />
            <div className="skeleton h-3 w-32 rounded-[var(--radius-default)]" />
            <div className="skeleton h-5 w-16 rounded-[var(--radius-sm)]" />
            <div className="skeleton h-3 w-12 rounded-[var(--radius-default)]" />
            <div className="skeleton h-5 w-14 rounded-[var(--radius-sm)]" />
            <div className="skeleton h-3 w-10 rounded-[var(--radius-default)]" />
            <div className="skeleton h-3 w-10 rounded-[var(--radius-default)]" />
            <div className="flex gap-2 ml-auto">
              <div className="skeleton h-7 w-12 rounded-[var(--radius-default)]" />
              <div className="skeleton h-7 w-16 rounded-[var(--radius-default)]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────

const PriceList = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editId, setEditId] = useState(null);
  const [editStock, setEditStock] = useState(0);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  useEffect(() => { fetchItems(); }, []);

  // Entrance animation after data loads
  useEffect(() => {
    if (!loading) {
      animate('.pricelist-animate', {
        translateY: [16, 0],
        opacity: [0, 1],
        duration: 400,
        delay: (el, i) => i * 80,
        easing: 'easeOutQuad',
      });
    }
  }, [loading]);

  const fetchItems = async (retryCount = 0) => {
    try {
      setError(null);
      const data = await priceListService.getPriceList();
      setItems(data);
    } catch (err) {
      // Auto-retry once on timeout (common with php artisan serve single-process)
      if (retryCount === 0 && (err.code === 'ECONNABORTED' || !err.response)) {
        setTimeout(() => fetchItems(1), 1500);
        return;
      }
      setError('Gagal memuat daftar barang');
    } finally {
      setLoading(false);
    }
  };

  const handleSale = async (id) => {
    try {
      await priceListService.saleItem(id, 1);
      fetchItems();
      toast.success('Penjualan berhasil disimpan');
    } catch (err) {
      toast.error('Gagal jual: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleRestock = async (id) => {
    try {
      await priceListService.restockItem(id, 1);
      fetchItems();
      toast.success('Restock berhasil disimpan');
    } catch (err) {
      toast.error('Gagal restock: ' + (err.response?.data?.message || err.message));
    }
  };

  const startEdit = (item) => { setEditId(item.id); setEditStock(item.stock); };

  const saveEdit = async (id) => {
    try {
      await priceListService.updateItem(id, { stock: editStock });
      setEditId(null);
      fetchItems();
      toast.success('Stok berhasil diperbarui');
    } catch (err) {
      toast.error('Gagal update: ' + (err.response?.data?.message || err.message));
    }
  };

  const debouncedSearch = useDebounce(search, 300);

  const filteredItems = items.filter((item) => {
    const q = debouncedSearch.toLowerCase();
    const matchSearch =
      item.product_name.toLowerCase().includes(q) ||
      item.product_id.toLowerCase().includes(q);
    const matchCat = categoryFilter === 'All' || item.category === categoryFilter;
    return matchSearch && matchCat;
  });

  const categories = ['All', ...new Set(items.map((i) => i.category))];
  const lowStockItems = items.filter((i) => i.stock < 5).length;

  if (loading) return <PriceListSkeleton />;

  if (error) return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="card p-6 flex items-center gap-3 border-l-4 border-[var(--status-danger)]">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          className="text-[var(--status-danger)] flex-shrink-0">
          <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <p className="text-sm text-[var(--text-main)]">{error}</p>
        <button onClick={fetchItems} className="ml-auto btn-brand text-xs px-3 h-8">
          Coba Lagi
        </button>
      </div>
    </div>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">

      {/* ── Header ──────────────────────────────────────────────────── */}
      <div>
        <h2 className="text-2xl font-bold text-[var(--text-main)]">Daftar Barang</h2>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          Kelola inventaris dan harga barang
        </p>
      </div>

      {/* ── Overview ────────────────────────────────────────────────── */}
      <div className="pricelist-animate" style={{ opacity: 0 }}>
        <PriceListOverview items={items} />
      </div>

      {/* ── Low Stock Alert ──────────────────────────────────────────── */}
      {lowStockItems > 0 && (
        <div className="pricelist-animate flex items-center gap-3 p-4 rounded-[var(--radius-card)]
          border-l-4 border-[var(--status-warning)]"
          style={{ backgroundColor: 'var(--status-warning-bg)' }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            style={{ color: 'var(--status-warning)', flexShrink: 0 }}>
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <p className="text-sm font-medium" style={{ color: 'var(--status-warning)' }}>
            <span className="font-bold">{lowStockItems} item</span> dengan stok di bawah 5 unit — segera lakukan restock.
          </p>
        </div>
      )}

      {/* ── Toolbar: Search + Category Filter ───────────────────────── */}
      <div className="pricelist-animate card p-4 flex flex-col md:flex-row gap-3 items-start md:items-center" style={{ opacity: 0 }}>
        {/* Search */}
        <div className="relative w-full md:w-80">
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

        {/* Category pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <svg className="text-[var(--text-muted)] flex-shrink-0"
            xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
          </svg>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className="px-3 py-1 text-xs font-semibold rounded-[var(--radius-default)]
                transition-colors whitespace-nowrap"
              style={
                categoryFilter === cat
                  ? { backgroundColor: 'var(--brand)', color: '#fff' }
                  : {
                      backgroundColor: 'var(--bg-app)',
                      color: 'var(--text-muted)',
                      border: '1px solid var(--border-subtle)',
                    }
              }
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Result count */}
        <span className="ml-auto text-xs text-[var(--text-muted)] whitespace-nowrap">
          {filteredItems.length} dari {items.length} item
        </span>
      </div>

      {/* ── Table ───────────────────────────────────────────────────── */}
      <div className="pricelist-animate" style={{ opacity: 0 }}>
        <PriceListTable
          filteredItems={filteredItems}
          editId={editId}
          editStock={editStock}
          setEditStock={setEditStock}
          saveEdit={saveEdit}
          startEdit={startEdit}
          handleSale={handleSale}
          handleRestock={handleRestock}
        />
      </div>
    </div>
  );
};

export default PriceList;
