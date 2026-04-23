import React, { useState, useEffect, useRef } from 'react';
import { getPendingApprovals, approveUser, rejectUser } from '../services/api';
import { animate, stagger } from 'animejs';

export default function ApprovalInbox() {
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef(null);

  useEffect(() => {
    fetchApprovals();
  }, []);

  useEffect(() => {
    if (!loading && containerRef.current) {
      animate(containerRef.current.querySelectorAll('.approval-card'), {
        translateY: [20, 0],
        opacity: [0, 1],
        duration: 600,
        delay: stagger(100),
        easing: 'easeOutQuad'
      });
    }
  }, [loading, approvals]);

  const fetchApprovals = async () => {
    try {
      const response = await getPendingApprovals();
      // Handle new standardized response format
      const data = response.data || response;
      setApprovals(Array.isArray(data) ? data : []);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch approvals', error);
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await approveUser(id);
      fetchApprovals();
    } catch (error) {
      alert('Failed to approve user');
    }
  };

  const handleReject = async (id) => {
    if (!window.confirm('Reject this user?')) return;
    try {
      await rejectUser(id);
      fetchApprovals();
    } catch (error) {
      alert('Failed to reject user');
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  );

  return (
    <div className="container mx-auto p-6 max-w-7xl" ref={containerRef}>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Inbox Persetujuan</h1>
        <p className="text-gray-700 dark:text-gray-300 mt-1">Kelola permintaan pendaftaran pengguna baru</p>
      </div>

      {approvals.length === 0 ? (
        <div className="card bg-white dark:bg-gray-800 p-12 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col items-center justify-center text-center min-h-[400px]">
          <div className="w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-6 text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"></polyline><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"></path></svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Tidak Ada Permintaan Pending</h3>
          <p className="text-gray-700 dark:text-gray-300 max-w-md">
            Semua permintaan pendaftaran telah diproses. Anda akan menerima notifikasi jika ada pengguna baru yang mendaftar.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {approvals.map((approval) => (
            <div
              key={approval.id}
              className="approval-card card bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border-l-4 border-yellow-500 opacity-0"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center font-bold">
                    {approval.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">{approval.name}</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Requesting Access</p>
                  </div>
                </div>
                <span className="px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-700">
                  Pending
                </span>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                  <svg className="w-4 h-4 mr-2" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                  {approval.email || 'No email'}
                </div>
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                  <svg className="w-4 h-4 mr-2" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                  @{approval.username}
                </div>
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                  <svg className="w-4 h-4 mr-2" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                  {new Date(approval.created_at).toLocaleString()}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => handleReject(approval.id)}
                  className="btn btn-outline border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 flex items-center justify-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                  Tolak
                </button>
                <button 
                  onClick={() => handleApprove(approval.id)}
                  className="btn btn-primary bg-green-600 hover:bg-green-700 border-none flex items-center justify-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  Setujui
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
