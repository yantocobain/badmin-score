// routes/admin.js
const express = require('express');
const router = express.Router();
const Match = require('../models/match');
const Score = require('../models/score');

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
  
// Instead of:
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
  res.render('admin/match-setup', { 
    title: 'Match Setup',
    settings
  });
});

router.post('/setup', (req, res) => {
  try {
    const { matchType, player1A, player1B, player2A, player2B, country1A, country1B, country2A, country2B } = req.body;
    
    let playerNames = [];
    let countries = [];
    
    if (matchType === 'single') {
      playerNames = [player1A, player1B];
      countries = [country1A, country1B];
    } else {
      playerNames = [player1A, player2A, player1B, player2B];
      countries = [country1A, country2A, country1B, country2B];
    }
    
    const matchId = Match.create(matchType, playerNames, countries);
    
    // Make sure matchId is valid
    if (!matchId) {
      throw new Error('Failed to create match - no match ID returned');
    }
    
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
  
// Instead of:
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
  const { maxSets, pointsToWin, layout } = req.body;
  
  Score.updateSetting('max_sets', maxSets);
  Score.updateSetting('points_to_win', pointsToWin);
  Score.updateSetting('layout', layout);
  
  res.redirect('/admin/settings');
});

module.exports = router;
