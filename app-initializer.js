// app-initializer.js
const Score = require('./models/score');

// Inisialisasi pengaturan baru jika belum ada
function initializeSettings() {
  try {
    // Inisialisasi pengaturan baru
    Score.initializeNewSettings();
    console.log('Application settings initialized successfully');
  } catch (error) {
    console.error('Error initializing settings:', error);
  }
}

module.exports = { initializeSettings };