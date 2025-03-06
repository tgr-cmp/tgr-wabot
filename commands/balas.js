const config = require('../config');

module.exports = {
    name: 'balas',
    description: 'Balas laporan dari pengguna (contoh: !balas [id]|[pesan])',
    async execute(sock, from, args, prefix, sender) {
        if (!global.isOwner(sender)) {
            await sock.sendMessage(from, { text: '❌ Hanya owner yang bisa menggunakan perintah ini!' });
            return;
        }

        if (args.length < 1 || !args.join(' ').includes('|')) {
            await sock.sendMessage(from, { text: `Format: ${prefix}balas [id]|[pesan]` });
            return;
        }

        const [reportId, ...replyParts] = args.join(' ').split('|');
        const replyMessage = replyParts.join('|').trim();

        if (!reportId || !replyMessage) {
            await sock.sendMessage(from, { text: 'ID laporan atau pesan balasan tidak boleh kosong!' });
            return;
        }

        const dbData = global.db.read();
        const report = dbData.reports[reportId];

        if (!report) {
            await sock.sendMessage(from, { text: `❌ Laporan dengan ID ${reportId} tidak ditemukan!` });
            return;
        }

        if (report.status === 'replied') {
            await sock.sendMessage(from, { text: `❌ Laporan dengan ID ${reportId} sudah dibalas sebelumnya!` });
            return;
        }

        // Kirim balasan ke pengguna yang melapor
        const userId = report.sender;
        await sock.sendMessage(userId, { 
            text: `📬 Balasan dari Owner untuk Laporan ID ${reportId}:\n${replyMessage}\n\nReward: +200 Money, +2 Limit` 
        });

        // Berikan reward kepada pengguna
        const user = dbData.users[userId];
        user.money += 200;
        user.limit += 2;

        // Tandai laporan sebagai dibalas
        report.status = 'replied';
        report.reply = replyMessage;
        report.replyTimestamp = new Date().toISOString();
        global.db.write(dbData);

        // Beri tahu owner
        await sock.sendMessage(from, { 
            text: `✅ Balasan untuk laporan ID ${reportId} telah dikirim ke ${userId}!` 
        });
    }
};