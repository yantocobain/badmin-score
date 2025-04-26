// routes/index.js
const express = require('express');
const router = express.Router();
const Match = require('../models/match');
const Score = require('../models/score');

router.get('/', (req, res) => {
  // res.render('index', { title: 'Badminton Scoreboard' });
  res.redirect('/admin/control');
});

router.get('/scoreboard', async (req, res) => {
  const layout = req.query.layout || 'layout1';
  const settings = Score.getSettings();
  const currentMatch = Match.getCurrent();
  
  // Jika tidak ada pertandingan berlangsung dan show_history diaktifkan
  if (!currentMatch && settings.show_history === 'true') {
    // Ambil riwayat pertandingan
    const historyLimit = parseInt(settings.history_limit || '5');
    const matchHistory = Match.getHistory(historyLimit);
    
    return res.render(`scoreboard/history`, {
      title: 'Match History',
      layout,
      matches: matchHistory,
      settings
    });
  }
  
  // Jika tidak ada pertandingan berlangsung dan show_history tidak diaktifkan
  if (!currentMatch) {
    return res.render(`scoreboard/no-match`, {
      title: 'No Match',
      layout,
      settings
    });
  }
  
  const players = Match.getPlayers(currentMatch.id);
  const scores = Match.getScores(currentMatch.id);
  
  // Organize players by side
  const sides = {
    A: players.filter(p => p.side === 'A').sort((a, b) => a.position - b.position),
    B: players.filter(p => p.side === 'B').sort((a, b) => a.position - b.position)
  };
  
  res.render(`scoreboard/${layout}`, {
    title: 'Live Scoreboard',
    match: currentMatch,
    sides,
    scores,
    settings
  });
});

router.get('/print/:id', (req, res) => {
  const matchId = req.params.id;
  const result = Score.getMatchResult(matchId);
  
  res.render('print', {
    title: 'Match Result',
    match: result.match,
    scores: result.scores,
    players: result.players
  });
});

module.exports = router;