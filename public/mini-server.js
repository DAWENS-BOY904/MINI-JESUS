import express from "express";
import fs from "fs";
import path from "path";
import bodyParser from "body-parser";
import crypto from "crypto";

const app = express();
const PORT = 4000;

app.use(bodyParser.json());
app.use(express.static("public"));

const DATA_FILE = path.join("./", "comments.json");

// Encryption helpers
function encryptMessage(message, code) {
  const cipher = crypto.createCipher("aes-256-cbc", code);
  let encrypted = cipher.update(message, "utf8", "hex");
  encrypted += cipher.final("hex");
  return encrypted;
}

function decryptMessage(encrypted, code) {
  try {
    const decipher = crypto.createDecipher("aes-256-cbc", code);
    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch {
    return null;
  }
}

// Load/save
function loadComments() {
  if (!fs.existsSync(DATA_FILE)) return [];
  const data = fs.readFileSync(DATA_FILE, "utf8");
  return JSON.parse(data || "[]");
}

function saveComments(comments) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(comments, null, 2));
}

// Auto delete messages older than 10 days
function cleanOldComments() {
  const now = Date.now();
  const comments = loadComments().filter(c => now - c.timestamp < 10 * 24 * 60 * 60 * 1000);
  saveComments(comments);
}

// ================= APIs =================

// Post comment from user
app.post("/api/comment", (req, res) => {
  const { name, number, message, code } = req.body;
  if (!name || !number || !message || !code) return res.json({ ok: false, error: "All fields required" });

  const encryptedMessage = encryptMessage(message, code);

  const comments = loadComments();
  comments.push({
    id: crypto.randomUUID(),
    name,
    number,
    message: encryptedMessage,
    code,
    timestamp: Date.now(),
    reply: null
  });

  saveComments(comments);
  res.json({ ok: true, msg: "Message sent successfully!" });
});

// Get reply for user
app.post("/api/reply", (req, res) => {
  const { id, code } = req.body;
  const comments = loadComments();
  const msg = comments.find(c => c.id === id);
  if (!msg) return res.json({ ok: false, error: "Message not found" });

  const decryptedMsg = decryptMessage(msg.message, code);
  if (!decryptedMsg) return res.json({ ok: false, error: "Wrong code" });

  const decryptedReply = msg.reply ? decryptMessage(msg.reply, "admin_secret") : null;

  res.json({ ok: true, message: decryptedMsg, reply: decryptedReply });
});

// Admin login
app.post("/api/admin/login", (req, res) => {
  const { email, password } = req.body;
  if (email === "admin305@gmail.com" && password === "2026") {
    return res.json({ ok: true, msg: "Login successful!" });
  }
  res.json({ ok: false, error: "Invalid credentials" });
});

// Admin get all messages
app.get("/api/admin/messages", (req, res) => {
  const comments = loadComments();
  const data = comments.map(c => ({
    id: c.id,
    name: c.name,
    number: c.number,
    message: c.message,
    timestamp: c.timestamp,
    reply: c.reply
  }));
  res.json(data);
});

// Admin send reply
app.post("/api/admin/reply", (req, res) => {
  const { id, reply } = req.body;
  const comments = loadComments();
  const msg = comments.find(c => c.id === id);
  if (!msg) return res.json({ ok: false, error: "Message not found" });

  msg.reply = encryptMessage(reply, "admin_secret");
  saveComments(comments);
  res.json({ ok: true, msg: "Reply sent!" });
});

// Clean old messages
setInterval(cleanOldComments, 60 * 60 * 1000);

app.listen(PORT, () => console.log(`Mini comment server running at http://localhost:${PORT}`));
