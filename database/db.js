// database/db.js
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Create database directory if it doesn't exist
const dbDir = path.join(__dirname, '../data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir);
}

const db = new Database(path.join(dbDir, 'badminton.db'));

// Initialize database tables
const initDb = () => {
  // Create players table
  db.exec(`
    CREATE TABLE IF NOT EXISTS players (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      country TEXT,
      logo TEXT
    );
  `);

  // Create matches table
  db.exec(`
    CREATE TABLE IF NOT EXISTS matches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      match_type TEXT NOT NULL, -- 'single' or 'double'
      date TEXT NOT NULL,
      status TEXT DEFAULT 'ongoing', -- 'ongoing', 'completed', 'cancelled'
      winner_side TEXT, -- 'A' or 'B'
      side_a_logo TEXT, -- Path logo untuk Side A
      side_b_logo TEXT  -- Path logo untuk Side B
    );
  `);

  // Create match_players table (for mapping players to matches)
  db.exec(`
    CREATE TABLE IF NOT EXISTS match_players (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      match_id INTEGER NOT NULL,
      player_id INTEGER NOT NULL,
      side TEXT NOT NULL, -- 'A' or 'B'
      position INTEGER DEFAULT 1, -- For doubles: 1 or 2
      FOREIGN KEY (match_id) REFERENCES matches (id),
      FOREIGN KEY (player_id) REFERENCES players (id)
    );
  `);

  // Create scores table
  db.exec(`
    CREATE TABLE IF NOT EXISTS scores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      match_id INTEGER NOT NULL,
      set_number INTEGER NOT NULL,
      side_a_score INTEGER DEFAULT 0,
      side_b_score INTEGER DEFAULT 0,
      completed BOOLEAN DEFAULT 0,
      FOREIGN KEY (match_id) REFERENCES matches (id)
    );
  `);

  // Create settings table
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT UNIQUE NOT NULL,
      value TEXT
    );
  `);

  // Insert default settings
  const insertSetting = db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)');
  insertSetting.run('max_sets', '3');
  insertSetting.run('points_to_win', '21');
  insertSetting.run('layout', 'layout1');
  
  // Tambahkan pengaturan baru untuk fitur tampilan history
  insertSetting.run('show_history', 'false');
  insertSetting.run('history_limit', '5');

  // Check if we need to insert default data
  const playerCount = db.prepare('SELECT COUNT(*) as count FROM players').get().count;
  
  // Only insert default data if tables are empty
  if (playerCount === 0) {
    insertDefaultData();
  }
};

// Function to insert default data into all tables
const insertDefaultData = () => {
  // Use transactions for better performance and to ensure data integrity
  const transaction = db.transaction(() => {
    // Insert default players
    const insertPlayer = db.prepare('INSERT INTO players (name, country, logo) VALUES (?, ?, ?)');
    const player1Id = insertPlayer.run('Lee Chong Wei', 'Malaysia', null).lastInsertRowid;
    const player2Id = insertPlayer.run('Lin Dan', 'China', null).lastInsertRowid;
    const player3Id = insertPlayer.run('Chen Long', 'China', null).lastInsertRowid;
    const player4Id = insertPlayer.run('Viktor Axelsen', 'Denmark', null).lastInsertRowid;
    const player5Id = insertPlayer.run('Kento Momota', 'Japan', null).lastInsertRowid;
    const player6Id = insertPlayer.run('Anthony Ginting', 'Indonesia', null).lastInsertRowid;
    
    // Insert a completed singles match
    const date1 = new Date(Date.now() - 86400000).toISOString(); // Yesterday
    const insertMatch = db.prepare(`
      INSERT INTO matches (match_type, date, status, winner_side, side_a_logo, side_b_logo)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const singleMatchId = insertMatch.run(
      'single',
      date1,
      'completed',
      'A',
      '/images/logos/malaysia.png', // Logo Side A
      '/images/logos/china.png'    // Logo Side B
    ).lastInsertRowid;    
    // Insert match players for singles
    const insertMatchPlayer = db.prepare('INSERT INTO match_players (match_id, player_id, side, position) VALUES (?, ?, ?, ?)');
    insertMatchPlayer.run(singleMatchId, player1Id, 'A', 1);
    insertMatchPlayer.run(singleMatchId, player2Id, 'B', 1);
    
    // Insert scores for singles match
    const insertScore = db.prepare('INSERT INTO scores (match_id, set_number, side_a_score, side_b_score, completed) VALUES (?, ?, ?, ?, ?)');
    insertScore.run(singleMatchId, 1, 21, 19, 1);
    insertScore.run(singleMatchId, 2, 18, 21, 1);
    insertScore.run(singleMatchId, 3, 21, 15, 1);
    
    // Insert an ongoing doubles match
    const date2 = new Date().toISOString(); // Today
    const doubleMatchId = insertMatch.run(
      'double',
      date2,
      'ongoing',
      null,
      '/images/logos/denmark.png', // Logo Side A
      '/images/logos/japan.png'   // Logo Side B
    ).lastInsertRowid;    
    // Insert match players for doubles
    insertMatchPlayer.run(doubleMatchId, player3Id, 'A', 1);
    insertMatchPlayer.run(doubleMatchId, player4Id, 'A', 2);
    insertMatchPlayer.run(doubleMatchId, player5Id, 'B', 1);
    insertMatchPlayer.run(doubleMatchId, player6Id, 'B', 2);
    
    // Insert scores for ongoing doubles match
    insertScore.run(doubleMatchId, 1, 21, 18, 1);
    insertScore.run(doubleMatchId, 2, 15, 19, 0); // Ongoing set
    insertScore.run(doubleMatchId, 3, 0, 0, 0);
    
    // Insert another completed match
    const date3 = new Date(Date.now() - 172800000).toISOString(); // Two days ago
    const singleMatch2Id = insertMatch.run('single', date3, 'completed', 'B','/images/logos/denmark.png','/images/logos/china.png').lastInsertRowid;
    
    // Insert players for second singles match
    insertMatchPlayer.run(singleMatch2Id, player3Id, 'A', 1);
    insertMatchPlayer.run(singleMatch2Id, player5Id, 'B', 1);
    
    // Insert scores for second singles match
    insertScore.run(singleMatch2Id, 1, 17, 21, 1);
    insertScore.run(singleMatch2Id, 2, 21, 19, 1);
    insertScore.run(singleMatch2Id, 3, 15, 21, 1);
  });
  
  // Execute transaction
  transaction();
  
  console.log('Default data inserted successfully');
};

// Initialize the database
initDb();

module.exports = db;