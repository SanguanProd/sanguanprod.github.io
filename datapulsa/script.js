// Data Pulsa V2 - POS System

const CONFIG = {
    API_URL: 'https://script.google.com/macros/s/AKfycbwYIm4bfNT4qZWvlGCpWsDkMV5ko-RQa7wyVvHolcrGXX1iRyYeGiJJ_j_kRubhGJgfUw/exec',
    SPREADSHEET_ID: '1AHkRaRjdYbW2HlKx6_nfXk7HK0cR5CRnqoqJtHbEelw',
    
    PULSA_PRICE: {
'5k': {asli: 5500, jual: 8000},
'10k': {asli: 10500, jual: 13000},
'15k': {asli: 15500, jual: 18000},
'20k': {asli: 20500, jual: 23000},
'25k': {asli: 25500, jual: 28000},
'30k': {asli: 30500, jual: 33000},
'45k': {asli: 45500, jual: 48000},
'50k': {asli: 50500, jual: 53000},
'55k': {asli: 55500, jual: 58000},
'60k': {asli: 60500, jual: 63000},
'65k': {asli: 65500, jual: 68000},
'70k': {asli: 70500, jual: 73000},
'75k': {asli: 75500, jual: 78000},
'80k': {asli: 80500, jual: 83000},
'85k': {asli: 85500, jual: 88000},
'90k': {asli: 90500, jual: 93000},
'95k': {asli: 95500, jual: 98000},
'100k': {asli: 100500, jual: 103000},
'150k': {asli: 150500, jual: 153000}

    },
    
    TOKEN_PRICE: {
        '20k': {asli: 20800, jual: 23000},
        '50k': {asli: 50800, jual: 53000},
        '100k': {asli: 100800, jual: 103000}
    }
};

const API = {
    async call(action, data = {}) {
        try {
            const response = await fetch(CONFIG.API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain' },
                body: JSON.stringify({ action, ...data })
            });
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            return { success: false, message: 'Koneksi gagal' };
        }
    },
    async getUserSheets(username, token) {
        return await this.call('getUserSheets', { username, token });
    },
    async createSheet(username, sheetName, token) {
        return await this.call('createSheet', { username, sheetName, token });
    },
    async getTransactions(sheetName, token) {
        return await this.call('getTransactionsV2', { sheetName, token });
    },
    async addTransaction(sheetName, transaction, token) {
        return await this.call('addTransactionV2', { sheetName, transaction, token });
    },
    async updateTransaction(sheetName, rowIndex, transaction, token) {
        return await this.call('updateTransactionV2', { sheetName, rowIndex, transaction, token });
    },
    async deleteTransaction(sheetName, rowIndex, token) {
        return await this.call('deleteTransaction', { sheetName, rowIndex, token });
    },
    async getSummary(sheetName, token) {
        return await this.call('getSummaryV2', { sheetName, token });
    }
};

function formatRupiah(number) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(number);
}

function formatDate(date) {
    const d = new Date(date);
    return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
}

const token = localStorage.getItem('session_token');
const username = localStorage.getItem('username');

if (!token || !username) window.location.href = '../login.html';

let userSheets = [];
let currentSheet = null;
let transactions = [];
let editingIndex = null;

document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

