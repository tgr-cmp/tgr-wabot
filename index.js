const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const path = require('path');
const config = require('./config');
const handleCase = require('./case');

// Nonaktifkan pemeriksaan update ytdl-core
process.env.YTDL_NO_UPDATE = '1';

// Command Handler Setup
const commands = new Map();
const commandsDir = path.join(__dirname, 'commands');

// Database JSON Setup
const dbPath = path.join(__dirname, 'database/db.json');
if (!fs.existsSync(path.join(__dirname, 'database'))) {
    fs.mkdirSync(path.join(__dirname, 'database'));
}
if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, JSON.stringify({ 
        users: {}, 
        groups: {},
        commands: {},
        captchas: {},
        reports: {} // Tambahan untuk menyimpan laporan
    }, null, 2));
}

// Fungsi untuk membaca dan menulis database
const readDB = () => JSON.parse(fs.readFileSync(dbPath, 'utf8'));
const writeDB = (data) => fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));

// Fungsi untuk generate captcha sederhana
const generateCaptcha = () => {
    const num1 = Math.floor(Math.random() * 10);
    const num2 = Math.floor(Math.random() * 10);
    const answer = num1 + num2;
    return { question: `${num1} + ${num2} = ?`, answer };
};

// Fungsi untuk memeriksa apakah sender adalah owner
const isOwner = (sender) => {
    return sender.startsWith(config.ownerNumber);
};

// Load commands dari folder commands/
function loadCommands() {
    const files = fs.readdirSync(commandsDir).filter(file => file.endsWith('.js'));
    for (const file of files) {
        const command = require(path.join(commandsDir, file));
        commands.set(command.name, command);
        console.log(`Loaded command: ${command.name}`);
    }
}

// Eksport commands, db, dan isOwner ke global
global.commands = commands;
global.db = { read: readDB, write: writeDB, generateCaptcha };
global.isOwner = isOwner;

async function connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
    
    const sock = makeWASocket({
        printQRInTerminal: true,
        auth: state,
        defaultQueryTimeoutMs: undefined
    });

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            qrcode.generate(qr, { small: true });
            console.log('Scan QR code dengan WhatsApp Anda');
        }

        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error instanceof Boom ? 
                lastDisconnect.error.output.statusCode !== DisconnectReason.loggedOut : true;
            
            console.log('Koneksi terputus:', lastDisconnect?.error, 'Mencoba reconnect:', shouldReconnect);
            if (shouldReconnect) {
                connectToWhatsApp();
            }
        } else if (connection === 'open') {
            console.log('Koneksi berhasil terbuka!');
        }
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0];
        
        if (!msg.message || msg.key.fromMe) return;

        const from = msg.key.remoteJid; // Grup atau individu
        const sender = msg.key.participant || msg.key.remoteJid; // Pengirim individu
        const messageText = msg.message.conversation || 
                          msg.message.extendedTextMessage?.text || 
                          '';
        
        const text = messageText.trim();
        
        let usedPrefix = null;
        for (const prefix of config.prefixes) {
            if (text.startsWith(prefix)) {
                usedPrefix = prefix;
                break;
            }
        }

        if (!usedPrefix) return;

        const commandBody = text.slice(usedPrefix.length).trim();
        const args = commandBody.split(/ +/);
        const commandName = args.shift().toLowerCase();

        // Inisialisasi data pengguna jika belum ada
        const dbData = global.db.read();
        if (!dbData.users[sender]) {
            dbData.users[sender] = {
                verify: false,
                limit: 10,
                money: 1000,
                commandCount: 0,
                lastUsed: null,
                downloads: { ytmp3: 0, ytmp4: 0 }
            };
        }
        // Inisialisasi data grup jika belum ada (opsional)
        if (!dbData.groups[from] && from.endsWith('@g.us')) {
            dbData.groups[from] = {
                commandCount: 0,
                lastUsed: null
            };
        }

        // Log penggunaan command untuk pengguna
        dbData.users[sender].commandCount += 1;
        dbData.users[sender].lastUsed = new Date().toISOString();
        if (from.endsWith('@g.us')) {
            dbData.groups[from].commandCount += 1;
            dbData.groups[from].lastUsed = new Date().toISOString();
        }
        if (!dbData.commands[commandName]) {
            dbData.commands[commandName] = { usage: 0 };
        }
        dbData.commands[commandName].usage += 1;
        global.db.write(dbData);

        // Cek command di folder commands/
        const command = commands.get(commandName);
        if (command) {
            try {
                await command.execute(sock, from, args, usedPrefix, sender);
            } catch (error) {
                console.error(`Error executing ${commandName}:`, error);
                await sock.sendMessage(from, { text: 'Terjadi kesalahan saat menjalankan perintah!' });
            }
        } else {
            // Jika tidak ditemukan di folder commands/, cek di case.js
            try {
                const handled = await handleCase(commandName, sock, from, args, usedPrefix, sender, msg);
                if (!handled) {
                    await sock.sendMessage(from, { text: `Perintah ${usedPrefix}${commandName} tidak ditemukan!` });
                }
            } catch (error) {
                console.error(`Error in case handler for ${commandName}:`, error);
                await sock.sendMessage(from, { text: 'Terjadi kesalahan saat menjalankan perintah case!' });
            }
        }
    });

    loadCommands();
}

process.on('uncaughtException', (err) => {
    console.error('Error:', err);
    process.exit(1);
});

connectToWhatsApp().catch(console.error);