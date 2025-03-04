const ytdl = require('@distube/ytdl-core');
const fs = require('fs');
const path = require('path');

// Buat agent dengan cookies dari file cookies.json
let agent;
try {
    const cookies = JSON.parse(fs.readFileSync(path.join(__dirname, '../cookies.json')));
    agent = ytdl.createAgent(cookies);
} catch (error) {
    console.error('Error loading cookies for ytmp3:', error);
    agent = null;
}

module.exports = {
    name: 'ytmp3',
    description: 'Download audio dari YouTube (contoh: !ytmp3 [url])',
    async execute(sock, from, args, prefix, sender) {
        const dbData = global.db.read();
        const user = dbData.users[sender]; // Perbaikan: Gunakan sender, bukan from

        if (!user.verify) {
            await sock.sendMessage(from, { text: `❌ Anda harus terverifikasi untuk menggunakan perintah ini. Gunakan ${prefix}daftar terlebih dahulu!` });
            return;
        }

        if (args.length === 0) {
            await sock.sendMessage(from, { text: `Format: ${prefix}ytmp3 [URL YouTube]` });
            return;
        }

        if (user.limit <= 0) {
            await sock.sendMessage(from, { text: '❌ Limit Anda habis! Tambah limit dengan !buy atau tunggu reset harian.' });
            return;
        }

        const url = args[0];
        if (!ytdl.validateURL(url)) {
            await sock.sendMessage(from, { text: 'URL YouTube tidak valid!' });
            return;
        }

        try {
            await sock.sendMessage(from, { text: '⏳ Sedang mendownload audio...' });

            const options = agent ? { 
                agent,
                requestOptions: {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                    }
                }
            } : { 
                requestOptions: {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                    }
                }
            };

            const info = await ytdl.getInfo(url, options);
            const title = info.videoDetails.title.replace(/[^\w\s]/gi, '');
            const outputPath = path.join(__dirname, `../downloads/${title}.mp4`);

            if (!fs.existsSync(path.join(__dirname, '../downloads'))) {
                fs.mkdirSync(path.join(__dirname, '../downloads'));
            }

            await new Promise((resolve, reject) => {
                const stream = ytdl(url, { 
                    filter: 'audioonly', 
                    quality: 'highestaudio',
                    ...options 
                });
                const fileStream = fs.createWriteStream(outputPath);
                stream.pipe(fileStream);
                stream.on('end', resolve);
                stream.on('error', reject);
            });

            const stats = fs.statSync(outputPath);
            const fileSizeInMB = stats.size / (1024 * 1024);
            if (fileSizeInMB > 16) {
                fs.unlinkSync(outputPath);
                await sock.sendMessage(from, { 
                    text: '❌ Audio terlalu besar (>16MB). Coba video yang lebih pendek.' 
                });
                return;
            }

            await sock.sendMessage(from, { 
                audio: { url: outputPath },
                mimetype: 'audio/mp4',
                fileName: `${title}.mp3`
            });

            fs.unlinkSync(outputPath);

            user.limit -= 1;
            user.downloads.ytmp3 += 1;
            global.db.write(dbData);

            await sock.sendMessage(from, { text: `✅ Audio berhasil dikirim! Limit tersisa: ${user.limit}` });

        } catch (error) {
            console.error('Error downloading YouTube audio:', error);
            if (error.statusCode === 403) {
                await sock.sendMessage(from, { 
                    text: '❌ Gagal mendownload: Akses ditolak (403). Perbarui cookies.json atau coba lagi nanti.' 
                });
            } else if (error.message.includes('Sign in to confirm')) {
                await sock.sendMessage(from, { 
                    text: '❌ Cookies YouTube tidak valid atau kedaluwarsa. Harap perbarui cookies.json.' 
                });
            } else {
                await sock.sendMessage(from, { 
                    text: '❌ Gagal mendownload audio. Pastikan URL valid atau coba lagi nanti.' 
                });
            }
        }
    }
};