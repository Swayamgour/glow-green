// const express = require('express');
// const router = express.Router();
// const {
//   getLeads, getLead, createLead, updateLead,
//   updateLeadStatus, updateLeadCategory,
//   addNote, deleteNote, deleteLead, scanNoteOCR
// } = require('../controllers/lead.controller');
// const { protect } = require('../middleware/auth.middleware');
// const upload = require('../middleware/upload.middleware');

// router.get('/', protect, getLeads);
// router.post('/', protect, createLead);
// router.post('/:id/scan-note', protect, upload.single('image'), scanNoteOCR);
// router.post('/:id/notes', protect, addNote);
// router.delete('/:id/notes/:noteId', protect, deleteNote);
// router.patch('/:id/status', protect, updateLeadStatus);
// router.patch('/:id/category', protect, updateLeadCategory);
// router.get('/:id', protect, getLead);
// router.put('/:id', protect, updateLead);
// router.delete('/:id', protect, deleteLead);

// module.exports = router;


const express = require('express');
const router = express.Router();

const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');

const {
  getLeads,
  getLead,
  createLead,
  updateLead,
  updateLeadStatus,
  updateLeadCategory,
  addNote,
  deleteNote,
  deleteLead,
  scanNoteOCR,

  // Excel Functions
  exportExcel,
  importExcel,
  downloadTemplate

} = require('../controllers/lead.controller');

const { protect } = require('../middleware/auth.middleware');

const upload = require('../middleware/upload.middleware');


// Upload Folder
const uploadsDir = path.join(process.cwd(), 'uploads');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}


// Excel Upload Storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),

  filename: (req, file, cb) =>
    cb(null, `${uuidv4()}${path.extname(file.originalname)}`)
});


const uploadExcel = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024
  }
});


// Lead Routes
router.get('/', protect, getLeads);

router.post('/', protect, createLead);


// Excel Routes
router.get('/export', protect, exportExcel);

router.get('/template', protect, downloadTemplate);

router.post(
  '/import',
  protect,
  uploadExcel.single('file'),
  importExcel
);


// OCR
router.post(
  '/:id/scan-note',
  protect,
  upload.single('image'),
  scanNoteOCR
);


// Notes
router.post('/:id/notes', protect, addNote);

router.delete('/:id/notes/:noteId', protect, deleteNote);


// Status & Category
router.patch('/:id/status', protect, updateLeadStatus);

router.patch('/:id/category', protect, updateLeadCategory);


// CRUD
router.get('/:id', protect, getLead);

router.put('/:id', protect, updateLead);

router.delete('/:id', protect, deleteLead);


module.exports = router;