const config = require('../config');

module.exports = {
    name: 'info',
    description: 'Menampilkan informasi bot dan statistik pengguna',
    async execute(sock, from, args, prefix) {
        const dbData = global.db.read();
        const user = dbData.users[from] || { 
            verify: false, 
            limit: 10, 
            money: 1000, 
            commandCount: 0, 
            lastUsed: 'Belum pernah',
            downloads: { ytmp3: 0, ytmp4: 0 }
        };
        
        const infoText = `🤖 ${config.botName}
Status: Online
Prefix: ${config.prefixes.join(', ')}
Owner: ${config.owner}
Tanggal: ${new Date().toLocaleDateString()}
\n📊 Statistik Anda:
- Verifikasi: ${user.verify ? '✅' : '❌'}
- Limit: ${user.limit}
- Money: ${user.money}
- Jumlah Command: ${user.commandCount}
- Download MP3: ${user.downloads.ytmp3}
- Download MP4: ${user.downloads.ytmp4}
- Terakhir Digunakan: ${user.lastUsed}`;
        await sock.sendMessage(from, { text: infoText });
    }
};