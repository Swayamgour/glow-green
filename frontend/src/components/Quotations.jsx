import { useState, useRef } from 'react';
import {
  useGetQuotationsQuery,
  useCreateQuotationMutation,
  useUpdateQuotationMutation,
  useDeleteQuotationMutation,
  useUpdateQuotationStatusMutation,
  useGetExecutivesQuery,
  useGetCustomersQuery,
  useGetProductsQuery
} from '../Redux/api';
import html2pdf from 'html2pdf.js';
import './Quotations.css';
import QuotationPdfs from './QuotationPdfs';
import ConfirmationDialog from './ConfirmationDialog';

import { FaWhatsapp, FaEnvelope } from "react-icons/fa";

const SERIES_OPTIONS = ['GG', 'QT', 'INV', 'EST'];
const UNITS = ['pcs', 'kg', 'g', 'litre', 'ml', 'box', 'bag', 'metre', 'set', 'other'];
const TAX_TYPES = [{ v: 'none', l: 'No Tax' }, { v: 'gst', l: 'GST' }, { v: 'igst', l: 'IGST' }];
const TAX_RATES = [0, 5, 12, 18, 28];
const STATUSES = ['draft', 'sent', 'accepted', 'rejected', 'expired'];

const STATUS_STYLE = {
  draft: { bg: '#f3f4f6', text: '#374151' },
  sent: { bg: '#dbeafe', text: '#1d4ed8' },
  accepted: { bg: '#dcfce7', text: '#166534' },
  rejected: { bg: '#fee2e2', text: '#991b1b' },
  expired: { bg: '#fef3c7', text: '#92400e' },
};

const DEFAULT_TERMS = `1. This quotation is valid for 30 days from the date of issue.
2. Payment terms: 50% advance, 50% before delivery.
3. Prices are subject to change without prior notice.
4. Delivery within 7-10 working days after order confirmation.`;

const emptyItem = {
  productId: '',
  description: '',
  productCode: '',
  hsnCode: '',
  image: '',
  category: '',
  wattage: '',
  length: '',
  breadth: '',
  height: '',
  weight: '',
  surge: '',
  quantity: 1,
  unit: 'pcs',
  rate: 0,
  amount: 0,
  isPriceEdited: false // Track if price was manually edited
};

const emptyForm = {
  customerId: '',
  series: 'GG',
  date: new Date().toISOString().split('T')[0],
  validTill: '',
  customerName: '',
  customerPhone: '',
  customerEmail: '',
  customerAddress: '',
  customerGST: '',
  items: [{ ...emptyItem }],
  discountType: 'percent',
  discountValue: 0,
  taxType: 'gst',
  taxRate: 18,
  terms: DEFAULT_TERMS,
  notes: '',
  status: 'draft',
  preparedBy: '',
};