function initApp() {
    document.getElementById('currentUser').textContent = `User: ${username}`;
    updateHeaderTime();
    setInterval(updateHeaderTime, 1000);
    
    document.getElementById('backBtn')?.addEventListener('click', () => window.location.href = '../dashboard.html');
    document.getElementById('mobileLogoutBtn')?.addEventListener('click', () => {
        if (confirm('Keluar?')) {
            localStorage.clear();
            window.location.href = '../login.html';
        }
    });
    
    document.getElementById('sheetSelect')?.addEventListener('change', (e) => {
        currentSheet = e.target.value;
        if (currentSheet) loadSheetData();
        else hideDataSections();
    });
    
    document.getElementById('createSheetBtn')?.addEventListener('click', () => openModal('createSheetModal'));
    document.getElementById('createSheetForm')?.addEventListener('submit', handleCreateSheet);
    
    document.getElementById('btnMasuk')?.addEventListener('click', () => openMasukModal());
    document.getElementById('btnKeluar')?.addEventListener('click', () => openKeluarModal());
    
    document.getElementById('masukJenis')?.addEventListener('change', handleJenisChange);
    document.getElementById('masukNominalDropdown')?.addEventListener('change', handleNominalChange);
    document.getElementById('masukNominalManual')?.addEventListener('input', handleManualNominalChange);
    
    document.getElementById('masukForm')?.addEventListener('submit', handleMasukSubmit);
    document.getElementById('keluarForm')?.addEventListener('submit', handleKeluarSubmit);
    
    document.querySelectorAll('.close-modal, .btn-cancel').forEach(btn => {
        btn.addEventListener('click', () => {
            const modalId = btn.getAttribute('data-modal');
            if (modalId) closeModal(modalId);
        });
    });
    
    loadUserSheets();
}

function updateHeaderTime() {
    const el = document.getElementById('headerTime');
    if (el) {
        const now = new Date();
        el.textContent = `${now.toLocaleDateString('id-ID', {day: '2-digit', month: 'short'})} ${now.toLocaleTimeString('id-ID', {hour: '2-digit', minute: '2-digit'})}`;
    }
}

