import React, { useState, useEffect } from 'react';
import priceListService from '../services/priceListService';
import PriceListOverview from './PriceListOverview';
import PriceListTable from './PriceListTable';
import useDebounce from '../hooks/useDebounce';

const PriceList = ({ token }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editId, setEditId] = useState(null);
  const [editStock, setEditStock] = useState(0);
  
  // New features state
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const data = await priceListService.getPriceList(token);
      setItems(data);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch price list');
      setLoading(false);
    }
  };

  const handleSale = async (id) => {
    try {
      await priceListService.saleItem(id, 1, token);
      fetchItems();
    } catch (err) {
      alert('Sale failed: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleRestock = async (id) => {
    try {
      await priceListService.restockItem(id, 1, token);
      fetchItems();
    } catch (err) {
      alert('Restock failed');
    }
  };

  const startEdit = (item) => {
    setEditId(item.id);
    setEditStock(item.stock);
  };

  const saveEdit = async (id) => {
    try {
      await priceListService.updateItem(id, { stock: editStock }, token);
      setEditId(null);
      fetchItems();
    } catch (err) {
      alert('Update failed');
    }
  };

  // Debounced search for performance
  const debouncedSearch = useDebounce(search, 300);

  // Filter Logic
  const filteredItems = items.filter(item => {
    const matchesSearch = item.product_name.toLowerCase().includes(debouncedSearch.toLowerCase()) || 
                          item.product_id.toLowerCase().includes(debouncedSearch.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const categories = ['All', ...new Set(items.map(item => item.category))];
  const lowStockItems = items.filter(i => i.stock < 5).length;

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  );
  
  if (error) return <div className="text-red-500 text-center p-4">{error}</div>;

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-7xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white tracking-tight">Daftar Barang</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Kelola inventaris dan harga barang</p>
        </div>
      </div>

      <PriceListOverview items={items} />

      {/* Stock Alert Banner */}
      {lowStockItems > 0 && (
        <div className="mb-6 p-4 bg-orange-50 dark:bg-orange-900/20 border-l-4 border-orange-500 rounded-r-lg flex items-center gap-3">
          <div className="p-2 bg-orange-100 dark:bg-orange-900/40 rounded-full text-orange-600 dark:text-orange-400">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
          </div>
          <div>
            <h4 className="font-bold text-base text-orange-800 dark:text-orange-300">⚠️ Peringatan Stok Menipis!</h4>
            <p className="text-sm font-semibold text-orange-700 dark:text-orange-400">Ada {lowStockItems} item dengan stok di bawah 5 unit. Segera lakukan restock!</p>
          </div>
        </div>
      )}

      {/* Search & Filters */}
      <div className="mb-6 flex flex-col md:flex-row gap-4 justify-between items-center bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="relative w-full md:w-96">
          <svg className="absolute left-3 top-3 text-gray-400" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          <input 
            placeholder="Cari nama atau kode barang..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
          />
        </div>
        
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
          <svg className="text-gray-400" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                categoryFilter === cat 
                  ? 'bg-primary text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

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
  );
};

export default PriceList;
