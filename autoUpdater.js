// ==================== autoUpdater.js ====================
// ✅ ESM Compatible
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { execSync, exec } from "child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 📦 CHEMIN REPO (ou dwe gen git initialisé)
const repoUrl = "https://github.com/<USERNAME>/<REPO_NAME>.git"; // 🔁 Ranplase sa
const checkInterval = 5 * 60 * 1000; // 5 minit
const projectDir = __dirname;

// ✅ Fonksyon pou verifye si git init
function ensureGitRepo() {
  if (!fs.existsSync(path.join(projectDir, ".git"))) {
    console.log("🧩 Initialisation du dépôt local...");
    execSync(`git init && git remote add origin ${repoUrl}`, { cwd: projectDir });
  }
}

// ✅ Tcheke si gen nouvo chanjman
async function checkForUpdates() {
  try {
    console.log("🔎 Checking for updates from GitHub...");

    // Fetch latest commits
    execSync("git fetch origin main", { cwd: projectDir });

    const localCommit = execSync("git rev-parse HEAD", { cwd: projectDir }).toString().trim();
    const remoteCommit = execSync("git rev-parse origin/main", { cwd: projectDir }).toString().trim();

    if (localCommit === remoteCommit) {
      console.log("✅ Already up to date.");
      return;
    }

    console.log("🚀 Update available! Testing update before applying...");

    // 🔄 Download files to temp folder for safety
    const tempDir = path.join(projectDir, "tmp_update");
    execSync(`rm -rf ${tempDir} && mkdir ${tempDir}`);
    execSync(`git clone --depth=1 ${repoUrl} ${tempDir}`);

    // ✅ Test if update has no syntax errors
    console.log("🧪 Running syntax check...");
    try {
      execSync("npm run build", { cwd: tempDir, stdio: "inherit" });
      execSync("node --check ./server.js", { cwd: tempDir });
      console.log("✅ Syntax OK — Applying update...");
    } catch (err) {
      console.error("❌ Update contains errors — cancelled.");
      execSync(`rm -rf ${tempDir}`);
      return;
    }

    // ✅ Replace current project with temp
    execSync("git reset --hard origin/main", { cwd: projectDir, stdio: "inherit" });
    execSync(`rm -rf ${tempDir}`);

    console.log("✅ Update applied successfully! Restarting server...");
    process.exit(0);

  } catch (err) {
    console.error("❌ Update check failed:", err.message);
  }
}

// ✅ Initialize & schedule updates
ensureGitRepo();
setInterval(checkForUpdates, checkInterval);
checkForUpdates(); // Run once at startup
