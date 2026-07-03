import React, { useState, useEffect } from 'react';
import { ExchangeRates, CapitalAllocation, CapitalPoolOverride, User } from '../types';
import { api } from '../utils/api';
import { 
  Database,
  Download,
  Upload,
  RefreshCw,
  Coins,
  Percent,
  Trash2,
  Users,
  UserPlus,
  Shield,
  Trash,
  Lock
} from 'lucide-react';

interface SettingsProps {
  rates: ExchangeRates;
  allocation: CapitalAllocation;
  poolOverride: CapitalPoolOverride;
  currentUser: User;
  onUpdateRates: (rates: ExchangeRates) => void;
  onUpdateAllocation: (allocation: CapitalAllocation) => void;
  onUpdatePoolOverride: (override: CapitalPoolOverride) => void;
  onResetData: () => void;
  onClearData: () => void;
  onImportData: (data: any) => boolean;
  onExportData: () => void;
}

export const Settings: React.FC<SettingsProps> = ({
  rates,
  allocation,
  poolOverride,
  currentUser,
  onUpdateRates,
  onUpdateAllocation,
  onUpdatePoolOverride,
  onResetData,
  onClearData,
  onImportData,
  onExportData
}) => {
  // Active settings sub-tab
  const [activeSubTab, setActiveSubTab] = useState<'rates' | 'system' | 'users' | 'account'>('rates');

  // Rates Form State
  const [globalRate, setGlobalRate] = useState(rates.global);

  // Capital Allocation Form State
  const [takenAside, setTakenAside] = useState(allocation.takenAsidePercent);

  // Capital Pool Override Form State
  const [overrideEnabled, setOverrideEnabled] = useState(poolOverride.enabled);
  const [overrideValue, setOverrideValue] = useState(poolOverride.value);

  // User Management State
  const [usersList, setUsersList] = useState<User[]>([]);
  const [newUsername, setNewUsername] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'admin' | 'staff'>('admin');
  const [userError, setUserError] = useState('');

  // Change Password Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPasswordVal, setNewPasswordVal] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  // File Input Ref for Import
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Fetch users list
  const fetchUsers = () => {
    api.getUsers()
      .then(setUsersList)
      .catch(err => console.error('Error fetching users:', err));
  };

  // Load users when entering the users tab
  useEffect(() => {
    if (activeSubTab === 'users') {
      fetchUsers();
    }
  }, [activeSubTab]);

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim() || !newEmail.trim() || !newPassword.trim()) {
      setUserError('All fields are required.');
      return;
    }
    setUserError('');
    api.createUser({
      username: newUsername.trim(),
      email: newEmail.trim(),
      password: newPassword,
      role: newRole
    })
      .then(() => {
        alert('🎉 User account created successfully!');
        setNewUsername('');
        setNewEmail('');
        setNewPassword('');
        fetchUsers();
      })
      .catch(err => {
        setUserError(err.message || 'Error creating user account');
      });
  };

  const handleDeleteUser = (id: string) => {
    if (!confirm('Are you sure you want to delete this user account?')) return;
    api.deleteUser(id)
      .then(() => {
        alert('User account deleted.');
        fetchUsers();
      })
      .catch(err => {
        alert(err.message || 'Error deleting user account');
      });
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPasswordVal || !confirmPassword) {
      setPasswordError('All password fields are required.');
      setPasswordSuccess('');
      return;
    }
    if (newPasswordVal !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      setPasswordSuccess('');
      return;
    }
    if (newPasswordVal.length < 4) {
      setPasswordError('New password must be at least 4 characters long.');
      setPasswordSuccess('');
      return;
    }

    setPasswordError('');
    setPasswordSuccess('');
    setPasswordLoading(true);

    api.changePassword(currentPassword, newPasswordVal)
      .then(() => {
        setPasswordSuccess('🎉 Password updated successfully!');
        setCurrentPassword('');
        setNewPasswordVal('');
        setConfirmPassword('');
      })
      .catch(err => {
        setPasswordError(err.message || 'Error updating password. Verify your current password.');
      })
      .finally(() => {
        setPasswordLoading(false);
      });
  };

  const handleSaveRates = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateRates({
      global: globalRate
    });
    alert('🎉 Global exchange rate updated! Used for converting global business expenses.');
  };

  const handleAllocationChange = (value: number) => {
    setTakenAside(value);
    onUpdateAllocation({
      takenAsidePercent: value,
      reinvestedPercent: 100 - value
    });
  };

  const handleSaveOverride = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdatePoolOverride({
      enabled: overrideEnabled,
      value: overrideValue
    });
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        const success = onImportData(parsed);
        if (success) {
          alert('🎉 Database restored successfully!');
          // Refresh state
          setGlobalRate(parsed.exchangeRates?.global || 275);
          setTakenAside(parsed.capitalAllocation?.takenAsidePercent || 30);
          setOverrideEnabled(parsed.capitalPoolOverride?.enabled ?? false);
          setOverrideValue(parsed.capitalPoolOverride?.value ?? 0);
        } else {
          alert('❌ Invalid backup file format. Make sure it is a valid POTY Portal backup.');
        }
      } catch (err) {
        alert('❌ Error parsing backup JSON file.');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = ''; // Reset input
  };

  return (
    <div className="fade-in-section">
      {/* Sub tabs navigation */}
      <div className="settings-subtabs">
        <button 
          className={`btn ${activeSubTab === 'rates' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ padding: '8px 16px', fontSize: '0.85rem' }}
          onClick={() => setActiveSubTab('rates')}
        >
          <Coins size={16} />
          Rates & Financials
        </button>
        <button 
          className={`btn ${activeSubTab === 'system' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ padding: '8px 16px', fontSize: '0.85rem' }}
          onClick={() => setActiveSubTab('system')}
        >
          <Database size={16} />
          System Maintenance
        </button>
        {currentUser.role === 'admin' && (
          <button 
            className={`btn ${activeSubTab === 'users' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '8px 16px', fontSize: '0.85rem' }}
            onClick={() => setActiveSubTab('users')}
          >
            <Users size={16} />
            User Accounts
          </button>
        )}
        <button 
          className={`btn ${activeSubTab === 'account' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ padding: '8px 16px', fontSize: '0.85rem' }}
          onClick={() => setActiveSubTab('account')}
        >
          <Lock size={16} />
          Change Password
        </button>
      </div>

      {/* Rates & Financials */}
      {activeSubTab === 'rates' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          {/* Exchange Rates Form */}
          <div className="glass-card">
            <h4 style={{ marginBottom: '16px', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Coins size={18} color="var(--primary)" />
              Global Exchange Rate (1 EUR = X DZD)
            </h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '20px' }}>
              Set the global exchange rate. This rate is used to convert global expenses (such as ad spend and shipping/cargo costs) logged in EUR or DZD.
            </p>

            <form onSubmit={handleSaveRates}>
              <div className="form-group">
                <label htmlFor="rate-global">Global Exchange Rate (Default)</label>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <input 
                    type="number" 
                    id="rate-global" 
                    className="form-control"
                    required
                    min="1"
                    value={globalRate}
                    onChange={(e) => setGlobalRate(parseFloat(e.target.value) || 0)}
                  />
                  <span style={{ marginLeft: '10px', color: 'var(--text-muted)' }}>DZD</span>
                </div>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '12px' }}>
                Save Global Rate
              </button>
            </form>
          </div>

          {/* Capital Allocation */}
          <div className="glass-card" style={{ height: 'fit-content' }}>
            <h4 style={{ marginBottom: '16px', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Percent size={18} color="var(--accent)" />
              Net Profit Allocation
            </h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '20px' }}>
              Adjust the slider to split your net profits on the dashboard between Capital Taken Aside (personal payout) and Reinvested Capital.
            </p>

            <div style={{ margin: '30px 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, marginBottom: '8px' }}>
                <span>Taken Aside: {takenAside}%</span>
                <span>Reinvested: {100 - takenAside}%</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={takenAside} 
                onChange={(e) => handleAllocationChange(parseInt(e.target.value))}
                style={{ width: '100%', height: '6px', background: 'var(--border-color)', outline: 'none', borderRadius: '4px', cursor: 'pointer' }}
              />
            </div>

            <div className="allocation-preview-box">
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-color)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Taken Aside Role:</span>
                <span style={{ fontWeight: 600 }}>Personal Income / Draw</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Reinvested Role:</span>
                <span style={{ fontWeight: 600 }}>Cargo, Ads, Next Batches</span>
              </div>
            </div>
          </div>

          {/* Capital Pool Override Card */}
          <div className="glass-card" style={{ height: 'fit-content' }}>
            <h4 style={{ marginBottom: '16px', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Coins size={18} color="var(--primary)" />
              Capital Pool Override & Reset
            </h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '20px' }}>
              Manually set or reset your Total Invested (Capital Pool) statistics on the dashboard. Turn this on and set it to <strong>0 DZD</strong> to reset your capital pool.
            </p>

            <form onSubmit={handleSaveOverride}>
              <div className="form-group" style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input 
                  type="checkbox" 
                  id="override-enabled" 
                  checked={overrideEnabled}
                  onChange={(e) => setOverrideEnabled(e.target.checked)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <label htmlFor="override-enabled" style={{ cursor: 'pointer', fontWeight: 600 }}>
                  Enable Capital Pool Override
                </label>
              </div>

              <div className="form-group" style={{ opacity: overrideEnabled ? 1 : 0.5, transition: 'opacity 0.2s' }}>
                <label htmlFor="override-value">Custom Capital Pool Value (DZD)</label>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <input 
                    type="number" 
                    id="override-value" 
                    className="form-control"
                    min="0"
                    disabled={!overrideEnabled}
                    value={overrideValue}
                    onChange={(e) => setOverrideValue(parseFloat(e.target.value) || 0)}
                  />
                  <span style={{ marginLeft: '10px', color: 'var(--text-muted)' }}>DZD</span>
                </div>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '12px' }}>
                Save Override Settings
              </button>
            </form>
          </div>
        </div>
      )}

      {/* System Maintenance */}
      {activeSubTab === 'system' && (
        <div style={{ maxWidth: '600px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="glass-card">
            <h4 style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Database size={18} color="var(--primary)" />
              Database Backups
            </h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '20px' }}>
              Export all system data (sourcing list, sales history, operating expenses, exchange rates) to a local JSON file, or restore a previous backup.
            </p>

            <div style={{ display: 'flex', gap: '16px' }}>
              <button className="btn btn-secondary" onClick={onExportData}>
                <Download size={16} />
                Backup Data (JSON)
              </button>

              <button className="btn btn-secondary" onClick={() => fileInputRef.current?.click()}>
                <Upload size={16} />
                Restore Data (JSON)
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                style={{ display: 'none' }} 
                accept=".json"
                onChange={handleImportFile}
              />
            </div>
          </div>

          <div className="glass-card" style={{ borderLeft: '4px solid var(--danger)' }}>
            <h4 style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px', color: 'white' }}>
              Danger Zone
            </h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '20px' }}>
              Reset the database to default values or wipe all records. These actions cannot be undone.
            </p>

            <div style={{ display: 'flex', gap: '16px' }}>
              <button 
                className="btn btn-secondary"
                style={{ borderColor: 'rgba(245, 158, 11, 0.3)', color: 'var(--warning)' }}
                onClick={() => {
                  if (window.confirm('Are you sure you want to reset all data to default values? This will overwrite your current data.')) {
                    onResetData();
                    alert('Database has been reset to default values.');
                  }
                }}
              >
                <RefreshCw size={16} />
                Reset to Demo Data
              </button>

              <button 
                className="btn btn-danger"
                onClick={() => {
                  if (window.confirm('⚠️ CRITICAL WARNING: This will permanently delete all products, sales history, and expenses. Proceed?')) {
                    if (window.confirm('Are you absolutely sure? This cannot be undone.')) {
                      onClearData();
                      alert('Database has been cleared.');
                    }
                  }
                }}
              >
                <Trash2 size={16} />
                Wipe All Data
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Accounts Management */}
      {activeSubTab === 'users' && currentUser.role === 'admin' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '24px' }}>
          {/* Create User Form */}
          <div className="glass-card" style={{ height: 'fit-content' }}>
            <h4 style={{ marginBottom: '16px', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <UserPlus size={18} color="var(--primary)" />
              Create User Account
            </h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '20px' }}>
              Add a new administrator or staff account. New users will be able to log in with these credentials immediately.
            </p>

            {userError && (
              <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '10px', borderRadius: '6px', color: '#f87171', fontSize: '0.8rem', marginBottom: '16px' }}>
                {userError}
              </div>
            )}

            <form onSubmit={handleCreateUser}>
              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label htmlFor="new-username">Username</label>
                <input 
                  type="text" 
                  id="new-username" 
                  className="form-control"
                  required
                  placeholder="e.g. amine_fit"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label htmlFor="new-email">Email Address</label>
                <input 
                  type="email" 
                  id="new-email" 
                  className="form-control"
                  required
                  placeholder="e.g. amine@poty.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label htmlFor="new-password">Password</label>
                <input 
                  type="password" 
                  id="new-password" 
                  className="form-control"
                  required
                  placeholder="Enter secure password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label htmlFor="new-role">System Role</label>
                <select 
                  id="new-role" 
                  className="form-control"
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as 'admin' | 'staff')}
                >
                  <option value="admin">Administrator (Full Access)</option>
                  <option value="staff">Staff (Sales/Inventory View Only)</option>
                </select>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                <UserPlus size={16} /> Create Account
              </button>
            </form>
          </div>

          {/* Active Users Table */}
          <div className="glass-card">
            <h4 style={{ marginBottom: '16px', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Shield size={18} color="var(--success)" />
              Active System Users
            </h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '20px' }}>
              A list of accounts authorized to access the POTY Business Portal.
            </p>

            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Username</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th style={{ width: '60px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {usersList.map(u => (
                    <tr key={u.id}>
                      <td style={{ fontWeight: 600 }}>{u.username}</td>
                      <td>{u.email}</td>
                      <td>
                        <span className={`badge ${u.role === 'admin' ? 'badge-primary' : 'badge-secondary'}`}>
                          {u.role.toUpperCase()}
                        </span>
                      </td>
                      <td>
                        {u.id !== currentUser.id ? (
                          <button 
                            className="btn btn-danger btn-icon" 
                            style={{ padding: '4px', color: 'var(--danger)', background: 'none', border: 'none' }}
                            onClick={() => handleDeleteUser(u.id)}
                            title="Delete user account"
                          >
                            <Trash size={16} />
                          </button>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>You</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Change Password */}
      {activeSubTab === 'account' && (
        <div style={{ maxWidth: '500px' }}>
          <div className="glass-card">
            <h4 style={{ marginBottom: '16px', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Lock size={18} color="var(--primary)" />
              Change Password
            </h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '20px' }}>
              Update your account password. Once updated, you will need to use the new password the next time you log in.
            </p>

            {passwordError && (
              <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '10px', borderRadius: '6px', color: '#f87171', fontSize: '0.8rem', marginBottom: '16px' }}>
                {passwordError}
              </div>
            )}

            {passwordSuccess && (
              <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '10px', borderRadius: '6px', color: '#34d399', fontSize: '0.8rem', marginBottom: '16px' }}>
                {passwordSuccess}
              </div>
            )}

            <form onSubmit={handleChangePassword}>
              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label htmlFor="current-password">Current Password</label>
                <input 
                  type="password" 
                  id="current-password" 
                  className="form-control"
                  required
                  placeholder="Enter current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label htmlFor="new-password-val">New Password</label>
                <input 
                  type="password" 
                  id="new-password-val" 
                  className="form-control"
                  required
                  placeholder="Enter new password (min. 4 characters)"
                  value={newPasswordVal}
                  onChange={(e) => setNewPasswordVal(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label htmlFor="confirm-password">Confirm New Password</label>
                <input 
                  type="password" 
                  id="confirm-password" 
                  className="form-control"
                  required
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={passwordLoading}>
                {passwordLoading ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default Settings;