async function loadUserSheets() {
    try {
        const result = await API.getUserSheets(username, token);
        if (result.success) {
            userSheets = result.sheets || [];
            renderSheetSelect();
        } else {
            alert('❌ ' + result.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('❌ Gagal memuat sheet');
    }
}

function renderSheetSelect() {
    const select = document.getElementById('sheetSelect');
    if (!select) return;
    select.innerHTML = '<option value="">-- Pilih Sheet --</option>';
    userSheets.forEach(sheet => {
        const option = document.createElement('option');
        option.value = sheet;
        option.textContent = sheet.replace(username + '_', '');
        select.appendChild(option);
    });
}

async function handleCreateSheet(e) {
    e.preventDefault();
    const sheetName = document.getElementById('newSheetName').value.trim();
    if (!sheetName) {
        alert('❌ Nama sheet kosong');
        return;
    }
    try {
        const result = await API.createSheet(username, sheetName, token);
        if (result.success) {
            closeModal('createSheetModal');
            alert('✅ Sheet dibuat!');
            await loadUserSheets();
            const fullName = `${username}_${sheetName}`;
            document.getElementById('sheetSelect').value = fullName;
            currentSheet = fullName;
            loadSheetData();
        } else {
            alert('❌ ' + result.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('❌ Error');
    }
}

async function loadSheetData() {
    if (!currentSheet) return;
    showDataSections();
    
    try {
        const [transResult, summaryResult] = await Promise.all([
            API.getTransactions(currentSheet, token),
            API.getSummary(currentSheet, token)
        ]);
        
        if (transResult.success) {
            transactions = transResult.transactions || [];
            renderTable();
        }
        
        if (summaryResult.success) {
            updateSummary(summaryResult.summary);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('❌ Error loading');
    }
}

function showDataSections() {
    document.getElementById('summarySection').style.display = 'block';
    document.getElementById('transactionsSection').style.display = 'block';
}

function hideDataSections() {
    document.getElementById('summarySection').style.display = 'none';
    document.getElementById('transactionsSection').style.display = 'none';
}

function updateSummary(summary) {
    document.getElementById('totalUang').textContent = formatRupiah(summary.total || 0);
    document.getElementById('jumlahUtang').textContent = formatRupiah(summary.utang || 0);
    document.getElementById('sisaUang').textContent = formatRupiah(summary.sisa || 0);
    document.getElementById('income').textContent = formatRupiah(summary.income || 0);
}

function renderTable() {
    const tbody = document.getElementById('tableBody');
    tbody.innerHTML = '';
    
    if (transactions.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;padding:30px;">Belum ada transaksi</td></tr>';
        return;
    }
    
    transactions.forEach((t, idx) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${t.tanggal}</td>
            <td>${t.nama}</td>
            <td>${t.jenis}</td>
            <td>${t.nominal}</td>
            <td>${formatRupiah(t.harga_asli || 0)}</td>
            <td>${formatRupiah(t.harga_jual || 0)}</td>
            <td><span class="status-badge status-${t.status.toLowerCase()}" onclick="toggleStatus(${idx})">${t.status === 'Bayar' ? '✅' : '❌'}</span></td>
            <td>${t.keterangan || '-'}</td>
            <td><button class="btn-edit-icon" onclick="editTransaction(${idx})">✏️</button></td>
        `;
        tbody.appendChild(tr);
    });
}

async function toggleStatus(index) {
    const t = transactions[index];
    t.status = t.status === 'Bayar' ? 'Ngutang' : 'Bayar';
    
    try {
        const result = await API.updateTransaction(currentSheet, index, t, token);
        if (result.success) {
            loadSheetData();
        } else {
            alert('❌ ' + result.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('❌ Error');
    }
}

function openMasukModal(index = null) {
    editingIndex = index;
    const form = document.getElementById('masukForm');
    form.reset();
    document.getElementById('masukTanggal').value = new Date().toISOString().split('T')[0];
    
    if (index !== null) {
        const t = transactions[index];
        document.getElementById('editRowIndex').value = index;
        document.getElementById('masukTanggal').value = t.tanggal.split('-').reverse().join('-');
        document.getElementById('masukNama').value = t.nama;
        document.getElementById('masukJenis').value = t.jenis;
        // Trigger jenis change untuk populate dropdown/manual
        handleJenisChange();
        document.getElementById('masukHargaAsli').value = t.harga_asli;
        document.getElementById('masukHargaJual').value = t.harga_jual;
        document.getElementById('masukKet').value = t.keterangan || '';
        document.getElementById('masukKonfirmasi').value = t.status;
    } else {
        document.getElementById('editRowIndex').value = '';
    }
    
    openModal('masukModal');
}

function handleJenisChange() {
    const jenis = document.getElementById('masukJenis').value;
    const dropdown = document.getElementById('masukNominalDropdown');
    const manual = document.getElementById('masukNominalManual');
    
    dropdown.style.display = 'none';
    manual.style.display = 'none';
    dropdown.innerHTML = '';
    manual.value = '';
    
    if (jenis === 'Pulsa') {
        dropdown.style.display = 'block';
        dropdown.innerHTML = '<option value="">-- Pilih --</option>';
        Object.keys(CONFIG.PULSA_PRICE).forEach(key => {
            dropdown.innerHTML += `<option value="${key}">${key}</option>`;
        });
    } else if (jenis === 'Token') {
        dropdown.style.display = 'block';
        dropdown.innerHTML = '<option value="">-- Pilih --</option>';
        Object.keys(CONFIG.TOKEN_PRICE).forEach(key => {
            dropdown.innerHTML += `<option value="${key}">${key}</option>`;
        });
    } else {
        manual.style.display = 'block';
    }
}

function handleNominalChange() {
    const jenis = document.getElementById('masukJenis').value;
    const nominal = document.getElementById('masukNominalDropdown').value;
    
    if (jenis === 'Pulsa' && CONFIG.PULSA_PRICE[nominal]) {
        document.getElementById('masukHargaAsli').value = CONFIG.PULSA_PRICE[nominal].asli;
        document.getElementById('masukHargaJual').value = CONFIG.PULSA_PRICE[nominal].jual;
    } else if (jenis === 'Token' && CONFIG.TOKEN_PRICE[nominal]) {
        document.getElementById('masukHargaAsli').value = CONFIG.TOKEN_PRICE[nominal].asli;
        document.getElementById('masukHargaJual').value = CONFIG.TOKEN_PRICE[nominal].jual;
    }
}

function handleManualNominalChange() {
    const jenis = document.getElementById('masukJenis').value;
    const nominalText = document.getElementById('masukNominalManual').value;
    
    // Extract angka dari text (contoh: "1GB 3 Hari 50000" → 50000)
    const angka = parseInt(nominalText.replace(/\D/g, '')) || 0;
    
    if (jenis === 'E-Wallet') {
        document.getElementById('masukHargaAsli').value = angka;
        const fee = angka >= 100000 ? 5000 : 3000;
        document.getElementById('masukHargaJual').value = angka + fee;
    } else if (jenis === 'Transfer') {
        document.getElementById('masukHargaAsli').value = angka;
        document.getElementById('masukHargaJual').value = angka + 7000;
    } else if (jenis === 'Kuota' || jenis === 'Lainnya') {
        document.getElementById('masukHargaAsli').value = angka;
        document.getElementById('masukHargaJual').value = angka;
    }
}

async function handleMasukSubmit(e) {
    e.preventDefault();
    
    const rowIndex = document.getElementById('editRowIndex').value;
    const jenis = document.getElementById('masukJenis').value;
    
    let nominal = '';
    if (jenis === 'Pulsa' || jenis === 'Token') {
        nominal = document.getElementById('masukNominalDropdown').value;
    } else {
        nominal = document.getElementById('masukNominalManual').value;
    }
    
    const tanggalInput = document.getElementById('masukTanggal').value;
    const [year, month, day] = tanggalInput.split('-');
    
    const transaction = {
        tanggal: `${day}-${month}-${year}`,
        nama: document.getElementById('masukNama').value,
        jenis: jenis,
        nominal: nominal,
        harga_asli: parseInt(document.getElementById('masukHargaAsli').value) || 0,
        harga_jual: parseInt(document.getElementById('masukHargaJual').value) || 0,
        status: document.getElementById('masukKonfirmasi').value,
        keterangan: document.getElementById('masukKet').value,
        tipe: 'masuk'
    };
    
    try {
        let result;
        if (rowIndex) {
            result = await API.updateTransaction(currentSheet, parseInt(rowIndex), transaction, token);
        } else {
            result = await API.addTransaction(currentSheet, transaction, token);
        }
        
        if (result.success) {
            closeModal('masukModal');
            loadSheetData();
            alert('✅ Tersimpan!');
        } else {
            alert('❌ ' + result.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('❌ Error');
    }
}

function openKeluarModal() {
    document.getElementById('keluarForm').reset();
    document.getElementById('keluarTanggal').value = new Date().toISOString().split('T')[0];
    openModal('keluarModal');
}

async function handleKeluarSubmit(e) {
    e.preventDefault();
    
    const tanggalInput = document.getElementById('keluarTanggal').value;
    const [year, month, day] = tanggalInput.split('-');
    const jenis = document.getElementById('keluarJenis').value;
    const nominal = parseInt(document.getElementById('keluarNominal').value) || 0;
    
    const transaction = {
        tanggal: `${day}-${month}-${year}`,
        nama: jenis,
        jenis: jenis,
        nominal: '-' + nominal,
        harga_asli: -nominal,
        harga_jual: -nominal,
        status: 'Bayar',
        keterangan: document.getElementById('keluarKet').value,
        tipe: 'keluar'
    };
    
    try {
        const result = await API.addTransaction(currentSheet, transaction, token);
        if (result.success) {
            closeModal('keluarModal');
            loadSheetData();
            alert('✅ Tersimpan!');
        } else {
            alert('❌ ' + result.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('❌ Error');
    }
}

function editTransaction(index) {
    openMasukModal(index);
}

function openModal(id) {
    document.getElementById(id)?.classList.add('show');
}

function closeModal(id) {
    document.getElementById(id)?.classList.remove('show');
}

