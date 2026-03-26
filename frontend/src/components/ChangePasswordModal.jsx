// src/components/Dashboard/ChangePasswordModal.jsx
import { useState } from 'react';
import { Lock, Eye, EyeOff, Save, X } from 'lucide-react';
import './Dashboard.css';
import toast from 'react-hot-toast';


const ChangePasswordModal = ({ isOpen, executive, onClose, onPasswordChange }) => {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);

    if (!isOpen || !executive) return null;

    const handleSubmit = async () => {
        setError('');

        if (!newPassword || newPassword.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setSaving(true);
        try {
            await onPasswordChange(executive._id, newPassword);
            toast.success('Password updated successfully');
            handleClose();
        } catch (err) {
            toast.error(err.message || 'Failed to update password');
        } finally {
            setSaving(false);
        }
    };

    const handleClose = () => {
        setNewPassword('');
        setConfirmPassword('');
        setError('');
        setShowPassword(false);
        setShowConfirmPassword(false);
        onClose();
    };

    return (
        <div className="modal-overlay" style={{ zIndex: 2000 }} onClick={handleClose}>
            <div className="modal-card" style={{ maxWidth: 450 }} onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <div className="modal-title-group">
                        <div className="modal-lead-avatar" style={{ background: '#eff6ff', color: '#3b82f6' }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="11" width="18" height="11" rx="2" />
                                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="modal-lead-name">Change Password</h3>
                            <p className="modal-lead-sub">{executive?.name}</p>
                        </div>
                    </div>
                    <button className="modal-close" onClick={handleClose}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>

                <div className="modal-body" style={{ padding: '20px 24px' }}>
                    <div className="form-group" style={{ marginBottom: 16 }}>
                        <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, display: 'block', color: 'var(--text-secondary)' }}>
                            New Password <span className="required">*</span>
                        </label>
                        <div className="input-wrapper">
                            <svg className="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="11" width="18" height="11" rx="2" />
                                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                            </svg>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Enter new password (min 6 characters)"
                                value={newPassword}
                                onChange={e => setNewPassword(e.target.value)}
                                autoComplete="new-password"
                            />
                            <button
                                className="eye-btn"
                                type="button"
                                onClick={() => setShowPassword(v => !v)}
                                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)' }}
                            >
                                {showPassword ? (
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                                        <line x1="1" y1="1" x2="23" y2="23" />
                                    </svg>
                                ) : (
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                        <circle cx="12" cy="12" r="3" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>

                    <div className="form-group" style={{ marginBottom: 16 }}>
                        <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, display: 'block', color: 'var(--text-secondary)' }}>
                            Confirm Password <span className="required">*</span>
                        </label>
                        <div className="input-wrapper">
                            <svg className="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="11" width="18" height="11" rx="2" />
                                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                            </svg>
                            <input
                                type={showConfirmPassword ? 'text' : 'password'}
                                placeholder="Confirm new password"
                                value={confirmPassword}
                                onChange={e => setConfirmPassword(e.target.value)}
                                autoComplete="new-password"
                            />
                            <button
                                className="eye-btn"
                                type="button"
                                onClick={() => setShowConfirmPassword(v => !v)}
                                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)' }}
                            >
                                {showConfirmPassword ? (
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                                        <line x1="1" y1="1" x2="23" y2="23" />
                                    </svg>
                                ) : (
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                        <circle cx="12" cy="12" r="3" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>

                    {error && (
                        <div style={{
                            background: '#fee2e2',
                            color: '#dc2626',
                            padding: '10px 12px',
                            borderRadius: 8,
                            fontSize: 12,
                            marginTop: 12
                        }}>
                            {error}
                        </div>
                    )}

                    <div style={{ marginTop: 8, fontSize: 11, color: '#9ca3af' }}>
                        Password must be at least 6 characters long
                    </div>
                </div>

                <div className="modal-footer" style={{ justifyContent: 'flex-end', gap: '12px' }}>
                    {/* <button className="btn-reset" onClick={handleClose}>
            Cancel
          </button> */}
                    <button className="btn-primary" onClick={handleSubmit} disabled={saving}>
                        {saving ? (
                            <>
                                <span className="spinner" style={{ marginRight: 6 }} />
                                Saving...
                            </>
                        ) : (
                            <>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 6 }}>
                                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                                    <polyline points="17 21 17 13 7 13 7 21" />
                                    <polyline points="7 3 7 8 15 8" />
                                </svg>
                                Update Password
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChangePasswordModal;