const ExcelJS   = require('exceljs');
const Lead      = require('../models/Lead.model');
const Customer  = require('../models/Customer.model');
const Product   = require('../models/Product.model');
const Quotation = require('../models/Quotation.model');
const Executive = require('../models/Executive.model');

// ── Shared style helpers ───────────────────────────────────
const BRAND   = '1A3C6E';
const ACCENT  = '2563EB';
const SUCCESS = '166534';
const WARN    = '92400E';
const DANGER  = '991B1B';
const LIGHT   = 'F0F4FF';
const ALT     = 'F7F9FF';
const WHITE   = 'FFFFFF';
const GREY    = 'F3F4F6';

const hdrFill  = (hex) => ({ type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + hex } });
const font     = (bold = false, sz = 10, color = '111827') => ({ name: 'Arial', bold, size: sz, color: { argb: 'FF' + color } });
const border   = () => ({
  top:    { style: 'thin', color: { argb: 'FFE5E7EB' } },
  bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
  left:   { style: 'thin', color: { argb: 'FFE5E7EB' } },
  right:  { style: 'thin', color: { argb: 'FFE5E7EB' } },
});
const align = (h = 'left', v = 'middle', wrap = false) => ({ horizontal: h, vertical: v, wrapText: wrap });

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN') : '';
const fmtMoney = (n) => n != null ? Number(n).toFixed(2) : '';

const applyHeader = (ws, cols) => {
  const row = ws.addRow(cols.map(c => c.header));
  row.height = 20;
  row.eachCell(cell => {
    cell.fill = hdrFill(BRAND);
    cell.font = font(true, 10, WHITE);
    cell.alignment = align('center');
    cell.border = border();
  });
};

const applyRow = (ws, values, idx) => {
  const row = ws.addRow(values);
  row.eachCell(cell => {
    cell.font = font();
    cell.alignment = align('left', 'middle', true);
    cell.border = border();
    if (idx % 2 === 0) cell.fill = hdrFill('F7F9FF');
  });
  row.height = 16;
  return row;
};

const setCols = (ws, cols) => {
  ws.columns = cols.map(c => ({ key: c.key, width: c.width || 18 }));
};

const addSummaryBlock = (ws, items, startRow = 1) => {
  // title row
  const tr = ws.getRow(startRow);
  tr.height = 28;
  const c = ws.getCell(startRow, 1);
  c.value = 'GLOW GREEN CRM — Report Summary';
  c.font = font(true, 13, WHITE);
  c.fill = hdrFill(BRAND);
  c.alignment = align('center', 'middle');
  ws.mergeCells(startRow, 1, startRow, items[0]?.cols || 8);

  const dr = ws.getRow(startRow + 1);
  dr.height = 14;
  const dc = ws.getCell(startRow + 1, 1);
  dc.value = `Generated: ${new Date().toLocaleString('en-IN')}`;
  dc.font = font(false, 9, '6B7280');
  dc.fill = hdrFill(LIGHT.replace('#', ''));
  ws.mergeCells(startRow + 1, 1, startRow + 1, items[0]?.cols || 8);

  ws.addRow([]);
};

