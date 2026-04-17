import React from 'react';
import { motion } from 'framer-motion';

const PriceListTable = ({ 
  filteredItems, 
  editId, 
  editStock, 
  setEditStock, 
  saveEdit, 
  startEdit, 
  handleSale, 
  handleRestock 
}) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors duration-300">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700">
              <th className="py-4 px-6 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">Kode Barang</th>
              <th className="py-4 px-6 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">Nama Barang</th>
              <th className="py-4 px-6 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">Kategori</th>
              <th className="py-4 px-6 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">Ukuran</th>
              <th className="py-4 px-6 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">Stok Barang</th>
              <th className="py-4 px-6 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">Qty Penjualan</th>
              <th className="py-4 px-6 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">Qty Pembelian</th>
              <th className="py-4 px-6 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {filteredItems.map((item, index) => (
              <motion.tr 
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors duration-200"
              >
                <td className="py-4 px-6 text-sm font-medium text-gray-900 dark:text-gray-200 whitespace-nowrap">{item.product_id}</td>
                <td className="py-4 px-6 text-sm text-gray-700 dark:text-gray-300 font-medium">{item.product_name}</td>
                <td className="py-4 px-6 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                    {item.category}
                  </span>
                </td>
                <td className="py-4 px-6 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                  <span className="font-semibold text-gray-700 dark:text-gray-300">
                    {item.unit}
                  </span>
                </td>
                <td className="py-4 px-6 text-sm whitespace-nowrap">
                  {editId === item.id ? (
                    <input
                      type="number"
                      value={editStock}
                      onChange={(e) => setEditStock(e.target.value)}
                      className="border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-1 w-24 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                      autoFocus
                    />
                  ) : (
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      item.stock < 5 
                        ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' 
                        : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                    }`}>
                      {item.stock} Unit
                    </span>
                  )}
                </td>
                <td className="py-4 px-6 text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap font-semibold">
                  {item.qty_sales || 0}
                </td>
                <td className="py-4 px-6 text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap font-semibold">
                  {item.qty_purchases || 0}
                </td>
                <td className="py-4 px-6 text-sm space-x-2 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    {editId === item.id ? (
                      <button
                        onClick={() => saveEdit(item.id)}
                        className="bg-green-500 text-white px-3 py-1.5 rounded-lg hover:bg-green-600 transition-colors text-xs font-medium shadow-sm"
                      >
                        Simpan
                      </button>
                    ) : (
                      <button
                        onClick={() => startEdit(item)}
                        className="text-gray-500 hover:text-primary dark:text-gray-400 dark:hover:text-primary transition-colors p-1"
                        title="Edit Stok"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                      </button>
                    )}
                    <button
                      onClick={() => handleSale(item.id)}
                      className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1.5 rounded-lg transition-all text-xs font-medium shadow-sm hover:shadow-md flex items-center gap-1"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                      Jual
                    </button>
                    <button
                      onClick={() => handleRestock(item.id)}
                      className="bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-lg transition-all text-xs font-medium shadow-sm hover:shadow-md flex items-center gap-1"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                      Restock
                    </button>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PriceListTable;
