// test-db.js
require('dotenv').config();
const { Client } = require('pg');

async function testDbConnection() {
  const databaseUrl = process.env.NEXT_PUBLIC_DATABASE_URL;

  console.log('Test: Checking NEXT_PUBLIC_DATABASE_URL...');
  if (!databaseUrl) {
    console.error('Test Error: NEXT_PUBLIC_DATABASE_URL is not set.');
    return;
  }
  console.log('Test: NEXT_PUBLIC_DATABASE_URL obtained.');

  console.log('Test: Attempting to connect to database...');
  const client = new Client({
    connectionString: databaseUrl,
    ssl: {
      rejectUnauthorized: false,
    },
  });

  try {
    await client.connect();
    console.log('Test Success: Database connected successfully!');

    // 测试创建表
    console.log('Test: Creating test table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS test_table (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Test Success: Test table created!');

    // 测试插入数据
    console.log('Test: Inserting test data...');
    const insertResult = await client.query(
      'INSERT INTO test_table (name) VALUES ($1) RETURNING *',
      ['测试数据']
    );
    console.log('Test Success: Data inserted:', insertResult.rows[0]);

    // 测试查询数据
    console.log('Test: Querying test data...');
    const queryResult = await client.query('SELECT * FROM test_table');
    console.log('Test Success: Data retrieved:', queryResult.rows);

    // 清理测试数据
    console.log('Test: Cleaning up test data...');
    await client.query('DROP TABLE IF EXISTS test_table');
    console.log('Test Success: Test table cleaned up!');

    await client.end();
    console.log('Test: Database connection closed.');
  } catch (err) {
    console.error('Test Error: Database operation failed:', err);
    try {
      await client.end();
    } catch (closeErr) {
      console.error('Test Error: Failed to close connection:', closeErr);
    }
  }
}

testDbConnection();