import { useState, useEffect, useCallback, useRef } from 'react';
import {
  fetchCustomers, createCustomer, updateCustomer, deleteCustomer,
  addCustomerNote, exportCustomersExcel, downloadCustomerTemplate, importCustomersExcel
} from '../services/Customer.service';
import './Customers.css';

const CATEGORIES = ['new', 'routine', 'closed'];
const SOURCES = ['Website', 'Referral', 'Social Media', 'Cold Call', 'Email Campaign', 'Exhibition', 'Other'];

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [allCustomers, setAllCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editCustomer, setEditCustomer] = useState(null);
  const [viewCustomer, setViewCustomer] = useState(null);
  const [toast, setToast] = useState(null);
  const [importLoading, setImportLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [noteLoading, setNoteLoading] = useState(false);

  const [dateFilter, setDateFilter] = useState("all"); // all | today | yesterday | custom
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const fileInputRef = useRef();

  const [form, setForm] = useState({
    name: '', company: '', phone: '', email: '',
    address: '', city: '', state: '', category: 'new',
    source: '', status: 'active'
  });

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {


      const params = {};

      if (search) params.search = search;
      if (filterCategory) params.category = filterCategory;

      // ✅ DATE FILTER ADD
      if (dateFilter === "today") {
        params.date = "today";
      }

      if (dateFilter === "yesterday") {
        params.date = "yesterday";
      }

      if (dateFilter === "custom") {
        if (fromDate) params.fromDate = fromDate;
        if (toDate) params.toDate = toDate;
      }

      const res = await fetchCustomers(params);
      setCustomers(res.data || []);

      // Always fetch unfiltered count for tab badges
      if (filterCategory || search) {
        const allRes = await fetchCustomers({});
        setAllCustomers(allRes.data || []);
      } else {
        setAllCustomers(res.data || []);
      }
    } catch (err) {
      showToast(err.message || 'Failed to load', 'error');
    } finally {
      setLoading(false);
    }
  }, [search, filterCategory, dateFilter, fromDate, toDate]);

  useEffect(() => { load(); }, [load]);


  const resetForm = () => setForm({
    name: '', company: '', phone: '', email: '',
    address: '', city: '', state: '', category: 'new',
    source: '', status: 'active'
  });

  const handleOpenForm = (customer = null) => {
    if (customer) {
      setEditCustomer(customer);
      setForm({
        name: customer.name || '',
        company: customer.company || '',
        phone: customer.phone || '',
        email: customer.email || '',
        address: customer.address || '',
        city: customer.city || '',
        state: customer.state || '',
        category: customer.category || 'new',
        source: customer.source || '',
        status: customer.status || 'active',
      });
    } else {
      setEditCustomer(null);
      resetForm();
    }
    setShowForm(true);
  };

  const handleSave = async () => {
    const phoneRegex = /^[0-9]{10}$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!form.name || form.name.trim().length < 2)
      return showToast('Name must be at least 2 characters', 'error');
    if (!form.phone || !phoneRegex.test(form.phone))
      return showToast('Phone must be exactly 10 digits', 'error');
    if (form.email && !emailRegex.test(form.email))
      return showToast('Please enter a valid email address', 'error');

    setSaving(true);
    try {
      if (editCustomer) {
        await updateCustomer(editCustomer._id, form);
        showToast('Customer updated');
      } else {
        await createCustomer(form);
        showToast('Customer added');
      }
      setShowForm(false);
      resetForm();
      setEditCustomer(null);
      load();
    } catch (err) {
      showToast(err.message || 'Failed to save', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this customer?')) return;
    try {
      await deleteCustomer(id);
      showToast('Customer deleted');
      load();
    } catch (err) {
      showToast(err.message || 'Failed to delete', 'error');
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    setNoteLoading(true);
    try {
      const res = await addCustomerNote(viewCustomer._id, newNote.trim());
      setViewCustomer(res.data);
      setNewNote('');
      showToast('Note added');
      load();
    } catch (err) {
      showToast(err.message || 'Failed to add note', 'error');
    } finally {
      setNoteLoading(false);
    }
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImportLoading(true);
    try {
      const res = await importCustomersExcel(file);
      if (res.success) {
        showToast(`${res.imported} customers imported`);
        load();
      } else {
        showToast(res.message || 'Import failed', 'error');
      }
    } catch (err) {
      showToast('Import failed', 'error');
    } finally {
      setImportLoading(false);
      e.target.value = '';
    }
  };


  const handleExport = (e) => {
    if (e) e.preventDefault();

    const params = {};

    if (search) params.search = search;
    if (filterCategory) params.category = filterCategory;

    if (dateFilter === "today") params.date = "today";
    if (dateFilter === "yesterday") params.date = "yesterday";

    if (dateFilter === "custom") {
      if (fromDate) params.fromDate = fromDate;
      if (toDate) params.toDate = toDate;
    }

    exportCustomersExcel(params);
  };



  const catCounts = {
    all: allCustomers.length,
    new: allCustomers.filter(c => c.category === 'new').length,
    routine: allCustomers.filter(c => c.category === 'routine').length,
    closed: allCustomers.filter(c => c.category === 'closed').length,
  };

  return (
    <div className="cust-page">

      {/* Toast */}
      {toast && (
        <div className={`cust-toast cust-toast-${toast.type}`}>
          {toast.type === 'success' ? '✓' : '✕'} {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="cust-header">
        <div>
          <h2>Customer Management</h2>
          <p>Manage all your customers — New, Routine & Closed</p>
        </div>
        <div className="cust-header-actions">
          <button className="cust-btn-outline" onClick={downloadCustomerTemplate} title="Download Excel Template">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
            Template
          </button>
          <label className={`cust-btn-outline ${importLoading ? 'loading' : ''}`}>
            {importLoading ? (
              <span className="cust-spinner" />
            ) : (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
            )}
            {importLoading ? 'Importing...' : 'Import Excel'}
            <input ref={fileInputRef} type="file" accept=".xlsx,.xls" hidden onChange={handleImport} />
          </label>
          <button className="cust-btn-outline"
            // onClick={exportCustomersExcel}
            onClick={handleExport}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
            Export Excel
          </button>
          <button className="cust-btn-primary" onClick={() => handleOpenForm()}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
            Add Customer
          </button>
        </div>
      </div>

      {/* Category tabs */}
      <div className="cust-tabs">
        {[
          { key: '', label: 'All', count: catCounts.all, color: '#4f46e5' },
          { key: 'new', label: 'New', count: catCounts.new, color: '#0ea5e9' },
          { key: 'routine', label: 'Routine', count: catCounts.routine, color: '#22c55e' },
          { key: 'closed', label: 'Closed / Old', count: catCounts.closed, color: '#ef4444' },
        ].map(tab => (
          <button
            key={tab.key}
            className={`cust-tab ${filterCategory === tab.key ? 'active' : ''}`}
            style={{ '--tab-color': tab.color }}
            onClick={() => setFilterCategory(tab.key)}>
            {tab.label}
            <span className="cust-tab-count">{tab.count}</span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="cust-search-bar">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
        <input
          type="text"
          placeholder="Search by name, company, phone or email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {search && <button onClick={() => setSearch('')} className="cust-search-clear">✕</button>}
      </div>

      <div style={{ display: "flex", gap: "10px", marginTop: "10px", flexWrap: "wrap" }}>

        {/* Date Filter Dropdown */}
        <select
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          style={{ padding: "6px 10px", borderRadius: "6px", border: "1px solid #ddd" }}
        >
          <option value="all">All Dates</option>
          <option value="today">Today</option>
          <option value="yesterday">Yesterday</option>
          <option value="custom">Between Dates</option>
        </select>

        {/* Custom Date */}
        {dateFilter === "custom" && (
          <>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              style={{ padding: "6px", borderRadius: "6px", border: "1px solid #ddd" }}
            />
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              style={{ padding: "6px", borderRadius: "6px", border: "1px solid #ddd" }}
            />
          </>
        )}

      </div>

      {/* Table */}
      <div className="cust-card">
        <div className="cust-table-header">
          <h3>Customers ({customers.length})</h3>
          {loading && <span className="cust-loading">Loading...</span>}
        </div>
        {customers.length === 0 && !loading ? (
          <div className="cust-empty">
            <div className="cust-empty-icon">👥</div>
            <p>No customers found. Add your first customer or import from Excel.</p>
          </div>
        ) : (
          <div className="cust-table-wrap">
            <table className="cust-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>Company</th>
                  <th>Phone</th>
                  <th>City</th>
                  <th>Category</th>
                  <th>Source</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c, i) => (
                  <tr key={c._id}>
                    <td className="cust-num">{i + 1}</td>
                    <td className="cust-name-cell">
                      <div className="cust-avatar">{c.name[0].toUpperCase()}</div>
                      <span>{c.name}</span>
                    </td>
                    <td>{c.pname || '—'}</td>
                    <td>{c.omobile}</td>
                    <td>{c.city || '—'}</td>
                    <td><span className={`cust-cat-badge cust-cat-${c.category}`}>{c.category}</span></td>
                    <td>{c.source || '—'}</td>
                    <td><span className={`cust-status-badge ${c.status}`}>{c.status}</span></td>
                    <td className="cust-actions">
                      <button className="cust-action view" onClick={() => setViewCustomer(c)} title="View">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                      </button>
                      <button className="cust-action edit" onClick={() => handleOpenForm(c)} title="Edit">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                      </button>
                      <button className="cust-action delete" onClick={() => handleDelete(c._id)} title="Delete">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" /></svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="cust-modal-overlay" onClick={() => setShowForm(false)}>
          <div className="cust-modal" onClick={e => e.stopPropagation()}>
            <div className="cust-modal-header">
              <h3>{editCustomer ? 'Edit Customer' : 'Add Customer'}</h3>
              <button className="cust-modal-close" onClick={() => setShowForm(false)}>✕</button>
            </div>
            <div className="cust-modal-body">
              <div className="cust-form-row">
                <div className="cust-form-group">
                  <label>Full Name <span className="req">*</span></label>
                  <input type="text" placeholder="Customer name" value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })} />
                </div>
                <div className="cust-form-group">
                  <label>Company</label>
                  <input type="text" placeholder="Company name" value={form.company}
                    onChange={e => setForm({ ...form, company: e.target.value })} />
                </div>
              </div>
              <div className="cust-form-row">
                <div className="cust-form-group">
                  <label>Phone <span className="req">*</span></label>
                  <input type="tel" placeholder="10-digit mobile" value={form.phone}
                    onChange={e => setForm({ ...form, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })} />
                </div>
                <div className="cust-form-group">
                  <label>Email</label>
                  <input type="email" placeholder="email@example.com" value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })} />
                </div>
              </div>
              <div className="cust-form-row">
                <div className="cust-form-group">
                  <label>City</label>
                  <input type="text" placeholder="City" value={form.city}
                    onChange={e => setForm({ ...form, city: e.target.value })} />
                </div>
                <div className="cust-form-group">
                  <label>State</label>
                  <input type="text" placeholder="State" value={form.state}
                    onChange={e => setForm({ ...form, state: e.target.value })} />
                </div>
              </div>
              <div className="cust-form-row">
                <div className="cust-form-group">
                  <label>Category</label>
                  <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                    <option value="new">New</option>
                    <option value="routine">Routine</option>
                    <option value="closed">Closed / Old</option>
                  </select>
                </div>
                <div className="cust-form-group">
                  <label>Source</label>
                  <select value={form.source} onChange={e => setForm({ ...form, source: e.target.value })}>
                    <option value="">Select Source</option>
                    {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="cust-form-group full">
                <label>Address</label>
                <textarea rows={2} placeholder="Full address" value={form.address}
                  onChange={e => setForm({ ...form, address: e.target.value })} />
              </div>
              <div className="cust-form-group">
                <label>Status</label>
                <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
            <div className="cust-modal-footer">
              <button className="cust-btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
              <button className="cust-btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? <span className="cust-spinner" /> : null}
                {saving ? 'Saving...' : editCustomer ? 'Update Customer' : 'Add Customer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {viewCustomer && (
        <div className="cust-modal-overlay" onClick={() => setViewCustomer(null)}>
          <div className="cust-modal cust-modal-view" onClick={e => e.stopPropagation()}>
            <div className="cust-modal-header">
              <div className="cust-view-title">
                <div className="cust-view-avatar">{viewCustomer.name[0].toUpperCase()}</div>
                <div>
                  <h3>{viewCustomer.name}</h3>
                  <p>{viewCustomer.company || 'No company'}</p>
                </div>
              </div>
              <button className="cust-modal-close" onClick={() => setViewCustomer(null)}>✕</button>
            </div>

            <div className="cust-modal-body">
              {/* Details grid */}
              <div className="cust-detail-grid">
                <div className="cust-detail-item">
                  <span className="cust-detail-label">Phone</span>
                  <span className="cust-detail-value">{viewCustomer.phone}</span>
                </div>
                <div className="cust-detail-item">
                  <span className="cust-detail-label">Email</span>
                  <span className="cust-detail-value">{viewCustomer.email || '—'}</span>
                </div>
                <div className="cust-detail-item">
                  <span className="cust-detail-label">City</span>
                  <span className="cust-detail-value">{viewCustomer.city || '—'}</span>
                </div>
                <div className="cust-detail-item">
                  <span className="cust-detail-label">State</span>
                  <span className="cust-detail-value">{viewCustomer.state || '—'}</span>
                </div>
                <div className="cust-detail-item">
                  <span className="cust-detail-label">Category</span>
                  <span className={`cust-cat-badge cust-cat-${viewCustomer.category}`}>{viewCustomer.category}</span>
                </div>
                <div className="cust-detail-item">
                  <span className="cust-detail-label">Source</span>
                  <span className="cust-detail-value">{viewCustomer.source || '—'}</span>
                </div>
                <div className="cust-detail-item full">
                  <span className="cust-detail-label">Address</span>
                  <span className="cust-detail-value">{viewCustomer.address || '—'}</span>
                </div>
              </div>

              {/* Notes */}
              <div className="cust-notes-section">
                <h4>Notes & History</h4>
                <div className="cust-notes-list">
                  {viewCustomer.notes?.length === 0 && (
                    <p className="cust-no-notes">No notes yet.</p>
                  )}
                  {[...(viewCustomer.notes || [])].reverse().map((note, i) => (
                    <div key={i} className="cust-note-item">
                      <p>{note.text}</p>
                      <span>{new Date(note.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  ))}
                </div>
                <div className="cust-add-note">
                  <textarea
                    rows={2}
                    placeholder="Add a note..."
                    value={newNote}
                    onChange={e => setNewNote(e.target.value)}
                  />
                  <button className="cust-btn-primary" onClick={handleAddNote} disabled={noteLoading || !newNote.trim()}>
                    {noteLoading ? <span className="cust-spinner" /> : 'Add Note'}
                  </button>
                </div>
              </div>
            </div>

            <div className="cust-modal-footer">
              <button className="cust-btn-ghost" onClick={() => setViewCustomer(null)}>Close</button>
              <button className="cust-btn-primary" onClick={() => { setViewCustomer(null); handleOpenForm(viewCustomer); }}>
                Edit Customer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}