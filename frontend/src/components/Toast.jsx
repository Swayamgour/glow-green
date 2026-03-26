// src/components/common/Toast.jsx
import { CheckCircle, XCircle, X } from 'lucide-react';
import { useEffect } from 'react';
import './Dashboard.css';

const Toast = ({ message, type = 'success', onClose }) => {
    useEffect(() => {
        const timer = setTimeout(onClose, 3000);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className={`toast toast-${type}`}>
            <div className="toast-icon">
                {type === 'success' ? <CheckCircle size={18} /> : <XCircle size={18} />}
            </div>
            <div className="toast-message">{message}</div>
            <button className="toast-close" onClick={onClose}>
                <X size={14} />
            </button>
        </div>
    );
};

export default Toast;