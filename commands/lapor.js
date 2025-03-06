const config = require('../config');

module.exports = {
    name: 'lapor',
    description: 'Laporkan masalah ke owner (contoh: !lapor [pesan])',
    async execute(sock, from, args, prefix, sender) {
        const dbData = global.db.read();
        const user = dbData.users[sender];

        if (!user.verify) {
            await sock.sendMessage(from, { text: `❌ Anda harus terverifikasi untuk menggunakan perintah ini. Gunakan ${prefix}daftar terlebih dahulu!` });
            return;
        }

        if (args.length === 0) {
            await sock.sendMessage(from, { text: `Format: ${prefix}lapor [pesan]` });
            return;
        }

        const reportMessage = args.join(' ');
        const reportId = Date.now().toString(); // ID laporan berdasarkan timestamp
        const report = {
            id: reportId,
            sender: sender,
            message: reportMessage,
            timestamp: new Date().toISOString(),
            status: 'pending'
        };

        // Simpan laporan ke database
        dbData.reports[reportId] = report;
        global.db.write(dbData);

        // Kirim laporan ke owner
        const ownerNumber = `${config.ownerNumber}@s.whatsapp.net`;
        await sock.sendMessage(ownerNumber, { 
            text: `📩 Laporan Baru\nID: ${reportId}\nDari: ${sender}\nPesan: ${reportMessage}\nBalas dengan: ${prefix}balas ${reportId}|<pesan>` 
        });

        // Beri tahu pengguna
        await sock.sendMessage(from, { 
            text: `✅ Laporan Anda telah dikirim! ID Laporan: ${reportId}\nTunggu balasan dari owner.` 
        });
    }
};