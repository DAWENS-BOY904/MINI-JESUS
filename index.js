// ==================== index.js ====================
// 🌐 MINI JESUS CRASH SYSTEM - Multi-session WhatsApp Bot
// 🧠 Version: 3.0 Stable | Engine: Node.js ESM | Author: DAWENS
// ⚙️ Compatible: Baileys, Express, Mega.nz, Render Hosting
// ==================================================

// ==================== CORE IMPORTS ====================
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import pino from 'pino';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

// ==================== WHATSAPP / BAILEYS ====================
import { makeWASocket, jidDecode, useMultiFileAuthState } from "@whiskeysockets/baileys";
// ==================== LOCAL IMPORTS ====================
import config from "./config.js";
import handler from "./handler.js";
import { smsg } from "./system/func.js";
import { contextInfo } from "./system/contextInfo.js";
import { sessionGuard } from "./autoUpdater.js";

// ==================== ESM PATH FIX ====================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ==================== GLOBALS & CONFIG ====================
const log = console.log;
const prefix = config.PREFIX || "!";
const ownerNumber = config.OWNER || ["13058962443"];

global.groupSettings = {};
global.menuState = {};
global.groupCache = {};

if (!globalThis.crypto?.subtle) globalThis.crypto = crypto.webcrypto;

// ==================== MEGA.JS AUTO IMPORT ====================
let MegaFile; // ✅ nouvo non pou evite konfli ak 'File' global

try {
  const megajs = await import("megajs");
  MegaFile = megajs?.default?.File || megajs.File;
} catch (err) {
  console.log(chalk.yellow("📦 megajs manke, ap enstale li..."));
  execSync("npm install megajs", { stdio: "inherit" });
  const megajs = await import("megajs");
  MegaFile = megajs?.default?.File || megajs.File;
}

// ==================== STRUCTURE DIRS ====================
const sessionsDir = path.join(__dirname, "sessions");
if (!fs.existsSync(sessionsDir)) fs.mkdirSync(sessionsDir, { recursive: true });

const configPath = path.join(__dirname, "config.json");

// ==================== ACTIVE SESSION MAP ====================
const activeSessions = new Map();

// 🔐 SECURITY GUARD ====================
sessionGuard("devask");
// ==================== Charger la configuration ====================
function loadConfig() {
  try {
    if (!fs.existsSync(configPath)) {
      console.log("❌ Fichier config.json non trouvé");
      return { BOT_NAME: 'MINI JESUS CRASH', sessions: [] };
    }

    const configData = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    return configData;
  } catch (error) {
    console.error('❌ Erreur lors du chargement de config.json:', error);
    return { BOT_NAME: 'MINI JESUS CRASH', sessions: [] };
  }
}

// ==================== Charger session Mega pour un utilisateur ====================
async function loadSessionFromMega(sessionId, sessionName) {
  try {
    const sessionUserDir = path.join(sessionsDir, sessionName);
    const credsPath = path.join(sessionUserDir, 'creds.json');

    // Si le fichier de session existe déjà, pas besoin de Mega
    if (fs.existsSync(credsPath)) {
      console.log(chalk.green(`✅ Session locale déjà présente pour ${sessionName}`));
      return true;
    }

    if (!sessionId.startsWith('MINI-JESUS-CRASH~')) {
      console.log(chalk.yellow(`⚠️ Format Session ID non reconnu pour ${sessionName}`));
      return false;
    }

    const [fileID, key] = sessionId.replace('MINI-JESUS-CRASH~', '').split('#');
    if (!fileID || !key) {
      console.log(chalk.red(`❌ SESSION_ID invalide pour ${sessionName}`));
      return false;
    }

    console.log(chalk.blue(`🔄 Tentative de téléchargement Mega pour ${sessionName}`));
    console.log(chalk.blue(`   📁 FileID: ${fileID.substring(0, 8)}...`));

    // Télécharger depuis Mega
    const file = File.fromURL(`https://mega.nz/file/${fileID}#${key}`);
    await file.loadAttributes();

    const data = await new Promise((resolve, reject) =>
      file.download((err, d) => (err ? reject(err) : resolve(d)))
    );

    // Sauvegarder localement
    if (!fs.existsSync(sessionUserDir)) {
      fs.mkdirSync(sessionUserDir, { recursive: true });
    }

    await fs.promises.writeFile(credsPath, data);
    console.log(chalk.green(`✅ Session Mega téléchargée et sauvegardée pour ${sessionName}`));
    return true;

  } catch (err) {
    console.error(chalk.red(`❌ Impossible de charger la session depuis Mega pour ${sessionName}:`), err.message);
    return false;
  }
}

