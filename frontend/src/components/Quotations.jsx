import { useState, useRef } from 'react';
import {
  useGetQuotationsQuery,
  useCreateQuotationMutation,
  useUpdateQuotationMutation,
  useDeleteQuotationMutation,
  useUpdateQuotationStatusMutation,
  useGetExecutivesQuery,
  useGetCustomersQuery,
  useGetProductsQuery,
  useSendQuotationEmailMutation,
  useSendQuotationWhatsAppMutation
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
  type: '',
  category1: '',
  category2: '',
  category3: '',
  brandName: '',
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
  isPriceEdited: false
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
  const [editingPriceFor, setEditingPriceFor] = useState(null);

  const pdfContentRef = useRef();

  const queryParams = {};
  if (search) queryParams.search = search;
  if (filterStatus) queryParams.status = filterStatus;

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

  const [sendQuotationEmail] = useSendQuotationEmailMutation();
  const [sendQuotationWhatsApp] = useSendQuotationWhatsAppMutation();

  const quotations = quotationsData;
  const executives = executivesData;
  const customers = customersData || [];
  const products = productsData || [];

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3200);
  };

  const getMasterPrice = (productId) => {
    const product = products.find(p => p._id === productId);
    if (!product) return 0;

    if (product.type === 'RM' && product.rmDetails) {
      const rmPrice = product.rmDetails.masterPrice;
      if (rmPrice && !isNaN(Number(rmPrice)) && Number(rmPrice) > 0) {
        return Number(rmPrice);
      }
    }

    if (product.type === 'FM' && product.fmDetails) {
      const fmPrice = product.fmDetails.fgCost;
      if (fmPrice && !isNaN(Number(fmPrice)) && Number(fmPrice) > 0) {
        return Number(fmPrice);
      }
    }

    const mainPrice = product.price;
    if (mainPrice && !isNaN(Number(mainPrice)) && Number(mainPrice) > 0) {
      return Number(mainPrice);
    }

    return 0;
  };

  const getProductCategories = (product) => {
    const categories = [];

    if (product.type === 'FM' && product.fmDetails) {
      const fm = product.fmDetails;
      if (fm.category1) categories.push({ label: 'Series', value: fm.category1 });
      if (fm.category2) categories.push({ label: 'Type', value: fm.category2 });
      if (fm.brandName) categories.push({ label: 'Brand', value: fm.brandName });
    }

    if (product.type === 'RM' && product.rmDetails) {
      const rm = product.rmDetails;
      if (rm.category1) categories.push({ label: 'Category 1', value: rm.category1 });
      if (rm.category2) categories.push({ label: 'Category 2', value: rm.category2 });
      if (rm.category3) categories.push({ label: 'Category 3', value: rm.category3 });
    }

    return categories;
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
        updated.isPriceEdited = true;
      }
      if (field === 'quantity' || field === 'rate') {
        updated.amount = (Number(updated.quantity) || 0) * (Number(updated.rate) || 0);
      }
      return updated;
    });
    setForm(f => ({ ...f, items }));
  };

  const addItem = () => {

    const lastItem =
      form.items[form.items.length - 1];

    const isIncomplete =

      (
        !lastItem.productId &&
        !lastItem.description?.trim()
      ) ||

      !lastItem.quantity ||

      !lastItem.rate;

    if (isIncomplete) {

      showToast(
        'Please complete current item before adding new one',
        'warning'
      );

      return;

    }

    setForm(f => ({

      ...f,

      items: [
        ...f.items,
        { ...emptyItem }
      ]

    }));

  };
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
    const categories = getProductCategories(product);

    let enhancedDescription = product.name || '';
    if (categories.length > 0) {
      const catStr = categories.map(c => `${c.label}: ${c.value}`).join(' | ');
      enhancedDescription += ` (${catStr})`;
    }

    items[index] = {
      ...items[index],
      productId: product._id,
      description: enhancedDescription,
      productCode: product.code || product.productCode || '',
      hsnCode: product.hsn || product.hsnCode || '',
      category: product.category || '',
      type: product.type || '',
      category1: product.fmDetails?.category1 || product.rmDetails?.category1 || '',
      category2: product.fmDetails?.category2 || product.rmDetails?.category2 || '',
      category3: product.fmDetails?.category3 || product.rmDetails?.category3 || '',
      brandName: product.fmDetails?.brandName || '',
      quantity: currentItem.quantity || 1,
      rate: currentItem.isPriceEdited ? currentItem.rate : masterPrice,
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
      const priceSource = product.type === 'RM' ? 'RM Master Price' : (product.type === 'FM' ? 'FG Cost' : 'Product Price');
      showToast(`✓ Product added with ${priceSource}: ₹${masterPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 'success');
    }
  };

  const handlePriceEdit = (idx, newPrice) => {
    if (newPrice !== null && !isNaN(newPrice) && newPrice >= 0) {
      setItem(idx, 'rate', parseFloat(newPrice));
      showToast(`Price updated to ₹${parseFloat(newPrice).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 'success');
      setEditingPriceFor(null);
    }
  };

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
    if (!form.customerName) {
      return showToast('Customer name is required', 'error');
    }

    if (!form.items?.length) {
      return showToast('Add at least one item', 'error');
    }

    const hasValidItem = form.items.some(
      (item) => item.description || item.productId
    );

    if (!hasValidItem) {
      return showToast('Add at least one item', 'error');
    }

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

  const handleSendEmail = async (quotation) => {
    setSendingEmail(true);
    try {
      await sendQuotationEmail({ id: quotation._id }).unwrap();
      showToast('Email sent successfully');
    } catch (err) {
      console.error('Email error:', err);
      showToast('Failed to send email', 'error');
    } finally {
      setSendingEmail(false);
    }
  }


  const handleSendWhatsApp = async (quotation) => {
    console.log(quotation);
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
        <div className="qt-form-left">
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

        <div className="qt-form-right">
          {/* Items Section - Improved UI */}
          <div className="qt-section">
            <div className="qt-section-head">
              <h4 className="qt-section-title">
                <span>📦</span> Line Items
              </h4>
              <button className="qt-add-item-btn" onClick={addItem}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Add Item
              </button>
            </div>

            <div className="qt-items-table-wrap">
              <table className="qt-items-table">
                <thead>
                  <tr>
                    <th style={{ width: 40 }}>#</th>
                    <th>Product Details</th>
                    <th style={{ width: 80 }}>HSN</th>
                    <th style={{ width: 70 }}>Qty</th>
                    <th style={{ width: 80 }}>Unit</th>
                    <th style={{ width: 150 }}>Price (₹)</th>
                    <th style={{ width: 100 }}>Amount (₹)</th>
                    <th style={{ width: 40 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {form.items.map((item, idx) => {
                    const productInfo = item.productId ? products.find(p => p._id === item.productId) : null;
                    const categories = productInfo ? getProductCategories(productInfo) : [];

                    return (
                      <tr key={idx} className="qt-item-row">
                        <td className="qt-sr">{idx + 1}</td>
                        <td className="qt-product-cell">
                          <select
                            className="qt-product-select"
                            value={item.productId || ''}
                            onChange={(e) => handleProductSelect(idx, e.target.value)}
                          >
                            {console.log(products)}
                            <option value="">-- Select Product --</option>
                            {products
                              .filter((p) => {

                                // ALLOW CURRENT SELECTED PRODUCT

                                if (item.productId === p._id) {
                                  return true;
                                }

                                // PREVENT DUPLICATE PRODUCT SELECTION

                                return !form.items.some(
                                  (selectedItem) =>
                                    selectedItem.productId === p._id
                                );

                              })
                              .map((p) => {
                                let displayPrice = 0;
                                let priceSource = '';

                                if (p.type === 'RM' && p.rmDetails?.masterPrice) {
                                  displayPrice = p.rmDetails.masterPrice;
                                  priceSource = 'RM';
                                } else if (p.type === 'FM' && p.fmDetails?.fgCost) {
                                  displayPrice = p.fmDetails.fgCost;
                                  priceSource = 'FG';
                                } else if (p.price) {
                                  displayPrice = p.price;
                                  priceSource = '';
                                }

                                return (
                                  <option key={p._id} value={p._id}>
                                    {p.name} {p.code && `(${p.code})`}
                                    {displayPrice > 0 ? ` - ₹${displayPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : ' - Price N/A'}
                                    {priceSource && ` [${priceSource}]`}
                                  </option>
                                );
                              })}
                          </select>

                          {/* Category Tags */}
                          {console.log(categories)}
                          {categories.length > 0 && (
                            <div className="qt-category-tags">

                              <span className="qt-category-tag">
                                {item.type}
                              </span>
                              {categories.map((cat, catIdx) => (
                                <span key={catIdx} className="qt-category-tag">
                                  {cat.label}: {cat.value}
                                </span>
                              ))}
                            </div>
                          )}

                          <div className="qt-manual-desc">
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
                          <input
                            className="qt-item-input center"
                            type="text"
                            placeholder="HSN"
                            value={item.hsnCode}
                            onChange={e => setItem(idx, 'hsnCode', e.target.value)}
                          />
                        </td>
                        <td>
                          <input
                            className="qt-item-input center qty-input"
                            type="number"
                            min="0"
                            step="1"
                            placeholder="Qty"
                            value={item.quantity}
                            onChange={e => setItem(idx, 'quantity', e.target.value)}
                          />
                        </td>
                        <td>
                          <select
                            className="qt-item-select"
                            value={item.unit}
                            onChange={e => setItem(idx, 'unit', e.target.value)}>
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
                              <div className="qt-price-input-wrapper">
                                <span className="qt-currency-symbol">₹</span>
                                <input
                                  type="number"
                                  className="qt-price-input-field"
                                  value={item.rate}
                                  onChange={(e) => handlePriceEdit(idx, parseFloat(e.target.value))}
                                  step="0.01"
                                  min="0"
                                  placeholder="0.00"
                                />
                              </div>
                              {item.productId && (
                                <div className="qt-price-meta">
                                  <span className={`qt-price-badge ${item.isPriceEdited ? 'edited' : 'master'}`}>
                                    {item.isPriceEdited ? '✏️ Custom' : '📦 Master'}
                                  </span>
                                  {!item.isPriceEdited && getMasterPrice(item.productId) > 0 && (
                                    <button
                                      className="qt-price-edit-icon"
                                      onClick={() => setEditingPriceFor(idx)}
                                      title="Edit Price"
                                    >
                                      ✏️
                                    </button>
                                  )}
                                  {item.isPriceEdited && (
                                    <button
                                      className="qt-price-reset-icon"
                                      onClick={() => handleResetToMasterPrice(idx)}
                                      title="Reset to Master Price"
                                    >
                                      🔄
                                    </button>
                                  )}
                                </div>
                              )}
                              {!item.productId && (
                                <div className="qt-price-meta">
                                  <span className="qt-price-badge manual">✏️ Manual Entry</span>
                                </div>
                              )}
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
                            <button className="qt-remove-item" onClick={() => removeItem(idx)} title="Remove item">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                              </svg>
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="qt-section">
            <h4 className="qt-section-title">🧮 Tax & Discount</h4>
            <div className="qt-form-row2">
              <div className="qt-fg">
                <label>Discount Type</label>
                <div className="qt-discount-toggle">
                  <button
                    type="button"
                    className={`qt-toggle-btn ${form.discountType === 'percent' ? 'active' : ''}`}
                    onClick={() => setForm(f => ({ ...f, discountType: 'percent' }))}
                  >
                    Percentage (%)
                  </button>
                  <button
                    type="button"
                    className={`qt-toggle-btn ${form.discountType === 'fixed' ? 'active' : ''}`}
                    onClick={() => setForm(f => ({ ...f, discountType: 'fixed' }))}
                  >
                    Fixed Amount (₹)
                  </button>
                </div>
              </div>
              <div className="qt-fg">
                <label>Discount Value</label>
                <div className="qt-discount-input">
                  <span className="qt-discount-symbol">
                    {form.discountType === 'percent' ? '%' : '₹'}
                  </span>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={form.discountValue}
                    onChange={e => setForm(f => ({ ...f, discountValue: e.target.value }))}
                  />
                </div>
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
                <select
                  value={form.taxRate}
                  onChange={e => setForm(f => ({ ...f, taxRate: e.target.value }))}
                  disabled={form.taxType === 'none'}
                  className={form.taxType === 'none' ? 'qt-disabled-select' : ''}
                >
                  {TAX_RATES.map(r => <option key={r} value={r}>{r}%</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="qt-summary">
            <div className="qt-summary-row">
              <span>Subtotal</span>
              <span>{fmt(totals.subtotal)}</span>
            </div>
            {totals.discountAmount > 0 && (
              <div className="qt-summary-row discount">
                <span>Discount</span>
                <span>- {fmt(totals.discountAmount)}</span>
              </div>
            )}
            {form.taxType !== 'none' && totals.taxAmount > 0 && (
              <div className="qt-summary-row">
                <span>{form.taxType.toUpperCase()} ({form.taxRate}%)</span>
                <span>{fmt(totals.taxAmount)}</span>
              </div>
            )}
            <div className="qt-summary-total">
              <span>Grand Total</span>
              <span>{fmt(totals.grandTotal)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="qt-form-footer">
        <button className="qt-btn-ghost" onClick={() => setView('list')}>Cancel</button>
        <button className="qt-btn-primary" onClick={handleSave} disabled={saving}>
          {saving && <span className="qt-spinner" />}
          {saving ? 'Saving...' : editId ? '💾 Update Quotation' : '✨ Create Quotation'}
        </button>
      </div>
    </div>
  );

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
                      <td>
                        <div className="qt-actions">
                          <button
                            className="qt-action email"
                            onClick={() => handleSendEmail(q)}
                            title="Send Email"
                            disabled={sendingEmail}
                            style={{ background: '#34a853', color: 'white' }}
                          >
                            <FaEnvelope size={15} />
                          </button>
                          <button
                            className="qt-action whatsapp"
                            onClick={() => handleSendWhatsApp(q)}
                            title="Send WhatsApp"
                            disabled={sendingWhatsApp}
                            style={{ background: '#25D366', color: 'white' }}
                          >
                            <FaWhatsapp size={16} />
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