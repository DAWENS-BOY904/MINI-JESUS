// mini-server.js
import express from 'express';
import bodyParser from 'body-parser';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import session from 'express-session';

const app = express();
const PORT = 3001;

app.use(bodyParser.json());
app.use(express.static('public'));

// --- Sessions ---
app.use(session({
  secret: 'mini_secret_comment_system',
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge: 86400000 } // 1 day
}));

// --- Admin Credentials ---
const ADMIN_EMAIL = 'admin305@gmail.com';
const ADMIN_PASS = '2026';

// --- File paths ---
const messagesFile = path.join('./data/messages.json');
const repliesFile = path.join('./data/replies.json');

// --- Helpers ---
function loadJSON(filePath) {
  if (!fs.existsSync(filePath)) fs.writeFileSync(filePath, '[]');
  const data = fs.readFileSync(filePath);
  return JSON.parse(data);
}

function saveJSON(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

function encryptMessage(message, code) {
  const cipher = crypto.createCipher('aes-256-cbc', code);
  let encrypted = cipher.update(message, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}

function decryptMessage(encrypted, code) {
  try {
    const decipher = crypto.createDecipher('aes-256-cbc', code);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (e) {
    return null;
  }
}

// --- Admin Login ---
app.post('/admin/login', (req, res) => {
  const { email, password, remember } = req.body;
  if (email === ADMIN_EMAIL && password === ADMIN_PASS) {
    req.session.admin = true;
    if (remember) req.session.cookie.maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
    res.json({ ok: true, redirect: '/admin.html' });
  } else {
    res.json({ ok: false, error: 'Invalid credentials' });
  }
});

// --- Check Admin Session ---
function requireAdmin(req, res, next) {
  if (req.session.admin) return next();
  res.status(401).json({ error: 'Unauthorized' });
}

// --- Save User Message ---
app.post('/api/comment', (req, res) => {
  const { name, number, message, code } = req.body;
  if (!name || !number || !message || !code) return res.json({ ok: false, error: 'All fields required' });

  const encryptedMessage = encryptMessage(message, code);
  const messages = loadJSON(messagesFile);
  messages.push({ id: crypto.randomUUID(), name, number, message: encryptedMessage, code, timestamp: Date.now() });
  saveJSON(messagesFile, messages);

  res.json({ ok: true, msg: 'Message sent to admin' });
});

// --- Admin Get Messages ---
app.get('/api/admin/messages', requireAdmin, (req, res) => {
  const messages = loadJSON(messagesFile);
  res.json({ ok: true, messages });
});

// --- Admin Reply to Message ---
app.post('/api/admin/reply', requireAdmin, (req, res) => {
  const { id, reply } = req.body;
  if (!id || !reply) return res.json({ ok: false, error: 'Message ID and reply required' });

  const messages = loadJSON(messagesFile);
  const msg = messages.find(m => m.id === id);
  if (!msg) return res.json({ ok: false, error: 'Message not found' });

  const replies = loadJSON(repliesFile);
  replies.push({ id: crypto.randomUUID(), messageId: id, reply: encryptMessage(reply, msg.code), timestamp: Date.now() });
  saveJSON(repliesFile, replies);

  res.json({ ok: true, msg: 'Reply sent to user' });
});

// --- User Get Reply ---
app.post('/api/reply', (req, res) => {
  const { code, id } = req.body;
  if (!code || !id) return res.json({ ok: false, error: 'Code and message ID required' });

  const replies = loadJSON(repliesFile);
  const messages = loadJSON(messagesFile);
  const message = messages.find(m => m.id === id && m.code === code);
  if (!message) return res.json({ ok: false, error: 'Message not found or wrong code' });

  const userReplies = replies.filter(r => r.messageId === id).map(r => decryptMessage(r.reply, code)).filter(r => r !== null);

  res.json({ ok: true, replies: userReplies });
});

app.listen(PORT, () => console.log(`Mini comment server running on http://localhost:${PORT}`));
