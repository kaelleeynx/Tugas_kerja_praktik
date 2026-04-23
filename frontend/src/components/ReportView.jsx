import React, { useEffect, useState, useRef } from 'react';
import { getTransactions } from '../services/api';
import { motion } from 'framer-motion';

function formatIDR(n) {
  return n.toLocaleString('id-ID', { style:'currency', currency:'IDR' });
}

export default function ReportView() {
  const [transactions, setTransactions] = useState([]);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const reportRef = useRef(null);

  useEffect(()=> {
    const fetchData = async () => {
      try {
        const response = await getTransactions();
        const data = Array.isArray(response) ? response : (response.data || []);
        setTransactions(data);
        setLoading(false);
      } catch (error) {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const setDatePreset = (days) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);
    setFrom(start.toISOString().slice(0,10));
    setTo(end.toISOString().slice(0,10));
  };

  const generate = () => {
    if (transactions.length === 0) {
      alert('Belum ada data transaksi. Silakan buat transaksi terlebih dahulu.');
      return;
    }
    
    const f = from || '1970-01-01';
    const t = to || '9999-12-31';
    
    const filtered = transactions.filter(trx => {
      const trxDate = trx.date || trx.created_at;
      return trxDate >= f && trxDate <= t;
    });
    
    if (filtered.length === 0) {
      alert('Tidak ada transaksi dalam rentang tanggal yang dipilih.');
      setReport(null);
      return;
    }
    
    const totals = filtered.reduce((acc, t) => {
      const amount = Number(t.total);
      if (t.type === 'penjualan') acc.sales += amount; 
      else acc.expense += amount;
      return acc;
    }, { sales: 0, expense: 0 });
    
    setReport({ filtered, totals });
  };

  const exportCSV = () => {
    if (!report) return;
    const rows = [['ID','Tanggal','Jenis','Produk','Qty','Harga','Total','Note']];
    report.filtered.forEach(r => rows.push([r.id, r.date, r.type, r.product, r.quantity, r.price, r.total, r.note]));
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report_${from || 'all'}_${to||'all'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getNetProfitClass = () => {
    if (!report) return '';
    const netProfit = report.totals.sales - report.totals.expense;
    if (netProfit > 0) return 'text-green-600';
    if (netProfit < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  if (loading) return (
    <div className="p-8 text-center min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-gray-200 dark:border-gray-700 border-t-cyan-500 rounded-full"
        />
        <p className="text-gray-600 dark:text-gray-400 font-medium">Memuat data laporan...</p>
      </div>
    </div>
  );

  return (
    <div className="report-view p-8 max-w-7xl mx-auto">
      {/* Generate Report Card */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 mb-8 relative overflow-hidden">
        <div className="absolute inset-0 opacity-3 pointer-events-none" style={{backgroundImage: 'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 1px)', backgroundSize: '25px 25px'}}></div>
        <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white leading-tight">Generate Laporan</h2>
          </div>
        <div className="flex flex-col gap-6">
          {/* Date Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Dari Tanggal</label>
              <input 
                type="date" 
                value={from} 
                onChange={e=>setFrom(e.target.value)} 
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Sampai Tanggal</label>
              <input 
                type="date" 
                value={to} 
                onChange={e=>setTo(e.target.value)} 
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
              />
            </div>
          </div>

          {/* Preset Buttons */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Periode Cepat</label>
            <div className="flex flex-wrap gap-3">
              <button 
                onClick={() => setDatePreset(1)}
                className="px-4 py-2.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-all font-medium text-sm shadow-sm hover:shadow-md flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                Harian
              </button>
              <button 
                onClick={() => setDatePreset(7)}
                className="px-4 py-2.5 bg-cyan-50 dark:bg-cyan-900/20 text-cyan-600 dark:text-cyan-400 rounded-lg hover:bg-cyan-100 dark:hover:bg-cyan-900/30 transition-all font-medium text-sm shadow-sm hover:shadow-md flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                7 Hari
              </button>
              <button 
                onClick={() => setDatePreset(14)}
                className="px-4 py-2.5 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-all font-medium text-sm shadow-sm hover:shadow-md flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                14 Hari
              </button>
              <button 
                onClick={() => setDatePreset(30)}
                className="px-4 py-2.5 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-all font-medium text-sm shadow-sm hover:shadow-md flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                30 Hari
              </button>
              <button 
                onClick={() => setDatePreset(90)}
                className="px-4 py-2.5 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-all font-medium text-sm shadow-sm hover:shadow-md flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                3 Bulan
              </button>
              <button 
                onClick={() => { setFrom(''); setTo(''); }}
                className="px-4 py-2.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-all font-medium text-sm shadow-sm hover:shadow-md flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"></circle><circle cx="19" cy="12" r="1"></circle><circle cx="5" cy="12" r="1"></circle></svg>
                Semua
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col md:flex-row gap-3 pt-2">
            <button 
              className="flex-1 md:flex-none bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-3 rounded-lg transition-all font-semibold text-sm shadow-md hover:shadow-lg flex items-center justify-center gap-2 transform hover:scale-105 duration-200"
              onClick={generate}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
              Generate Laporan
            </button>
            <button 
              className="flex-1 md:flex-none bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white px-6 py-3 rounded-lg transition-all font-semibold text-sm shadow-md hover:shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 duration-200"
              onClick={exportCSV} 
              disabled={!report}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
              Export CSV
            </button>
          </div>
        </div>
        </div>
      </div>

      {report && (
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-semibold text-gray-800 dark:text-white">Laporan Periode {from || 'Awal'} s/d {to || 'Akhir'}</h4>
            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">{report.filtered.length} transaksi ditemukan</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="card bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 relative overflow-hidden">
              <div className="absolute inset-0 opacity-3 pointer-events-none" style={{backgroundImage: 'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 1px)', backgroundSize: '25px 25px'}}></div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 rounded-full blur-3xl pointer-events-none"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-100 text-green-600 rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Total Penjualan</h4>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatIDR(report.totals.sales)}</p>
                </div>
              </div>
              </div>
            </div>
            <div className="card bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 relative overflow-hidden">
              <div className="absolute inset-0 opacity-3 pointer-events-none" style={{backgroundImage: 'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 1px)', backgroundSize: '25px 25px'}}></div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full blur-3xl pointer-events-none"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-4">
                <div className="p-3 bg-red-100 text-red-600 rounded-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Total Pengeluaran</h4>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatIDR(report.totals.expense)}</p>
                </div>
              </div>
              </div>
            </div>
            <div className="card bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 relative overflow-hidden">
              <div className="absolute inset-0 opacity-3 pointer-events-none" style={{backgroundImage: 'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 1px)', backgroundSize: '25px 25px'}}></div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl pointer-events-none"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Laba Bersih</h4>
                  <p className={`text-2xl font-bold ${getNetProfitClass()}`}>{formatIDR(report.totals.sales - report.totals.expense)}</p>
                </div>
              </div>
              </div>
            </div>
          </div>

          <div className="card bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden relative">
            <div className="absolute inset-0 opacity-2 pointer-events-none" style={{backgroundImage: 'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 1px)', backgroundSize: '30px 30px'}}></div>
            <div className="relative z-10">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-700/50 border-b-2 border-gray-200 dark:border-gray-600">
                      <th className="py-4 px-6 text-left text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">Tanggal</th>
                      <th className="py-4 px-6 text-left text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">Jenis</th>
                      <th className="py-4 px-6 text-left text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">Produk</th>
                      <th className="py-4 px-6 text-left text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">Jumlah</th>
                    <th className="py-4 px-6 text-right text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {report.filtered.map(r => (
                    <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="py-4 px-6 text-sm font-medium text-gray-700 dark:text-gray-300">{new Date(r.date).toLocaleDateString('id-ID')}</td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          r.type === 'penjualan' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {r.type}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-sm font-medium text-gray-900 dark:text-gray-300">{r.product}</td>
                      <td className="py-4 px-6 text-sm font-medium text-gray-700 dark:text-gray-300">{r.quantity}</td>
                      <td className="py-4 px-6 text-sm text-gray-900 dark:text-gray-300 text-right font-semibold">{formatIDR(r.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </div>
          </div>
        </div>
      )}
      {!report && (
        <motion.div 
          className="card bg-gradient-to-br from-blue-50 to-white dark:from-blue-900/10 dark:to-gray-800 p-12 rounded-xl shadow-sm border border-blue-100 dark:border-blue-900/30 text-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div 
            className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 mb-6 text-blue-500 dark:text-blue-400"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
          </motion.div>
          <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Belum Ada Laporan</h4>
          <p className="text-gray-700 dark:text-gray-300 mb-6 max-w-sm mx-auto font-medium">Silakan pilih rentang tanggal atau gunakan tombol periode cepat untuk membuat laporan.</p>
        </motion.div>
      )}
    </div>
  );
}