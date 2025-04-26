// routes/admin.js
const express = require('express');
const router = express.Router();
const Match = require('../models/match');
const Score = require('../models/score');
const upload = require('../config/multer');
const { getAvailableLogos } = require('../utils/logo-utils');
const path = require('path');
const fs = require('fs');

router.get('/dashboard', (req, res) => {
  const settings = Score.getSettings();
  res.render('admin/dashboard', { 
    title: 'Admin Dashboard',
    settings
  });
});

router.get('/', (req, res) => {
  const currentMatch = Match.getCurrent();
  
  if (!currentMatch) {
    return res.redirect('/admin/dashboard');
  }
  
  const players = Match.getPlayers(currentMatch.id);
  const scores = Match.getScores(currentMatch.id);

  const settings = Score.getSettings();
  
  // Organize players by side
  const sides = {
    A: players.filter(p => p.side === 'A').sort((a, b) => a.position - b.position),
    B: players.filter(p => p.side === 'B').sort((a, b) => a.position - b.position)
  };
  
  res.render('admin/match-control', {
    title: 'Match Control',
    match: currentMatch,
    sides,
    scores,
    settings
  });
});

router.get('/setup', (req, res) => {
  const settings = Score.getSettings();
  const availableLogos = getAvailableLogos();
  
  res.render('admin/match-setup', { 
    title: 'Match Setup',
    settings,
    availableLogos
  });
});

// Endpoint untuk menangani unggah logo melalui AJAX
router.post('/upload-logo', (req, res) => {
  const uploadSingle = upload.single('logo');
  
  uploadSingle(req, res, function(err) {
    if (err) {
      console.error('Error uploading file:', err);
      return res.status(400).json({
        success: false,
        message: err.message
      });
    }
    
    // Jika tidak ada file yang diunggah
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Tidak ada file yang diunggah'
      });
    }
    
    // File berhasil diunggah
    const relativePath = `/images/logos/${req.file.filename}`;
    
    return res.json({
      success: true,
      logoPath: relativePath,
      fileName: req.file.filename
    });
  });
});

// Endpoint untuk menghapus logo
router.delete('/delete-logo', (req, res) => {
  const { logoPath } = req.body;
  
  if (!logoPath) {
    return res.status(400).json({ 
      success: false, 
      message: 'Logo path tidak boleh kosong' 
    });
  }
  
  // Pastikan path tidak keluar dari direktori logos
  const filename = path.basename(logoPath);
  const absolutePath = path.join(__dirname, '../public/images/logos', filename);
  
  // Cek kalau file ada
  if (!fs.existsSync(absolutePath)) {
    return res.status(404).json({ 
      success: false, 
      message: 'File tidak ditemukan' 
    });
  }
  
  // Cek kalau bukan logo default
  if (filename === 'default.png') {
    return res.status(400).json({ 
      success: false, 
      message: 'Logo default tidak dapat dihapus' 
    });
  }
  
  // Periksa apakah logo sedang digunakan di pertandingan yang aktif
  const currentMatch = Match.getCurrent();
  if (currentMatch) {
    const logoInUse = 
      currentMatch.side_a_logo === logoPath || 
      currentMatch.side_b_logo === logoPath;
    
    if (logoInUse) {
      return res.status(400).json({
        success: false,
        message: 'Logo sedang digunakan di pertandingan yang aktif'
      });
    }
  }
  
  // Hapus file
  try {
    fs.unlinkSync(absolutePath);
    return res.json({ 
      success: true, 
      message: 'Logo berhasil dihapus' 
    });
  } catch (error) {
    console.error('Error deleting logo:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Gagal menghapus logo: ' + error.message 
    });
  }
});

// Endpoint untuk mengganti nama logo
router.put('/rename-logo', (req, res) => {
  const { oldPath, newName } = req.body;
  
  if (!oldPath || !newName) {
    return res.status(400).json({ 
      success: false, 
      message: 'Path lama dan nama baru diperlukan' 
    });
  }
  
  // Pastikan path tidak keluar dari direktori logos
  const oldFilename = path.basename(oldPath);
  const oldAbsolutePath = path.join(__dirname, '../public/images/logos', oldFilename);
  
  // Cek kalau file ada
  if (!fs.existsSync(oldAbsolutePath)) {
    return res.status(404).json({ 
      success: false, 
      message: 'File tidak ditemukan' 
    });
  }
  
  // Cek kalau bukan logo default
  if (oldFilename === 'default.png') {
    return res.status(400).json({ 
      success: false, 
      message: 'Logo default tidak dapat diganti namanya' 
    });
  }
  
  // Dapatkan ekstensi file
  const ext = path.extname(oldFilename);
  
  // Buat nama file baru
  const sanitizedNewName = newName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
  const newFilename = `${sanitizedNewName}${ext}`;
  const newAbsolutePath = path.join(__dirname, '../public/images/logos', newFilename);
  const newRelativePath = `/images/logos/${newFilename}`;
  
  // Cek kalau file dengan nama baru sudah ada
  if (fs.existsSync(newAbsolutePath)) {
    return res.status(400).json({ 
      success: false, 
      message: 'File dengan nama tersebut sudah ada' 
    });
  }
  
  // Periksa apakah logo sedang digunakan di pertandingan yang aktif
  const currentMatch = Match.getCurrent();
  if (currentMatch) {
    const logoInUse = 
      currentMatch.side_a_logo === `/images/logos/${oldFilename}` || 
      currentMatch.side_b_logo === `/images/logos/${oldFilename}`;
    
    if (logoInUse) {
      // Update logo pada pertandingan aktif
      try {
        const oldPathRelative = `/images/logos/${oldFilename}`;
        if (currentMatch.side_a_logo === oldPathRelative) {
          Match.updateLogo(currentMatch.id, 'A', newRelativePath);
        }
        if (currentMatch.side_b_logo === oldPathRelative) {
          Match.updateLogo(currentMatch.id, 'B', newRelativePath);
        }
      } catch (error) {
        console.error('Error updating match logo:', error);
        return res.status(500).json({
          success: false,
          message: 'Gagal memperbarui pertandingan: ' + error.message
        });
      }
    }
  }
  
  // Ganti nama file
  try {
    fs.renameSync(oldAbsolutePath, newAbsolutePath);
    return res.json({ 
      success: true, 
      message: 'Logo berhasil diubah namanya',
      newPath: newRelativePath
    });
  } catch (error) {
    console.error('Error renaming logo:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Gagal mengubah nama logo: ' + error.message 
    });
  }
});