export default function Quotations() {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [view, setView] = useState('list');
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [pdfPreview, setPdfPreview] = useState({ show: false, quotation: null });
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [sendingWhatsApp, setSendingWhatsApp] = useState(false);
  const [editingPriceFor, setEditingPriceFor] = useState(null); // Track which item is being edited

  const pdfContentRef = useRef();

  // Build query params
  const queryParams = {};
  if (search) queryParams.search = search;
  if (filterStatus) queryParams.status = filterStatus;

  // RTK Query hooks
  const {
    data: quotationsData = [],
    isLoading: loading,
    refetch: refetchQuotations
  } = useGetQuotationsQuery(queryParams);

  const { data: executivesData = [] } = useGetExecutivesQuery();
  const { data: customersData = [] } = useGetCustomersQuery();
  const { data: productsData = [] } = useGetProductsQuery();

  const [createQuotation] = useCreateQuotationMutation();
  const [updateQuotation] = useUpdateQuotationMutation();
  const [deleteQuotation] = useDeleteQuotationMutation();
  const [updateQuotationStatus] = useUpdateQuotationStatusMutation();

  const quotations = quotationsData;
  const executives = executivesData;
  const customers = customersData || [];
  const products = productsData || [];

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3200);
  };

  // Helper function to get master price from product
  const getMasterPrice = (productId) => {
    const product = products.find(p => p._id === productId);
    if (!product) return 0;

    // Try multiple possible price fields
    const price = Number(product.price) ||
      Number(product.masterPrice) ||
      Number(product.sellingPrice) ||
      Number(product.fmDetails?.masterPrice) ||
      Number(product.rate) || 0;
    return price;
  };

  const calcTotals = (items, discountType, discountValue, taxType, taxRate) => {
    const subtotal = (items || []).reduce((s, i) => s + (Number(i.quantity) || 0) * (Number(i.rate) || 0), 0);
    let discountAmount = discountType === 'percent'
      ? (subtotal * Number(discountValue || 0)) / 100
      : Number(discountValue || 0);
    const afterDiscount = subtotal - discountAmount;
    const taxAmount = taxType !== 'none' ? (afterDiscount * Number(taxRate || 0)) / 100 : 0;
    const grandTotal = afterDiscount + taxAmount;
    return { subtotal, discountAmount, taxAmount, grandTotal };
  };

  const totals = calcTotals(form.items, form.discountType, form.discountValue, form.taxType, form.taxRate);

  const setItem = (idx, field, value) => {
    const items = form.items.map((it, i) => {
      if (i !== idx) return it;
      const updated = { ...it, [field]: value };
      if (field === 'rate') {
        updated.isPriceEdited = true; // Mark as edited when rate changes
      }
      if (field === 'quantity' || field === 'rate') {
        updated.amount = (Number(updated.quantity) || 0) * (Number(updated.rate) || 0);
      }
      return updated;
    });
    setForm(f => ({ ...f, items }));
  };

  const addItem = () => setForm(f => ({ ...f, items: [...f.items, { ...emptyItem }] }));
  const removeItem = (idx) => setForm(f => ({ ...f, items: f.items.filter((_, i) => i !== idx) }));

  const handleNew = () => {
    setEditId(null);
    setForm(emptyForm);
    setView('form');
  };

  const handleCustomerSelect = (id) => {
    const customer = customers.find((c) => c._id === id);
    if (!customer) return;

    setForm((prev) => ({
      ...prev,
      customerId: customer._id,
      customerName: customer.name || '',
      customerPhone: customer.omobile || customer.smobile || customer.amobile || '',
      customerEmail: customer.oemail || customer.semail || customer.aemail || '',
      customerGST: customer.gstin || customer.gstnbill || '',
      customerAddress: [customer.add1, customer.add2, customer.city, customer.pin].filter(Boolean).join(', ')
    }));
  };

  const handleEdit = (q) => {
    setEditId(q._id);
    setForm({
      series: q.series || 'GG',
      date: q.date ? q.date.split('T')[0] : new Date().toISOString().split('T')[0],
      validTill: q.validTill ? q.validTill.split('T')[0] : '',
      customerName: q.customerName || '',
      customerPhone: q.customerPhone || '',
      customerEmail: q.customerEmail || '',
      customerAddress: q.customerAddress || '',
      customerGST: q.customerGST || '',
      items: q.items?.length ? q.items.map(item => ({ ...item, isPriceEdited: true })) : [{ ...emptyItem }],
      discountType: q.discountType || 'percent',
      discountValue: q.discountValue || 0,
      taxType: q.taxType || 'gst',
      taxRate: q.taxRate || 18,
      terms: q.terms || DEFAULT_TERMS,
      notes: q.notes || '',
      status: q.status || 'draft',
      preparedBy: q.preparedBy?._id || '',
    });
    setView('form');
  };

  const handleProductSelect = (index, productId) => {
    const product = products.find((p) => p._id === productId);
    if (!product) return;

    const masterPrice = getMasterPrice(productId);
    const items = [...form.items];
    const currentItem = items[index];

    items[index] = {
      ...items[index],
      productId: product._id,
      description: product.name || '',
      productCode: product.code || product.productCode || '',
      hsnCode: product.hsn || product.hsnCode || '',
      category: product.category || '',
      wattage: product.wattage || '',
      length: product.length || '',
      breadth: product.breadth || '',
      height: product.height || '',
      weight: product.weight || '',
      surge: product.surge || '',
      rate: currentItem.isPriceEdited ? currentItem.rate : masterPrice, // Keep edited price if already edited
      quantity: currentItem.quantity || 1,
      amount: (currentItem.quantity || 1) * (currentItem.isPriceEdited ? currentItem.rate : masterPrice),
      isPriceEdited: currentItem.isPriceEdited || false
    };

    setForm((prev) => ({
      ...prev,
      items
    }));

    if (masterPrice === 0 && !currentItem.isPriceEdited) {
      showToast(`⚠️ Product "${product.name}" has no master price. Please enter price manually.`, 'warning');
    } else if (!currentItem.isPriceEdited) {
      showToast(`✓ Product added with master price: ₹${masterPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 'success');
    }
  };

  // Handle manual price editing
  const handlePriceEdit = (idx, newPrice) => {
    if (newPrice !== null && !isNaN(newPrice) && newPrice >= 0) {
      setItem(idx, 'rate', parseFloat(newPrice));
      showToast(`Price updated to ₹${parseFloat(newPrice).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 'success');
      setEditingPriceFor(null);
    }
  };

  // Reset to master price
  const handleResetToMasterPrice = (idx) => {
    const item = form.items[idx];
    if (!item.productId) {
      showToast('No product selected to reset price', 'warning');
      return;
    }

    const masterPrice = getMasterPrice(item.productId);
    if (masterPrice > 0) {
      setItem(idx, 'rate', masterPrice);
      showToast(`Reset to master price: ₹${masterPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 'success');
    } else {
      showToast('No master price available for this product', 'warning');
    }
  };

  const handleSave = async () => {
    // Customer Validation
    if (!form.customerName) {
      return showToast('Customer name is required', 'error');
    }

    // Items Validation
    if (!form.items?.length) {
      return showToast('Add at least one item', 'error');
    }

    // Check valid item
    const hasValidItem = form.items.some(
      (item) => item.description || item.productId
    );

    if (!hasValidItem) {
      return showToast('Add at least one item', 'error');
    }

    // Check price for all items
    const hasInvalidPrice = form.items.some(
      (item) =>
        (item.description || item.productId) &&
        (!item.rate || item.rate <= 0)
    );

    if (hasInvalidPrice) {
      return showToast('Please enter price for all selected items', 'error');
    }

    setSaving(true);

    try {
      if (editId) {
        await updateQuotation({
          id: editId,
          ...form
        }).unwrap();
        showToast('Quotation updated');
      } else {
        await createQuotation(form).unwrap();
        showToast('Quotation created');
      }

      setView('list');
      setEditId(null);
      refetchQuotations();
    } catch (err) {
      showToast(
        err.data?.message ||
        err.message ||
        'Failed to save',
        'error'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id) => {
    setDeleteId(id);
    setConfirmOpen(true);
  };

  const confirmDelete = async () => {
    try {
      await deleteQuotation(deleteId).unwrap();
      showToast('Quotation deleted');
      refetchQuotations();
    } catch (err) {
      showToast(err.data?.message || err.message, 'error');
    } finally {
      setConfirmOpen(false);
      setDeleteId(null);
    }
  };

  const cancelDelete = () => {
    setConfirmOpen(false);
    setDeleteId(null);
  };

  const handleQuickStatus = async (id, status) => {
    try {
      await updateQuotationStatus({ id, status }).unwrap();
      showToast('Status updated');
      refetchQuotations();
    } catch (err) {
      showToast('Failed', 'error');
    }
  };

  // Generate PDF and return as blob
  const generatePDFBlob = async (quotation) => {
    try {
      const element = pdfContentRef.current;
      if (!element) return null;

      const opt = {
        margin: [10, 10, 10, 10],
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, letterRendering: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      const pdfBlob = await html2pdf().set(opt).from(element).outputPdf('blob');
      return pdfBlob;
    } catch (err) {
      console.error('PDF generation error:', err);
      return null;
    }
  };

  // Email functionality
  const handleSendEmail = async (quotation) => {
    if (!quotation.customerEmail) {
      showToast('Customer email is required to send quotation', 'error');
      return;
    }

    setSendingEmail(true);
    try {
      const pdfBlob = await generatePDFBlob(quotation);
      if (!pdfBlob) {
        showToast('Failed to generate PDF', 'error');
        return;
      }

      const pdfUrl = URL.createObjectURL(pdfBlob);
      const subject = `Quotation ${quotation.quotationNo} from Your Company Name`;
      const body = `Dear ${quotation.customerName},

Thank you for your interest in our products/services.

Please find attached our quotation (${quotation.quotationNo}) for your reference.

Quotation Details:
- Quotation Number: ${quotation.quotationNo}
- Date: ${new Date(quotation.date).toLocaleDateString()}
- Valid Till: ${quotation.validTill ? new Date(quotation.validTill).toLocaleDateString() : 'N/A'}
- Grand Total: ₹${Number(quotation.grandTotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}

For any clarification, please feel free to contact us.

Best regards,
${quotation.preparedBy?.name || 'Sales Team'}
Your Company Name
Phone: Your Phone Number
Email: your.email@company.com

Note: This is an automatically generated email. Please do not reply directly.`;

      const mailtoLink = `mailto:${quotation.customerEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      window.location.href = mailtoLink;

      const downloadLink = document.createElement('a');
      downloadLink.href = pdfUrl;
      downloadLink.download = `${quotation.quotationNo}_${quotation.customerName}.pdf`;

      setTimeout(() => {
        if (confirm('Email client opened. If attachment doesn\'t work automatically, click OK to download PDF for manual attachment.')) {
          downloadLink.click();
        }
        URL.revokeObjectURL(pdfUrl);
      }, 1000);

      showToast('Opening email client... Please attach the downloaded PDF manually if needed', 'success');

      if (quotation.status === 'draft') {
        await updateQuotationStatus({ id: quotation._id, status: 'sent' }).unwrap();
        refetchQuotations();
      }
    } catch (err) {
      console.error('Email error:', err);
      showToast('Failed to send email', 'error');
    } finally {
      setSendingEmail(false);
    }
  };

  // WhatsApp functionality
  const handleSendWhatsApp = async (quotation) => {
    if (!quotation.customerPhone) {
      showToast('Customer phone number is required to send via WhatsApp', 'error');
      return;
    }

    setSendingWhatsApp(true);
    try {
      const pdfBlob = await generatePDFBlob(quotation);
      if (!pdfBlob) {
        showToast('Failed to generate PDF', 'error');
        return;
      }

      const pdfUrl = URL.createObjectURL(pdfBlob);
      const message = `*Quotation ${quotation.quotationNo} from Your Company Name*

Dear ${quotation.customerName},

Thank you for your interest in our products/services.

*Quotation Details:*
📄 Quotation Number: ${quotation.quotationNo}
📅 Date: ${new Date(quotation.date).toLocaleDateString()}
⏰ Valid Till: ${quotation.validTill ? new Date(quotation.validTill).toLocaleDateString() : 'N/A'}
💰 Grand Total: ₹${Number(quotation.grandTotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}

Please find attached the detailed quotation PDF.

For any clarification, please feel free to contact us.

Best regards,
${quotation.preparedBy?.name || 'Sales Team'}
Your Company Name

_This is an automated message. Please save the attachment for your records._`;

      let phoneNumber = quotation.customerPhone.toString().replace(/\s/g, '');
      if (!phoneNumber.startsWith('+')) {
        phoneNumber = phoneNumber.startsWith('91') ? `+${phoneNumber}` : `+91${phoneNumber}`;
      }

      const encodedMessage = encodeURIComponent(message);
      const whatsappUrl = `https://web.whatsapp.com/send?phone=${phoneNumber}&text=${encodedMessage}`;
      const whatsappWindow = window.open(whatsappUrl, '_blank');

      if (!whatsappWindow) {
        showToast('Please allow popups to open WhatsApp', 'error');
        URL.revokeObjectURL(pdfUrl);
        return;
      }

      setTimeout(() => {
        const downloadLink = document.createElement('a');
        downloadLink.href = pdfUrl;
        downloadLink.download = `${quotation.quotationNo}_${quotation.customerName}.pdf`;

        if (confirm('WhatsApp Web opened. Click OK to download the PDF, then drag and drop it into the WhatsApp chat to send.')) {
          downloadLink.click();
        }
        URL.revokeObjectURL(pdfUrl);
      }, 2000);

      showToast('Opening WhatsApp Web... Please download the PDF and attach it manually', 'success');

      if (quotation.status === 'draft') {
        await updateQuotationStatus({ id: quotation._id, status: 'sent' }).unwrap();
        refetchQuotations();
      }
    } catch (err) {
      console.error('WhatsApp error:', err);
      showToast('Failed to send via WhatsApp', 'error');
    } finally {
      setSendingWhatsApp(false);
    }
  };

  const generatePDF = async (quotation) => {
    try {
      setLoadingPdf(true);
      const element = pdfContentRef.current;
      if (!element) return;

      const opt = {
        margin: [10, 10, 10, 10],
        filename: `${quotation.quotationNo || 'quotation'}_${quotation.customerName}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, letterRendering: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      await html2pdf().set(opt).from(element).save();
      showToast('PDF downloaded successfully');
    } catch (err) {
      console.error(err);
      showToast('PDF generation failed', 'error');
    } finally {
      setLoadingPdf(false);
    }
  };

  const handleViewPDF = (quotation) => {
    setPdfPreview({ show: true, quotation });
  };

  const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

  const counts = {
    all: quotations.length,
    draft: quotations.filter(q => q.status === 'draft').length,
    sent: quotations.filter(q => q.status === 'sent').length,
    accepted: quotations.filter(q => q.status === 'accepted').length,
  };

  // Loading state
  if (loading && quotations.length === 0 && view === 'list') {
    return (
      <div className="qt-page">
        <div className="qt-header">
          <div>
            <h2>Quotation Management</h2>
            <p>Loading quotations...</p>
          </div>
        </div>
        <div className="qt-card">
          <div className="loading-state" style={{ padding: '40px', textAlign: 'center' }}>
            Loading quotation data...
          </div>
        </div>
      </div>
    );
  }

  // FORM VIEW
  if (view === 'form') return (
    <div className="qt-page">
      {toast && <div className={`qt-toast qt-toast-${toast.type}`}>{toast.type === 'success' ? '✓' : '✕'} {toast.msg}</div>}

      <div className="qt-form-header">
        <button className="qt-back-btn" onClick={() => setView('list')}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6" /></svg>
          Back
        </button>
        <h2>{editId ? 'Edit Quotation' : 'New Quotation'}</h2>
        <button className="qt-btn-primary" onClick={handleSave} disabled={saving}>
          {saving && <span className="qt-spinner" />}
          {saving ? 'Saving...' : editId ? '💾 Update' : '✨ Create'}
        </button>
      </div>

      <div className="qt-form-grid">
        {/* LEFT COLUMN */}
        <div className="qt-form-left">
          {/* Quotation Info */}
          <div className="qt-section">
            <h4 className="qt-section-title">📋 Quotation Details</h4>
            <div className="qt-form-row3">
              <div className="qt-fg">
                <label>Series</label>
                <select value={form.series} onChange={e => setForm(f => ({ ...f, series: e.target.value }))}>
                  {SERIES_OPTIONS.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div className="qt-fg">
                <label>Date</label>
                <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
              </div>
              <div className="qt-fg">
                <label>Valid Till</label>
                <input type="date" value={form.validTill} onChange={e => setForm(f => ({ ...f, validTill: e.target.value }))} />
              </div>
            </div>
            <div className="qt-form-row2">
              <div className="qt-fg">
                <label>Status</label>
                <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                  {STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                </select>
              </div>
              <div className="qt-fg">
                <label>Prepared By</label>
                <select value={form.preparedBy} onChange={e => setForm(f => ({ ...f, preparedBy: e.target.value }))}>
                  <option value="">Select executive</option>
                  {executives.map(ex => <option key={ex._id} value={ex._id}>{ex.name}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Customer */}
          <div className="qt-section">
            <h4 className="qt-section-title">👤 Customer / Bill To</h4>
            <div className="qt-form-row2">
              <div className="qt-fg">
                <label>Customer Name <span className="req">*</span></label>
                <select
                  value={form.customerId || ''}
                  onChange={(e) => handleCustomerSelect(e.target.value)}
                >
                  <option value="">Select Customer</option>
                  {customers.map((customer) => (
                    <option key={customer._id} value={customer._id}>
                      {customer.name} - {customer.city}
                    </option>
                  ))}
                </select>
              </div>
              <div className="qt-fg">
                <label>Phone</label>
                <input type="tel" placeholder="Mobile number" value={form.customerPhone}
                  onChange={e => setForm(f => ({ ...f, customerPhone: e.target.value }))} />
              </div>
            </div>
            <div className="qt-form-row2">
              <div className="qt-fg">
                <label>Email</label>
                <input type="email" placeholder="email@example.com" value={form.customerEmail}
                  onChange={e => setForm(f => ({ ...f, customerEmail: e.target.value }))} />
              </div>
              <div className="qt-fg">
                <label>GST Number</label>
                <input type="text" placeholder="GST Number" value={form.customerGST}
                  onChange={e => setForm(f => ({ ...f, customerGST: e.target.value }))} />
              </div>
            </div>
            <div className="qt-fg full">
              <label>Address</label>
              <textarea rows={2} placeholder="Full address" value={form.customerAddress}
                onChange={e => setForm(f => ({ ...f, customerAddress: e.target.value }))} />
            </div>
          </div>

          {/* Terms & Notes */}
          <div className="qt-section">
            <h4 className="qt-section-title">📝 Terms & Notes</h4>
            <div className="qt-fg full">
              <label>Terms & Conditions</label>
              <textarea rows={4} value={form.terms}
                onChange={e => setForm(f => ({ ...f, terms: e.target.value }))} />
            </div>
            <div className="qt-fg full" style={{ marginTop: 12 }}>
              <label>Notes</label>
              <textarea rows={2} placeholder="Additional notes..." value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="qt-form-right">
          {/* Items */}
          <div className="qt-section">
            <div className="qt-section-head">
              <h4 className="qt-section-title">📦 Line Items</h4>
              <button className="qt-add-item-btn" onClick={addItem}>+ Add Item</button>
            </div>

            <div className="qt-items-table-wrap">
              <table className="qt-items-table">
                <thead>
                  <tr>
                    <th style={{ width: 28 }}>#</th>
                    <th>Product / Description</th>
                    <th style={{ width: 70 }}>HSN</th>
                    <th style={{ width: 55 }}>Qty</th>
                    <th style={{ width: 65 }}>Unit</th>
                    <th style={{ width: 160 }}>Price (₹)</th>
                    <th style={{ width: 90 }}>Amount (₹)</th>
                    <th style={{ width: 28 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {form.items.map((item, idx) => (
                    <tr key={idx}>
                      <td className="qt-sr">{idx + 1}</td>
                      <td>
                        <select
                          className="qt-item-select"
                          value={item.productId || ''}
                          onChange={(e) => handleProductSelect(idx, e.target.value)}
                        >
                          <option value="">-- Select Product (Auto-fills details) --</option>
                          {products.map((p) => (
                            <option key={p._id} value={p._id}>
                              {p.name} {p.code && `(${p.code})`} - ₹{getMasterPrice(p._id).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </option>
                          ))}
                        </select>
                        <div style={{ marginTop: '8px', borderTop: '1px dashed #e5e7eb', paddingTop: '8px' }}>
                          <input
                            className="qt-item-input"
                            type="text"
                            placeholder="Or type product description manually"
                            value={item.description}
                            onChange={e => setItem(idx, 'description', e.target.value)}
                          />
                        </div>
                      </td>
                      <td>
                        <input className="qt-item-input center" type="text" placeholder="HSN"
                          value={item.hsnCode} onChange={e => setItem(idx, 'hsnCode', e.target.value)} />
                      </td>
                      <td>
                        <input className="qt-item-input center" type="number" min="0" step="1" placeholder="Qty"
                          value={item.quantity} onChange={e => setItem(idx, 'quantity', e.target.value)} />
                      </td>
                      <td>
                        <select className="qt-item-select"
                          value={item.unit} onChange={e => setItem(idx, 'unit', e.target.value)}>
                          {UNITS.map(u => <option key={u}>{u}</option>)}
                        </select>
                      </td>
                      <td className="qt-price-cell">
                        {editingPriceFor === idx ? (
                          <div className="qt-price-edit-popup">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              defaultValue={item.rate}
                              autoFocus
                              className="qt-price-edit-input"
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  handlePriceEdit(idx, parseFloat(e.target.value));
                                }
                              }}
                              id={`price-input-${idx}`}
                            />
                            <div className="qt-price-edit-actions">
                              <button
                                className="qt-price-edit-save"
                                onClick={() => {
                                  const input = document.getElementById(`price-input-${idx}`);
                                  handlePriceEdit(idx, parseFloat(input.value));
                                }}
                              >
                                ✓ Save
                              </button>
                              <button
                                className="qt-price-edit-cancel"
                                onClick={() => setEditingPriceFor(null)}
                              >
                                ✕ Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="qt-price-display">
                            <div className="qt-price-main">
                              <strong className={item.isPriceEdited ? 'qt-price-edited' : 'qt-price-master'}>
                                {fmt(item.rate)}
                              </strong>
                              {item.productId && (
                                <span className="qt-price-badge">
                                  {item.isPriceEdited ? '✏️ Edited' : '📦 Master'}
                                </span>
                              )}
                              {!item.productId && (
                                <span className="qt-price-badge manual">✏️ Manual</span>
                              )}
                            </div>
                            <div className="qt-price-actions">
                              <button
                                className="qt-price-edit-btn"
                                onClick={() => setEditingPriceFor(idx)}
                                title="Edit Price"
                              >
                                ✏️ Edit
                              </button>
                              {item.productId && item.isPriceEdited && (
                                <button
                                  className="qt-price-reset-btn"
                                  onClick={() => handleResetToMasterPrice(idx)}
                                  title="Reset to Master Price"
                                >
                                  🔄 Reset
                                </button>
                              )}
                            </div>
                            {item.productId && getMasterPrice(item.productId) > 0 && item.rate !== getMasterPrice(item.productId) && (
                              <div className="qt-price-info">
                                <small>Master: {fmt(getMasterPrice(item.productId))}</small>
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="qt-item-amount">{fmt(item.quantity * item.rate)}</td>
                      <td>
                        {form.items.length > 1 && (
                          <button className="qt-remove-item" onClick={() => removeItem(idx)}>✕</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Tax & Discount */}
          <div className="qt-section">
            <h4 className="qt-section-title">🧮 Tax & Discount</h4>
            <div className="qt-form-row2">
              <div className="qt-fg">
                <label>Discount Type</label>
                <select value={form.discountType} onChange={e => setForm(f => ({ ...f, discountType: e.target.value }))}>
                  <option value="percent">Percentage (%)</option>
                  <option value="fixed">Fixed Amount (₹)</option>
                </select>
              </div>
              <div className="qt-fg">
                <label>Discount Value</label>
                <input type="number" min="0" placeholder="0"
                  value={form.discountValue}
                  onChange={e => setForm(f => ({ ...f, discountValue: e.target.value }))} />
              </div>
            </div>
            <div className="qt-form-row2">
              <div className="qt-fg">
                <label>Tax Type</label>
                <select value={form.taxType} onChange={e => setForm(f => ({ ...f, taxType: e.target.value }))}>
                  {TAX_TYPES.map(t => <option key={t.v} value={t.v}>{t.l}</option>)}
                </select>
              </div>
              <div className="qt-fg">
                <label>Tax Rate (%)</label>
                <select value={form.taxRate} onChange={e => setForm(f => ({ ...f, taxRate: e.target.value }))}
                  disabled={form.taxType === 'none'}>
                  {TAX_RATES.map(r => <option key={r} value={r}>{r}%</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="qt-summary">
            <div className="qt-summary-row">
              <span>Subtotal</span><span>{fmt(totals.subtotal)}</span>
            </div>
            {totals.discountAmount > 0 && (
              <div className="qt-summary-row discount">
                <span>Discount</span><span>- {fmt(totals.discountAmount)}</span>
              </div>
            )}
            {form.taxType !== 'none' && totals.taxAmount > 0 && (
              <div className="qt-summary-row">
                <span>{form.taxType.toUpperCase()} ({form.taxRate}%)</span>
                <span>{fmt(totals.taxAmount)}</span>
              </div>
            )}
            <div className="qt-summary-total">
              <span>Grand Total</span><span>{fmt(totals.grandTotal)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom action */}
      <div className="qt-form-footer">
        <button className="qt-btn-ghost" onClick={() => setView('list')}>Cancel</button>
        <button className="qt-btn-primary" onClick={handleSave} disabled={saving}>
          {saving && <span className="qt-spinner" />}
          {saving ? 'Saving...' : editId ? '💾 Update Quotation' : '✨ Create Quotation'}
        </button>
      </div>
    </div>
  );

  // LIST VIEW
  return (
    <>
      <div className="qt-page">
        {toast && <div className={`qt-toast qt-toast-${toast.type}`}>{toast.type === 'success' ? '✓' : '✕'} {toast.msg}</div>}

        <div className="qt-header">
          <div>
            <h2>Quotation Management</h2>
            <p>Create, manage and download professional quotations</p>
          </div>
          <button className="qt-btn-primary" onClick={handleNew}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
            New Quotation
          </button>
        </div>

        <div className="qt-stats">
          {[
            { label: 'Total', value: counts.all, color: '#6366f1', icon: '📋' },
            { label: 'Draft', value: counts.draft, color: '#6b7280', icon: '✏️' },
            { label: 'Sent', value: counts.sent, color: '#2563eb', icon: '📤' },
            { label: 'Accepted', value: counts.accepted, color: '#16a34a', icon: '✅' },
            { label: 'Total Value', value: `₹${Number(quotations.reduce((s, q) => s + (q.grandTotal || 0), 0)).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`, color: '#f59e0b', icon: '💰' },
          ].map((s, i) => (
            <div key={i} className="qt-stat-card" style={{ borderLeftColor: s.color }}>
              <div className="qt-stat-icon">{s.icon}</div>
              <div>
                <div className="qt-stat-num" style={{ color: s.color }}>{s.value}</div>
                <div className="qt-stat-label">{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="qt-filters">
          <div className="qt-search">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
            <input type="text" placeholder="Search by number, customer..."
              value={search} onChange={e => setSearch(e.target.value)} />
            {search && <button className="qt-clear" onClick={() => setSearch('')}>✕</button>}
          </div>
          <select className="qt-filter-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">All Statuses</option>
            {STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
          </select>
        </div>

        <div className="qt-card">
          <div className="qt-card-head">
            <h3>Quotations ({quotations.length})</h3>
            {loading && <span className="qt-loading">Loading...</span>}
          </div>

          {quotations.length === 0 && !loading ? (
            <div className="qt-empty">
              <div className="qt-empty-icon">📋</div>
              <p>No quotations yet. Create your first one.</p>
              <button className="qt-btn-primary" onClick={handleNew}>New Quotation</button>
            </div>
          ) : (
            <div className="qt-table-wrap">
              <table className="qt-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Quotation No.</th>
                    <th>Customer</th>
                    <th>Date</th>
                    <th>Valid Till</th>
                    <th>Grand Total</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {quotations.map((q, i) => (
                    <tr key={q._id}>
                      <td className="qt-num">{i + 1}</td>
                      <td className="qt-no">{q.quotationNo}</td>
                      <td className="qt-customer">
                        <span className="qt-cust-name">{q.customerName}</span>
                        {q.customerPhone && <span className="qt-cust-ph">{q.customerPhone}</span>}
                      </td>
                      <td>{fmtDate(q.date)}</td>
                      <td>{fmtDate(q.validTill)}</td>
                      <td className="qt-total">{fmt(q.grandTotal)}</td>
                      <td>
                        <select
                          className="qt-status-select"
                          value={q.status}
                          style={{ background: STATUS_STYLE[q.status]?.bg, color: STATUS_STYLE[q.status]?.text }}
                          onChange={e => handleQuickStatus(q._id, e.target.value)}>
                          {STATUSES.map(s => (
                            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                          ))}
                        </select>
                      </td>
                      <td >

                        <div className="qt-actions">


                          <button
                            className="qt-action email"
                            onClick={() => handleSendEmail(q)}
                            title="Send Email"
                            disabled={sendingEmail}
                            style={{
                              background: '#34a853',
                              color: 'white'
                            }}
                          >

                            <FaEnvelope size={15} />

                            {/* {sendingEmail ? ' Sending...' : ' Email'} */}

                          </button>

                          <button
                            className="qt-action whatsapp"
                            onClick={() => handleSendWhatsApp(q)}
                            title="Send WhatsApp"
                            disabled={sendingWhatsApp}
                            style={{
                              background: '#25D366',
                              color: 'white'
                            }}
                          >

                            <FaWhatsapp size={16} />

                            {/* {sendingWhatsApp ? ' Sending...' : ' WhatsApp'} */}

                          </button>


                          <button
                            className="qt-action pdf"
                            onClick={() => handleViewPDF(q)}
                            title="View & Download PDF">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                              <polyline points="14 2 14 8 20 8" />
                              <path d="M9 13h6M9 17h4" />
                              <path d="M8 10h.01" />
                            </svg>
                          </button>
                          <button className="qt-action edit" onClick={() => handleEdit(q)} title="Edit">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                          </button>
                          <button className="qt-action delete" onClick={() => handleDelete(q._id)} title="Delete">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" /></svg>
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
      </div>

      {/* PDF Preview Modal */}
      {pdfPreview.show && pdfPreview.quotation && (
        <div className="pdf-preview-overlay" onClick={() => setPdfPreview({ show: false, quotation: null })}>
          <div className="pdf-preview-modal" onClick={e => e.stopPropagation()}>
            <div className="pdf-preview-header">
              <h3>
                {pdfPreview.quotation.quotationNo} - {pdfPreview.quotation.customerName}
              </h3>
              <button className="pdf-preview-close" onClick={() => setPdfPreview({ show: false, quotation: null })}>×</button>
            </div>

            <div className="pdf-preview-content" ref={pdfContentRef}>
              <QuotationPdfs quotation={pdfPreview.quotation} />
            </div>

            <div className="pdf-preview-footer">
              <button className="pdf-preview-btn primary" onClick={() => generatePDF(pdfPreview.quotation)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                {loadingPdf ? "Loading..." : 'Download PDF'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmationDialog
        isOpen={confirmOpen}
        title="Delete Quotation"
        message="Are you sure you want to delete this quotation? This action cannot be undone."
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
    </>
  );
}