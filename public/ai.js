<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Da-ChatGPT</title>
<style>
/* =============================
   DA-CHATGPT AI PAGE — PROFESSIONAL NEON UI
   Author: Dawens Boy Tech
   ============================= */
:root {
  --bg: #0a0a0a;
  --card-bg: rgba(20,20,20,0.6);
  --border: rgba(255,255,255,0.08);
  --accent: #6c63ff;
  --neon1: #00ffff;
  --neon2: #ff00ff;
  --neon3: #ff4b2b;
  --neon4: #39ff14;
  --radius: 16px;
  --blur: 20px;
  --transition: all 0.3s ease;
  --glow: 0 0 20px var(--accent), 0 0 30px var(--accent);
}

/* Reset */
* {margin:0; padding:0; box-sizing:border-box;}
html, body {width:100%; height:100%; font-family:"Poppins","Segoe UI",sans-serif; background:var(--bg); color:#fff; overflow-x:hidden;}

/* Background Gradient + Neon Glow Anim */
body::before {
  content:"";
  position:fixed;
  inset:0;
  background:radial-gradient(circle at top left, #6c63ff 0%, #0a0a0a 80%);
  z-index:-2;
}
body::after {
  content:"";
  position:fixed;
  inset:0;
  background:conic-gradient(var(--neon1), var(--neon2), var(--neon3), var(--neon4), var(--neon1));
  opacity:0.05;
  z-index:-1;
  filter:blur(180px);
  animation:spin 15s linear infinite;
}
@keyframes spin{from{transform:rotate(0deg);} to{transform:rotate(360deg);}}

/* Main container */
.container {
  max-width:800px;
  margin:80px auto;
  padding:32px;
  background:var(--card-bg);
  border-radius:var(--radius);
  box-shadow:0 0 50px rgba(108,99,255,0.3),0 0 25px rgba(108,99,255,0.2);
  backdrop-filter:blur(var(--blur));
  text-align:center;
}

/* Header */
.container h1 {
  font-size:2.5rem;
  font-weight:800;
  color:var(--accent);
  text-shadow:var(--glow);
  margin-bottom:16px;
}

/* Description */
.container p {
  font-size:1.1rem;
  color:#ccc;
  margin-bottom:24px;
}

/* Buttons */
.button {
  display:inline-block;
  padding:12px 20px;
  margin:8px;
  border:none;
  border-radius:12px;
  background:var(--accent);
  color:#fff;
  font-weight:600;
  cursor:pointer;
  transition:var(--transition);
  box-shadow:var(--glow);
}
.button:hover {
  filter:brightness(1.3);
  box-shadow:0 0 40px var(--accent), 0 0 20px var(--accent);
}

/* File input styling */
input[type="file"] {
  padding:8px;
  margin:8px 0;
  border-radius:8px;
  border:1px solid var(--border);
  background:rgba(255,255,255,0.05);
  color:#fff;
  width:100%;
}

/* Output Area */
#aiOutput {
  margin-top:24px;
  padding:16px;
  background:rgba(0,0,0,0.4);
  border-radius:12px;
  min-height:100px;
  text-align:left;
  font-family:monospace;
  white-space:pre-wrap;
}

/* Responsive */
@media (max-width:600px){
  .container{padding:24px;margin:40px auto;}
  h1{font-size:2rem;}
  .button{padding:10px 16px;}
}
</style>
<link rel="icon" href="https://files.catbox.moe/x16nfd.png">
</head>
<body>
<div class="container">
<h1>Da-ChatGPT</h1>
<p>L'ultime AI assistant pour vos projets et automation. Upload a file or ask a question!</p>

<!-- Upload Photo -->
<input type="file" id="fileUpload" accept="image/*" />
<button class="button" id="uploadBtn">Upload Photo</button>

<!-- Ask AI -->
<input type="text" id="promptInput" placeholder="Enter your question..." style="width:100%;padding:12px;margin-top:12px;border-radius:12px;border:1px solid var(--border);background:rgba(255,255,255,0.05);color:#fff;outline:none;">
<button class="button" id="askBtn">Ask AI</button>

<!-- Output -->
<div id="aiOutput"></div>

</div>
<script src="ai.js"></script>
</body>
</html>
