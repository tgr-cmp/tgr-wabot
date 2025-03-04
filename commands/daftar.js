module.exports = {
    name: 'daftar',
    description: 'Daftar sebagai pengguna baru dengan captcha (contoh: !daftar)',
    async execute(sock, from, args, prefix, sender) {
        const dbData = global.db.read();
        const user = dbData.users[sender]; // Perbaikan: Gunakan sender, bukan from

        if (user.verify) {
            await sock.sendMessage(from, { text: '✅ Anda sudah terdaftar dan terverifikasi!' });
            return;
        }

        // Generate captcha
        const captcha = global.db.generateCaptcha();
        dbData.captchas[sender] = { answer: captcha.answer, expires: Date.now() + 300000 }; // Expired dalam 5 menit
        global.db.write(dbData);

        await sock.sendMessage(from, { 
            text: `📝 Silakan jawab captcha untuk mendaftar:\n${captcha.question}\nKirim jawaban dengan: ${prefix}verify [jawaban]` 
        });
    }
};