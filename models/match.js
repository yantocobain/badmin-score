// models/match.js
const db = require('../database/db');

class Match {
  static create(matchType, playerIds, countries, sideALogo, sideBLogo) {
    // Validasi parameter input
    if (!matchType || (matchType !== 'single' && matchType !== 'double')) {
      throw new Error('Invalid match type. Must be either "single" or "double"');
    }
    
    if (!playerIds || !Array.isArray(playerIds)) {
      throw new Error('Player IDs must be an array');
    }
    
    // Validasi jumlah pemain berdasarkan jenis pertandingan
    const expectedPlayerCount = matchType === 'single' ? 2 : 4;
    if (playerIds.length !== expectedPlayerCount) {
      throw new Error(`Expected ${expectedPlayerCount} players for ${matchType} match, but got ${playerIds.length}`);
    }

    // Pastikan logo memiliki nilai valid
    sideALogo = sideALogo || '/images/logos/default.png';
    sideBLogo = sideBLogo || '/images/logos/default.png';
    
    // Format countries array jika perlu
    if (!countries || !Array.isArray(countries)) {
      countries = new Array(playerIds.length).fill(null);
    }
    
    const date = new Date().toISOString();
    
    const insertMatch = db.prepare(`
      INSERT INTO matches (match_type, date, status, side_a_logo, side_b_logo)
      VALUES (?, ?, 'ongoing', ?, ?)
    `);
    
    const insertPlayer = db.prepare(`
      INSERT INTO players (name, country)
      VALUES (?, ?)
    `);
    
    const insertMatchPlayer = db.prepare(`
      INSERT INTO match_players (match_id, player_id, side, position)
      VALUES (?, ?, ?, ?)
    `);
    
    const insertScore = db.prepare(`
      INSERT INTO scores (match_id, set_number)
      VALUES (?, ?)
    `);
    
    try {
      // Use transaction to ensure data integrity
      const matchId = db.transaction(() => {
        console.log(`Inserting match with type: ${matchType}, date: ${date}, logoA: ${sideALogo}, logoB: ${sideBLogo}`);
        
        // Insert match
        const matchInfo = insertMatch.run(matchType, date, sideALogo, sideBLogo);
        const matchId = matchInfo.lastInsertRowid;
        
        console.log(`Match created with ID: ${matchId}`);
        
        // Insert players and match_players
        const sides = ['A', 'B'];
        
        for (let sideIndex = 0; sideIndex < sides.length; sideIndex++) {
          const side = sides[sideIndex];
          
          if (matchType === 'single') {
            // For singles, we have one player per side
            const playerName = playerIds[sideIndex];
            const country = countries[sideIndex] || null;
            
            console.log(`Inserting single player: ${playerName}, country: ${country}, side: ${side}`);
            
            const playerInfo = insertPlayer.run(playerName, country);
            const playerId = playerInfo.lastInsertRowid;
            
            insertMatchPlayer.run(matchId, playerId, side, 1);
          } else {
            // For doubles, we have two players per side
            const playerOffset = sideIndex * 2;
            
            for (let pos = 0; pos < 2; pos++) {
              const playerName = playerIds[playerOffset + pos];
              const country = countries[playerOffset + pos] || null;
              
              console.log(`Inserting double player: ${playerName}, country: ${country}, side: ${side}, position: ${pos + 1}`);
              
              const playerInfo = insertPlayer.run(playerName, country);
              const playerId = playerInfo.lastInsertRowid;
              
              insertMatchPlayer.run(matchId, playerId, side, pos + 1);
            }
          }
        }
        
        // Initialize score sets (3 sets by default)
        const maxSets = db.prepare('SELECT value FROM settings WHERE key = ?').get('max_sets');
        const setsCount = maxSets ? parseInt(maxSets.value) : 3;
        
        for (let i = 1; i <= setsCount; i++) {
          insertScore.run(matchId, i);
        }
        
        return matchId;
      })();
      
      return matchId;
    } catch (error) {
      console.error('Error creating match:', error);
      throw error;
    }
  }
  
