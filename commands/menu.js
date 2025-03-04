const config = require('../config');

module.exports = {
    name: 'menu',
    description: 'Menampilkan daftar semua perintah',
    async execute(sock, from, args, prefix) {
        let menuText = `📋 *Menu ${config.botName}*\n`;
        menuText += `Prefix: ${config.prefixes.join(', ')}\n\n`;
        menuText += 'Daftar Perintah:\n';

        const commandList = Array.from(global.commands.values());
        
        commandList.forEach((cmd, index) => {
            menuText += `${index + 1}. *${prefix}${cmd.name}*\n`;
            menuText += `   ${cmd.description}\n`;
        });

        menuText += `\nKetik ${prefix}command untuk menggunakan perintah!`;
        await sock.sendMessage(from, { text: menuText });
    }
};