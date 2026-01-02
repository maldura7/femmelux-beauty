// Quick database check script
// Run: node check-db.js

const { Client } = require('pg');

// Connection details from your DigitalOcean screenshot
// You need to fill in the password from the "Show" button
const config = {
  host: 'app-76e51851-c939-4ca9-bbb9-88b5d16cec33-do-user-13702439-0.h.db.ondigitalocean.com',
  port: 25060,
  database: 'femmelux-db',
  user: 'femmelux-db',
  password: process.argv[2] || 'YOUR_PASSWORD_HERE', // Pass password as argument
  ssl: { rejectUnauthorized: false }
};

async function checkDB() {
  if (!process.argv[2]) {
    console.log(`
Usage: node check-db.js YOUR_DATABASE_PASSWORD

Get the password from DigitalOcean:
1. Go to your app settings
2. Click on femmelux-db
3. Click "Show" next to the password field
4. Copy and paste it as the argument
`);
    return;
  }

  const client = new Client(config);

  try {
    console.log('Connecting to DigitalOcean database...');
    await client.connect();
    console.log('✓ Connected!\n');

    // Check user
    const user = await client.query('SELECT current_user');
    console.log('Current user:', user.rows[0].current_user);

    // Check existing tables
    const tables = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
    `);
    console.log('\nExisting tables:', tables.rows.length === 0 ? 'None' : '');
    tables.rows.forEach(t => console.log('  -', t.table_name));

    // Test CREATE permission
    console.log('\nTesting CREATE permission...');
    try {
      await client.query('CREATE TABLE _perm_test (id serial)');
      await client.query('DROP TABLE _perm_test');
      console.log('✓ CREATE permission: GRANTED');
      console.log('\n✓ Database is ready! Run: npx prisma db push');
    } catch (e) {
      console.log('✗ CREATE permission: DENIED');
      console.log('  Error:', e.message);
      console.log(`
╔══════════════════════════════════════════════════════════════╗
║  SOLUTION REQUIRED                                            ║
╠══════════════════════════════════════════════════════════════╣
║                                                               ║
║  The Dev Database doesn't allow creating tables.              ║
║                                                               ║
║  You need to "Convert to a Managed Database":                 ║
║  1. Go to your app in DigitalOcean                            ║
║  2. Click Settings > femmelux-db                              ║
║  3. Click "Convert to a Managed Database"                     ║
║  4. This will give you proper admin access                    ║
║                                                               ║
║  After converting, redeploy your app.                         ║
║                                                               ║
╚══════════════════════════════════════════════════════════════╝
`);
    }

  } catch (error) {
    console.error('Connection error:', error.message);
  } finally {
    await client.end();
  }
}

checkDB();