// ════════════════════════════════════════════════════════════
// LEAD REPORT
// ════════════════════════════════════════════════════════════
const exportLeads = async (req, res) => {
  try {
    const { status, category, assignedTo, from, to } = req.query;
    const filter = {};
    if (status)     filter.leadStatus = { $in: status.split(',') };
    if (category)   filter.category   = category;
    if (assignedTo) filter.assignedTo = assignedTo;
    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to)   filter.createdAt.$lte = new Date(to + 'T23:59:59');
    }

    const leads = await Lead.find(filter).populate('assignedTo', 'name').sort({ createdAt: -1 });

    const wb = new ExcelJS.Workbook();
    wb.creator = 'Glow Green CRM';
    wb.created = new Date();

    // ── Sheet 1: All Leads ─────────────────────────────────
    const ws = wb.addWorksheet('All Leads', { views: [{ state: 'frozen', ySplit: 4 }] });

    const cols = [
      { key: 'sr',       header: '#',              width: 5  },
      { key: 'name',     header: 'Lead Name',       width: 22 },
      { key: 'company',  header: 'Company',          width: 22 },
      { key: 'phone',    header: 'Phone',            width: 16 },
      { key: 'email',    header: 'Email',            width: 26 },
      { key: 'source',   header: 'Source',           width: 16 },
      { key: 'category', header: 'Category',         width: 12 },
      { key: 'status',   header: 'Status',           width: 14 },
      { key: 'assigned', header: 'Assigned To',      width: 18 },
      { key: 'followup', header: 'Follow-Up Date',   width: 16 },
      { key: 'value',    header: 'Expected Value (₹)', width: 20 },
      { key: 'notes',    header: 'Notes Count',      width: 14 },
      { key: 'remarks',  header: 'Remarks',          width: 30 },
      { key: 'created',  header: 'Created On',       width: 16 },
    ];

    setCols(ws, cols);
    addSummaryBlock(ws, [{ cols: cols.length }]);
    applyHeader(ws, cols);

    leads.forEach((lead, i) => {
      const isOverdue = lead.followUpDate && new Date(lead.followUpDate) < new Date();
      const row = applyRow(ws, [
        i + 1,
        lead.leadName || '',
        lead.company  || '',
        lead.phone    || '',
        lead.email    || '',
        lead.leadSource || '',
        lead.category || '',
        lead.leadStatus || '',
        lead.assignedTo?.name || '',
        fmtDate(lead.followUpDate),
        lead.expectedValue || '',
        lead.notes?.length || 0,
        lead.remarks || '',
        fmtDate(lead.createdAt),
      ], i);

      // Colour-code status cell (col 8)
      const statusCell = row.getCell(8);
      const statusColors = {
        'open':        { bg: 'DBEAFE', text: '1D4ED8' },
        'in-progress': { bg: 'FEF3C7', text: '92400E' },
        'follow-up':   { bg: 'EDE9FE', text: '6D28D9' },
        'won':         { bg: 'DCFCE7', text: '166534' },
        'lost':        { bg: 'FEE2E2', text: '991B1B' },
      };
      const sc = statusColors[lead.leadStatus];
      if (sc) { statusCell.fill = hdrFill(sc.bg); statusCell.font = font(true, 9, sc.text); }

      // Highlight overdue follow-ups
      if (isOverdue) {
        row.getCell(10).fill = hdrFill('FEE2E2');
        row.getCell(10).font = font(true, 9, DANGER);
      }
    });

    ws.autoFilter = { from: 'A4', to: `${String.fromCharCode(64 + cols.length)}4` };

    // ── Sheet 2: Summary ───────────────────────────────────
    const ws2 = wb.addWorksheet('Summary');
    ws2.columns = [{ width: 24 }, { width: 16 }, { width: 20 }];

    const addS2Row = (label, value, bold = false, bgHex = null) => {
      const row = ws2.addRow([label, value]);
      row.getCell(1).font = font(bold, 10, bold ? BRAND : '374151');
      row.getCell(2).font = font(bold, 10, bold ? BRAND : '111827');
      row.getCell(2).alignment = align('right');
      if (bgHex) { row.getCell(1).fill = hdrFill(bgHex); row.getCell(2).fill = hdrFill(bgHex); }
      [row.getCell(1), row.getCell(2)].forEach(c => c.border = border());
      row.height = 16;
    };

    ws2.addRow(['LEAD REPORT SUMMARY']).getCell(1).font = font(true, 13, WHITE);
    ws2.getRow(1).getCell(1).fill = hdrFill(BRAND);
    ws2.getRow(1).height = 24;
    ws2.mergeCells('A1:B1');
    ws2.getRow(1).getCell(1).alignment = align('center', 'middle');

    ws2.addRow([]);
    addS2Row('Total Leads',       leads.length, true, LIGHT);
    addS2Row('Open',              leads.filter(l => l.leadStatus === 'open').length);
    addS2Row('In Progress',       leads.filter(l => l.leadStatus === 'in-progress').length);
    addS2Row('Follow-Up',         leads.filter(l => l.leadStatus === 'follow-up').length);
    addS2Row('Won',               leads.filter(l => l.leadStatus === 'won').length);
    addS2Row('Lost',              leads.filter(l => l.leadStatus === 'lost').length);
    ws2.addRow([]);
    addS2Row('Total Expected Value (₹)', leads.reduce((s, l) => s + (l.expectedValue || 0), 0).toFixed(2), true, LIGHT);
    addS2Row('Won Value (₹)',     leads.filter(l => l.leadStatus === 'won').reduce((s, l) => s + (l.expectedValue || 0), 0).toFixed(2));
    ws2.addRow([]);
    addS2Row('New Category',    leads.filter(l => l.category === 'new').length);
    addS2Row('Routine Category', leads.filter(l => l.category === 'routine').length);
    addS2Row('Closed Category',  leads.filter(l => l.category === 'closed').length);
    ws2.addRow([]);
    addS2Row('Overdue Follow-Ups', leads.filter(l => l.followUpDate && new Date(l.followUpDate) < new Date()).length, true, 'FEE2E2');

    const buf = await wb.xlsx.writeBuffer();
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="GlowGreen_Leads_${Date.now()}.xlsx"`,
    });
    res.send(buf);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ════════════════════════════════════════════════════════════
// CUSTOMER REPORT
// ════════════════════════════════════════════════════════════
const exportCustomers = async (req, res) => {
  try {
    const { status, category, assignedTo, from, to } = req.query;
    const filter = {};
    if (status)     filter.status   = status;
    if (category)   filter.category = category;
    if (assignedTo) filter.assignedTo = assignedTo;
    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to)   filter.createdAt.$lte = new Date(to + 'T23:59:59');
    }

    const customers = await Customer.find(filter).populate('assignedTo', 'name').sort({ createdAt: -1 });

    const wb = new ExcelJS.Workbook();
    wb.creator = 'Glow Green CRM';
    wb.created = new Date();

    const ws = wb.addWorksheet('Customers', { views: [{ state: 'frozen', ySplit: 4 }] });

    const cols = [
      { key: 'sr',       header: '#',             width: 5  },
      { key: 'name',     header: 'Customer Name',  width: 24 },
      { key: 'company',  header: 'Company',         width: 24 },
      { key: 'phone',    header: 'Phone',           width: 16 },
      { key: 'email',    header: 'Email',           width: 26 },
      { key: 'city',     header: 'City',            width: 14 },
      { key: 'state',    header: 'State',           width: 14 },
      { key: 'category', header: 'Category',        width: 12 },
      { key: 'source',   header: 'Source',          width: 16 },
      { key: 'status',   header: 'Status',          width: 12 },
      { key: 'assigned', header: 'Assigned To',     width: 18 },
      { key: 'notes',    header: 'Notes Count',     width: 14 },
      { key: 'address',  header: 'Address',         width: 30 },
      { key: 'created',  header: 'Created On',      width: 16 },
    ];

    setCols(ws, cols);
    addSummaryBlock(ws, [{ cols: cols.length }]);
    applyHeader(ws, cols);

    customers.forEach((c, i) => {
      const row = applyRow(ws, [
        i + 1,
        c.name     || '',
        c.company  || '',
        c.phone    || '',
        c.email    || '',
        c.city     || '',
        c.state    || '',
        c.category || '',
        c.source   || '',
        c.status   || '',
        c.assignedTo?.name || '',
        c.notes?.length || 0,
        c.address  || '',
        fmtDate(c.createdAt),
      ], i);

      const catColors = {
        new:     { bg: 'E0F2FE', text: '0369A1' },
        routine: { bg: 'DCFCE7', text: '166534' },
        closed:  { bg: 'FEE2E2', text: '991B1B' },
      };
      const cc = catColors[c.category];
      if (cc) { const cell = row.getCell(8); cell.fill = hdrFill(cc.bg); cell.font = font(true, 9, cc.text); }

      if (c.status === 'inactive') row.getCell(10).font = font(false, 9, '9CA3AF');
    });

    ws.autoFilter = { from: 'A4', to: `${String.fromCharCode(64 + cols.length)}4` };

    // Summary sheet
    const ws2 = wb.addWorksheet('Summary');
    ws2.columns = [{ width: 24 }, { width: 16 }];

    const addRow = (l, v, bold = false, bg = null) => {
      const row = ws2.addRow([l, v]);
      row.getCell(1).font = font(bold, 10, bold ? BRAND : '374151');
      row.getCell(2).font = font(bold, 10, '111827');
      row.getCell(2).alignment = align('right');
      if (bg) { row.getCell(1).fill = hdrFill(bg); row.getCell(2).fill = hdrFill(bg); }
      [row.getCell(1), row.getCell(2)].forEach(c => c.border = border());
      row.height = 16;
    };

    ws2.addRow(['CUSTOMER REPORT SUMMARY']).getCell(1).font = font(true, 13, WHITE);
    ws2.getRow(1).getCell(1).fill = hdrFill(BRAND);
    ws2.getRow(1).height = 24;
    ws2.mergeCells('A1:B1');
    ws2.getRow(1).getCell(1).alignment = align('center', 'middle');
    ws2.addRow([]);

    addRow('Total Customers', customers.length, true, LIGHT);
    addRow('Active',   customers.filter(c => c.status === 'active').length);
    addRow('Inactive', customers.filter(c => c.status === 'inactive').length);
    ws2.addRow([]);
    addRow('New Category',     customers.filter(c => c.category === 'new').length);
    addRow('Routine Category', customers.filter(c => c.category === 'routine').length);
    addRow('Closed Category',  customers.filter(c => c.category === 'closed').length);

    const buf = await wb.xlsx.writeBuffer();
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="GlowGreen_Customers_${Date.now()}.xlsx"`,
    });
    res.send(buf);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ════════════════════════════════════════════════════════════
