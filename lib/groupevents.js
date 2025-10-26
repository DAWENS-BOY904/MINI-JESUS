// Credits: DAWENS-BOY96 - jesus-crash-v1 💜
// Channel: https://whatsapp.com/channel/0029VbCHd5V1dAw132PB7M1B

const { isJidGroup } = require('@whiskeysockets/baileys');
const config = require('../config');

const fallbackPPs = [
    'https://i.ibb.co/KhYC4FY/1221bc0bdd2354b42b293317ff2adbcf-icon.png',
    'https://i.ibb.co/KhYC4FY/1221bc0bdd2354b42b293317ff2adbcf-icon.png',
    'https://i.ibb.co/KhYC4FY/1221bc0bdd2354b42b293317ff2adbcf-icon.png',
];

const GroupEvents = async (conn, update) => {
    try {
        if (!isJidGroup(update.id)) return;

        const metadata = await conn.groupMetadata(update.id);
        const participants = update.participants || [];
        const desc = metadata.desc || "No description available.";
        const memberCount = metadata.participants.length;

        let groupPP;
        try {
            groupPP = await conn.profilePictureUrl(update.id, 'image');
        } catch {
            groupPP = fallbackPPs[Math.floor(Math.random() * fallbackPPs.length)];
        }

        for (const participant of participants) {
            const user = participant.id || participant; // some versions send objects
            const userName = user.split("@")[0];
            const timestamp = new Date().toLocaleString();
            const author = update.author || conn.user.id || "system@whatsapp.net";
            const authorName = author.split("@")[0];
            const action = update.action;

            // WELCOME
            if (action === "add" && config.WELCOME) {
                const welcomeMsg = `╭─〔 🤖 *${config.BOT_NAME}* 〕
├─ 🎉 Welcome @${userName} to *${metadata.subject}*
├─ You are member #${memberCount}
├─ ⏰ Joined at: ${timestamp}
╰─ Please read the group description below 👇

╭──〔 📜 Group Description 〕
├─ ${desc}
╰─🚀 Powered by ${config.BOT_NAME}`;

                await conn.sendMessage(update.id, {
                    image: { url: groupPP },
                    caption: welcomeMsg,
                    mentions: [user]
                });
            }

            // GOODBYE
            else if (action === "remove" && config.GOODBYE) {
                const goodbyeMsg = `╭─〔 🤖 *${config.BOT_NAME}* 〕
├─ 😔 Goodbye @${userName}
├─ ⏰ Left at: ${timestamp}
├─ Remaining members: ${memberCount}
╰─🚀 Powered by ${config.BOT_NAME}`;

                await conn.sendMessage(update.id, {
                    image: { url: groupPP },
                    caption: goodbyeMsg,
                    mentions: [user]
                });
            }

            // DEMOTE
            else if (action === "demote") {
                if (!author) continue;
                const isAuthorized = config.SUDO?.split(",").includes(authorName);

                if (!isAuthorized && config.SECURITY_ALERT) {
                    const alertMsg = `╭─〔 🚨 *SECURITY ALERT* 🚨 〕
├─ ⚠️ Unauthorized demotion detected!
├─ 👤 Target: @${userName}
├─ 🛑 Action by: @${authorName}
├─ ⏰ Time: ${timestamp}
╰─🔒 @${authorName} has been *removed* for illegal admin action.
🚀 Powered by ${config.BOT_NAME}`;

                    await conn.sendMessage(update.id, {
                        text: alertMsg,
                        mentions: [user, author]
                    });

                    await conn.groupParticipantsUpdate(update.id, [author], "remove").catch(() => {});
                } else if (config.ADMIN_EVENTS) {
                    await conn.sendMessage(update.id, {
                        text: `╭─〔 ⚠️ *Admin Event* 〕
├─ @${authorName} demoted @${userName}
├─ ⏰ Time: ${timestamp}
╰─🚀 Powered by ${config.BOT_NAME}`,
                        mentions: [author, user]
                    });
                }
            }

            // PROMOTE
            else if (action === "promote") {
                if (!author) continue;
                const isAuthorized = config.SUDO?.split(",").includes(authorName);

                if (!isAuthorized && config.SECURITY_ALERT) {
                    const alertMsg = `╭─〔 🚨 *SECURITY ALERT* 🚨 〕
├─ ⚠️ Unauthorized promotion detected!
├─ 👤 Target: @${userName}
├─ 🛑 Action by: @${authorName}
├─ ⏰ Time: ${timestamp}
╰─🔒 @${authorName} has been *removed* for illegal admin action.
🚀 Powered by ${config.BOT_NAME}`;

                    await conn.sendMessage(update.id, {
                        text: alertMsg,
                        mentions: [user, author]
                    });

                    await conn.groupParticipantsUpdate(update.id, [author], "remove").catch(() => {});
                } else if (config.ADMIN_EVENTS) {
                    await conn.sendMessage(update.id, {
                        text: `╭─〔 🎉 *Admin Event* 〕
├─ @${authorName} promoted @${userName}
├─ ⏰ Time: ${timestamp}
╰─🚀 Powered by ${config.BOT_NAME}`,
                        mentions: [author, user]
                    });
                }
            }
        }
    } catch (err) {
        console.error('❌ GroupEvents Error:', err);
    }
};

module.exports = GroupEvents;
