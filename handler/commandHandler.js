// commandHandler.js
const fs = require('fs');
const path = require('path');
const { prefixes, owner } = require('../config');

class CommandHandler {
    constructor(sock) {
        this.sock = sock;
        this.commands = new Map();
        this.loadCommands();
    }

    loadCommands() {
        const commandsPath = path.join(__dirname, '../commands');
        const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

        for (const file of commandFiles) {
            const command = require(path.join(commandsPath, file));
            this.commands.set(command.name, command);
            console.log(`Loaded command: ${command.name}`);
        }
    }

    // Perbaikan fungsi isOwner
    isOwner(message) {
        const sender = message.key.participant || message.key.remoteJid;
        return sender === owner;
    }

    async handleMessage(message) {
        if (!message.message || message.key.fromMe) return;

        const from = message.key.remoteJid;
        const messageContent = message.message.conversation || 
                             message.message.extendedTextMessage?.text || 
                             '';
        const text = messageContent.toLowerCase();

        for (const prefix of prefixes) {
            if (text.startsWith(prefix)) {
                const commandText = text.slice(prefix.length).trim();
                const [commandName, ...args] = commandText.split(/\s+/);
                
                const command = this.commands.get(commandName);
                if (command) {
                    try {
                        if (command.ownerOnly && !this.isOwner(message)) {
                            await this.sock.sendMessage(from, { 
                                text: 'Perintah ini hanya untuk owner!' 
                            });
                            return;
                        }
                        await command.execute(this.sock, message, args, from);
                    } catch (error) {
                        console.error(`Error executing command ${commandName}:`, error);
                        await this.sock.sendMessage(from, { 
                            text: 'Terjadi error saat menjalankan perintah' 
                        });
                    }
                }
                break;
            }
        }
    }

    getCommands() {
        return this.commands;
    }
}

module.exports = CommandHandler;