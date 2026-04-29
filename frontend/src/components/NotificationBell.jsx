import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getNotifications, markNotificationRead, markAllNotificationsRead, deleteNotification as deleteNotifApi } from '../services/api';

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const fetchRef = useRef({ running: false, controller: null });

  useEffect(() => {
    const fetchNotifications = async () => {
      if (fetchRef.current.running) return;
      fetchRef.current.running = true;
      fetchRef.current.controller = new AbortController();

      try {
        const result = await getNotifications(fetchRef.current.controller.signal);
        if (result.success) {
          setNotifications(result.data || []);
          setUnreadCount(result.unread_count || 0);
        }
      } catch (err) {
        if (err?.name === 'AbortError' || err?.name === 'CanceledError') return;
      } finally {
        fetchRef.current.running = false;
      }
    };

    // Stagger initial fetch by 1.5s so it doesn't collide with
    // Dashboard's transaction fetch and Navbar's approvals fetch on login
    const initialDelay = setTimeout(fetchNotifications, 1500);

    const interval = setInterval(() => {
      if (!document.hidden) {
        fetchNotifications();
      }
    }, 30000);

    return () => {
      clearTimeout(initialDelay);
      clearInterval(interval);
      fetchRef.current.controller?.abort();
    };
  }, []);

  // Close on click outside — no full-screen overlay needed
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    // Use capture phase so it fires before other handlers
    document.addEventListener('mousedown', handleClickOutside, true);
    return () => document.removeEventListener('mousedown', handleClickOutside, true);
  }, [isOpen]);

  const markAsRead = async (id) => {
    try {
      await markNotificationRead(id);
      setNotifications(notifications.map(n => 
        n.id === id ? { ...n, read_at: new Date() } : n
      ));
      setUnreadCount(Math.max(0, unreadCount - 1));
    } catch {
      // Silently fail
    }
  };

  const markAllAsRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications(notifications.map(n => ({ ...n, read_at: new Date() })));
      setUnreadCount(0);
    } catch {
      // Silently fail
    }
  };

  const handleDeleteNotification = async (id) => {
    try {
      await deleteNotifApi(id);
      const notification = notifications.find(n => n.id === id);
      setNotifications(notifications.filter(n => n.id !== id));
      if (!notification?.read_at) {
        setUnreadCount(Math.max(0, unreadCount - 1));
      }
    } catch {
      // Silently fail
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-[var(--radius-default)]
          text-[var(--text-muted)] hover:text-[var(--text-main)]
          hover:bg-[var(--bg-app)] transition-colors"
        title="Notifikasi"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-0.5 right-0.5 w-[6px] h-[6px] rounded-full
            bg-[var(--status-danger)]" />
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="absolute right-0 mt-3 w-96 max-w-[calc(100vw-1rem)] sm:max-w-96
              bg-[var(--bg-surface)] rounded-[var(--radius-card)]
              border border-[var(--border-subtle)] shadow-[var(--shadow-elevated)]
              z-50 max-h-[32rem] overflow-hidden flex flex-col"
          >
              {/* Header */}
              <div className="px-4 py-3 border-b border-[var(--border-subtle)]
                flex items-center justify-between bg-[var(--bg-app)]">
                <h3 className="text-sm font-bold text-[var(--text-main)] flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--brand)]">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                  </svg>
                  Notifikasi
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded-[var(--radius-sm)]
                      bg-[var(--status-danger)] text-white text-[10px] font-bold">
                      {unreadCount}
                    </span>
                  )}
                </h3>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-xs font-medium text-[var(--brand)]
                        hover:text-[var(--brand-hover)] transition-colors"
                    >
                      Tandai Semua
                    </button>
                  )}
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1 rounded-[var(--radius-default)]
                      text-[var(--text-muted)] hover:text-[var(--text-main)]
                      hover:bg-[var(--bg-surface)] transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                </div>
              </div>

              {/* Notifications List */}
              <div className="overflow-y-auto flex-1">
                {notifications.length === 0 ? (
                  <motion.div
                    className="p-8 text-center flex flex-col items-center justify-center h-full"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <svg className="mx-auto h-12 w-12 mb-3 text-[var(--text-muted)]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    <p className="text-sm font-medium text-[var(--text-main)]">Tidak ada notifikasi</p>
                    <p className="text-xs text-[var(--text-muted)] mt-1">Notifikasi baru akan muncul di sini</p>
                  </motion.div>
                ) : (
                  notifications.map((notification) => (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      transition={{ duration: 0.15 }}
                      className={`px-4 py-3 border-b border-[var(--border-subtle)]
                        hover:bg-[var(--bg-app)] cursor-pointer transition-colors
                        ${!notification.read_at
                          ? 'border-l-[3px] border-l-[var(--brand)] bg-[var(--brand-muted)]'
                          : ''
                        }`}
                      onClick={() => !notification.read_at && markAsRead(notification.id)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className={`text-sm font-semibold truncate
                              ${!notification.read_at
                                ? 'text-[var(--text-main)]'
                                : 'text-[var(--text-muted)]'
                              }`}>
                              {notification.title}
                            </h4>
                            {!notification.read_at && (
                              <span className="w-1.5 h-1.5 rounded-full bg-[var(--brand)] flex-shrink-0" />
                            )}
                          </div>
                          <p className="text-xs text-[var(--text-muted)] mt-1 line-clamp-2">
                            {notification.message}
                          </p>
                          <p className="text-[10px] text-[var(--text-muted)] mt-1.5 font-mono">
                            {new Date(notification.created_at).toLocaleString('id-ID', {
                              year: 'numeric', month: 'short', day: 'numeric',
                              hour: '2-digit', minute: '2-digit'
                            })}
                          </p>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteNotification(notification.id); }}
                          className="p-1 rounded-[var(--radius-default)]
                            text-[var(--text-muted)] hover:text-[var(--status-danger)]
                            hover:bg-[var(--status-danger-bg)] transition-colors flex-shrink-0"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                          </svg>
                        </button>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationBell;
