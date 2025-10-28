// mini-server.js
import express from "express";
import bodyParser from "body-parser";
import fs from "fs";
import path from "path";
import session from "express-session";

const app = express();
const PORT = 4000;

app.use(bodyParser.json());
app.use(express.static("public"));
app.use(session({
  secret: "mini-secret-key",
  resave: false,
  saveUninitialized: true
}));

// ========== STORAGE ==========
const now = new Date();
comments = comments.filter(c => (now - new Date(c.timestamp)) < 10*24*60*60*1000);
const COMMENTS_FILE = path.join("./data/comments.json");

// Ensure file exists
if (!fs.existsSync(COMMENTS_FILE)) fs.writeFileSync(COMMENTS_FILE, "[]");

// Helper functions
const loadComments = () => JSON.parse(fs.readFileSync(COMMENTS_FILE));
const saveComments = (data) => fs.writeFileSync(COMMENTS_FILE, JSON.stringify(data, null, 2));

// Herlper
const crypto = require('crypto');

function encryptMessage(message, code){
  const cipher = crypto.createCipher('aes-256-cbc', code);
  let encrypted = cipher.update(message, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}

function decryptMessage(encrypted, code){
  try {
    const decipher = crypto.createDecipher('aes-256-cbc', code);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch(e) {
    return null; // si kòd pa matche
  }
}
// ========== USER COMMENT ==========
app.post("/api/comment", (req, res) => {
  const { name, number, message, code } = req.body;
  if (!name || !number || !message || !code) return res.json({ ok: false, error: "All fields required" });

  const comments = loadComments();
  comments.push({ id: Date.now(), name, number, message, code, reply: "" });
  saveComments(comments);

  res.json({ ok: true });
});

// ========== ADMIN LOGIN ==========
const ADMIN_EMAIL = "admin305@gmail.com";
const ADMIN_PASS = "2026";

app.post("/api/admin-login", (req, res) => {
  const { email, password, remember } = req.body;
  if (email === ADMIN_EMAIL && password === ADMIN_PASS) {
    req.session.admin = true;
    if (remember) req.session.cookie.maxAge = 7*24*60*60*1000; // 7 days
    res.json({ ok: true });
  } else res.json({ ok: false, error: "Invalid credentials" });
});

// ========== GET COMMENTS (ADMIN ONLY) ==========
app.get("/api/comments", (req, res) => {
  if (!req.session.admin) return res.status(401).json({ error: "Unauthorized" });
  const comments = loadComments();
  res.json(comments);
});

// ========== SEND REPLY (ADMIN ONLY) ==========
app.post("/api/reply", (req, res) => {
  if (!req.session.admin) return res.status(401).json({ error: "Unauthorized" });
  const { id, reply } = req.body;
  const comments = loadComments();
  const c = comments.find(c => c.id === id);
  if (!c) return res.json({ ok: false, error: "Comment not found" });
  c.reply = reply;
  saveComments(comments);
  res.json({ ok: true });
});

// ========== GET REPLY (USER ONLY) ==========
app.post("/api/get-reply", (req, res) => {
  const { code } = req.body;
  if (!code) return res.json({ ok: false, error: "Code required" });
  const comments = loadComments();
  const c = comments.find(c => c.code === code && c.reply !== "");
  if (!c) return res.json({ ok: false, error: "No reply yet" });
  res.json({ ok: true, reply: c.reply });
});

app.listen(PORT, () => console.log(`Mini Comment Server running on http://localhost:${PORT}`));
