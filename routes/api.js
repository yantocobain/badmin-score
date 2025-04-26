// routes/api.js
const express = require('express');
const router = express.Router();
const Match = require('../models/match');
const Score = require('../models/score');

router.put('/score/:matchId/:set', (req, res) => {
  const { matchId, set } = req.params;
  const { sideA, sideB } = req.body;
  
  Match.updateScore(matchId, set, sideA, sideB);
  
  res.json({ success: true });
});

router.put('/complete-set/:matchId/:set', (req, res) => {
  const { matchId, set } = req.params;
  const { sideA, sideB } = req.body;
  
  Score.completeSet(matchId, set, sideA, sideB);
  
  res.json({ success: true });
});

router.put('/switch-sides/:matchId', (req, res) => {
  const { matchId } = req.params;
  // Mengambil informasi match terlebih dahulu
  const match = Match.getById(matchId);
  
  // Menyimpan logo sebelum ditukar
  const sideALogo = match.side_a_logo;
  const sideBLogo = match.side_b_logo;
  
  // Memanggil switchSides untuk memindahkan pemain
  Match.switchSides(matchId);
  
  // Memperbarui logo
  Match.switchLogos(matchId, sideALogo, sideBLogo);
  
  res.json({ success: true });
});

router.put('/end-match/:matchId', (req, res) => {
  const { matchId } = req.params;
  const { winner } = req.body;
  
  Match.endMatch(matchId, winner);
  
  res.json({ success: true });
});

// API baru untuk pengaturan tampilan history
router.put('/settings/show-history', (req, res) => {
  const { value } = req.body;
  
  Score.updateSetting('show_history', value);
  
  res.json({ success: true });
});

module.exports = router;