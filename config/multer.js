// config/multer.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Pastikan direktori uploads ada
const uploadDir = path.join(__dirname, '../public/images/logos');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Konfigurasi penyimpanan
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Ambil nama asli, hapus spasi dan karakter khusus
    const originalName = file.originalname.replace(/[^a-zA-Z0-9.]/g, '_').toLowerCase();
    
    // Hapus ekstensi dari nama file
    const nameWithoutExt = path.parse(originalName).name;
    
    // Ambil ekstensi file
    const ext = path.extname(originalName);
    
    // Gunakan timestamp untuk menghindari nama file yang sama
    const timestamp = Date.now();
    
    // Gabungkan untuk membuat nama file yang lebih mudah dibaca
    const newFilename = `${nameWithoutExt}-${timestamp}${ext}`;
    
    cb(null, newFilename);
  }
});

// Filter file untuk memastikan hanya gambar yang diunggah
const fileFilter = (req, file, cb) => {
  // Terima hanya file gambar
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Hanya file gambar yang diperbolehkan!'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // Batasi ukuran file (5MB)
  }
});

module.exports = upload;