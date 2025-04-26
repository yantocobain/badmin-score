// models/score.js
const db = require('../database/db');

class Score {
  static getSettings() {
    const settings = {};
    
    const rows = db.prepare('SELECT key, value FROM settings').all();
    rows.forEach(row => {
      settings[row.key] = row.value;
    });
    
    return settings;
  }
  
  static updateSetting(key, value) {
    const stmt = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
    return stmt.run(key, value);
  }
  
  static completeSet(matchId, setNumber, sideAScore, sideBScore) {
    // Validate the scores
    if (typeof sideAScore !== 'number' || typeof sideBScore !== 'number') {
      throw new Error('Scores must be numbers');
    }
    
    if (sideAScore < 0 || sideBScore < 0) {
      throw new Error('Scores cannot be negative');
    }
    
    const stmt = db.prepare(`
      UPDATE scores
      SET side_a_score = ?, side_b_score = ?, completed = 1
      WHERE match_id = ? AND set_number = ?
    `);
    
    return stmt.run(sideAScore, sideBScore, matchId, setNumber);
  }
  
  static getMatchResult(matchId) {
    const match = db.prepare('SELECT * FROM matches WHERE id = ?').get(matchId);
    
    const scores = db.prepare(`
      SELECT * FROM scores 
      WHERE match_id = ? 
      ORDER BY set_number
    `).all(matchId);
    
    const players = db.prepare(`
      SELECT p.*, mp.side, mp.position
      FROM players p
      JOIN match_players mp ON p.id = mp.player_id
      WHERE mp.match_id = ?
      ORDER BY mp.side, mp.position
    `).all(matchId);
    
    return {
      match,
      scores,
      players
    };
  }
  
  // Inisialisasi database dengan pengaturan baru
  static initializeNewSettings() {
    // Periksa apakah pengaturan show_history sudah ada
    const showHistorySetting = db.prepare('SELECT value FROM settings WHERE key = ?').get('show_history');
    
    // Jika belum ada, tambahkan dengan nilai default "false"
    if (!showHistorySetting) {
      this.updateSetting('show_history', 'false');
      console.log('Initialized show_history setting to false');
    }
    
    // Periksa apakah pengaturan history_limit sudah ada
    const historyLimitSetting = db.prepare('SELECT value FROM settings WHERE key = ?').get('history_limit');
    
    // Jika belum ada, tambahkan dengan nilai default "5"
    if (!historyLimitSetting) {
      this.updateSetting('history_limit', '5');
      console.log('Initialized history_limit setting to 5');
    }
  }
}

module.exports = Score;