// ==================== AUTO UPDATE + BACKUP + NOTIF ====================
// ESM Compatible ✅

import fs from "fs";
import path from "path";
import { exec } from "child_process";
import { fileURLToPath } from "url";
import { proto } from "@whiskeysockets/baileys"; // Si w ap itilize Baileys
import { format } from "date-fns";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 🧭 Config
const GITHUB_REPO = "https://github.com/DAWENSTECH/MINI-JESUS-CRASH.git";
const CHECK_INTERVAL = 5 * 60 * 1000; // 5 min
const SESSION_FILE = path.join(__dirname, "session.json");
const BACKUP_DIR = path.join(__dirname, "backup");
const OWNER_NUMBER = "509xxxxxxxx@s.whatsapp.net"; // 🔁 Remplace ak nimewo owner ou

// 🔧 Asire folder backup la egziste
if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR);

// 🔁 Fonksyon pou fè backup session
function backupSession() {
  if (!fs.existsSync(SESSION_FILE)) return;
  const date = format(new Date(), "yyyy-MM-dd_HH-mm-ss");
  const backupFile = path.join(BACKUP_DIR, `session-${date}.json`);
  fs.copyFileSync(SESSION_FILE, backupFile);
  console.log(`💾 Session backup created: ${backupFile}`);
}

// 🧠 Auto update from GitHub
function autoUpdateFromGit(devask) {
  console.log("🕓 Vérification des mises à jour GitHub...");

  exec("git pull origin main", { cwd: __dirname }, async (error, stdout) => {
    if (error) {
      console.log("⚠️ Erreur pendant la mise à jour:", error.message);
      return;
    }

    if (stdout.includes("Already up to date")) {
      console.log("✅ Aucun changement trouvé.");
    } else {
      console.log("🚀 Mise à jour détectée !");
      console.log(stdout);

      // 🔁 Recharger les commandes
      try {
        const commandsDir = path.join(__dirname, "commands");
        const files = fs.readdirSync(commandsDir);

        files.forEach((file) => {
          if (file.endsWith(".js")) {
            const filePath = path.join(commandsDir, file);
            delete import.cache?.[filePath];
          }
        });

        console.log("✅ Commandes rechargées !");
        await sendUpdateNotification(devask);
      } catch (err) {
        console.error("❌ Erreur rechargement:", err);
      }
    }
  });
}

// 📩 Notify owner via WhatsApp
async function sendUpdateNotification(devask) {
  try {
    await devask.sendMessage(OWNER_NUMBER, {
      text: "🚨 *Nouvelle mise à jour détectée et installée !*\nBot rechargé automatiquement ✅"
    });
    console.log("📨 Notification envoyée à l'owner !");
  } catch (err) {
    console.log("⚠️ Impossible d’envoyer notification:", err.message);
  }
}

// 🔐 Reconnexion si bot crash
export function sessionGuard(devask) {
  devask.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === "close") {
      console.log("⚠️ Déconnexion détectée !");
      backupSession();

      setTimeout(async () => {
        console.log("🔁 Tentative de reconnexion...");
        try {
          const { startBot } = await import("./index.js");
          await startBot();
          console.log("✅ Reconnexion réussie !");
        } catch (err) {
          console.log("❌ Erreur reconnexion:", err);
        }
      }, 5000);
    } else if (connection === "open") {
      console.log("🟢 Bot connecté avec succès !");
    }
  });

  // 🔄 Lancer update loop
  autoUpdateFromGit(devask);
  setInterval(() => autoUpdateFromGit(devask), CHECK_INTERVAL);
}
