// Commands/restart.js
module.exports = {
    name: 'restart',
    description: 'Restart bot (owner only)',
    ownerOnly: true, // Hanya bisa diakses owner
    execute: async (sock, message, args, from) => {
        await sock.sendMessage(from, { text: 'Bot akan restart...' });
        process.exit(0); // Keluar dari proses, bisa diganti dengan logika restart lain
    }
};