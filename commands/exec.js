const { exec } = require('child_process');

module.exports = {
    name: 'exec',
    description: 'Jalankan perintah shell (khusus owner, contoh: !exec ls)',
    async execute(sock, from, args, prefix, sender) {
        if (!global.isOwner(sender)) {
            await sock.sendMessage(from, { text: '❌ Hanya owner yang bisa menggunakan perintah ini!' });
            return;
        }

        if (args.length === 0) {
            await sock.sendMessage(from, { text: `Format: ${prefix}exec [perintah]` });
            return;
        }

        const shellCommand = args.join(' ');

        await sock.sendMessage(from, { text: `⏳ Menjalankan: ${shellCommand}` });

        exec(shellCommand, (error, stdout, stderr) => {
            if (error) {
                sock.sendMessage(from, { text: `❌ Error:\n${error.message}` });
                return;
            }
            if (stderr) {
                sock.sendMessage(from, { text: `⚠️ Stderr:\n${stderr}` });
                return;
            }
            const output = stdout || '✅ Perintah selesai, tidak ada output.';
            sock.sendMessage(from, { text: `📤 Output:\n${output}` });
        });
    }
};