// PRODUCT REPORT
// ════════════════════════════════════════════════════════════
const exportProducts = async (req, res) => {
  try {
    const { type, status } = req.query;
    const filter = {};
    if (type)   filter.type   = type;
    if (status) filter.status = status;

    const products = await Product.find(filter).sort({ type: 1, name: 1 });

    const wb = new ExcelJS.Workbook();
    wb.creator = 'Glow Green CRM';
    wb.created = new Date();

    const cols = [
      { key: 'sr',       header: '#',          width: 5  },
      { key: 'name',     header: 'Product Name', width: 28 },
      { key: 'code',     header: 'Code',         width: 14 },
      { key: 'type',     header: 'Type',         width: 10 },
      { key: 'category', header: 'Category',     width: 16 },
      { key: 'unit',     header: 'Unit',         width: 10 },
      { key: 'hsn',      header: 'HSN',          width: 12 },
      { key: 'price',    header: 'Price (₹)',    width: 14 },
      { key: 'stock',    header: 'Stock',        width: 12 },
      { key: 'status',   header: 'Status',       width: 12 },
      { key: 'desc',     header: 'Description',  width: 36 },
    ];

    // All Products sheet
    const ws = wb.addWorksheet('All Products', { views: [{ state: 'frozen', ySplit: 4 }] });
    setCols(ws, cols);
    addSummaryBlock(ws, [{ cols: cols.length }]);
    applyHeader(ws, cols);

    products.forEach((p, i) => {
      const row = applyRow(ws, [
        i + 1,
        p.name     || '',
        p.code     || '',
        p.type     || '',
        p.category || '',
        p.unit     || '',
        p.hsn      || '',
        p.price    != null ? p.price : '',
        p.stock    != null ? p.stock : '',
        p.status   || '',
        p.description || '',
      ], i);

      const typeCell = row.getCell(4);
      if (p.type === 'RM') { typeCell.fill = hdrFill('DBEAFE'); typeCell.font = font(true, 9, '1D4ED8'); }
      if (p.type === 'FM') { typeCell.fill = hdrFill('DCFCE7'); typeCell.font = font(true, 9, '166534'); }
    });

    ws.autoFilter = { from: 'A4', to: `${String.fromCharCode(64 + cols.length)}4` };

    // Separate RM sheet
    ['RM', 'FM'].forEach(t => {
      const subset = products.filter(p => p.type === t);
      if (!subset.length) return;

      const wsT = wb.addWorksheet(`${t} Products`);
      setCols(wsT, cols);
      addSummaryBlock(wsT, [{ cols: cols.length }]);
      applyHeader(wsT, cols);

      subset.forEach((p, i) => {
        applyRow(wsT, [
          i + 1, p.name, p.code, p.type, p.category,
          p.unit, p.hsn, p.price, p.stock, p.status, p.description
        ], i);
      });
    });

    // Summary sheet
    const ws2 = wb.addWorksheet('Summary');
    ws2.columns = [{ width: 26 }, { width: 14 }];

    const addRow = (l, v, bold = false, bg = null) => {
      const row = ws2.addRow([l, v]);
      row.getCell(1).font = font(bold, 10, bold ? BRAND : '374151');
      row.getCell(2).font = font(bold, 10, '111827');
      row.getCell(2).alignment = align('right');
      if (bg) { row.getCell(1).fill = hdrFill(bg); row.getCell(2).fill = hdrFill(bg); }
      [row.getCell(1), row.getCell(2)].forEach(c => c.border = border());
      row.height = 16;
    };

    ws2.addRow(['PRODUCT REPORT SUMMARY']).getCell(1).font = font(true, 13, WHITE);
    ws2.getRow(1).getCell(1).fill = hdrFill(BRAND);
    ws2.getRow(1).height = 24;
    ws2.mergeCells('A1:B1');
    ws2.getRow(1).getCell(1).alignment = align('center', 'middle');
    ws2.addRow([]);

    addRow('Total Products', products.length, true, LIGHT);
    addRow('RM Products',    products.filter(p => p.type === 'RM').length);
    addRow('FM Products',    products.filter(p => p.type === 'FM').length);
    ws2.addRow([]);
    addRow('Active',   products.filter(p => p.status === 'active').length);
    addRow('Inactive', products.filter(p => p.status !== 'active').length);

    const buf = await wb.xlsx.writeBuffer();
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="GlowGreen_Products_${Date.now()}.xlsx"`,
    });
    res.send(buf);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ════════════════════════════════════════════════════════════
// QUOTATION REPORT
// ════════════════════════════════════════════════════════════
const exportQuotations = async (req, res) => {
  try {
    const { status, from, to } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = new Date(from);
      if (to)   filter.date.$lte = new Date(to + 'T23:59:59');
    }

    const quotations = await Quotation.find(filter).populate('preparedBy', 'name').sort({ date: -1 });

    const wb = new ExcelJS.Workbook();
    wb.creator = 'Glow Green CRM';
    wb.created = new Date();

    // ── Sheet 1: Quotation Summary ─────────────────────────
    const ws = wb.addWorksheet('Quotations', { views: [{ state: 'frozen', ySplit: 4 }] });

    const cols = [
      { key: 'sr',       header: '#',             width: 5  },
      { key: 'no',       header: 'Quotation No.',  width: 20 },
      { key: 'customer', header: 'Customer',        width: 24 },
      { key: 'phone',    header: 'Phone',           width: 16 },
      { key: 'date',     header: 'Date',            width: 14 },
      { key: 'valid',    header: 'Valid Till',       width: 14 },
      { key: 'items',    header: 'Items',            width: 8  },
      { key: 'subtotal', header: 'Subtotal (₹)',    width: 16 },
      { key: 'discount', header: 'Discount (₹)',    width: 16 },
      { key: 'tax',      header: 'Tax (₹)',         width: 14 },
      { key: 'total',    header: 'Grand Total (₹)', width: 18 },
      { key: 'status',   header: 'Status',          width: 14 },
      { key: 'prepared', header: 'Prepared By',     width: 18 },
    ];

    setCols(ws, cols);
    addSummaryBlock(ws, [{ cols: cols.length }]);
    applyHeader(ws, cols);

    quotations.forEach((q, i) => {
      const row = applyRow(ws, [
        i + 1,
        q.quotationNo   || '',
        q.customerName  || '',
        q.customerPhone || '',
        fmtDate(q.date),
        fmtDate(q.validTill),
        q.items?.length || 0,
        fmtMoney(q.subtotal),
        fmtMoney(q.discountAmount),
        fmtMoney(q.taxAmount),
        fmtMoney(q.grandTotal),
        q.status || '',
        q.preparedBy?.name || '',
      ], i);

      const qStatusColors = {
        draft:    { bg: 'F3F4F6', text: '374151' },
        sent:     { bg: 'DBEAFE', text: '1D4ED8' },
        accepted: { bg: 'DCFCE7', text: '166534' },
        rejected: { bg: 'FEE2E2', text: '991B1B' },
        expired:  { bg: 'FEF3C7', text: '92400E' },
      };
      const qsc = qStatusColors[q.status];
      if (qsc) {
        const sc = row.getCell(12);
        sc.fill = hdrFill(qsc.bg);
        sc.font = font(true, 9, qsc.text);
      }

      // Bold grand total
      const gtCell = row.getCell(11);
      gtCell.font = font(true, 10, SUCCESS);
      gtCell.numFmt = '#,##0.00';
    });

    ws.autoFilter = { from: 'A4', to: `${String.fromCharCode(64 + cols.length)}4` };

    // ── Sheet 2: Line Items detail ─────────────────────────
    const ws3 = wb.addWorksheet('Line Items');
    const cols3 = [
      { key: 'qtno',   header: 'Quotation No.',  width: 20 },
      { key: 'cust',   header: 'Customer',        width: 22 },
      { key: 'sr',     header: '#',              width: 6  },
      { key: 'desc',   header: 'Description',     width: 34 },
      { key: 'hsn',    header: 'HSN',             width: 10 },
      { key: 'qty',    header: 'Qty',             width: 8  },
      { key: 'unit',   header: 'Unit',            width: 10 },
      { key: 'rate',   header: 'Rate (₹)',        width: 14 },
      { key: 'amount', header: 'Amount (₹)',      width: 16 },
    ];
    setCols(ws3, cols3);
    addSummaryBlock(ws3, [{ cols: cols3.length }]);
    applyHeader(ws3, cols3);

    let rowIdx = 0;
    quotations.forEach(q => {
      (q.items || []).forEach(item => {
        applyRow(ws3, [
          q.quotationNo,
          q.customerName,
          item.srNo,
          item.description,
          item.hsnCode,
          item.quantity,
          item.unit,
          fmtMoney(item.rate),
          fmtMoney(item.amount),
        ], rowIdx++);
      });
    });

    // ── Sheet 3: Summary ───────────────────────────────────
    const ws2 = wb.addWorksheet('Summary');
    ws2.columns = [{ width: 26 }, { width: 18 }];

    const addRow = (l, v, bold = false, bg = null) => {
      const row = ws2.addRow([l, v]);
      row.getCell(1).font = font(bold, 10, bold ? BRAND : '374151');
      row.getCell(2).font = font(bold, 10, '111827');
      row.getCell(2).alignment = align('right');
      if (bg) { row.getCell(1).fill = hdrFill(bg); row.getCell(2).fill = hdrFill(bg); }
      [row.getCell(1), row.getCell(2)].forEach(c => c.border = border());
      row.height = 16;
    };

    ws2.addRow(['QUOTATION REPORT SUMMARY']).getCell(1).font = font(true, 13, WHITE);
    ws2.getRow(1).getCell(1).fill = hdrFill(BRAND);
    ws2.getRow(1).height = 24;
    ws2.mergeCells('A1:B1');
    ws2.getRow(1).getCell(1).alignment = align('center', 'middle');
    ws2.addRow([]);

    addRow('Total Quotations', quotations.length, true, LIGHT);
    addRow('Draft',    quotations.filter(q => q.status === 'draft').length);
    addRow('Sent',     quotations.filter(q => q.status === 'sent').length);
    addRow('Accepted', quotations.filter(q => q.status === 'accepted').length);
    addRow('Rejected', quotations.filter(q => q.status === 'rejected').length);
    addRow('Expired',  quotations.filter(q => q.status === 'expired').length);
    ws2.addRow([]);
    const totalVal    = quotations.reduce((s, q) => s + (q.grandTotal || 0), 0);
    const acceptedVal = quotations.filter(q => q.status === 'accepted').reduce((s, q) => s + (q.grandTotal || 0), 0);
    addRow('Total Quoted Value (₹)', totalVal.toFixed(2), true, LIGHT);
    addRow('Accepted Value (₹)',     acceptedVal.toFixed(2));

    const buf = await wb.xlsx.writeBuffer();
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="GlowGreen_Quotations_${Date.now()}.xlsx"`,
    });
    res.send(buf);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ════════════════════════════════════════════════════════════
