const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname));

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

// Models
const User = require('./models/User');
const Message = require('./models/Message');

// Routes
app.post('/api/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        const existingUser = await User.findOne({ $or: [{ username }, { email }] });
        if (existingUser) {
            return res.status(400).json({ error: 'Username or email already exists' });
        }

        const user = new User({ username, email, password });
        await user.save();

        res.json({ success: true, message: 'Registration successful' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        const user = await User.findOne({
            $or: [{ username }, { email: username }]
        });

        if (!user || !(await user.comparePassword(password))) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        user.status = 'online';
        await user.save();

        req.session.userId = user._id;
        req.session.username = user.username;

        res.json({ 
            success: true, 
            user: { 
                id: user._id, 
                username: user.username, 
                email: user.email 
            } 
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/logout', async (req, res) => {
    if (req.session.userId) {
        await User.findByIdAndUpdate(req.session.userId, { status: 'offline' });
        req.session.destroy();
    }
    res.json({ success: true });
});

app.get('/api/user', (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    res.json({ 
        userId: req.session.userId, 
        username: req.session.username 
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
