import fs from "fs";
import dotenv from "dotenv";

if (fs.existsSync("config.env")) {
  dotenv.config({ path: "./config.env" });
}

function toBool(text, fault = "true") {
  return String(text).toLowerCase() === String(fault).toLowerCase();
}

export const config = {
  // SESSION & OWNER
  SESSION_ID: process.env.SESSION_ID || "MINI",
  OWNER_NUMBER: (process.env.OWNER_NUMBER || "13058962443") + "@s.whatsapp.net",
  OWNER_NAME: process.env.OWNER_NAME || "DAWENS BOY",
  DEV: (process.env.DEV || "50942241547") + "@s.whatsapp.net",

  // BOT INFO
  BOT_NAME: process.env.BOT_NAME || "MINI-JESUS-CRASH",
  STICKER_NAME: process.env.STICKER_NAME || "MINI-JESUS-CRASH",
  DESCRIPTION: process.env.DESCRIPTION || "*© ᴘᴏᴡᴇʀᴇᴅ by dawens boy*",
  PREFIX: process.env.PREFIX || ".",
  MENU_IMAGE_URL: process.env.MENU_IMAGE_URL || "https://files.catbox.moe/x16nfd.png",

  // WELCOME / GOODBYE / ADMIN
  WELCOME: toBool(process.env.WELCOME, "true"),
  GOODBYE: toBool(process.env.GOODBYE, "true"),
  ADMIN_EVENTS: toBool(process.env.ADMIN_EVENTS, "true"),
  SECURITY_ALERT: toBool(process.env.SECURITY_ALERT, "true"),

  // STATUS
  AUTO_STATUS_SEEN: toBool(process.env.AUTO_STATUS_SEEN, "true"),
  AUTO_STATUS_REPLY: toBool(process.env.AUTO_STATUS_REPLY, "true"),
  AUTO_STATUS_REACT: toBool(process.env.AUTO_STATUS_REACT, "true"),
  AUTO_STATUS_MSG:
    process.env.AUTO_STATUS_MSG || "*SEEN YOUR STATUS BY MINI-JESUS-CRASH*",

  // AUTO FEATURES
  AUTO_REACT: toBool(process.env.AUTO_REACT, "false"),
  CUSTOM_REACT: toBool(process.env.CUSTOM_REACT, "false"),
  CUSTOM_REACT_EMOJIS:
    process.env.CUSTOM_REACT_EMOJIS ||
    "💝,💖,💗,❤️‍🩹,❤️,🧡,💛,💚,💙,💜,🤎,🖤,🤍",
  AUTO_VOICE: toBool(process.env.AUTO_VOICE, "false"),
  AUTO_STICKER: toBool(process.env.AUTO_STICKER, "true"),
  AUTO_REPLY: toBool(process.env.AUTO_REPLY, "true"),
  AUTO_TYPING: toBool(process.env.AUTO_TYPING, "false"),
  AUTO_RECORDING: toBool(process.env.AUTO_RECORDING, "true"),
  ALWAYS_ONLINE: toBool(process.env.ALWAYS_ONLINE, "false"),

  // ANTI SYSTEM
  ANTI_LINK: toBool(process.env.ANTI_LINK, "true"),
  ANTI_LINK_KICK: toBool(process.env.ANTI_LINK_KICK, "true"),
  DELETE_LINKS: toBool(process.env.DELETE_LINKS, "true"),
  ANTI_BAD: toBool(process.env.ANTI_BAD, "true"),
  ANTI_VV: toBool(process.env.ANTI_VV, "true"),
  ANTI_DEL_PATH: process.env.ANTI_DEL_PATH || "same",
  GHOST_MODE: toBool(process.env.GHOST_MODE, "true"),
  ANTI_CALL: toBool(process.env.ANTI_CALL, "true"),

  // ALIVE
  ALIVE_IMG: process.env.ALIVE_IMG || "https://files.catbox.moe/x16nfd.png",
  ALIVE_MSG: process.env.ALIVE_MSG || "> Zinda Hun Yar *MINI-JESUS-CRASH*⚡",

  // OTHER
  MENTION_REPLY: toBool(process.env.MENTION_REPLY, "true"),
  MODE: process.env.MODE || "public",
  PUBLIC_MODE: toBool(process.env.PUBLIC_MODE, "true"),
  READ_MESSAGE: toBool(process.env.READ_MESSAGE, "false"),
  READ_CMD: toBool(process.env.READ_CMD, "false"),
  BAILEYS: process.env.BAILEYS || "@whiskeysockets/baileys",

  // ADMIN ACCESS
  SUDO: process.env.SUDO || "989910713754,13058962443"
};

// ==================== config.js2====================
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const configPath = path.join(__dirname, "config.json");

// Lire le config.json
let configData;
try {
  configData = JSON.parse(fs.readFileSync(configPath, "utf-8"));
} catch (err) {
  console.error("❌ Erreur lecture config.json:", err);
  process.exit(1);
}

// Fonction pour récupérer la config d'une session spécifique
export function getSessionConfig(sessionId) {
  const session = configData.sessions.find(s => s.sessionId === sessionId);
  if (!session) {
    throw new Error(`Session ${sessionId} non trouvée dans config.json`);
  }
  return {
    ...configData,  // Garde les valeurs globales comme BOT_NAME si nécessaire
    ...session      // Override avec les valeurs spécifiques à la session
  };
}

// Export par défaut pour compatibilité (si tu as d'autres usages)
export default configData;
