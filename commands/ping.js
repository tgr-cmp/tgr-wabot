// Commands/ping.js
module.exports = {
    name: 'ping',
    description: 'Test respons bot',
    execute: async (sock, message, args, from) => {
        await sock.sendMessage(from, { text: 'Pong!' });
    }
};