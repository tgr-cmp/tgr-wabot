module.exports = {
    name: 'buy',
    description: 'Beli limit tambahan (contoh: !buy [jumlah])',
    async execute(sock, from, args, prefix, sender) {
        const dbData = global.db.read();
        const user = dbData.users[sender]; // Perbaikan: Gunakan sender, bukan from

        if (!user.verify) {
            await sock.sendMessage(from, { text: `❌ Anda harus terverifikasi untuk menggunakan perintah ini. Gunakan ${prefix}daftar terlebih dahulu!` });
            return;
        }

        if (args.length === 0) {
            await sock.sendMessage(from, { text: `Format: ${prefix}buy [jumlah]\nHarga: 100 money per limit` });
            return;
        }

        const amount = parseInt(args[0]);
        if (isNaN(amount) || amount <= 0) {
            await sock.sendMessage(from, { text: 'Masukkan jumlah yang valid!' });
            return;
        }

        const cost = amount * 100; // 100 money per limit
        if (user.money < cost) {
            await sock.sendMessage(from, { text: `❌ Uang Anda (${user.money}) tidak cukup! Dibutuhkan: ${cost}` });
            return;
        }

        user.money -= cost;
        user.limit += amount;
        global.db.write(dbData);

        await sock.sendMessage(from, { text: `✅ Berhasil membeli ${amount} limit! Sisa money: ${user.money}, Limit: ${user.limit}` });
    }
};