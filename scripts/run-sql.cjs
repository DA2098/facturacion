#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

async function runFile(filePath, connectionString) {
  const sql = fs.readFileSync(filePath, 'utf8');
  // Enable SSL for hosted Postgres if needed (Render requires TLS)
  const clientOptions = { connectionString };
  if (connectionString.includes('render.com') || process.env.FORCE_PG_SSL === 'true' || connectionString.includes('sslmode=require')) {
    clientOptions.ssl = { rejectUnauthorized: false };
  }
  const client = new Client(clientOptions);
  try {
    await client.connect();
    console.log('Executing', filePath);
    await client.query(sql);
    console.log('Done', filePath);
  } finally {
    await client.end();
  }
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error('Usage: node scripts/run-sql.cjs <file1.sql> [file2.sql ...] [CONNECTION_STRING]');
    process.exit(1);
  }

  let connectionString = process.env.DATABASE_URL || '';
  const last = args[args.length - 1];
  const files = [];
  if (typeof last === 'string' && last.startsWith('postgres')) {
    connectionString = last;
    files.push(...args.slice(0, -1));
  } else {
    files.push(...args);
  }

  if (!connectionString) {
    console.error('No DATABASE_URL provided. Set environment variable DATABASE_URL or pass connection string as last argument.');
    process.exit(1);
  }

  for (const f of files) {
    const p = path.resolve(f);
    if (!fs.existsSync(p)) {
      console.error('File not found:', p);
      process.exit(1);
    }
    try {
      await runFile(p, connectionString);
    } catch (err) {
      console.error('Error executing', f);
      console.error(err.message || err);
      process.exit(1);
    }
  }
}

main();
