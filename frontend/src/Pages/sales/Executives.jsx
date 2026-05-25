// src/components/Executives/Executives.jsx
import React, { useState } from 'react';
import {
    useGetExecutivesQuery,
    useCreateExecutiveMutation,
    useUpdateExecutiveMutation,
    useDeleteExecutiveMutation,
    useUpdateExecutivePasswordMutation,
    useLazyViewExecutivePasswordQuery
} from '../../Redux/api';
import {
    Plus,
    Trash2,
    Key,
    UserPlus,
    Eye,
    EyeOff,
    Save,
    X,
    RefreshCw,
    Mail,
    Phone,
    User,
    Lock,
    Copy,
    AlertCircle,
    Edit2
} from 'lucide-react';
import Switch from "@mui/material/Switch";
import ConfirmationDialog from '../../components/ConfirmationDialog';
import ChangePasswordModal from '../../components/ChangePasswordModal';
import '../../components/Dashboard.css';
import toast from 'react-hot-toast';

const Executives = () => {
    // RTK Query hooks
    const { data: executives = [], refetch, isLoading: execLoading } = useGetExecutivesQuery();
    const [createExecutive] = useCreateExecutiveMutation();
    const [updateExecutive] = useUpdateExecutiveMutation();
    const [deleteExecutive] = useDeleteExecutiveMutation();
    const [updatePassword] = useUpdateExecutivePasswordMutation();
    const [viewPassword] = useLazyViewExecutivePasswordQuery();

    // State
    const [showAddExecutive, setShowAddExecutive] = useState(false);
    const [showEditExecutive, setShowEditExecutive] = useState(false);
    const [editingExecutive, setEditingExecutive] = useState(null);
    const [executiveForm, setExecutiveForm] = useState({
        name: '',
        phone: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [photoFile, setPhotoFile] = useState(null);
    const [photoPreview, setPhotoPreview] = useState(null);
    const [execSaving, setExecSaving] = useState(false);
    const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, id: null, name: '' });
    const [statusDialog, setStatusDialog] = useState({ isOpen: false, executive: null, newStatus: '' });
    const [passwordModal, setPasswordModal] = useState({ isOpen: false, executive: null });
    const [viewModal, setViewModal] = useState({ isOpen: false, executive: null });
    const [passwordViewModal, setPasswordViewModal] = useState({ 
        isOpen: false, 
        executive: null, 
        password: '', 
        needsReset: false,
        loading: false 
    });

    const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'https://glowgreen-backend.onrender.com';

    const getPhotoUrl = (path) => (path ? `${SERVER_URL}/${path}` : null);

    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setPhotoFile(file);
        const reader = new FileReader();
        reader.onloadend = () => setPhotoPreview(reader.result);
        reader.readAsDataURL(file);
    };

    const handleExecutiveReset = () => {
        setExecutiveForm({
            name: '',
            phone: '',
            email: '',
            password: '',
            confirmPassword: ''
        });
        setPhotoFile(null);
        setPhotoPreview(null);
        setShowAddExecutive(false);
        setShowEditExecutive(false);
        setEditingExecutive(null);
        setShowPassword(false);
        setShowConfirmPassword(false);
    };

    const handleEditClick = (executive) => {
        setEditingExecutive(executive);
        setExecutiveForm({
            name: executive.name || '',
            phone: executive.phone || '',
            email: executive.email || '',
            password: '',
            confirmPassword: ''
        });
        setPhotoPreview(executive.avatar ? getPhotoUrl(executive.avatar) : null);
        setPhotoFile(null);
        setShowEditExecutive(true);
        setShowAddExecutive(false);
    };

    const validateForm = (isEdit = false) => {
        const phoneRegex = /^[0-9]{10}$/;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!executiveForm.name || executiveForm.name.trim().length < 2) {
            toast.error('Name must be at least 2 characters');
            return false;
        }
        if (!executiveForm.phone || !phoneRegex.test(executiveForm.phone)) {
            toast.error('Phone must be exactly 10 digits');
            return false;
        }
        if (!executiveForm.email || !emailRegex.test(executiveForm.email)) {
            toast.error('Please enter a valid email address');
            return false;
        }
        
        // Only validate password for new executives or if password is being changed in edit
        if (!isEdit && (!executiveForm.password || executiveForm.password.length < 6)) {
            toast.error('Password must be at least 6 characters');
            return false;
        }
        if (!isEdit && executiveForm.password !== executiveForm.confirmPassword) {
            toast.error('Passwords do not match');
            return false;
        }
        
        return true;
    };

    const handleSaveExecutive = async () => {
        if (!validateForm(false)) return;

        setExecSaving(true);
        try {
            const formDataToSend = new FormData();
            formDataToSend.append('name', executiveForm.name);
            formDataToSend.append('phone', executiveForm.phone);
            formDataToSend.append('email', executiveForm.email);
            formDataToSend.append('password', executiveForm.password);
            if (photoFile) formDataToSend.append('avatar', photoFile);

            await createExecutive(formDataToSend).unwrap();
            toast.success('Executive saved successfully');
            handleExecutiveReset();
            refetch();
        } catch (err) {
            toast.error(err.data?.message || 'Failed to save executive');
        } finally {
            setExecSaving(false);
        }
    };

    const handleUpdateExecutive = async () => {
        if (!validateForm(true)) return;

        setExecSaving(true);
        try {
            const formDataToSend = new FormData();
            formDataToSend.append('name', executiveForm.name);
            formDataToSend.append('phone', executiveForm.phone);
            formDataToSend.append('email', executiveForm.email);
            if (photoFile) formDataToSend.append('avatar', photoFile);
            
            // Only include password if it's being changed
            if (executiveForm.password) {
                formDataToSend.append('password', executiveForm.password);
            }

            await updateExecutive({ 
                id: editingExecutive._id, 
                ...Object.fromEntries(formDataToSend)
            }).unwrap();
            toast.success('Executive updated successfully');
            handleExecutiveReset();
            refetch();
        } catch (err) {
            toast.error(err.data?.message || 'Failed to update executive');
        } finally {
            setExecSaving(false);
        }
    };

    const handleDeleteExecutive = async (id) => {
        setDeleteDialog({ isOpen: true, id, name: '' });
    };

    const confirmDelete = async () => {
        try {
            await deleteExecutive(deleteDialog.id).unwrap();
            toast.success('Executive deleted');
            setDeleteDialog({ isOpen: false, id: null, name: '' });
            refetch();
        } catch (err) {
            toast.error(err.data?.message || 'Failed to delete');
        }
    };

    const handleToggle = (exec) => {
        const newStatus = exec.status === 'active' ? 'inactive' : 'active';
        setStatusDialog({
            isOpen: true,
            executive: exec,
            newStatus: newStatus
        });
    };

    const confirmStatusChange = async () => {
        const { executive, newStatus } = statusDialog;
        try {
            await updateExecutive({ id: executive._id, status: newStatus }).unwrap();
            toast.success(`Status updated to ${newStatus}`);
            refetch();
            setStatusDialog({ isOpen: false, executive: null, newStatus: '' });
        } catch (err) {
            toast.error(err.data?.message || 'Failed to update status');
        }
    };

    const handlePasswordUpdate = async (id, newPassword) => {
        try {
            await updatePassword({ id, password: newPassword }).unwrap();
            toast.success('Password updated successfully');
            setPasswordModal({ isOpen: false, executive: null });
            return true;
        } catch (err) {
            toast.error(err.data?.message || 'Failed to update password');
            return false;
        }
    };

    const handleViewPassword = async (executive) => {
        setPasswordViewModal({ 
            isOpen: true, 
            executive, 
            password: '', 
            needsReset: false,
            loading: true 
        });

        try {
            const result = await viewPassword(executive._id).unwrap();
            setPasswordViewModal({
                isOpen: true,
                executive,
                password: result.password || '',
                needsReset: result.password?.startsWith('(Password was set before') || false,
                loading: false
            });
        } catch (err) {
            toast.error(err.data?.message || 'Failed to retrieve password');
            setPasswordViewModal({ 
                isOpen: false, 
                executive: null, 
                password: '', 
                needsReset: false,
                loading: false 
            });
        }
    };

    const handleCopyPassword = () => {
        navigator.clipboard.writeText(passwordViewModal.password);
        toast.success('Password copied to clipboard');
    };

    const handleSetNewPassword = async () => {
        const newPassword = document.getElementById('pw-reset-input')?.value?.trim();
        if (!newPassword || newPassword.length < 6) {
            toast.error('Password must be at least 6 characters');
            return;
        }
        
        try {
            await updatePassword({ id: passwordViewModal.executive._id, password: newPassword }).unwrap();
            toast.success('Password updated successfully');
            setPasswordViewModal({ 
                isOpen: false, 
                executive: null, 
                password: '', 
                needsReset: false,
                loading: false 
            });
        } catch (err) {
            toast.error(err.data?.message || 'Failed to update password');
        }
    };

    return (
        <>
            <div className="crm-page">
                <div className="crm-page-header">
                    <h2>Sales Executives</h2>
                    <button className="btn-primary" onClick={() => setShowAddExecutive(!showAddExecutive)}>
                        <Plus size={16} />
                        Add Executive
                    </button>
                </div>

                {/* Add Executive Form */}
                {showAddExecutive && (
                    <div className="crm-form-card">
                        <div className="crm-form-topbar" />
                        <div className="crm-form-body">
                            {/* Photo */}
                            {/* <div className="profile-photo-section">
                                <div className="profile-avatar-upload">
                                    {photoPreview
                                        ? <img src={photoPreview} alt="Preview" className="avatar-preview" />
                                        : <div className="avatar-placeholder">
                                            <UserPlus size={24} />
                                        </div>}
                                    <label className="camera-btn" htmlFor="photo-upload">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                                            <circle cx="12" cy="13" r="4" />
                                        </svg>
                                    </label>
                                    <input id="photo-upload" type="file" accept="image/*" hidden onChange={handlePhotoChange} />
                                </div>
                                <div className="profile-photo-info">
                                    <h4>Profile Photo</h4>
                                    <p>Upload a profile picture (JPG, PNG, GIF)</p>
                                    <label htmlFor="photo-upload" className="upload-link">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                            <polyline points="17 8 12 3 7 8" />
                                            <line x1="12" y1="3" x2="12" y2="15" />
                                        </svg>
                                        Upload Photo
                                    </label>
                                </div>
                            </div> */}
                            <div className="form-divider" />

                            <div className="form-group full-width">
                                <label>Full Name <span className="required">*</span></label>
                                <div className="input-wrapper">
                                    <User size={16} className="input-icon" />
                                    <input
                                        type="text"
                                        placeholder="Enter executive's full name"
                                        value={executiveForm.name}
                                        onChange={e => setExecutiveForm({ ...executiveForm, name: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Phone Number <span className="required">*</span></label>
                                    <div className="input-wrapper">
                                        <Phone size={16} className="input-icon" />
                                        <input
                                            type="tel"
                                            placeholder="10-digit mobile number"
                                            value={executiveForm.phone}
                                            maxLength={10}
                                            onChange={e => {
                                                const val = e.target.value.replace(/\D/g, '');
                                                setExecutiveForm({ ...executiveForm, phone: val });
                                            }}
                                        />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Email Address <span className="required">*</span></label>
                                    <div className="input-wrapper">
                                        <Mail size={16} className="input-icon" />
                                        <input
                                            type="email"
                                            placeholder="executive@company.com"
                                            value={executiveForm.email}
                                            onChange={e => setExecutiveForm({ ...executiveForm, email: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Password <span className="required">*</span></label>
                                    <div className="input-wrapper">
                                        <Lock size={16} className="input-icon" />
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            placeholder="Create password"
                                            value={executiveForm.password}
                                            onChange={e => setExecutiveForm({ ...executiveForm, password: e.target.value })}
                                        />
                                        <button className="eye-btn" type="button" onClick={() => setShowPassword(!showPassword)}>
                                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Confirm Password <span className="required">*</span></label>
                                    <div className="input-wrapper">
                                        <Lock size={16} className="input-icon" />
                                        <input
                                            type={showConfirmPassword ? 'text' : 'password'}
                                            placeholder="Confirm password"
                                            value={executiveForm.confirmPassword}
                                            onChange={e => setExecutiveForm({ ...executiveForm, confirmPassword: e.target.value })}
                                        />
                                        <button className="eye-btn" type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                                            {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="form-actions">
                                <button className="btn-reset" onClick={handleExecutiveReset}>
                                    <X size={15} />
                                    Cancel
                                </button>
                                <button className="btn-primary" onClick={handleSaveExecutive} disabled={execSaving}>
                                    {execSaving ? <span className="spinner" /> : <Save size={15} />}
                                    {execSaving ? 'Saving...' : 'Save Executive'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Edit Executive Form */}
                {showEditExecutive && editingExecutive && (
                    <div className="crm-form-card">
                        <div className="crm-form-topbar" />
                        <div className="crm-form-body">
                            <div className="form-header">
                                <h3>Edit Executive Details</h3>
                                {/* <button className="close-btn" onClick={handleExecutiveReset}>
                                    <X size={20} />
                                </button> */}
                            </div>

                            {/* Photo */}
                            <div className="profile-photo-section">
                                {/* <div className="profile-avatar-upload">
                                    {photoPreview
                                        ? <img src={photoPreview} alt="Preview" className="avatar-preview" />
                                        : editingExecutive.avatar
                                            ? <img src={getPhotoUrl(editingExecutive.avatar)} alt={editingExecutive.name} className="avatar-preview" />
                                            : <div className="avatar-placeholder">
                                                <UserPlus size={24} />
                                            </div>}
                                    <label className="camera-btn" htmlFor="edit-photo-upload">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                                            <circle cx="12" cy="13" r="4" />
                                        </svg>
                                    </label>
                                    <input id="edit-photo-upload" type="file" accept="image/*" hidden onChange={handlePhotoChange} />
                                </div> */}
                                {/* <div className="profile-photo-info">
                                    <h4>Profile Photo</h4>
                                    <p>Upload a new profile picture (optional)</p>
                                    <label htmlFor="edit-photo-upload" className="upload-link">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                            <polyline points="17 8 12 3 7 8" />
                                            <line x1="12" y1="3" x2="12" y2="15" />
                                        </svg>
                                        Change Photo
                                    </label>
                                </div> */}
                            </div>
                            <div className="form-divider" />

                            <div className="form-group full-width">
                                <label>Full Name <span className="required">*</span></label>
                                <div className="input-wrapper">
                                    <User size={16} className="input-icon" />
                                    <input
                                        type="text"
                                        placeholder="Enter executive's full name"
                                        value={executiveForm.name}
                                        onChange={e => setExecutiveForm({ ...executiveForm, name: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Phone Number <span className="required">*</span></label>
                                    <div className="input-wrapper">
                                        <Phone size={16} className="input-icon" />
                                        <input
                                            type="tel"
                                            placeholder="10-digit mobile number"
                                            value={executiveForm.phone}
                                            maxLength={10}
                                            onChange={e => {
                                                const val = e.target.value.replace(/\D/g, '');
                                                setExecutiveForm({ ...executiveForm, phone: val });
                                            }}
                                        />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Email Address <span className="required">*</span></label>
                                    <div className="input-wrapper">
                                        <Mail size={16} className="input-icon" />
                                        <input
                                            type="email"
                                            placeholder="executive@company.com"
                                            value={executiveForm.email}
                                            onChange={e => setExecutiveForm({ ...executiveForm, email: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>New Password (Optional)</label>
                                    <div className="input-wrapper">
                                        <Lock size={16} className="input-icon" />
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            placeholder="Leave blank to keep current password"
                                            value={executiveForm.password}
                                            onChange={e => setExecutiveForm({ ...executiveForm, password: e.target.value })}
                                        />
                                        <button className="eye-btn" type="button" onClick={() => setShowPassword(!showPassword)}>
                                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                    <small style={{ color: 'var(--text-secondary)', fontSize: 11 }}>
                                        Only fill if you want to change the password
                                    </small>
                                </div>
                                {executiveForm.password && (
                                    <div className="form-group">
                                        <label>Confirm New Password</label>
                                        <div className="input-wrapper">
                                            <Lock size={16} className="input-icon" />
                                            <input
                                                type={showConfirmPassword ? 'text' : 'password'}
                                                placeholder="Confirm new password"
                                                value={executiveForm.confirmPassword}
                                                onChange={e => setExecutiveForm({ ...executiveForm, confirmPassword: e.target.value })}
                                            />
                                            <button className="eye-btn" type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                                                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="form-actions">
                                <button className="btn-reset" onClick={handleExecutiveReset}>
                                    <X size={15} />
                                    Cancel
                                </button>
                                <button className="btn-primary" onClick={handleUpdateExecutive} disabled={execSaving}>
                                    {execSaving ? <span className="spinner" /> : <Save size={15} />}
                                    {execSaving ? 'Updating...' : 'Update Executive'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Executives List */}
                <div className="card">
                    <div className="card-header">
                        <h3>All Executives ({executives.length})</h3>
                        {execLoading && <RefreshCw size={18} className="spinning" />}
                    </div>
                    {executives.length === 0 && !execLoading ? (
                        <div className="empty-state">
                            <UserPlus size={48} strokeWidth={1.5} />
                            <p>No executives added yet. Click "Add Executive" to get started.</p>
                        </div>
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
                                    {executives.map(exec => {
                                        const execName = exec.name || '';
                                        return (
                                            <tr key={exec._id}>
                                                <td>
                                                    {exec.avatar
                                                        ? <img src={getPhotoUrl(exec.avatar)} alt={exec.name} className="exec-avatar" />
                                                        : <div className="exec-avatar-placeholder">{execName[0]?.toUpperCase() || 'E'}</div>}
                                                </td>
                                                <td className="exec-name">{exec.name}</td>
                                                <td>{exec.phone}</td>
                                                <td>{exec.email}</td>
                                                <td>
                                                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                                        <Switch
                                                            checked={exec.status === "active"}
                                                            onChange={() => handleToggle(exec)}
                                                            inputProps={{ "aria-label": "controlled" }}
                                                            color="success"
                                                        />
                                                        <span
                                                            className={`status-badge ${exec.status === "active" ? "active" : "inactive"}`}
                                                        >
                                                            {exec.status === "active" ? "Active" : "Inactive"}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="actions-cell">
                                                        {/* Edit Button */}
                                                        <button
                                                            className="action-btn edit"
                                                            title="Edit Executive Details"
                                                            onClick={() => handleEditClick(exec)}
                                                        >
                                                            <Edit2 size={14} />
                                                        </button>

                                                        {/* View Password Button */}
                                                        <button
                                                            className="action-btn password-view"
                                                            title="View Password"
                                                            onClick={() => handleViewPassword(exec)}
                                                        >
                                                            <Key size={14} />
                                                        </button>

                                                        {/* Change Password Button */}
                                                        <button
                                                            className="action-btn password"
                                                            title="Change Password"
                                                            onClick={() => setPasswordModal({ isOpen: true, executive: exec })}
                                                        >
                                                            <Lock size={14} />
                                                        </button>

                                                        {/* Delete Button */}
                                                        <button
                                                            className="action-btn delete"
                                                            title="Delete Executive"
                                                            onClick={() => setDeleteDialog({ isOpen: true, id: exec._id, name: exec.name })}
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Delete Confirmation Dialog */}
            <ConfirmationDialog
                isOpen={deleteDialog.isOpen}
                title="Delete Executive"
                message={`Are you sure you want to delete ${deleteDialog.name}? This action cannot be undone.`}
                onConfirm={confirmDelete}
                onCancel={() => setDeleteDialog({ isOpen: false, id: null, name: '' })}
            />

            {/* Status Change Confirmation Dialog */}
            <ConfirmationDialog
                isOpen={statusDialog.isOpen}
                title="Change Status"
                message={`Are you sure you want to change ${statusDialog.executive?.name}'s status from "${statusDialog.executive?.status}" to "${statusDialog.newStatus}"?`}
                onConfirm={confirmStatusChange}
                onCancel={() => setStatusDialog({ isOpen: false, executive: null, newStatus: '' })}
            />

            {/* Change Password Modal */}
            <ChangePasswordModal
                isOpen={passwordModal.isOpen}
                executive={passwordModal.executive}
                onClose={() => setPasswordModal({ isOpen: false, executive: null })}
                onPasswordChange={handlePasswordUpdate}
            />

            {/* View Password Modal */}
            {passwordViewModal.isOpen && (
                <div className="modal-overlay" onClick={() => setPasswordViewModal({ 
                    isOpen: false, executive: null, password: '', needsReset: false, loading: false 
                })}>
                    <div className="modal-card" style={{ maxWidth: 450 }} onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <div className="modal-title-group">
                                <div className="modal-lead-avatar" style={{ background: '#f0fdf4', color: '#16a34a' }}>
                                    <Key size={18} />
                                </div>
                                <div>
                                    <h3 className="modal-lead-name">
                                        {passwordViewModal.needsReset ? 'Set Password' : 'View Password'}
                                    </h3>
                                    <p className="modal-lead-sub">{passwordViewModal.executive?.name}</p>
                                </div>
                            </div>
                            <button 
                                className="modal-close" 
                                onClick={() => setPasswordViewModal({ 
                                    isOpen: false, executive: null, password: '', needsReset: false, loading: false 
                                })}
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="modal-body" style={{ padding: '20px 24px' }}>
                            {passwordViewModal.loading ? (
                                <div style={{ textAlign: 'center', padding: '20px' }}>
                                    <RefreshCw size={24} className="spinning" />
                                    <p style={{ marginTop: 12, color: 'var(--text-secondary)' }}>Loading password...</p>
                                </div>
                            ) : !passwordViewModal.needsReset ? (
                                <>
                                    <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>
                                        Current Password
                                    </p>
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 10,
                                        background: 'var(--bg-secondary)',
                                        border: '1px solid #e5e7eb',
                                        borderRadius: 8,
                                        padding: '10px 14px',
                                    }}>
                                        <code style={{
                                            flex: 1,
                                            fontSize: 15,
                                            fontWeight: 700,
                                            letterSpacing: 1,
                                            color: 'var(--text-primary)',
                                            wordBreak: 'break-all'
                                        }}>
                                            {passwordViewModal.password}
                                        </code>
                                        <button
                                            onClick={handleCopyPassword}
                                            style={{
                                                flexShrink: 0,
                                                background: '#eff6ff',
                                                border: 'none',
                                                borderRadius: 6,
                                                padding: '6px 10px',
                                                cursor: 'pointer',
                                                color: '#3b82f6',
                                                fontWeight: 600,
                                                fontSize: 12,
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 6
                                            }}
                                        >
                                            <Copy size={12} />
                                            Copy
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div style={{
                                        background: '#fef3c7',
                                        color: '#92400e',
                                        border: '1px solid #fde68a',
                                        borderRadius: 8,
                                        padding: '10px 12px',
                                        marginBottom: 16,
                                        fontSize: 12,
                                        lineHeight: 1.4,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 8
                                    }}>
                                        <AlertCircle size={14} />
                                        This account was created before password storage was added. 
                                        Set a new password below to save it.
                                    </div>
                                    <div className="input-wrapper">
                                        <Lock size={16} className="input-icon" />
                                        <input 
                                            id="pw-reset-input" 
                                            type="text" 
                                            placeholder="Enter new password (min 6 characters)" 
                                            style={{ fontFamily: 'monospace' }} 
                                        />
                                    </div>
                                    <div className="form-actions" style={{ marginTop: 20, padding: 0 }}>
                                        <button 
                                            className="btn-primary" 
                                            onClick={handleSetNewPassword}
                                            style={{ width: '100%' }}
                                        >
                                            <Save size={15} />
                                            Set New Password
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Executives;