// COMBINED / MASTER REPORT
// ════════════════════════════════════════════════════════════
const exportMaster = async (req, res) => {
  try {
    const { from, to } = req.query;
    const dateFilter = {};
    if (from || to) {
      dateFilter.createdAt = {};
      if (from) dateFilter.createdAt.$gte = new Date(from);
      if (to)   dateFilter.createdAt.$lte = new Date(to + 'T23:59:59');
    }

    const [leads, customers, products, quotations] = await Promise.all([
      Lead.find(dateFilter).populate('assignedTo', 'name'),
      Customer.find(dateFilter).populate('assignedTo', 'name'),
      Product.find(),
      Quotation.find(dateFilter).populate('preparedBy', 'name'),
    ]);

    const wb = new ExcelJS.Workbook();
    wb.creator = 'Glow Green CRM';
    wb.created = new Date();

    // ── Dashboard sheet ────────────────────────────────────
    const ws = wb.addWorksheet('Dashboard');
    ws.columns = [{ width: 30 }, { width: 20 }, { width: 20 }, { width: 20 }];

    const title = ws.addRow(['GLOW GREEN CRM — MASTER REPORT']);
    title.height = 32;
    title.getCell(1).font = font(true, 16, WHITE);
    title.getCell(1).fill = hdrFill(BRAND);
    title.getCell(1).alignment = align('center', 'middle');
    ws.mergeCells('A1:D1');

    const sub = ws.addRow([`Period: ${from ? fmtDate(from) : 'All Time'}${to ? ' — ' + fmtDate(to) : ''}`]);
    sub.height = 16;
    sub.getCell(1).font = font(false, 10, '6B7280');
    sub.getCell(1).fill = hdrFill(LIGHT);
    ws.mergeCells('A2:D2');

    ws.addRow([]);

    const sections = [
      {
        title: '📋 LEADS', color: '6366F1',
        rows: [
          ['Total Leads',      leads.length],
          ['Open',             leads.filter(l => l.leadStatus === 'open').length],
          ['Won',              leads.filter(l => l.leadStatus === 'won').length],
          ['Lost',             leads.filter(l => l.leadStatus === 'lost').length],
          ['Total Value (₹)',  leads.reduce((s, l) => s + (l.expectedValue || 0), 0).toFixed(2)],
          ['Won Value (₹)',    leads.filter(l => l.leadStatus === 'won').reduce((s, l) => s + (l.expectedValue || 0), 0).toFixed(2)],
          ['Overdue Follow-Ups', leads.filter(l => l.followUpDate && new Date(l.followUpDate) < new Date()).length],
        ]
      },
      {
        title: '👥 CUSTOMERS', color: '059669',
        rows: [
          ['Total Customers',  customers.length],
          ['Active',           customers.filter(c => c.status === 'active').length],
          ['New Category',     customers.filter(c => c.category === 'new').length],
          ['Routine',          customers.filter(c => c.category === 'routine').length],
        ]
      },
      {
        title: '📦 PRODUCTS', color: '0EA5E9',
        rows: [
          ['Total Products',   products.length],
          ['RM Products',      products.filter(p => p.type === 'RM').length],
          ['FM Products',      products.filter(p => p.type === 'FM').length],
          ['Active',           products.filter(p => p.status === 'active').length],
        ]
      },
      {
        title: '📄 QUOTATIONS', color: 'F59E0B',
        rows: [
          ['Total Quotations', quotations.length],
          ['Sent',             quotations.filter(q => q.status === 'sent').length],
          ['Accepted',         quotations.filter(q => q.status === 'accepted').length],
          ['Total Value (₹)',  quotations.reduce((s, q) => s + (q.grandTotal || 0), 0).toFixed(2)],
          ['Accepted Value (₹)', quotations.filter(q => q.status === 'accepted').reduce((s, q) => s + (q.grandTotal || 0), 0).toFixed(2)],
        ]
      },
    ];

    sections.forEach(section => {
      const hr = ws.addRow([section.title, 'Count / Value']);
      hr.height = 20;
      hr.getCell(1).font = font(true, 11, WHITE);
      hr.getCell(2).font = font(true, 10, WHITE);
      hr.getCell(1).fill = hdrFill(section.color);
      hr.getCell(2).fill = hdrFill(section.color);
      hr.getCell(2).alignment = align('right');

      section.rows.forEach((r, i) => {
        const row = ws.addRow(r);
        row.getCell(1).font = font(false, 10, '374151');
        row.getCell(2).font = font(true, 10, '111827');
        row.getCell(2).alignment = align('right');
        if (i % 2 === 0) {
          row.getCell(1).fill = hdrFill('F9FAFB');
          row.getCell(2).fill = hdrFill('F9FAFB');
        }
        [row.getCell(1), row.getCell(2)].forEach(c => c.border = border());
        row.height = 15;
      });

      ws.addRow([]);
    });

    // ── Include mini versions of all modules ───────────────
    // Leads mini sheet
    const wsl = wb.addWorksheet('Leads');
    const lCols = [
      { key: 'sr', header: '#', width: 5 },
      { key: 'name', header: 'Lead Name', width: 22 },
      { key: 'company', header: 'Company', width: 20 },
      { key: 'phone', header: 'Phone', width: 16 },
      { key: 'category', header: 'Category', width: 12 },
      { key: 'status', header: 'Status', width: 14 },
      { key: 'followup', header: 'Follow-Up', width: 14 },
      { key: 'value', header: 'Value (₹)', width: 16 },
      { key: 'assigned', header: 'Assigned', width: 16 },
    ];
    setCols(wsl, lCols);
    addSummaryBlock(wsl, [{ cols: lCols.length }]);
    applyHeader(wsl, lCols);
    leads.forEach((l, i) => applyRow(wsl, [i+1, l.leadName, l.company, l.phone, l.category, l.leadStatus, fmtDate(l.followUpDate), l.expectedValue || '', l.assignedTo?.name || ''], i));

    // Customers mini
    const wsc = wb.addWorksheet('Customers');
    const cCols = [
      { key: 'sr', header: '#', width: 5 },
      { key: 'name', header: 'Customer Name', width: 24 },
      { key: 'company', header: 'Company', width: 22 },
      { key: 'phone', header: 'Phone', width: 16 },
      { key: 'category', header: 'Category', width: 12 },
      { key: 'status', header: 'Status', width: 12 },
      { key: 'city', header: 'City', width: 14 },
      { key: 'assigned', header: 'Assigned', width: 16 },
    ];
    setCols(wsc, cCols);
    addSummaryBlock(wsc, [{ cols: cCols.length }]);
    applyHeader(wsc, cCols);
    customers.forEach((c, i) => applyRow(wsc, [i+1, c.name, c.company, c.phone, c.category, c.status, c.city, c.assignedTo?.name || ''], i));

    // Products mini
    const wsp = wb.addWorksheet('Products');
    const pCols = [
      { key: 'sr', header: '#', width: 5 },
      { key: 'name', header: 'Product Name', width: 28 },
      { key: 'code', header: 'Code', width: 14 },
      { key: 'type', header: 'Type', width: 10 },
      { key: 'unit', header: 'Unit', width: 10 },
      { key: 'price', header: 'Price (₹)', width: 14 },
      { key: 'stock', header: 'Stock', width: 12 },
      { key: 'status', header: 'Status', width: 12 },
    ];
    setCols(wsp, pCols);
    addSummaryBlock(wsp, [{ cols: pCols.length }]);
    applyHeader(wsp, pCols);
    products.forEach((p, i) => applyRow(wsp, [i+1, p.name, p.code, p.type, p.unit, p.price, p.stock, p.status], i));

    // Quotations mini
    const wsq = wb.addWorksheet('Quotations');
    const qCols = [
      { key: 'sr', header: '#', width: 5 },
      { key: 'no', header: 'Quotation No.', width: 20 },
      { key: 'customer', header: 'Customer', width: 22 },
      { key: 'date', header: 'Date', width: 14 },
      { key: 'total', header: 'Grand Total (₹)', width: 18 },
      { key: 'status', header: 'Status', width: 14 },
      { key: 'prepared', header: 'Prepared By', width: 18 },
    ];
    setCols(wsq, qCols);
    addSummaryBlock(wsq, [{ cols: qCols.length }]);
    applyHeader(wsq, qCols);
    quotations.forEach((q, i) => applyRow(wsq, [i+1, q.quotationNo, q.customerName, fmtDate(q.date), fmtMoney(q.grandTotal), q.status, q.preparedBy?.name || ''], i));

    const buf = await wb.xlsx.writeBuffer();
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="GlowGreen_MasterReport_${Date.now()}.xlsx"`,
    });
    res.send(buf);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { exportLeads, exportCustomers, exportProducts, exportQuotations, exportMaster };