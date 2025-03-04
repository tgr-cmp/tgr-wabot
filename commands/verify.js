module.exports = {
    name: 'verify',
    description: 'Verifikasi akun Anda dengan captcha (contoh: !verify [jawaban])',
    async execute(sock, from, args, prefix, sender) {
        const dbData = global.db.read();
        const user = dbData.users[sender]; // Perbaikan: Gunakan sender, bukan from
        const captcha = dbData.captchas[sender];

        if (user.verify) {
            await sock.sendMessage(from, { text: '✅ Anda sudah terverifikasi!' });
            return;
        }

        if (!captcha) {
            await sock.sendMessage(from, { 
                text: `❌ Anda belum memulai proses verifikasi. Gunakan ${prefix}daftar terlebih dahulu!` 
            });
            return;
        }

        if (args.length === 0) {
            await sock.sendMessage(from, { text: 'Masukkan jawaban captcha! Contoh: !verify 5' });
            return;
        }

        const userAnswer = parseInt(args[0]);
        if (isNaN(userAnswer)) {
            await sock.sendMessage(from, { text: 'Jawaban harus berupa angka!' });
            return;
        }

        // Cek apakah captcha sudah kedaluwarsa
        if (Date.now() > captcha.expires) {
            delete dbData.captchas[sender];
            global.db.write(dbData);
            await sock.sendMessage(from, { 
                text: `❌ Captcha telah kedaluwarsa. Gunakan ${prefix}daftar lagi untuk mendapatkan captcha baru.` 
            });
            return;
        }

        // Validasi jawaban
        if (userAnswer === captcha.answer) {
            user.verify = true;
            user.money += 500; // Bonus verifikasi
            delete dbData.captchas[sender]; // Hapus captcha setelah sukses
            global.db.write(dbData);
            await sock.sendMessage(from, { 
                text: '✅ Verifikasi berhasil! Anda mendapatkan bonus 500 money.' 
            });
        } else {
            await sock.sendMessage(from, { 
                text: '❌ Jawaban salah! Coba lagi atau gunakan !daftar untuk captcha baru.' 
            });
        }
    }
};