const { Client } = require('pg');

async function main() {
  const conn = process.argv[2] || process.env.DATABASE_URL;
  if (!conn) {
    console.error('Usage: node count_empty_tables.js <connectionString>');
    process.exit(1);
  }

  const client = new Client({ connectionString: conn, ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    // Get list of public tables
    const res = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);

    const tables = res.rows.map(r => r.table_name);
    const empty = [];
    for (const t of tables) {
      try {
        const r2 = await client.query(`SELECT COUNT(*)::int AS cnt FROM "${t}"`);
        const cnt = r2.rows[0].cnt;
        if (cnt === 0) empty.push(t);
      } catch (e) {
        // ignore errors on system tables or permission issues
        console.error(`Skipping table ${t}: ${e.message}`);
      }
    }

    if (empty.length === 0) {
      console.log('No hay tablas vacías en el esquema public.');
    } else {
      console.log('Tablas vacías (0 filas):');
      empty.forEach(t => console.log('-', t));
    }
  } finally {
    await client.end();
  }
}

main().catch(err => {
  console.error('Error:', err.message || err);
  process.exit(2);
});
