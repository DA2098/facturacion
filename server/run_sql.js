const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

async function run() {
  const conn = process.argv[2] || process.env.DATABASE_URL;
  const fileArg = process.argv[3] || process.env.SQL_FILE;
  if (!conn) {
    console.error('Error: connection string required as first argument or DATABASE_URL env');
    process.exit(1);
  }
  if (!fileArg) {
    console.error('Error: SQL file path required as second argument or SQL_FILE env');
    process.exit(1);
  }

  const sqlPath = path.resolve(fileArg);
  if (!fs.existsSync(sqlPath)) {
    console.error('Error: SQL file not found:', sqlPath);
    process.exit(1);
  }

  const sql = fs.readFileSync(sqlPath, 'utf8');
  // Enable SSL for hosts that require TLS (Render, Heroku, etc.).
  const clientConfig = { connectionString: conn };
  // If SSL is not explicitly disabled via env NO_SSL, enable SSL with
  // rejectUnauthorized=false to accept Render's cert in many environments.
  if (!process.env.NO_SSL) {
    clientConfig.ssl = { rejectUnauthorized: false };
  }
  const client = new Client(clientConfig);

  try {
    console.log('Connecting to database...');
    await client.connect();
    console.log('Executing SQL file:', sqlPath);
    await client.query('BEGIN');
    // Execute the whole script
    await client.query(sql);
    await client.query('COMMIT');
    console.log('SQL executed successfully.');
  } catch (err) {
    console.error('SQL execution error:', err.message || err);
    try { await client.query('ROLLBACK'); } catch (e) {}
    process.exitCode = 2;
  } finally {
    await client.end();
  }
}

run();
