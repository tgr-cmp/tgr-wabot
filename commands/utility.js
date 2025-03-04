module.exports = {
    name: 'hitung',
    description: 'Menjumlahkan dua angka',
    async execute(sock, from, args, prefix) {
        if (args.length < 2) {
            await sock.sendMessage(from, { 
                text: `Format: ${prefix}hitung [angka1] [angka2]` 
            });
            return;
        }

        const [num1, num2] = args.map(Number);
        if (isNaN(num1) || isNaN(num2)) {
            await sock.sendMessage(from, { text: 'Masukkan angka yang valid!' });
            return;
        }

        const result = num1 + num2;
        await sock.sendMessage(from, { 
            text: `Hasil: ${num1} + ${num2} = ${result}` 
        });
    }
};