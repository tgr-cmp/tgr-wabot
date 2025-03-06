module.exports = {
    name: 'broadcast',
    description: 'Kirim pesan ke semua pengguna (khusus owner)',
    async execute(sock, from, args, prefix, sender) {
        if (!global.isOwner(sender)) {
            await sock.sendMessage(from, { text: '❌ Hanya owner yang bisa menggunakan perintah ini!' });
            return;
        }

        if (args.length === 0) {
            await sock.sendMessage(from, { text: `Format: ${prefix}broadcast [pesan]` });
            return;
        }

        const message = args.join(' ');
        const dbData = global.db.read();

        for (const userId in dbData.users) {
            await sock.sendMessage(userId, { text: `📢 Pesan dari owner: ${message}` });
        }

        await sock.sendMessage(from, { text: '✅ Pesan broadcast telah dikirim ke semua pengguna!' });
    }
};