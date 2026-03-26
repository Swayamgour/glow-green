// src/components/common/ConfirmationDialog.jsx
import { AlertTriangle, X } from 'lucide-react';
import './Dashboard.css';

const ConfirmationDialog = ({ isOpen, title, message, onConfirm, onCancel }) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay" style={{ zIndex: 2000 }}>
            <div className="modal-card" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <div className="modal-title-group">
                        <div className="modal-lead-avatar" style={{ background: '#fee2e2', color: '#dc2626' }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6l-1 14H6L5 6" />
                                <path d="M10 11v6M14 11v6" />
                                <path d="M9 6V4h6v2" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="modal-lead-name">{title}</h3>
                            <p className="modal-lead-sub">{message}</p>
                        </div>
                    </div>
                    <button className="modal-close" onClick={onCancel}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>
                <div className="modal-footer" style={{ justifyContent: 'center', gap: '12px', paddingTop: '20px' }}>
                    {/* <button className="btn-reset" onClick={onCancel}>
            Cancel
          </button> */}
                    <button className="btn-primary" style={{ background: '#dc2626', borderColor: '#dc2626' }} onClick={onConfirm}>
                        Confirm
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationDialog;