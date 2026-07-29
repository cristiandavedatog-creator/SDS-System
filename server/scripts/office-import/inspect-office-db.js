// One-off inspection tool: connects to the OFFICE database (OFFICE_DB_*
// env vars, see server/.env.example) and prints its tables, columns, row
// counts, and a few sample rows. Run this BEFORE writing any real
// extraction query, so the extraction script targets real table/column
// names instead of guessed ones.
//
// Usage (from server/): node scripts/office-import/inspect-office-db.js
require('dotenv').config();
const mysql = require('mysql2/promise');

async function main() {
  const required = ['OFFICE_DB_HOST', 'OFFICE_DB_USER', 'OFFICE_DB_NAME'];
  const missing = required.filter((k) => !process.env[k]);
  if (missing.length) {
    console.error(`Missing env vars: ${missing.join(', ')} — fill these into server/.env first.`);
    process.exit(1);
  }

  const conn = await mysql.createConnection({
    host: process.env.OFFICE_DB_HOST,
    port: Number(process.env.OFFICE_DB_PORT) || 3306,
    user: process.env.OFFICE_DB_USER,
    password: process.env.OFFICE_DB_PASSWORD,
    database: process.env.OFFICE_DB_NAME,
  });

  const [tables] = await conn.query('SHOW TABLES');
  const tableKey = tables.length ? Object.keys(tables[0])[0] : null;

  for (const row of tables) {
    const tableName = row[tableKey];
    console.log(`\n=== ${tableName} ===`);

    const [columns] = await conn.query('SHOW COLUMNS FROM ??', [tableName]);
    for (const col of columns) {
      console.log(`  ${col.Field}  ${col.Type}${col.Key === 'PRI' ? '  [PK]' : ''}`);
    }

    const [[{ count }]] = await conn.query('SELECT COUNT(*) AS count FROM ??', [tableName]);
    console.log(`  rows: ${count}`);

    // Flag any column that looks like a date/timestamp we could filter
    // "recent" on later.
    const dateCols = columns.filter((c) => /date|time|created|updated|added/i.test(c.Field));
    if (dateCols.length) {
      console.log(`  possible date/recency columns: ${dateCols.map((c) => c.Field).join(', ')}`);
    }
  }

  await conn.end();
}

main().catch((err) => {
  console.error('Inspection failed:', err.message);
  process.exit(1);
});
