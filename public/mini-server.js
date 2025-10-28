// mini-server.js
import express from "express";
import bodyParser from "body-parser";
import fs from "fs";
import path from "path";
import session from "express-session";
import crypto from "crypto";

const app = express();
const PORT = 4000;

app.use(bodyParser.json());
app.use(express.static("public"));
app.use(session({ secret: "mini-secret-key", resave: false, saveUninitialized: true }));

const COMMENTS_FILE = path.join("./data/comments.json");
if(!fs.existsSync(COMMENTS_FILE)) fs.writeFileSync(COMMENTS_FILE, "[]");

const loadComments = () => JSON.parse(fs.readFileSync(COMMENTS_FILE));
const saveComments = (data) => fs.writeFileSync(COMMENTS_FILE, JSON.stringify(data, null, 2));

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
  } catch(e) { return null; }
}

// ========== CLEAN OLD COMMENTS ==========
let comments = loadComments();
const now = new Date();
comments = comments.filter(c => (now - new Date(c.timestamp)) < 10*24*60*60*1000);
saveComments(comments);

// ========== USER COMMENT ==========
app.post("/api/comment", (req,res)=>{
  const { name, number, message, code } = req.body;
  if(!name||!number||!message||!code) return res.json({ ok:false, error:"All fields required" });

  comments = loadComments();
  comments.push({ id:Date.now(), name, number, message, code, reply:"", timestamp: new Date() });
  saveComments(comments);
  res.json({ ok:true });
});

// ========== ADMIN LOGIN ==========
const ADMIN_EMAIL = "admin305@gmail.com";
const ADMIN_PASS = "2026";
app.post("/api/admin-login", (req,res)=>{
  const { email, password, remember } = req.body;
  if(email===ADMIN_EMAIL && password===ADMIN_PASS){
    req.session.admin=true;
    if(remember) req.session.cookie.maxAge=7*24*60*60*1000;
    res.json({ ok:true });
  } else res.json({ ok:false, error:"Invalid credentials" });
});

// ========== GET COMMENTS (ADMIN ONLY) ==========
app.get("/api/comments",(req,res)=>{
  if(!req.session.admin) return res.status(401).json({ error:"Unauthorized" });
  comments = loadComments();
  res.json(comments);
});

// ========== SEND REPLY (ADMIN ONLY) ==========
app.post("/api/reply",(req,res)=>{
  if(!req.session.admin) return res.status(401).json({ error:"Unauthorized" });
  const { id, reply } = req.body;
  comments = loadComments();
  const c = comments.find(c => c.id===id);
  if(!c) return res.json({ ok:false, error:"Comment not found" });
  c.reply = encryptMessage(reply, c.code); // kripte reply
  saveComments(comments);
  res.json({ ok:true });
});

// ========== GET REPLY (USER ONLY) ==========
app.post("/api/get-reply",(req,res)=>{
  const { code } = req.body;
  if(!code) return res.json({ ok:false, error:"Code required" });
  comments = loadComments();
  const now = new Date();
  const validComments = comments.filter(c => (now - new Date(c.timestamp)) < 10*24*60*60*1000);
  const c = validComments.find(c => c.code===code && c.reply!=="");
  if(!c) return res.json({ ok:false, error:"No reply or expired" });
  const decrypted = decryptMessage(c.reply, code);
  if(!decrypted) return res.json({ ok:false, error:"Wrong code" });
  res.json({ ok:true, reply:decrypted });
});

app.listen(PORT, ()=>console.log(`Mini Comment Server running on http://localhost:${PORT}`));
