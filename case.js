const { openai } = require("./lib/scraper/ai.js")

async function handleCase(commandName, sock, from, args, prefix, sender, msg) {
    const dbData = global.db.read();
    const user = dbData.users[sender];

    switch (commandName) {
        case 'ai':
            if (args.length < 1) {
                return await sock.sendMessage(from, { text: `Format: ${prefix}ai query` });
            }
            if (user.limit <= 0) {
                await sock.sendMessage(from, { text: '❌ Limit Anda habis! Tambah limit dengan !buy atau tunggu reset harian.' });
                return;
            }
            user.limit -= 1;
            global.db.write(dbData);
            const query = args[0]
            const res = await openai(query, 'openai')
            sock.sendMessage(from, { text: res }, { quoted: msg})
            return true;

        case 'saldo':
            if (!user.verify) {
                return await sock.sendMessage(from, { text: `❌ Anda harus terverifikasi untuk menggunakan perintah ini. Gunakan ${prefix}daftar terlebih dahulu!` });
            }
            await sock.sendMessage(from, { text: `💰 Saldo Anda: ${user.money}` });
            return true;

        case 'addmoney':
            if (!global.isOwner(sender)) {
                await sock.sendMessage(from, { text: '❌ Hanya owner yang bisa menggunakan perintah ini!' });
                return;
            }
            if (args.length < 1) {
                await sock.sendMessage(from, { text: `Format: ${prefix}addmoney [jumlah]` });
                return 
            }
            const amount = parseInt(args[0]);
            if (isNaN(amount) || amount <= 0) {
                await sock.sendMessage(from, { text: 'Masukkan jumlah yang valid!' });
                return
            }
            user.money += amount;
            global.db.write(dbData);
            await sock.sendMessage(from, { text: `✅ Berhasil menambah ${amount} money! Saldo sekarang: ${user.money}` });
            return true;

        case 'resetalllimits':
            if (!global.isOwner(sender)) {
                 // Pemeriksaan isOwner
               return await sock.sendMessage(from, { text: '❌ Hanya owner yang bisa menggunakan perintah ini!' });
            }
            for (const userId in dbData.users) {
                dbData.users[userId].limit = 10;
            }
            global.db.write(dbData);
            await sock.sendMessage(from, { text: '✅ Semua limit pengguna telah direset ke 10!' });
            return true;

        default:
            return false; // Command tidak ditemukan di case.js
    }
}

module.exports = handleCase;