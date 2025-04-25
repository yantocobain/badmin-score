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
  Match.switchSides(matchId);
  
  res.json({ success: true });
});

router.put('/end-match/:matchId', (req, res) => {
  const { matchId } = req.params;
  const { winner } = req.body;
  
  Match.endMatch(matchId, winner);
  
  res.json({ success: true });
});

module.exports = router;
