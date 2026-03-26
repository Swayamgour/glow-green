// src/components/Dashboard/SalesExecutives.jsx
import { useState } from 'react';
import {
    useGetExecutivesQuery,
    useCreateExecutiveMutation,
    useUpdateExecutiveMutation,
    useDeleteExecutiveMutation,
    useUpdateExecutivePasswordMutation
} from '../../services/api';
import { Plus, Trash2, Key, UserPlus, Eye, EyeOff, Save, X } from 'lucide-react';
import ConfirmationDialog from '../common/ConfirmationDialog';
import ChangePasswordModal from './ChangePasswordModal';
import './SalesExecutives.css';

const SalesExecutives = ({ showToast }) => {
    const { data: executives = [], refetch, isLoading } = useGetExecutivesQuery();
    const [createExecutive] = useCreateExecutiveMutation();
    const [updateExecutive] = useUpdateExecutiveMutation();
    const [deleteExecutive] = useDeleteExecutiveMutation();
    const [updatePassword] = useUpdateExecutivePasswordMutation();

    const [showAddForm, setShowAddForm] = useState(false);
    const [formData, setFormData] = useState({
        name: '', phone: '', email: '', password: '', confirmPassword: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [photoFile, setPhotoFile] = useState(null);
    const [photoPreview, setPhotoPreview] = useState(null);
    const [saving, setSaving] = useState(false);
    const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, id: null, name: '' });
    const [passwordModal, setPasswordModal] = useState({ isOpen: false, executive: null });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setPhotoFile(file);
        const reader = new FileReader();
        reader.onloadend = () => setPhotoPreview(reader.result);
        reader.readAsDataURL(file);
    };

    const resetForm = () => {
        setFormData({ name: '', phone: '', email: '', password: '', confirmPassword: '' });
        setPhotoFile(null);
        setPhotoPreview(null);
        setShowAddForm(false);
    };

    const validateForm = () => {
        const phoneRegex = /^[0-9]{10}$/;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!formData.name || formData.name.trim().length < 2) {
            showToast('Name must be at least 2 characters', 'error');
            return false;
        }
        if (!formData.phone || !phoneRegex.test(formData.phone)) {
            showToast('Phone must be exactly 10 digits', 'error');
            return false;
        }
        if (!formData.email || !emailRegex.test(formData.email)) {
            showToast('Please enter a valid email address', 'error');
            return false;
        }
        if (!formData.password || formData.password.length < 6) {
            showToast('Password must be at least 6 characters', 'error');
            return false;
        }
        if (formData.password !== formData.confirmPassword) {
            showToast('Passwords do not match', 'error');
            return false;
        }
        return true;
    };

    const handleSave = async () => {
        if (!validateForm()) return;

        setSaving(true);
        try {
            const formDataToSend = new FormData();
            formDataToSend.append('name', formData.name);
            formDataToSend.append('phone', formData.phone);
            formDataToSend.append('email', formData.email);
            formDataToSend.append('password', formData.password);
            if (photoFile) formDataToSend.append('avatar', photoFile);

            await createExecutive(formDataToSend).unwrap();
            showToast('Executive saved successfully');
            resetForm();
            refetch();
        } catch (err) {
            showToast(err.data?.message || 'Failed to save executive', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        try {
            await deleteExecutive(deleteDialog.id).unwrap();
            showToast('Executive deleted');
            setDeleteDialog({ isOpen: false, id: null, name: '' });
            refetch();
        } catch (err) {
            showToast(err.data?.message || 'Failed to delete', 'error');
        }
    };

    const handleToggleStatus = async (exec) => {
        const newStatus = exec.status === 'active' ? 'inactive' : 'active';
        try {
            await updateExecutive({ id: exec._id, status: newStatus }).unwrap();
            showToast('Status updated');
            refetch();
        } catch (err) {
            showToast(err.data?.message || 'Failed to update status', 'error');
        }
    };

    const handlePasswordUpdate = async (id, newPassword) => {
        try {
            await updatePassword({ id, password: newPassword }).unwrap();
            showToast('Password updated successfully');
            return true;
        } catch (err) {
            showToast(err.data?.message || 'Failed to update password', 'error');
            return false;
        }
    };

    const getPhotoUrl = (path) => {
        const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'https://glowgreen-backend.onrender.com';
        return path ? `${SERVER_URL}/${path}` : null;
    };

    return (
        <div className="crm-page">
            <div className="crm-page-header">
                <h2>Sales Executives</h2>
                <button className="btn-primary" onClick={() => setShowAddForm(true)}>
                    <Plus size={16} />
                    Add Executive
                </button>
            </div>

            {showAddForm && (
                <div className="crm-form-card">
                    <div className="crm-form-topbar" />
                    <div className="crm-form-body">
                        <div className="profile-photo-section">
                            <div className="profile-avatar-upload">
                                {photoPreview ? (
                                    <img src={photoPreview} alt="Preview" className="avatar-preview" />
                                ) : (
                                    <div className="avatar-placeholder">
                                        <UserPlus size={24} />
                                    </div>
                                )}
                                <label className="camera-btn" htmlFor="photo-upload">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                                        <circle cx="12" cy="13" r="4" />
                                    </svg>
                                </label>
                                <input id="photo-upload" type="file" accept="image/*" hidden onChange={handlePhotoChange} />
                            </div>
                        </div>

                        <div className="form-divider" />

                        <div className="form-group full-width">
                            <label>Full Name <span className="required">*</span></label>
                            <input
                                type="text"
                                name="name"
                                placeholder="Enter executive's full name"
                                value={formData.name}
                                onChange={handleInputChange}
                            />
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Phone Number <span className="required">*</span></label>
                                <input
                                    type="tel"
                                    name="phone"
                                    placeholder="10-digit mobile number"
                                    value={formData.phone}
                                    onChange={(e) => {
                                        const val = e.target.value.replace(/\D/g, '');
                                        setFormData(prev => ({ ...prev, phone: val }));
                                    }}
                                    maxLength={10}
                                />
                            </div>
                            <div className="form-group">
                                <label>Email Address <span className="required">*</span></label>
                                <input
                                    type="email"
                                    name="email"
                                    placeholder="executive@company.com"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Password <span className="required">*</span></label>
                                <div className="password-input-wrapper">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        name="password"
                                        placeholder="Create password"
                                        value={formData.password}
                                        onChange={handleInputChange}
                                    />
                                    <button
                                        type="button"
                                        className="eye-btn"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Confirm Password <span className="required">*</span></label>
                                <div className="password-input-wrapper">
                                    <input
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        name="confirmPassword"
                                        placeholder="Confirm password"
                                        value={formData.confirmPassword}
                                        onChange={handleInputChange}
                                    />
                                    <button
                                        type="button"
                                        className="eye-btn"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    >
                                        {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="form-actions">
                            <button className="btn-reset" onClick={resetForm}>
                                <X size={15} />
                                Cancel
                            </button>
                            <button className="btn-primary" onClick={handleSave} disabled={saving}>
                                {saving ? (
                                    <span className="spinner" />
                                ) : (
                                    <>
                                        <Save size={15} />
                                        Save Executive
                                    </>
                                )}
                                {saving ? 'Saving...' : 'Save Executive'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="card">
                <div className="card-header">
                    <h3>All Executives ({executives.length})</h3>
                    {isLoading && <span className="loading-text">Loading...</span>}
                </div>

                {executives.length === 0 && !isLoading ? (
                    <div className="empty-state">No executives added yet. Click "Add Executive" to get started.</div>
                ) : (
                    <div className="table-container">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Photo</th>
                                    <th>Name</th>
                                    <th>Phone</th>
                                    <th>Email</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {executives.map(exec => (
                                    <tr key={exec._id}>
                                        <td>
                                            {exec.avatar ? (
                                                <img src={getPhotoUrl(exec.avatar)} alt={exec.name} className="exec-avatar" />
                                            ) : (
                                                <div className="exec-avatar-placeholder">{exec.name?.[0] || 'E'}</div>
                                            )}
                                        </td>
                                        <td className="exec-name">{exec.name}</td>
                                        <td>{exec.phone}</td>
                                        <td>{exec.email}</td>
                                        <td>
                                            <div className="status-toggle">
                                                <button
                                                    className={`status-switch ${exec.status === 'active' ? 'active' : 'inactive'}`}
                                                    onClick={() => handleToggleStatus(exec)}
                                                >
                                                    <span className={`slider ${exec.status === 'active' ? 'active' : 'inactive'}`} />
                                                </button>
                                                <span className={`status-badge ${exec.status === 'active' ? 'active' : 'inactive'}`}>
                                                    {exec.status === 'active' ? 'Active' : 'Inactive'}
                                                </span>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="actions-cell">
                                                <button
                                                    className="action-btn password"
                                                    title="Change Password"
                                                    onClick={() => setPasswordModal({ isOpen: true, executive: exec })}
                                                >
                                                    <Key size={14} />
                                                </button>
                                                <button
                                                    className="action-btn delete"
                                                    onClick={() => setDeleteDialog({ isOpen: true, id: exec._id, name: exec.name })}
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <ConfirmationDialog
                isOpen={deleteDialog.isOpen}
                title="Delete Executive"
                message={`Are you sure you want to delete ${deleteDialog.name}? This action cannot be undone.`}
                onConfirm={handleDelete}
                onCancel={() => setDeleteDialog({ isOpen: false, id: null, name: '' })}
            />

            <ChangePasswordModal
                isOpen={passwordModal.isOpen}
                executive={passwordModal.executive}
                onClose={() => setPasswordModal({ isOpen: false, executive: null })}
                onPasswordChange={handlePasswordUpdate}
                showToast={showToast}
            />
        </div>
    );
};

export default SalesExecutives;