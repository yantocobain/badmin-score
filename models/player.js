// models/player.js
const db = require('../database/db');

class Player {
  static create(name, country = null, logo = null) {
    const stmt = db.prepare('INSERT INTO players (name, country, logo) VALUES (?, ?, ?)');
    const info = stmt.run(name, country, logo);
    return info.lastInsertRowid;
  }
  
  static getById(id) {
    return db.prepare('SELECT * FROM players WHERE id = ?').get(id);
  }
  
  static getAll() {
    return db.prepare('SELECT * FROM players ORDER BY name').all();
  }
  
  static update(id, name, country = null, logo = null) {
    const stmt = db.prepare('UPDATE players SET name = ?, country = ?, logo = ? WHERE id = ?');
    return stmt.run(name, country, logo, id);
  }
}

module.exports = Player;
