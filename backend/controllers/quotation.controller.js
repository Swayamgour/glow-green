const Quotation = require('../models/Quotation.model');
const { generateQuotationPDF } = require('../utils/quotationPdfUtils');
const path = require('path');
const fs   = require('fs');
const { v4: uuidv4 } = require('uuid');

const quotationsDir = path.join(process.cwd(), 'quotations');
if (!fs.existsSync(quotationsDir)) fs.mkdirSync(quotationsDir, { recursive: true });

// ── compute totals helper ──────────────────────────────────
const computeTotals = (items = [], discountType, discountValue, taxType, taxRate) => {
  const subtotal = items.reduce((s, i) => s + (Number(i.amount) || 0), 0);

  let discountAmount = 0;
  if (discountType === 'percent') discountAmount = (subtotal * Number(discountValue || 0)) / 100;
  else discountAmount = Number(discountValue || 0);

  const afterDiscount = subtotal - discountAmount;
  const taxAmount     = taxType !== 'none' ? (afterDiscount * Number(taxRate || 0)) / 100 : 0;
  const grandTotal    = afterDiscount + taxAmount;

  return { subtotal, discountAmount, taxAmount, grandTotal };
};

// GET all quotations
const getQuotations = async (req, res) => {
  try {
    const { status, search } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { quotationNo:   { $regex: search, $options: 'i' } },
        { customerName:  { $regex: search, $options: 'i' } },
        { customerPhone: { $regex: search, $options: 'i' } },
      ];
    }
    const quotations = await Quotation.find(filter)
      .populate('preparedBy', 'name')
      .sort({ createdAt: -1 });
    return res.json({ success: true, data: quotations });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// GET single
const getQuotation = async (req, res) => {
  try {
    const q = await Quotation.findById(req.params.id).populate('preparedBy', 'name');
    if (!q) return res.status(404).json({ success: false, message: 'Not found' });
    return res.json({ success: true, data: q });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// POST create + generate PDF
const createQuotation = async (req, res) => {
  try {
    const body = req.body;
    if (!body.preparedBy) body.preparedBy = null;

    // Recalculate amounts per item
    const items = (body.items || []).map((item, i) => ({
      ...item,
      srNo:   i + 1,
      amount: Number(item.quantity || 0) * Number(item.rate || 0),
    }));

    const totals = computeTotals(items, body.discountType, body.discountValue, body.taxType, body.taxRate);

    const quotation = await Quotation.create({
      ...body,
      items,
      ...totals,
    });

    // Generate PDF
    const fileName = `QT_${quotation.quotationNo.replace(/[^a-zA-Z0-9]/g, '_')}_${uuidv4().slice(0,8)}.pdf`;
    const filePath = path.join(quotationsDir, fileName);
    await generateQuotationPDF(quotation.toObject(), filePath);
    quotation.pdfPath = fileName;
    await quotation.save();

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    return res.status(201).json({
      success: true,
      data: quotation,
      pdfUrl: `${baseUrl}/quotations/${fileName}`,
    });
  } catch (err) {
    console.error('Create quotation error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// PUT update + regenerate PDF
const updateQuotation = async (req, res) => {
  try {
    const body = req.body;
    if (!body.preparedBy) body.preparedBy = null;
    const items = (body.items || []).map((item, i) => ({
      ...item,
      srNo:   i + 1,
      amount: Number(item.quantity || 0) * Number(item.rate || 0),
    }));
    const totals = computeTotals(items, body.discountType, body.discountValue, body.taxType, body.taxRate);

    const existing = await Quotation.findById(req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: 'Not found' });

    // Delete old PDF
    if (existing.pdfPath) {
      const oldPath = path.join(quotationsDir, existing.pdfPath);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    Object.assign(existing, { ...body, items, ...totals });
    await existing.save();

    // Regenerate PDF
    const fileName = `QT_${existing.quotationNo.replace(/[^a-zA-Z0-9]/g, '_')}_${uuidv4().slice(0,8)}.pdf`;
    const filePath = path.join(quotationsDir, fileName);
    await generateQuotationPDF(existing.toObject(), filePath);
    existing.pdfPath = fileName;
    await existing.save();

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    return res.json({
      success: true,
      data: existing,
      pdfUrl: `${baseUrl}/quotations/${fileName}`,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH status
const updateStatus = async (req, res) => {
  try {
    const q = await Quotation.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
    return res.json({ success: true, data: q });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE
const deleteQuotation = async (req, res) => {
  try {
    const q = await Quotation.findByIdAndDelete(req.params.id);
    if (q?.pdfPath) {
      const p = path.join(quotationsDir, q.pdfPath);
      if (fs.existsSync(p)) fs.unlinkSync(p);
    }
    return res.json({ success: true, message: 'Deleted' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// GET re-download PDF
const downloadPDF = async (req, res) => {
  try {
    const q = await Quotation.findById(req.params.id);
    if (!q) return res.status(404).json({ success: false, message: 'Not found' });

    let fileName = q.pdfPath;
    let filePath = path.join(quotationsDir, fileName);

    // Regenerate if missing
    if (!fileName || !fs.existsSync(filePath)) {
      fileName = `QT_${q.quotationNo.replace(/[^a-zA-Z0-9]/g, '_')}_${uuidv4().slice(0,8)}.pdf`;
      filePath  = path.join(quotationsDir, fileName);
      await generateQuotationPDF(q.toObject(), filePath);
      q.pdfPath = fileName;
      await q.save();
    }

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    return res.json({ success: true, pdfUrl: `${baseUrl}/quotations/${fileName}` });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getQuotations, getQuotation, createQuotation, updateQuotation, updateStatus, deleteQuotation, downloadPDF };