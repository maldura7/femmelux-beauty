// Database Fix Script for FemmeLux Beauty
// Run this locally: node fix-database.js

const { Client } = require('pg');

// Get connection details from command line or use defaults
// Usage: node fix-database.js "postgresql://user:password@host:port/database?sslmode=require"

const connectionString = process.argv[2];

if (!connectionString) {
  console.log(`
╔═══════════════════════════════════════════════════════════════════╗
║  FemmeLux Database Fix Script                                      ║
╠═══════════════════════════════════════════════════════════════════╣
║                                                                    ║
║  Usage: node fix-database.js "CONNECTION_STRING"                   ║
║                                                                    ║
║  Get the connection string from DigitalOcean:                      ║
║  1. Go to Apps > femmelux-beauty > Settings                        ║
║  2. Click on femmelux-db component                                 ║
║  3. Copy the "Connection String" value                             ║
║                                                                    ║
║  Example:                                                          ║
║  node fix-database.js "postgresql://user:pass@host:25060/db"       ║
║                                                                    ║
╚═══════════════════════════════════════════════════════════════════╝
`);
  process.exit(1);
}

async function fixDatabase() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('Connecting to database...');
    await client.connect();
    console.log('✓ Connected successfully');

    // Check current user and permissions
    const userResult = await client.query('SELECT current_user, current_database()');
    console.log(`\nCurrent user: ${userResult.rows[0].current_user}`);
    console.log(`Database: ${userResult.rows[0].current_database}`);

    // Check if we can create tables
    console.log('\nChecking permissions...');

    // Try to create a test table
    try {
      await client.query('CREATE TABLE IF NOT EXISTS _test_permissions (id int)');
      await client.query('DROP TABLE IF EXISTS _test_permissions');
      console.log('✓ CREATE TABLE permission: YES');
    } catch (err) {
      console.log('✗ CREATE TABLE permission: NO');
      console.log(`  Error: ${err.message}`);

      // Check if we're the database owner
      const ownerResult = await client.query(`
        SELECT pg_catalog.pg_get_userbyid(d.datdba) as owner
        FROM pg_catalog.pg_database d
        WHERE d.datname = current_database()
      `);
      console.log(`\nDatabase owner: ${ownerResult.rows[0]?.owner || 'unknown'}`);

      console.log(`
╔═══════════════════════════════════════════════════════════════════╗
║  PERMISSION ERROR                                                  ║
╠═══════════════════════════════════════════════════════════════════╣
║                                                                    ║
║  The database user does not have permission to create tables.      ║
║                                                                    ║
║  For DigitalOcean Dev Databases, you need to:                      ║
║  1. Click "Convert to a Managed Database" in the settings          ║
║  2. Or create a new Managed Database from the Databases section    ║
║                                                                    ║
║  Dev Databases have restricted permissions and cannot be changed.  ║
║                                                                    ║
╚═══════════════════════════════════════════════════════════════════╝
`);
      return;
    }

    // If we have permissions, create the schema
    console.log('\n✓ Permissions OK! Creating tables...');

    // Run Prisma schema
    console.log('\nYou can now run: npx prisma db push');
    console.log('Or deploy the app again and migrations should work.');

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

fixDatabase();
