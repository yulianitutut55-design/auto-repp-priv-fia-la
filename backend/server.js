const express = require('express');
const cors = require('cors');
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// PATH FILE PENYIMPANAN SENDER
const SENDER_DB_PATH = path.join(__dirname, 'sender-db.json');

// FUNGSI BACA DATA SENDER
async function readSenderDB() {
    try {
        const data = await fs.readFile(SENDER_DB_PATH, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        // JIKA FILE BELUM ADA, BUAT DATA KOSONG
        await fs.writeFile(SENDER_DB_PATH, JSON.stringify([]));
        return [];
    }
}

// FUNGSI SIMPAN DATA SENDER
async function writeSenderDB(data) {
    await fs.writeFile(SENDER_DB_PATH, JSON.stringify(data, null, 2));
}

// ENDPOINT TAMBAH SENDER
app.post('/add-sender', async (req, res) => {
    const { number, token } = req.body;
    const senders = await readSenderDB();
    
    // CEK APAKAH SENDER SUDAH ADA
    const exists = senders.some(s => s.number === number);
    if (exists) {
        return res.json({ message: "Sender sudah terdaftar!" });
    }

    senders.push({ number, token, status: 'aktif' });
    await writeSenderDB(senders);
    res.json({ message: "Sender berhasil ditambahkan!" });
});

// ENDPOINT AMBIL SEMUA SENDER
app.get('/get-senders', async (req, res) => {
    const senders = await readSenderDB();
    res.json(senders);
});

// ENDPOINT HAPUS SENDER
app.post('/delete-sender', async (req, res) => {
    const { index } = req.body;
    const senders = await readSenderDB();
    
    if (index < 0 || index >= senders.length) {
        return res.json({ message: "Sender tidak ditemukan!" });
    }

    senders.splice(index, 1);
    await writeSenderDB(senders);
    res.json({ message: "Sender berhasil dihapus!" });
});

// ENDPOINT LAPORAN DENGAN SENDER TERTENTU
app.post('/report', async (req, res) => {
    const { target, reason, senderNumber, senderToken } = req.body;
    
    try {
        // KIRIM PERMINTAAN KE ANTARMUKA TIDAK RESMI
        const response = await axios.post('https://[ANTARMUKA-TIDAK-RESMI-WA].com/api/report', {
            targetNumber: target,
            reportReason: reason,
            senderAuthToken: senderToken,
            senderNumber: senderNumber
        }, { timeout: 15000 });

        res.json({ message: `Berhasil - ${response.data.status}` });
    } catch (error) {
        // JIKA GAGAL, SET STATUS SENDER MENJADI TIDAK AKTIF
        const senders = await readSenderDB();
        const senderIdx = senders.findIndex(s => s.number === senderNumber);
        if (senderIdx !== -1) {
            senders[senderIdx].status = 'tidak aktif';
            await writeSenderDB(senders);
        }

        res.json({ message: `Gagal - ${error.response?.data?.message || error.message}` });
    }
});

app.listen(PORT, () => console.log("Server berjalan di port " + PORT));
