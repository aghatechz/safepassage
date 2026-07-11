const { Pool } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;

const poolConfig = connectionString 
  ? { connectionString, connectionTimeoutMillis: 5000 }
  : {
      user: process.env.DB_USER || 'postgres',
      host: process.env.DB_HOST || 'localhost',
      database: process.env.DB_NAME || 'safepassage',
      password: process.env.DB_PASSWORD || 'postgres',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      connectionTimeoutMillis: 5000,
    };

// For AWS RDS deploy or local testing
if (process.env.NODE_ENV === 'production' && poolConfig.connectionString) {
  poolConfig.ssl = {
    rejectUnauthorized: false
  };
}

const pool = new Pool(poolConfig);

let dbConnected = false;

// Export a ready promise so server.js can wait for the DB check before listening.
// This prevents a race condition where signup/login requests arrive before the
// async connection test finishes, causing silent fallback to the mock data store.
let _resolveReady;
const ready = new Promise((resolve) => { _resolveReady = resolve; });

// Test query to verify connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Database connection error:', err.message);
    console.log('⚠️ Server will start without database. DB features will return errors.');
  } else {
    dbConnected = true;
    console.log('✅ Database connected successfully at:', res.rows[0].now);
  }
  // Resolve the promise regardless so the server always starts
  _resolveReady();
});

module.exports = { pool, dbConnected, isDbConnected: () => dbConnected, ready };
