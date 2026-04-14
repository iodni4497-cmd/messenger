# Vild Messenger

A modern real-time messaging application built with Node.js and vanilla JavaScript.

## Features

- 💬 Real-time messaging
- 🔐 User authentication (registration & login)
- 🎨 Dark/Light theme
- 🎤 Voice messages
- 📎 File attachments (images, documents)
- 😊 Emoji picker
- 🔍 User search
- 👤 User profiles
- 🔔 Message notifications with sound

## Tech Stack

- **Frontend:** HTML, CSS, JavaScript (Vanilla)
- **Backend:** Node.js, Express
- **Storage:** JSON files (localStorage for messages)
- **Authentication:** bcrypt, express-session

## Installation

1. Clone the repository:
```bash
git clone https://github.com/your-username/messenger.git
cd messenger
```

2. Install dependencies:
```bash
npm install
```

3. Start the server:
```bash
node server-simple.js
```

4. Open your browser and navigate to:
```
http://localhost:3000
```

## Usage

1. Register a new account at `/register.html`
2. Login at `/login.html`
3. Search for users and start chatting!

## Deployment

### Vercel (Recommended)

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Deploy:
```bash
vercel
```

### Railway

1. Push to GitHub
2. Connect your repository on railway.app
3. Deploy automatically

## Project Structure

```
messenger/
├── icons/          # SVG icons
├── fonts/          # San Francisco fonts
├── data/           # JSON storage
├── models/         # Data models
├── server-simple.js # Node.js server
├── index.html      # Main chat interface
├── login.html      # Login page
├── register.html   # Registration page
├── script.js       # Main JavaScript
├── style.css       # Main styles
└── package.json    # Dependencies
```

## License

MIT
