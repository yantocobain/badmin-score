// utils/ensure-directories.js
const fs = require('fs');
const path = require('path');
const { promises: fsPromises } = fs;

/**
 * Memastikan direktori penting ada dan membuat direktori jika tidak ada
 */
async function ensureDirectories() {
  const directories = [
    path.join(__dirname, '../public/images/logos'),
    path.join(__dirname, '../data')
  ];
  
  for (const dir of directories) {
    try {
      await fsPromises.access(dir);
      console.log(`Directory exists: ${dir}`);
    } catch (error) {
      // Direktori tidak ada, buat baru
      try {
        await fsPromises.mkdir(dir, { recursive: true });
        console.log(`Created directory: ${dir}`);
      } catch (err) {
        console.error(`Error creating directory ${dir}:`, err);
      }
    }
  }
  
  // Buat logo default jika belum ada
  await ensureDefaultLogo();
}

/**
 * Membuat logo default jika belum ada
 */
async function ensureDefaultLogo() {
  const defaultLogoPath = path.join(__dirname, '../public/images/logos/default.png');
  
  try {
    await fsPromises.access(defaultLogoPath);
    console.log('Default logo exists');
  } catch (error) {
    try {
      // Buat logo default sederhana menggunakan Buffer
      // Logo default ini hanya berupa persegi berwarna abu-abu
      // dengan teks "No Logo" di tengahnya
      // Untuk aplikasi produksi, Anda sebaiknya menyediakan file PNG asli
      
      // Salin dari direktori lain jika ada
      const sourceLogo = path.join(__dirname, '../public/images/default-logo.png');
      if (fs.existsSync(sourceLogo)) {
        await fsPromises.copyFile(sourceLogo, defaultLogoPath);
        console.log('Default logo copied from source');
      } else {
        // Jika tidak ada sumber, gunakan logo kosong
        // Perhatian: Ini akan membuat file 1x1 pixel transparant
        // yang dapat digunakan sebagai placeholder
        const emptyPNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
        await fsPromises.writeFile(defaultLogoPath, emptyPNG);
        console.log('Created empty default logo');
      }
    } catch (err) {
      console.error('Error creating default logo:', err);
    }
  }
}

module.exports = { ensureDirectories };