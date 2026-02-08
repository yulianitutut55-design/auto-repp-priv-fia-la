let autoReportInterval;
let senderData = [];

// AMBIL DATA SENDER DARI BACKEND SAAT HALAMAN DIBUKA
window.onload = async () => {
    await fetchSenderData();
    updateSenderLists();
};

// TAMPILKAN/KEMBALIKAN CONTAINER PILIH SENDER SPESIFIK
document.getElementById('senderSelection').addEventListener('change', (e) => {
    const container = document.getElementById('specificSenderContainer');
    container.style.display = e.target.value === 'specific' ? 'block' : 'none';
});

// FUNGSI TAMBAH SENDER
async function addSender() {
    const number = document.getElementById('senderNumber').value;
    const token = document.getElementById('senderToken').value;
    
    if (!number || !token) {
        alert("Isi semua kolom!");
        return;
    }

    const response = await fetch('https://[NAMA-YOUR-APP].vercel.app/add-sender', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ number, token })
    });

    const result = await response.json();
    alert(result.message);
    await fetchSenderData();
    updateSenderLists();
}

// FUNGSI AMBIL DATA SENDER
async function fetchSenderData() {
    const response = await fetch('https://[NAMA-YOUR-APP].vercel.app/get-senders');
    senderData = await response.json();
}

// FUNGSI UPDATE DAFTAR SENDER DI FRONTEND
function updateSenderLists() {
    const listContainer = document.getElementById('senderList');
    const specificSelect = document.getElementById('specificSender');
    
    // UPDATE DAFTAR SENDER
    listContainer.innerHTML = senderData.map((sender, idx) => `
        <div class="sender-item">
            <span>${sender.number} - ${sender.status}</span>
            <button class="delete-btn" onclick="deleteSender(${idx})">Hapus</button>
        </div>
    `).join('');

    // UPDATE PILIHAN SENDER SPESIFIK
    specificSelect.innerHTML = senderData.map((sender, idx) => `
        <option value="${idx}">${sender.number}</option>
    `).join('');
}

// FUNGSI HAPUS SENDER
async function deleteSender(index) {
    const response = await fetch('https://[NAMA-YOUR-APP].vercel.app/delete-sender', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ index })
    });

    const result = await response.json();
    alert(result.message);
    await fetchSenderData();
    updateSenderLists();
}

// FUNGSI MULAI OTOMATIS REPORT
function startAutoReport() {
    const target = document.getElementById('targetNumber').value;
    const reason = document.getElementById('reportReason').value;
    const interval = parseInt(document.getElementById('intervalTime').value) * 1000;
    const selectionType = document.getElementById('senderSelection').value;
    let selectedSenders = [];

    if (!target || !reason) {
        alert("Isi target dan alasan laporan!");
        return;
    }

    // PILIH SENDER YANG DIGUNAKAN
    if (selectionType === 'all') {
        selectedSenders = senderData.filter(s => s.status === 'aktif');
    } else {
        const idx = parseInt(document.getElementById('specificSender').value);
        selectedSenders = [senderData[idx]];
    }

    if (selectedSenders.length === 0) {
        alert("Tidak ada sender aktif yang tersedia!");
        return;
    }

    // JALANKAN OTOMATISASI
    let currentSenderIdx = 0;
    document.getElementById('status').textContent = "OTOMATIS REPORT BERJALAN...";
    
    autoReportInterval = setInterval(async () => {
        const sender = selectedSenders[currentSenderIdx];
        try {
            const response = await fetch('https://[NAMA-YOUR-APP].vercel.app/report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    target, 
                    reason, 
                    senderNumber: sender.number,
                    senderToken: sender.token 
                })
            });

            const result = await response.json();
            document.getElementById('status').textContent = `Terakhir dari ${sender.number}: ${result.message}`;
            
            // GANTI SENDER SETIAP KALI LAPORAN DIKIRIM
            currentSenderIdx = (currentSenderIdx + 1) % selectedSenders.length;
        } catch (error) {
            document.getElementById('status').textContent = `Gagal dari ${sender.number}: ${error.message}`;
        }
    }, interval);
}

// FUNGSI BERHENTIKAN OTOMATIS REPORT
function stopAutoReport() {
    clearInterval(autoReportInterval);
    document.getElementById('status').textContent = "OTOMATIS REPORT DIHENTIKAN";
}