// ==================== Envoyer un message de confirmation ====================
async function sendWelcomeMessage(devask, sessionConfig, connectionDuration) {
  try {
    const { ownerNumber, prefix, mode, name: sessionName } = sessionConfig;

    // Attendre que l'utilisateur soit disponible
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      if (devask.user && devask.user.id) {
        break;
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
      attempts++;
    }

    if (!devask.user || !devask.user.id) {
      console.log(chalk.yellow(`⚠️ User non disponible pour ${sessionName} après ${maxAttempts} tentatives`));
      return false;
    }

    const message = `*MINI JESUS CRASH CONNECT ✅*\n\n` +
                  `👤 *Owner:* ${ownerNumber}\n` +
                  `🫩 *Name:* ${sessionName}` +
                  `⚙️ *Prefix:* ${prefix || '.'}\n` +
                  `🌐 *Mode:* ${mode || 'public'}\n` +
                  `⏱️ *Latence:* ${connectionDuration}ms\n\n` +
                  `💡 Utilisez *${prefix || '.'}menu* pour voir les commandes disponibles.`;

    await devask.sendMessage(devask.user.id, {
      image: { url: 'https://files.catbox.moe/x16nfd.png' }, 
      caption: message,
      contextInfo: {
        ...contextInfo
      }
    });
    console.log(chalk.green(`✅ Message de confirmation envoyé pour ${sessionName}`));
    
    // Marquer comme message envoyé
    const session = activeSessions.get(sessionName);
    if (session && session.performance) {
      session.performance.welcomeMessageSent = true;
      session.performance.messageSentTime = Date.now();
    }
    
    return true;

  } catch (err) {
    console.error(chalk.red(`❌ Erreur envoi message confirmation:`), err.message);
    return false;
  }
}

// ==================== Lancer un bot pour une session ====================
async function startBotForSession(sessionConfig) {
  try {
    const { name: sessionName, sessionId, ownerNumber, sudo, prefix, mode } = sessionConfig;

    // Vérifier si la session est déjà active
    if (activeSessions.has(sessionName)) {
      console.log(chalk.yellow(`⚠️ Session ${sessionName} déjà active, ignore...`));
      return;
    }

    console.log(chalk.blue(`🔧 Initialisation de la session: ${sessionName}`));
    console.log(chalk.blue(`   👤 Owner: ${ownerNumber}`));
    console.log(chalk.blue(`   ⚙️ Prefix: ${prefix || '.'}`));
    console.log(chalk.blue(`   🌐 Mode: ${mode || 'public'}`));

    const sessionUserDir = path.join(sessionsDir, sessionName);

    // Créer le dossier de session si nécessaire
    if (!fs.existsSync(sessionUserDir)) {
      fs.mkdirSync(sessionUserDir, { recursive: true });
    }

    // ✅ CHARGER LA SESSION DEPUIS MEGA D'ABORD
    const megaLoaded = await loadSessionFromMega(sessionId, sessionName);
    
    if (!megaLoaded && !fs.existsSync(path.join(sessionUserDir, 'creds.json'))) {
      console.log(chalk.red(`❌ Impossible de charger la session Mega pour ${sessionName}`));
      return;
    }

    const { state, saveCreds } = await useMultiFileAuthState(sessionUserDir);
    
    // Configuration Baileys (COMME DANS TON FICHIER QUI FONCTIONNE)
    const devask = makeWASocket({
      logger: pino({ level: 'silent' }),
      auth: state,
      browser: [`ASK CRASHER - ${sessionName}`, 'Safari', '3.3'],
      printQRInTerminal: !megaLoaded, // Afficher QR seulement si Mega échoue
      markOnlineOnConnect: true,
    });

    // ==================== AJOUT IMPORTANT : Assigner sessionId à devask ====================
    // Cela permet au handler d'identifier la session et récupérer sa config spécifique
    devask.sessionId = sessionId;

    // ==================== Configuration globale par session ====================
    global.PREFIX = prefix || '.';
    global.owner = [ownerNumber];
    global.SUDO = sudo || [];

    devask.decodeJid = (jid) => {
      if (!jid) return jid;
      if (/:\d+@/gi.test(jid)) {
        const decode = jidDecode(jid) || {};
        return decode.user && decode.server ? `${decode.user}@${decode.server}` : jid;
      }
      return jid;
    };

    // Métriques de performance
    const performanceMetrics = {
      startTime: Date.now(),
      messageCount: 0,
      lastActivity: Date.now(),
      connectionTime: null,
      connectionAttempts: 0,
      welcomeMessageSent: false,
      messageSentTime: null
    };

    // ==================== Gestionnaire de connexion ====================
    devask.ev.on('connection.update', async ({ connection, lastDisconnect, qr }) => {
      if (qr) {
        console.log(chalk.yellow(`📷 QR Code reçu pour ${sessionName}`));
        performanceMetrics.connectionAttempts++;

        activeSessions.set(sessionName, {
          socket: devask,
          config: sessionConfig,
          connected: false,
          qrCode: qr,
          lastDisconnectTime: null,
          performance: performanceMetrics
        });
      }

      if (connection === 'open') {
        performanceMetrics.connectionTime = Date.now();
        const connectionDuration = performanceMetrics.connectionTime - performanceMetrics.startTime;

        console.log(chalk.green(`🎉 ASK CRASHER CONNECTÉ pour ${sessionName}`));
        console.log(chalk.green(`   ⏱️ Temps de connexion: ${connectionDuration}ms`));

        // Mettre à jour la session active
        activeSessions.set(sessionName, {
          socket: devask,
          config: sessionConfig,
          connected: true,
          qrCode: null,
          lastDisconnectTime: null,
          performance: {
            ...performanceMetrics,
            connectionTime: Date.now(),
            uptime: 0
          }
        });

        // Envoyer le message de bienvenue IMMÉDIATEMENT
        console.log(chalk.blue(`📤 Envoi du message de bienvenue pour ${sessionName}...`));
        await sendWelcomeMessage(devask, sessionConfig, connectionDuration);

      } else if (connection === 'close') {
        const reason = lastDisconnect?.error?.output?.statusCode || lastDisconnect?.error?.message || 'unknown';
        console.log(chalk.red(`🔴 DÉCONNEXION pour ${sessionName}`));
        console.log(chalk.red(`   📋 Raison: ${reason}`));

        // Mettre à jour les métriques
        activeSessions.set(sessionName, {
          socket: devask,
          config: sessionConfig,
          connected: false,
          qrCode: null,
          lastDisconnectTime: Date.now(),
          performance: performanceMetrics
        });

        // Redémarrer après un délai (COMME DANS TON FICHIER)
        console.log(chalk.yellow(`   ⏳ Redémarrage dans 5s...`));
        setTimeout(() => {
          console.log(chalk.blue(`🔄 Tentative de reconnexion pour ${sessionName}`));
          startBotForSession(sessionConfig);
        }, 5000);
      }
    });

    // ==================== Gestionnaire de messages ====================
    devask.ev.on('messages.upsert', async ({ messages, type }) => {
      if (type !== 'notify') return;

      // Mettre à jour les métriques de performance
      performanceMetrics.messageCount++;
      performanceMetrics.lastActivity = Date.now();

      for (const msg of messages) {
        if (!msg?.message) continue;
        try {
          const m = smsg(devask, msg);
          await handler(devask, m, msg);
        } catch (err) {
          console.error(chalk.red(`❌ Erreur traitement message pour ${sessionName}:`), err.message);
        }
      }
    });

    devask.ev.on('creds.update', saveCreds);

    // Stocker la socket dans les sessions actives
    activeSessions.set(sessionName, {
      socket: devask,
      config: sessionConfig,
      connected: false,
      qrCode: null,
      lastDisconnectTime: null,
      performance: performanceMetrics
    });

    return devask;

  } catch (err) {
    console.error(chalk.red(`❌ Erreur critique pour la session ${sessionConfig.name}:`), err);
    // Nettoyer en cas d'erreur
    activeSessions.delete(sessionConfig.name);

    // Retenter après un délai
    setTimeout(() => {
      console.log(chalk.yellow(`🔄 Nouvelle tentative pour ${sessionConfig.name} après erreur...`));
      startBotForSession(sessionConfig);
    }, 10000);
  }
}

