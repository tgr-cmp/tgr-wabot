// Commands/execute.js
const { exec } = require('child_process');

module.exports = {
    name: '$',  // Nama perintah adalah $
    description: 'Execute shell command (owner only)',
    ownerOnly: true,  // Hanya untuk owner
    execute: async (sock, message, args, from) => {
        if (args.length === 0) {
            await sock.sendMessage(from, { text: 'Masukkan perintah yang ingin dieksekusi setelah $' });
            return;
        }

        const command = args.join(' ');  // Gabungkan args menjadi string perintah
        await sock.sendMessage(from, { text: `Mengeksekusi: ${command}` });

        exec(command, (error, stdout, stderr) => {
            if (error) {
                sock.sendMessage(from, { text: `Error: ${error.message}` });
                return;
            }
            if (stderr) {
                sock.sendMessage(from, { text: `Stderr: ${stderr}` });
                return;
            }
            sock.sendMessage(from, { text: `Output: ${stdout || 'Perintah selesai tanpa output'}` });
        });
    }
};