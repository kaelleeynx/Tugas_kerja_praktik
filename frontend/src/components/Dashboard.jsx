import React, { useEffect, useState, useRef } from 'react';
import { getTransactions, deleteTransaction, updateTransaction } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { animate, stagger } from 'animejs';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

function formatIDR(n) {
  return n.toLocaleString('id-ID', { style:'currency', currency:'IDR' });
}

export default function Dashboard() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recapType, setRecapType] = useState('harian'); // harian, bulanan, tahunan
  const dashboardRef = useRef(null);

  useEffect(() => {
    const controller = new AbortController();
    fetchData(controller.signal);
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!loading && dashboardRef.current) {
      animate(dashboardRef.current.querySelectorAll('.card'), {
        translateY: [20, 0],
        opacity: [0, 1],
        duration: 600,
        delay: stagger(100),
        easing: 'easeOutQuad'
      });
    }
  }, [loading]);

  const fetchData = async (signal) => {
    try {
      const response = await getTransactions();
      if (signal?.aborted) return;
      // Response is already an array after API fix
      setTransactions(Array.isArray(response) ? response : (response.data || []));
      setLoading(false);
    } catch (error) {
      if (error.name === 'AbortError' || error.name === 'CanceledError') return;
      console.error('Failed to fetch transactions', error);
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    toast('Hapus transaksi ini?', {
      action: {
        label: 'Hapus',
        onClick: async () => {
          try {
            await deleteTransaction(id);
            fetchData();
            toast.success('Transaksi berhasil dihapus');
          } catch (error) {
            toast.error('Gagal menghapus: ' + (error.response?.data?.message || error.message));
          }
        },
      },
      cancel: { label: 'Batal' },
    });
  };

  const handleUpdateQuantity = async (id, currentQty, change) => {
    const newQty = currentQty + change;
    if (newQty < 1) return;

    try {
      await updateTransaction(id, { quantity: newQty });
      fetchData();
    } catch (error) {
      toast.error('Gagal update quantity: ' + (error.response?.data?.message || error.message));
    }
  };

  const getFilteredTransactions = () => {
    const now = new Date();
    return transactions.filter(t => {
      const tDate = new Date(t.date);
      if (recapType === 'harian') {
        return tDate.toDateString() === now.toDateString();
      } else if (recapType === 'bulanan') {
        return tDate.getMonth() === now.getMonth() && tDate.getFullYear() === now.getFullYear();
      } else if (recapType === 'tahunan') {
        return tDate.getFullYear() === now.getFullYear();
      }
      return true;
    });
  };

  const getPreviousPeriodTransactions = () => {
    const now = new Date();
    return transactions.filter(t => {
      const tDate = new Date(t.date);
      if (recapType === 'harian') {
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        return tDate.toDateString() === yesterday.toDateString();
      } else if (recapType === 'bulanan') {
        const prevMonth = new Date(now);
        prevMonth.setMonth(prevMonth.getMonth() - 1);
        return tDate.getMonth() === prevMonth.getMonth() && tDate.getFullYear() === prevMonth.getFullYear();
      } else if (recapType === 'tahunan') {
        return tDate.getFullYear() === now.getFullYear() - 1;
      }
      return true;
    });
  };

  const getPreviousTotals = () => {
    const prevTransactions = getPreviousPeriodTransactions();
    return prevTransactions.reduce((acc, t) => {
      if (t.type === 'penjualan') acc.sales += Number(t.total);
      else acc.expense += Number(t.total);
      return acc;
    }, { sales: 0, expense: 0 });
  };

  const calculatePercentageChange = (current, previous) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  const filteredTransactions = getFilteredTransactions();

  const totals = filteredTransactions.reduce((acc, t) => {
    if (t.type === 'penjualan') acc.sales += Number(t.total);
    else acc.expense += Number(t.total);
    return acc;
  }, { sales:0, expense:0 });

  const prevTotals = getPreviousTotals();
  const salesChange = calculatePercentageChange(totals.sales, prevTotals.sales);
  const expenseChange = calculatePercentageChange(totals.expense, prevTotals.expense);

  const getNetProfitClass = () => {
    const netProfit = totals.sales - totals.expense;
    if (netProfit > 0) return 'text-green-600';
    if (netProfit < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const chartData = [
    { name: 'Penjualan', amount: totals.sales, color: '#10b981' },
    { name: 'Pengeluaran', amount: totals.expense, color: '#ef4444' }
  ];

  if (loading) return (
    <div className="p-8 text-center min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-gray-200 dark:border-gray-700 border-t-blue-500 rounded-full"
        />
        <p className="text-gray-600 dark:text-gray-400 font-medium">Loading dashboard...</p>
      </div>
    </div>
  );

  return (
    <div className="dashboard p-8 max-w-7xl mx-auto" ref={dashboardRef}>
      <div className="welcome-header mb-8">
        <h2 className="text-4xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 dark:from-cyan-400 dark:to-blue-400 bg-clip-text text-transparent leading-tight">Dashboard</h2>
        <p className="text-base text-gray-600 dark:text-gray-400 mt-3">
          Selamat datang, <span className="font-semibold text-cyan-600 dark:text-cyan-400">{user?.name}</span>. 
          Anda login sebagai <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 text-blue-700 dark:text-blue-300 ml-1">{user?.role}</span>.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
        <div className="card bg-gradient-to-br from-green-50 to-white dark:from-green-900/10 dark:to-gray-800 p-6 rounded-xl shadow-sm border border-green-100 dark:border-green-900/30 opacity-0 hover:shadow-lg hover:scale-105 transition-all duration-300 relative overflow-hidden">
          <div className="absolute inset-0 opacity-5 pointer-events-none" style={{backgroundImage: 'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 1px)', backgroundSize: '20px 20px'}}></div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 rounded-full blur-3xl pointer-events-none"></div>
          <div className="relative z-10">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
              </div>
              <div className={`flex items-center gap-1 px-3 py-1 rounded-lg font-semibold text-sm ${
                salesChange >= 0 
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' 
                  : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
              }`}>
                {salesChange >= 0 ? '↑' : '↓'} {Math.abs(salesChange)}%
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Total Penjualan ({recapType})</h4>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{formatIDR(totals.sales)}</p>
              <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mt-2">vs {formatIDR(prevTotals.sales)} periode lalu</p>
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-red-50 to-white dark:from-red-900/10 dark:to-gray-800 p-6 rounded-xl shadow-sm border border-red-100 dark:border-red-900/30 opacity-0 hover:shadow-lg hover:scale-105 transition-all duration-300 relative overflow-hidden">
          <div className="absolute inset-0 opacity-5 pointer-events-none" style={{backgroundImage: 'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 1px)', backgroundSize: '20px 20px'}}></div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full blur-3xl pointer-events-none"></div>
          <div className="relative z-10">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
              </div>
              <div className={`flex items-center gap-1 px-3 py-1 rounded-lg font-semibold text-sm ${
                expenseChange <= 0 
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' 
                  : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
              }`}>
                {expenseChange <= 0 ? '↓' : '↑'} {Math.abs(expenseChange)}%
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Total Pengeluaran ({recapType})</h4>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{formatIDR(totals.expense)}</p>
              <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mt-2">vs {formatIDR(prevTotals.expense)} periode lalu</p>
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-blue-50 to-white dark:from-blue-900/10 dark:to-gray-800 p-6 rounded-xl shadow-sm border border-blue-100 dark:border-blue-900/30 opacity-100 hover:shadow-lg hover:scale-105 transition-all duration-300 relative overflow-hidden">
          <div className="absolute inset-0 opacity-5 pointer-events-none" style={{backgroundImage: 'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 1px)', backgroundSize: '20px 20px'}}></div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl pointer-events-none"></div>
          <div className="relative z-10">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
              </div>
              <div className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                Laba Bersih
              </div>
            </div>
            <div>
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Laba Bersih ({recapType})</h4>
            <p className={`text-3xl font-bold ${getNetProfitClass()}`}>{formatIDR(totals.sales - totals.expense)}</p>
            <p className={`text-xs font-medium mt-1 ${totals.sales - totals.expense > 0 ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
              Margin: {totals.sales > 0 ? ((((totals.sales - totals.expense) / totals.sales) * 100).toFixed(1)) : 0}%
            </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 opacity-0 relative overflow-hidden">
          <div className="absolute inset-0 opacity-3 pointer-events-none" style={{backgroundImage: 'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 1px)', backgroundSize: '25px 25px'}}></div>
          <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/5 rounded-full blur-3xl pointer-events-none"></div>
          <div className="relative z-10">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Statistik Keuangan</h3>
              <div className="flex gap-2 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
                {['harian', 'bulanan', 'tahunan'].map((type) => (
                  <button 
                    key={type}
                    onClick={() => setRecapType(type)}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all duration-200 ${
                      recapType === type 
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-md' 
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis dataKey="name" stroke="#9ca3af" tick={{fontSize: 12}} tickLine={false} axisLine={false} />
                <YAxis stroke="#9ca3af" tickFormatter={(value) => `Rp${value/1000}k`} tick={{fontSize: 12}} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value) => formatIDR(value)}
                  cursor={{fill: 'transparent'}}
                />
                <Bar dataKey="amount" radius={[8, 8, 0, 0]} barSize={60}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="card bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 opacity-0 relative overflow-hidden">
          <div className="absolute inset-0 opacity-3 pointer-events-none" style={{backgroundImage: 'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 1px)', backgroundSize: '25px 25px'}}></div>
          <div className="absolute top-0 left-0 w-40 h-40 bg-purple-500/5 rounded-full blur-3xl pointer-events-none"></div>
          <div className="relative z-10">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-6">Transaksi Terbaru</h3>
          {filteredTransactions.length === 0 && (
            <motion.div 
              className="flex flex-col items-center justify-center h-64 text-gray-500 dark:text-gray-400"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <motion.div 
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mb-3 text-gray-400 dark:text-gray-500"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
              </motion.div>
              <p className="font-medium text-gray-700 dark:text-gray-300">Tidak ada transaksi untuk ditampilkan.</p>
            </motion.div>
          )}
          {filteredTransactions.length > 0 && (
            <div className="overflow-x-auto -mx-6 px-6 md:mx-0 md:px-0">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-700/50 border-b-2 border-gray-200 dark:border-gray-600">
                    <th className="py-3 sm:py-4 px-2 sm:px-3 text-left text-xs sm:text-xs font-bold text-gray-900 dark:text-white uppercase tracking-tight sm:tracking-wide">Tanggal</th>
                    <th className="py-3 sm:py-4 px-2 sm:px-3 text-left text-xs sm:text-xs font-bold text-gray-900 dark:text-white uppercase tracking-tight sm:tracking-wide">Jenis</th>
                    <th className="py-3 sm:py-4 px-2 sm:px-3 text-left text-xs sm:text-xs font-bold text-gray-900 dark:text-white uppercase tracking-tight sm:tracking-wide">Produk</th>
                    <th className="py-3 sm:py-4 px-2 sm:px-3 text-left text-xs sm:text-xs font-bold text-gray-900 dark:text-white uppercase tracking-tight sm:tracking-wide">Qty</th>
                    <th className="py-3 sm:py-4 px-2 sm:px-3 text-right text-xs sm:text-xs font-bold text-gray-900 dark:text-white uppercase tracking-tight sm:tracking-wide">Total</th>
                    {user?.role === 'owner' && <th className="py-3 sm:py-4 px-2 sm:px-3 text-center text-xs sm:text-xs font-bold text-gray-900 dark:text-white uppercase tracking-tight sm:tracking-wide">Aksi</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {filteredTransactions.slice(0,5).map(t => (
                  <tr key={t.id} className="group">
                      <td className="py-2 sm:py-3 px-2 sm:px-3 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">{new Date(t.date).toLocaleDateString('id-ID')}</td>
                      <td className="py-2 sm:py-3 px-2 sm:px-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          t.type === 'penjualan' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {t.type}
                        </span>
                      </td>
                      <td className="py-2 sm:py-3 px-2 sm:px-3 text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">{t.price_list?.product_name || t.note || '-'}</td>
                      <td className="py-2 sm:py-3 px-2 sm:px-3 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
                        <div className="flex items-center gap-2">
                          {user?.role === 'owner' && (
                            <button 
                              onClick={() => handleUpdateQuantity(t.id, t.quantity, -1)}
                              aria-label={`Kurangi quantity ${t.price_list?.product_name || ''}`}
                              className="w-5 h-5 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded text-gray-600 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              -
                            </button>
                          )}
                          <span>{t.quantity}</span>
                          {user?.role === 'owner' && (
                            <button 
                              onClick={() => handleUpdateQuantity(t.id, t.quantity, 1)}
                              aria-label={`Tambah quantity ${t.price_list?.product_name || ''}`}
                              className="w-5 h-5 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded text-gray-600 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              +
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="py-3 text-right text-sm font-medium text-gray-900 dark:text-white">{formatIDR(t.total)}</td>
                      {user?.role === 'owner' && (
                        <td className="py-3 text-center">
                          <button 
                            onClick={() => handleDelete(t.id)}
                            className="text-gray-400 hover:text-red-500 transition-colors p-1"
                            aria-label={`Hapus transaksi ${t.price_list?.product_name || t.id}`}
                            title="Hapus Transaksi"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
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
    </div>
  );
}