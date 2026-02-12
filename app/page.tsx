'use client';

import { useState, useEffect } from 'react';
import { mutate } from 'swr';
import Dashboard from '@/components/Dashboard';
import Login from '@/components/Login';
import SpreadsheetView from '@/components/SpreadsheetView';
import ManagePots from '@/components/ManagePots';
import ManageAccounts from '@/components/ManageAccounts';
import UpdateBalanceForm from '@/components/UpdateBalanceForm';
import AccountDetail from '@/components/AccountDetail';

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [currentView, setCurrentView] = useState<'home' | 'accounts' | 'history' | 'manage'>('home');
  const [loading, setLoading] = useState(true);
  const [showUpdateBalance, setShowUpdateBalance] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
  const [refreshKey, setRefreshKey] = useState(0); // Only for non-SWR components

  useEffect(() => { checkSession(); }, []);

  const checkSession = async () => {
    try {
      const res = await fetch('/api/auth/session');
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated) setUser(data.user);
      }
    } catch (error) {
      console.error('Session check error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/session', { method: 'POST' });
    setUser(null);
  };

  const handleBalanceUpdated = () => {
    setShowUpdateBalance(false);
    // Refresh SWR cache
    mutate('/api/accounts');
    mutate('/api/pots');
    // Refresh legacy components
    setRefreshKey((prev) => prev + 1);
  };

  const handleAccountClick = (accountId: number) => {
    setSelectedAccountId(accountId);
  };

  const handleAccountDetailClose = () => {
    setSelectedAccountId(null);
  };

  const handleAccountUpdated = () => {
    // Refresh SWR cache
    mutate('/api/accounts');
    mutate('/api/pots');
    // Refresh legacy components
    setRefreshKey((prev) => prev + 1);
  };

  if (loading) {
    return (
      <div className="app-shell" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100dvh' }}>
        <div className="skeleton" style={{ width: '280px', height: '380px' }} />
      </div>
    );
  }

  if (!user) return <Login onLogin={setUser} />;

  return (
    <div className="app-shell">
      {/* Header */}
      <div className="app-header">
        <div className="header-user">
          <div className="avatar">
            {user.displayName?.charAt(0) || 'U'}
          </div>
          <div>
            <div className="header-greeting">Welcome back</div>
            <div className="header-name">{user.displayName}</div>
          </div>
        </div>
        <div className="header-actions">
          <button className="icon-btn" onClick={handleLogout} title="Logout">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="app-content">
        {currentView === 'home' && <Dashboard onUpdateBalance={() => setShowUpdateBalance(true)} onAccountClick={handleAccountClick} />}
        {currentView === 'accounts' && <ManageAccounts onUpdate={() => { mutate('/api/accounts'); mutate('/api/pots'); }} onAccountClick={handleAccountClick} currentUser={user} />}
        {currentView === 'history' && <SpreadsheetView key={refreshKey} />}
        {currentView === 'manage' && <ManagePots key={refreshKey} onUpdate={() => { mutate('/api/accounts'); mutate('/api/pots'); setRefreshKey((prev) => prev + 1); }} />}
      </div>

      {/* Bottom Tab Bar */}
      <nav className="tab-bar">
        <button className={`tab-item${currentView === 'home' ? ' active' : ''}`} onClick={() => setCurrentView('home')}>
          <span className="tab-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </span>
          Home
        </button>

        <button className={`tab-item${currentView === 'accounts' ? ' active' : ''}`} onClick={() => setCurrentView('accounts')}>
          <span className="tab-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="1" y1="10" x2="23" y2="10" />
            </svg>
          </span>
          Accounts
        </button>

        {/* Center FAB — Update Balance */}
        <button className="tab-fab" onClick={() => setShowUpdateBalance(true)} title="Update Balance">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
        </button>

        <button className={`tab-item${currentView === 'history' ? ' active' : ''}`} onClick={() => setCurrentView('history')}>
          <span className="tab-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
            </svg>
          </span>
          History
        </button>

        <button className={`tab-item${currentView === 'manage' ? ' active' : ''}`} onClick={() => setCurrentView('manage')}>
          <span className="tab-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </span>
          Settings
        </button>
      </nav>

      {/* Update Balance Bottom Sheet */}
      {showUpdateBalance && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowUpdateBalance(false); }}>
          <div className="modal-sheet">
            <div className="modal-handle" />
            <UpdateBalanceForm onSuccess={handleBalanceUpdated} currentUser={user} />
          </div>
        </div>
      )}

      {/* Account Detail Bottom Sheet */}
      {selectedAccountId !== null && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) handleAccountDetailClose(); }}>
          <div className="modal-sheet">
            <div className="modal-handle" />
            <AccountDetail
              accountId={selectedAccountId}
              currentUser={user}
              onClose={handleAccountDetailClose}
              onUpdate={handleAccountUpdated}
            />
          </div>
        </div>
      )}
    </div>
  );
}
