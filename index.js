// index.js
const { 
    default: makeWASocket, 
    useMultiFileAuthState, 
    DisconnectReason,
    fetchLatestBaileysVersion 
} = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const pino = require('pino');
const readline = require("node:readline");
const CommandHandler = require('./handler/commandHandler');

const question = (text) => { 
    const rl = readline.createInterface({ 
        input: process.stdin, 
        output: process.stdout 
    }); 
    return new Promise((resolve) => { 
        rl.question(text, resolve) 
    }) 
};

async function connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
    const { version } = await fetchLatestBaileysVersion();
    
    const sock = makeWASocket({
        version,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false,
        auth: state,
        defaultQueryTimeoutMs: undefined,
        generateHighQualityLinkPreview: true
    });

    // Inisialisasi CommandHandler
    const commandHandler = new CommandHandler(sock);

    // Pairing code logic
    if (!sock.authState.creds.registered) {
        const phoneNumber = await question('Enter Phone Number :\n');
        let code = await sock.requestPairingCode(phoneNumber);
        code = code?.match(/.{1,4}/g)?.join("-") || code;
        console.log(`Pairing Code :`, code);
    }

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('Koneksi terputus:', lastDisconnect?.error, 'Mencoba reconnect:', shouldReconnect);
            
            if (shouldReconnect) {
                connectToWhatsApp();
            }
        } else if (connection === 'open') {
            console.log('Bot WhatsApp berhasil terkoneksi!');
        }
    });

    sock.ev.on('creds.update', saveCreds);

    // Event handler untuk pesan masuk
    sock.ev.on('messages.upsert', async (msg) => {
        const message = msg.messages[0];
        await commandHandler.handleMessage(message);
    });
}

// Jalankan bot
connectToWhatsApp().catch(err => console.log('Error:', err));

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
});