// ==================== Lancer toutes les sessions ====================
async function startAllSessions() {
  const cfg = loadConfig();

  // ✅ Double vérifikasyon pou eviter undefined ou format non-array
  let sessions = [];
  if (Array.isArray(cfg.sessions)) {
    sessions = cfg.sessions;
  } else if (typeof cfg.sessions === 'object' && cfg.sessions !== null) {
    sessions = Object.values(cfg.sessions);
  } else {
    console.log(chalk.red("❌ sessions dans config.json n'est pas un tableau valide"));
  }

  console.log(chalk.blue(`🚀 Démarrage de ${sessions.length} session(s)...`));

  if (sessions.length === 0) {
    console.log(chalk.yellow('💡 Aucune session à démarrer. Utilisez la page web pour déployer une session.'));
    return;
  }

  for (const session of sessions) {
    try {
      if (session?.name && session?.sessionId && session?.ownerNumber) {
        await startBotForSession(session);
      } else {
        console.log(chalk.red(`⚠️ Session invalide ignorée:`), session);
      }
    } catch (err) {
      console.error(chalk.red(`❌ Erreur lors du démarrage de ${session?.name || 'session inconnue'}:`), err);
    }
  }
}

// ==================== Export pour le serveur web ====================
export { 
    activeSessions, 
    loadConfig, 
    startBotForSession
};

// ==================== Surveiller les changements de config.json ====================
function watchConfigChanges() {
  let lastConfig = JSON.stringify(loadConfig().sessions);

  fs.watchFile(configPath, (curr, prev) => {
    if (curr.mtime !== prev.mtime) {
      try {
        const currentConfig = loadConfig();
        const currentSessions = currentConfig.sessions || [];
        const currentSessionsStr = JSON.stringify(currentSessions);

        if (currentSessionsStr !== lastConfig) {
          console.log(chalk.blue('🔄 Détection de changement dans config.json...'));
          startAllSessions();
          lastConfig = currentSessionsStr;
        }
      } catch (error) {
        console.error('❌ Erreur lors du traitement des changements:', error);
      }
    }
  });
}

// ==================== Execute ====================
watchConfigChanges();
startAllSessions();
