import express from "express";
import fs from "fs";
import path from "path";
import bodyParser from "body-parser";
import crypto from "crypto";

const app = express();
const PORT = 4000;

app.use(bodyParser.json());
app.use(express.static("public")); // kote HTML yo ye

// File pou sove mesaj yo
const DATA_FILE = path.join("./", "comments.json");

// Helper pou chifre/dechifre message ak code
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
    return null; // si code pa matche
  }
}

// Chaje mesaj yo
function loadComments() {
  if (!fs.existsSync(DATA_FILE)) return [];
  const data = fs.readFileSync(DATA_FILE, "utf8");
  return JSON.parse(data || "[]");
}

// Sove mesaj yo
function saveComments(comments) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(comments, null, 2));
}

// DELETE mesaj ki pi gran pase 10 jou
function cleanOldComments() {
  const now = Date.now();
  const comments = loadComments().filter(c => now - c.timestamp < 10 * 24 * 60 * 60 * 1000);
  saveComments(comments);
}

// ===================== API =====================

// POST comment
app.post("/api/comment", (req, res) => {
  const { name, number, message, code } = req.body;
  if (!name || !number || !message || !code) {
    return res.json({ ok: false, error: "All fields required" });
  }

  const encryptedMessage = encryptMessage(message, code);

  const comments = loadComments();
  comments.push({
    id: crypto.randomUUID(),
    name,
    number,
    message: encryptedMessage,
    code,
    timestamp: Date.now(),
    reply: null // admin reply
  });

  saveComments(comments);
  res.json({ ok: true, msg: "Message sent successfully!" });
});

// GET reply pou user
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

// POST admin reply
app.post("/api/admin/reply", (req, res) => {
  const { id, reply } = req.body;
  if (!id || !reply) return res.json({ ok: false, error: "Missing fields" });

  const comments = loadComments();
  const msg = comments.find(c => c.id === id);
  if (!msg) return res.json({ ok: false, error: "Message not found" });

  msg.reply = encryptMessage(reply, "admin_secret");
  saveComments(comments);
  res.json({ ok: true, msg: "Reply sent!" });
});

// Clean old messages
setInterval(cleanOldComments, 60 * 60 * 1000); // chak 1h

app.listen(PORT, () => console.log(`Mini comment server running on http://localhost:${PORT}`));
