const ExcelJS = require('exceljs');
const Lead = require('../models/Lead.model');
const Customer = require('../models/Customer.model');
const Product = require('../models/Product.model');
const Quotation = require('../models/Quotation.model');
const Executive = require('../models/Executive.model');


// ================= COMMON DATE FILTER =================
const applyDateFilter = (filter, from, to, field = "createdAt") => {
  if (from || to) {
    filter[field] = {};

    if (from) filter[field].$gte = new Date(from);

    if (to) {
      const end = new Date(to);
      end.setHours(23, 59, 59, 999);
      filter[field].$lte = end;
    }
  }
};


// ================= LEADS =================
const exportLeads = async (req, res) => {
  try {
    const { status, category, assignedTo, from, to } = req.query;

    const filter = {};

    if (status) filter.leadStatus = { $in: status.split(',') };
    if (category) filter.category = category;
    if (assignedTo) filter.assignedTo = assignedTo;

    applyDateFilter(filter, from, to);

    const leads = await Lead.find(filter)
      .populate('assignedTo', 'name')
      .sort({ createdAt: -1 });

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Leads');

    ws.columns = [
      { header: '#', key: 'sr', width: 5 },
      { header: 'Name', key: 'name', width: 25 },
      { header: 'Phone', key: 'phone', width: 15 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Created', key: 'created', width: 20 },
    ];

    leads.forEach((l, i) => {
      ws.addRow({
        sr: i + 1,
        name: l.leadName,
        phone: l.phone,
        status: l.leadStatus,
        created: new Date(l.createdAt).toLocaleDateString(),
      });
    });

    const buffer = await wb.xlsx.writeBuffer();

    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename=leads.xlsx',
    });

    res.send(buffer);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// ================= CUSTOMERS =================
const exportCustomers = async (req, res) => {
  try {
    const { status, category, assignedTo, from, to } = req.query;

    const filter = {};

    if (status) filter.status = status;
    if (category) filter.category = category;
    if (assignedTo) filter.assignedTo = assignedTo;

    applyDateFilter(filter, from, to);

    const customers = await Customer.find(filter)
      .populate('assignedTo', 'name')
      .sort({ createdAt: -1 });

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Customers');

    ws.columns = [
      { header: '#', key: 'sr', width: 5 },
      { header: 'Name', key: 'name', width: 25 },
      { header: 'Phone', key: 'phone', width: 15 },
      { header: 'Category', key: 'category', width: 15 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Created', key: 'created', width: 20 },
    ];

    customers.forEach((c, i) => {
      ws.addRow({
        sr: i + 1,
        name: c.name,
        phone: c.phone,
        category: c.category,
        status: c.status,
        created: new Date(c.createdAt).toLocaleDateString(),
      });
    });

    const buffer = await wb.xlsx.writeBuffer();

    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename=customers.xlsx',
    });

    res.send(buffer);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// ================= PRODUCTS =================
const exportProducts = async (req, res) => {
  try {
    const { type, status, from, to } = req.query;

    const filter = {};

    if (type) filter.type = type;
    if (status) filter.status = status;

    applyDateFilter(filter, from, to); // ✅ FIXED

    const products = await Product.find(filter).sort({ createdAt: -1 });

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Products');

    ws.columns = [
      { header: '#', key: 'sr', width: 5 },
      { header: 'Name', key: 'name', width: 25 },
      { header: 'Type', key: 'type', width: 10 },
      { header: 'Price', key: 'price', width: 15 },
      { header: 'Stock', key: 'stock', width: 10 },
      { header: 'Created', key: 'created', width: 20 },
    ];

    products.forEach((p, i) => {
      ws.addRow({
        sr: i + 1,
        name: p.name,
        type: p.type,
        price: p.price,
        stock: p.stock,
        created: new Date(p.createdAt).toLocaleDateString(),
      });
    });

    const buffer = await wb.xlsx.writeBuffer();

    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename=products.xlsx',
    });

    res.send(buffer);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// ================= QUOTATIONS =================
const exportQuotations = async (req, res) => {
  try {
    const { status, from, to } = req.query;

    const filter = {};

    if (status) filter.status = status;

    applyDateFilter(filter, from, to, "date");

    const quotations = await Quotation.find(filter).sort({ date: -1 });

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Quotations');

    ws.columns = [
      { header: '#', key: 'sr', width: 5 },
      { header: 'Customer', key: 'customer', width: 25 },
      { header: 'Total', key: 'total', width: 15 },
      { header: 'Date', key: 'date', width: 20 },
    ];

    quotations.forEach((q, i) => {
      ws.addRow({
        sr: i + 1,
        customer: q.customerName,
        total: q.grandTotal,
        date: new Date(q.date).toLocaleDateString(),
      });
    });

    const buffer = await wb.xlsx.writeBuffer();

    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename=quotations.xlsx',
    });

    res.send(buffer);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// ================= MASTER REPORT =================
const exportMaster = async (req, res) => {
  try {
    const { from, to } = req.query;

    const dateFilter = {};
    applyDateFilter(dateFilter, from, to);

    const [leads, customers, products, quotations] = await Promise.all([
      Lead.find(dateFilter),
      Customer.find(dateFilter),
      Product.find(dateFilter), // ✅ FIXED
      Quotation.find(dateFilter),
    ]);

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Dashboard');

    ws.addRow(['MASTER REPORT']);
    ws.addRow([`From: ${from || 'All'} To: ${to || 'All'}`]);
    ws.addRow([]);

    ws.addRow(['Leads', leads.length]);
    ws.addRow(['Customers', customers.length]);
    ws.addRow(['Products', products.length]);
    ws.addRow(['Quotations', quotations.length]);

    const buffer = await wb.xlsx.writeBuffer();

    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename=master.xlsx',
    });

    res.send(buffer);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


module.exports = {
  exportLeads,
  exportCustomers,
  exportProducts,
  exportQuotations,
  exportMaster
};