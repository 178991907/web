const { Client } = require('pg');
require('dotenv').config();

async function initTestData() {
  const databaseUrl = process.env.NEXT_PUBLIC_DATABASE_URL;

  if (!databaseUrl) {
    console.error('Error: NEXT_PUBLIC_DATABASE_URL is not set.');
    return;
  }

  const client = new Client({
    connectionString: databaseUrl,
    ssl: {
      rejectUnauthorized: false,
    },
  });

  try {
    await client.connect();
    console.log('Connected to database successfully!');

    // 创建必要的表
    console.log('Creating tables...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS Categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS Links (
        id SERIAL PRIMARY KEY,
        category_id INT NOT NULL,
        name VARCHAR(100) NOT NULL,
        url VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES Categories(id) ON DELETE CASCADE
      );
    `);
    console.log('Tables created successfully!');

    // 插入测试分类数据
    console.log('Inserting test categories...');
    const categories = [
      { name: '搜索引擎' },
      { name: '社交媒体' },
      { name: '技术文档' },
    ];

    for (const category of categories) {
      const result = await client.query(
        'INSERT INTO Categories (name) VALUES ($1) RETURNING id, name',
        [category.name]
      );
      console.log(`Added category: ${result.rows[0].name}`);
    }

    // 获取所有分类
    const categoriesResult = await client.query('SELECT id, name FROM Categories');
    const categoryMap = categoriesResult.rows.reduce((acc, cat) => {
      acc[cat.name] = cat.id;
      return acc;
    }, {});

    // 插入测试链接数据
    console.log('Inserting test links...');
    const links = [
      { category: '搜索引擎', name: '百度', url: 'https://www.baidu.com' },
      { category: '搜索引擎', name: '谷歌', url: 'https://www.google.com' },
      { category: '社交媒体', name: '微博', url: 'https://www.weibo.com' },
      { category: '社交媒体', name: 'Twitter', url: 'https://twitter.com' },
      { category: '技术文档', name: 'MDN', url: 'https://developer.mozilla.org' },
      { category: '技术文档', name: 'React文档', url: 'https://react.dev' },
    ];

    for (const link of links) {
      const categoryId = categoryMap[link.category];
      const result = await client.query(
        'INSERT INTO Links (category_id, name, url) VALUES ($1, $2, $3) RETURNING id, name',
        [categoryId, link.name, link.url]
      );
      console.log(`Added link: ${result.rows[0].name}`);
    }

    // 验证数据
    console.log('\nVerifying data...');
    const allCategories = await client.query('SELECT * FROM Categories');
    console.log('\nAll Categories:', allCategories.rows);

    const allLinks = await client.query(`
      SELECT l.*, c.name as category_name 
      FROM Links l 
      JOIN Categories c ON l.category_id = c.id
    `);
    console.log('\nAll Links:', allLinks.rows);

    console.log('\nTest data initialization completed successfully!');
  } catch (error) {
    console.error('Error during test data initialization:', error);
  } finally {
    await client.end();
    console.log('Database connection closed.');
  }
}

initTestData().catch(console.error);