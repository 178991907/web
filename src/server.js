const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const db = require('./lib/db');

const app = express();
app.use(cors());
app.use(express.json());

// 登录接口
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const users = await db.getUsers();
        const user = users.find(u => u.username === username);
        if (!user) return res.status(401).json({ message: 'Invalid credentials' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.json({ token });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// 获取所有类别
app.get('/api/categories', async (req, res) => {
    try {
        const categories = await db.getCategories();
        res.json(categories);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// 添加类别
app.post('/api/categories', async (req, res) => {
    const { name } = req.body;
    try {
        await db.addCategory(name);
        res.status(201).json({ message: 'Category added' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// 获取所有链接
app.get('/api/links', async (req, res) => {
    try {
        const links = await db.getLinks();
        res.json(links);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// 添加链接
app.post('/api/links', async (req, res) => {
    const { category_id, name, url } = req.body;
    try {
        await db.addLink(category_id, name, url);
        res.status(201).json({ message: 'Link added' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// 动态路由：根据类别获取链接
app.get('/api/categories/:categoryId/links', async (req, res) => {
    const { categoryId } = req.params;
    try {
        const links = await db.getLinks();
        const filteredLinks = links.filter(link => link.category_id == categoryId || link.category._id == categoryId);
        res.json(filteredLinks);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));