const setupFormUpload = upload.fields([
  { name: 'logoA', maxCount: 1 },
  { name: 'logoB', maxCount: 1 }
]);

router.post('/setup', setupFormUpload, (req, res) => {
  // console.log("Headers:", req.headers);
  // console.log("Raw body:", req.body);
  
  try {
    // Verifikasi data yang diterima
    if (!req.body || Object.keys(req.body).length === 0) {
      throw new Error('No form data received. Make sure form is properly configured.');
    }
    
    // Ekstrak dan validasi matchType
    const matchType = req.body.matchType;
    console.log(`Received matchType: ${matchType}`);
    
    if (!matchType || (matchType !== 'single' && matchType !== 'double')) {
      throw new Error(`Invalid match type: "${matchType}". Must be either "single" or "double"`);
    }
    
    // Ekstrak player data
    const player1A = req.body.player1A;
    const player1B = req.body.player1B;
    const player2A = req.body.player2A;
    const player2B = req.body.player2B;
    
    // Ekstrak logo paths
    const logoPathA = req.body.logoPathA || '/images/logos/default.png';
    const logoPathB = req.body.logoPathB || '/images/logos/default.png';
    
    console.log(`Players A: ${player1A}, ${player2A || 'N/A'}`);
    console.log(`Players B: ${player1B}, ${player2B || 'N/A'}`);
    console.log(`Logos: A=${logoPathA}, B=${logoPathB}`);
    
    // Siapkan array pemain dan negara
    let playerNames = [];
    let countries = [];
    
    if (matchType === 'single') {
      playerNames = [player1A, player1B];
      countries = [null, null]; // Sederhanakan dengan asumsi tidak ada data negara
    } else {
      playerNames = [player1A, player2A, player1B, player2B];
      countries = [null, null, null, null]; // Sederhanakan dengan asumsi tidak ada data negara
    }
    
    // Buat pertandingan baru
    const matchId = Match.create(matchType, playerNames, countries, logoPathA, logoPathB);
    
    if (!matchId) {
      throw new Error('Failed to create match - no match ID returned');
    }
    
    // Redirect ke halaman kontrol
    res.redirect('/admin/control');
  } catch (error) {
    console.error('Error in setup:', error);
    res.status(500).send('Error creating match: ' + error.message);
  }
});

router.get('/control', (req, res) => {
  const currentMatch = Match.getCurrent();
  
  if (!currentMatch) {
    return res.redirect('/admin/setup');
  }
  
  const players = Match.getPlayers(currentMatch.id);
  const scores = Match.getScores(currentMatch.id);

  const settings = Score.getSettings();
  
  // Organize players by side
  const sides = {
    A: players.filter(p => p.side === 'A').sort((a, b) => a.position - b.position),
    B: players.filter(p => p.side === 'B').sort((a, b) => a.position - b.position)
  };
  
  res.render('admin/match-control', {
    title: 'Match Control',
    match: currentMatch,
    sides,
    scores,
    settings
  });
});

router.get('/history', (req, res) => {
  const matches = Match.getHistory();
  res.render('admin/match-history', { 
    title: 'Match History',
    matches 
  });
});

router.get('/settings', (req, res) => {
  const settings = Score.getSettings();
  res.render('admin/settings', { 
    title: 'Settings',
    settings 
  });
});

router.post('/settings', (req, res) => {
  const { maxSets, pointsToWin, layout, showHistory, historyLimit } = req.body;
  
  Score.updateSetting('max_sets', maxSets);
  Score.updateSetting('points_to_win', pointsToWin);
  Score.updateSetting('layout', layout);
  Score.updateSetting('show_history', showHistory);
  Score.updateSetting('history_limit', historyLimit);
  
  res.redirect('/admin/settings');
});

module.exports = router;