const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const app = express();

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname));

app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));

// Data files
const USERS_FILE = path.join(__dirname, 'data', 'users.json');
const MESSAGES_FILE = path.join(__dirname, 'data', 'messages.json');

// Ensure data directory exists
if (!fs.existsSync(path.join(__dirname, 'data'))) {
    fs.mkdirSync(path.join(__dirname, 'data'));
}

// Initialize files if they don't exist
if (!fs.existsSync(USERS_FILE)) {
    fs.writeFileSync(USERS_FILE, JSON.stringify([]));
}
if (!fs.existsSync(MESSAGES_FILE)) {
    fs.writeFileSync(MESSAGES_FILE, JSON.stringify([]));
}

// Helper functions
const readUsers = () => JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
const writeUsers = (users) => fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));

// Routes
app.post('/api/register', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        const users = readUsers();
        
        if (users.find(u => u.username === username)) {
            return res.status(400).json({ error: 'Username already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        
        const newUser = {
            id: Date.now().toString(),
            username,
            password: hashedPassword,
            avatar: null,
            status: 'offline',
            createdAt: new Date().toISOString()
        };

        users.push(newUser);
        writeUsers(users);

        res.json({ success: true, message: 'Registration successful' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        const users = readUsers();
        const user = users.find(u => u.username === username);

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        user.status = 'online';
        writeUsers(users);

        req.session.userId = user.id;
        req.session.username = user.username;

        res.json({ 
            success: true, 
            user: { 
                id: user.id, 
                username: user.username
            } 
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/logout', (req, res) => {
    if (req.session.userId) {
        const users = readUsers();
        const user = users.find(u => u.id === req.session.userId);
        if (user) {
            user.status = 'offline';
            writeUsers(users);
        }
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

app.get('/api/users/search', (req, res) => {
    const query = req.query.q || '';
    const users = readUsers();
    
    const results = users
        .filter(u => u.username.toLowerCase().includes(query.toLowerCase()))
        .map(u => ({ id: u.id, username: u.username, status: u.status }))
        .slice(0, 10);
    
    res.json(results);
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Register: http://localhost:${PORT}/register.html`);
    console.log(`Login: http://localhost:${PORT}/login.html`);
});
