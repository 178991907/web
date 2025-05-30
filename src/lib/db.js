const { Pool } = require('pg');
const mongoose = require('mongoose');
require('dotenv').config();

const DB_TYPE = process.env.DB_TYPE || 'postgresql';

let db;

if (DB_TYPE === 'postgresql') {
    // PostgreSQL 配置
    db = new Pool({
        host: process.env.PG_HOST,
        user: process.env.PG_USER,
        password: process.env.PG_PASSWORD,
        database: process.env.PG_DATABASE,
        port: process.env.PG_PORT || 5432
    });

    // PostgreSQL CRUD 方法
    module.exports = {
        query: async (text, params) => (await db.query(text, params)).rows,
        getUsers: async () => (await db.query('SELECT * FROM Users')).rows,
        getCategories: async () => (await db.query('SELECT * FROM Categories')).rows,
        getLinks: async () => (await db.query('SELECT l.*, c.name AS category_name FROM Links l JOIN Categories c ON l.category_id = c.id')).rows,
        addCategory: async (name) => await db.query('INSERT INTO Categories (name) VALUES ($1)', [name]),
        addLink: async (category_id, name, url) => await db.query('INSERT INTO Links (category_id, name, url) VALUES ($1, $2, $3)', [category_id, name, url])
    };
} else if (DB_TYPE === 'mongodb') {
    // MongoDB 配置
    mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

    const UserSchema = new mongoose.Schema({
        username: String,
        password: String,
        created_at: { type: Date, default: Date.now }
    });

    const CategorySchema = new mongoose.Schema({
        name: String,
        created_at: { type: Date, default: Date.now }
    });

    const LinkSchema = new mongoose.Schema({
        category: { _id: String, name: String },
        name: String,
        url: String,
        created_at: { type: Date, default: Date.now }
    });

    const User = mongoose.model('User', UserSchema);
    const Category = mongoose.model('Category', CategorySchema);
    const Link = mongoose.model('Link', LinkSchema);

    // MongoDB CRUD 方法
    module.exports = {
        getUsers: async () => await User.find(),
        getCategories: async () => await Category.find(),
        getLinks: async () => await Link.find(),
        addCategory: async (name) => await Category.create({ name }),
        addLink: async (category_id, name, url) => {
            const category = await Category.findById(category_id);
            await Link.create({ category: { _id: category_id, name: category.name }, name, url });
        }
    };
} else {
    throw new Error('Invalid DB_TYPE in environment variables');
}