  static getById(id) {
    return db.prepare(`
      SELECT id, match_type, date, status, winner_side, side_a_logo, side_b_logo
      FROM matches
      WHERE id = ?
    `).get(id);
  }
  
  static getCurrent() {
    return db.prepare(`
      SELECT id, match_type, date, status, winner_side, side_a_logo, side_b_logo
      FROM matches
      WHERE status = 'ongoing'
      ORDER BY id DESC
      LIMIT 1
    `).get();
  }
    
  static getPlayers(matchId) {
    return db.prepare(`
      SELECT p.*, mp.side, mp.position
      FROM players p
      JOIN match_players mp ON p.id = mp.player_id
      WHERE mp.match_id = ?
      ORDER BY mp.side, mp.position
    `).all(matchId);
  }
  
  static getScores(matchId) {
    return db.prepare('SELECT * FROM scores WHERE match_id = ? ORDER BY set_number').all(matchId);
  }
  
  static updateScore(matchId, setNumber, sideAScore, sideBScore) {
    const updateScore = db.prepare(`
      UPDATE scores
      SET side_a_score = ?, side_b_score = ?
      WHERE match_id = ? AND set_number = ?
    `);
    
    return updateScore.run(sideAScore, sideBScore, matchId, setNumber);
  }
  
  static switchSides(matchId) {
    // Switch sides by updating player records
    const switchSidesQuery = db.prepare(`
      UPDATE match_players
      SET side = CASE 
                   WHEN side = 'A' THEN 'B'
                   WHEN side = 'B' THEN 'A'
                 END
      WHERE match_id = ?
    `);
    
    return switchSidesQuery.run(matchId);
  }
  
    // Method untuk menukar logo saat pergantian sisi
  static switchLogos(matchId, sideALogo, sideBLogo) {
    const updateLogos = db.prepare(`
      UPDATE matches
      SET side_a_logo = ?, side_b_logo = ?
      WHERE id = ?
    `);
    
    // Menukar logo tim A dan tim B
    return updateLogos.run(sideBLogo, sideALogo, matchId);
  }
  
  // Method untuk memperbarui path logo
  static updateLogo(matchId, side, logoPath) {
    const updateQuery = db.prepare(`
      UPDATE matches
      SET ${side === 'A' ? 'side_a_logo' : 'side_b_logo'} = ?
      WHERE id = ?
    `);
    
    return updateQuery.run(logoPath, matchId);
  }
  
  static endMatch(matchId, winnerSide) {
    const updateMatch = db.prepare(`
      UPDATE matches
      SET status = 'completed', winner_side = ?
      WHERE id = ?
    `);
    
    return updateMatch.run(winnerSide, matchId);
  }
  
  static getHistory(limit = 10) {
    
    return db.prepare(`
      SELECT m.*, 
             SUM(CASE WHEN s.side_a_score > s.side_b_score THEN 1 ELSE 0 END) as side_a_sets,
             SUM(CASE WHEN s.side_b_score > s.side_a_score THEN 1 ELSE 0 END) as side_b_sets
      FROM matches m
      LEFT JOIN scores s ON m.id = s.match_id AND s.completed = 1
      WHERE m.status = 'completed'
      GROUP BY m.id
      ORDER BY m.date DESC
      LIMIT ?
    `).all(limit);
  }
  
  // Mendapatkan detail match beserta pemain untuk riwayat di frontend
  static getHistoryDetail(matchId) {
    const match = this.getById(matchId);
    const players = this.getPlayers(matchId);
    const scores = this.getScores(matchId);
    
    // Mengelompokkan pemain berdasarkan sisi
    const sides = {
      A: players.filter(p => p.side === 'A').sort((a, b) => a.position - b.position),
      B: players.filter(p => p.side === 'B').sort((a, b) => a.position - b.position)
    };
    
    return {
      match,
      sides,
      scores
    };
  }
}

module.exports = Match;