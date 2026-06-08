const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, 'skystrike.db');

let db;

function getDb() {
    if (!db) {
        db = new Database(DB_PATH);
        db.pragma('journal_mode = WAL');
        db.pragma('foreign_keys = ON');
        initSchema();
    }
    return db;
}

function initSchema() {
    db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            created_at INTEGER NOT NULL
        );

        CREATE TABLE IF NOT EXISTS game_data (
            user_id INTEGER NOT NULL UNIQUE,
            data TEXT NOT NULL DEFAULT '{}',
            updated_at INTEGER NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
    `);
}

function close() {
    if (db) {
        db.close();
        db = null;
    }
}

module.exports = { getDb, close };
