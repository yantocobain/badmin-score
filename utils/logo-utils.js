// utils/logo-utils.js
const fs = require('fs');
const path = require('path');

/**
 * Mendapatkan daftar file logo yang tersedia di direktori logos
 * @returns {Array} Daftar file logo dengan path relatif
 */
function getAvailableLogos() {
  const logoDir = path.join(__dirname, '../public/images/logos');
  
  // Pastikan direktori ada
  if (!fs.existsSync(logoDir)) {
    fs.mkdirSync(logoDir, { recursive: true });
    return [];
  }
  
  try {
    // Dapatkan semua file dalam direktori
    const files = fs.readdirSync(logoDir);
    
    // Filter hanya file gambar
    const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.svg'];
    const logos = files.filter(file => {
      const ext = path.extname(file).toLowerCase();
      return imageExtensions.includes(ext);
    });
    
    // Buat path relatif untuk tiap file
    return logos.map(logo => `/images/logos/${logo}`);
  } catch (error) {
    console.error('Error reading logos directory:', error);
    return [];
  }
}

module.exports = { getAvailableLogos };