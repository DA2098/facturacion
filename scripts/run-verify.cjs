#!/usr/bin/env node
const { Client } = require('pg');

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('Set DATABASE_URL environment variable first.');
    process.exit(1);
  }

  const clientOptions = { connectionString };
  if (connectionString.includes('render.com') || connectionString.includes('sslmode=require')) {
    clientOptions.ssl = { rejectUnauthorized: false };
  }

  const client = new Client(clientOptions);
  try {
    await client.connect();

    const t = await client.query("SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public';");
    console.log('\n== Tables ==');
    t.rows.forEach(r => console.log('-', r.tablename));

    const c = await client.query('SELECT count(*) AS usuarios_count FROM usuarios;');
    console.log('\n== Usuarios count ==');
    console.log(c.rows[0].usuarios_count);

    const s = await client.query('SELECT id, email, nombre, rol FROM usuarios ORDER BY created_at LIMIT 5;');
    console.log('\n== Sample usuarios ==');
    s.rows.forEach(r => console.log(r));
  } catch (err) {
    console.error('Error querying DB:', err.message || err);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

main();
