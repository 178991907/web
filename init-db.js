const { Client } = require('pg');
require('dotenv').config();

async function initializeDatabase() {
  const client = new Client({
    connectionString: process.env.NEXT_PUBLIC_DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log('Connected to database successfully!');

    // 创建Users表
    await client.query(`
      CREATE TABLE IF NOT EXISTS Users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Users table created successfully!');

    // 创建Categories表
    await client.query(`
      CREATE TABLE IF NOT EXISTS Categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Categories table created successfully!');

    // 创建Links表
    await client.query(`
      CREATE TABLE IF NOT EXISTS Links (
        id SERIAL PRIMARY KEY,
        category_id INT NOT NULL,
        name VARCHAR(100) NOT NULL,
        url VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES Categories(id) ON DELETE CASCADE
      );
    `);
    console.log('Links table created successfully!');

    // 创建Settings表
    await client.query(`
      CREATE TABLE IF NOT EXISTS Settings (
        id SERIAL PRIMARY KEY,
        key VARCHAR(50) NOT NULL UNIQUE,
        value TEXT,
        description VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Settings table created successfully!');

  } catch (error) {
    console.error('Error initializing database:', error);
  } finally {
    await client.end();
    console.log('Database connection closed.');
  }
}

initializeDatabase();