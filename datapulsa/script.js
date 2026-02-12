// Data Pulsa - Editable Table Version

// ========== CONFIG (INLINE) ==========
const CONFIG = {
    API_URL: 'https://script.google.com/macros/s/AKfycbwRafiiUzRt6yo8GxV2d0pG4VS64LBj8Mb9qnDUSVQDTGVEcZcB6E2TffXh3_vfopPHbQ/exec',
    SPREADSHEET_ID: '1AHkRaRjdYbW2HlKx6_nfXk7HK0cR5CRnqoqJtHbEelw',
    JENIS_OPTIONS: ['Pulsa', 'Kuota', 'Transfer', 'E-Wallet', 'Topup']
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
        return await this.call('getTransactions', { sheetName, token });
    },
    async saveAllTransactions(sheetName, transactions, token) {
        return await this.call('saveAllTransactions', { sheetName, transactions, token });
    },
    async getSummary(sheetName, token) {
        return await this.call('getSummary', { sheetName, token });
    }
};

function formatRupiah(number) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(number);
}
// ========== END CONFIG ==========

const token = localStorage.getItem('session_token');
const username = localStorage.getItem('username');

if (!token || !username) {
    window.location.href = '../login.html';
}

let userSheets = [];
let currentSheet = null;
let tableRows = [];

document.addEventListener('DOMContentLoaded', () => {
    initDataPulsa();
});

function initDataPulsa() {
    document.getElementById('currentUser').textContent = `User: ${username}`;
    
    updateHeaderTime();
    setInterval(updateHeaderTime, 1000);
    
    document.getElementById('backBtn')?.addEventListener('click', () => {
        window.location.href = '../dashboard.html';
    });
    
    document.getElementById('mobileLogoutBtn')?.addEventListener('click', () => {
        if (confirm('Keluar dari sistem?')) {
            localStorage.clear();
            window.location.href = '../login.html';
        }
    });
    
    document.getElementById('sheetSelect')?.addEventListener('change', (e) => {
        currentSheet = e.target.value;
        if (currentSheet) {
            loadSheetData();
        } else {
            hideDataSections();
        }
    });
    
    document.getElementById('createSheetBtn')?.addEventListener('click', openCreateSheetModal);
    document.getElementById('createSheetForm')?.addEventListener('submit', handleCreateSheet);
    
    document.getElementById('addRowBtn')?.addEventListener('click', addNewRow);
    document.getElementById('saveAllBtn')?.addEventListener('click', saveAllData);
    
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
        alert('❌ Gagal memuat daftar sheet');
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

function openCreateSheetModal() {
    document.getElementById('newSheetName').value = '';
    openModal('createSheetModal');
}

async function handleCreateSheet(e) {
    e.preventDefault();
    
    const sheetName = document.getElementById('newSheetName').value.trim();
    
    if (!sheetName) {
        alert('❌ Nama sheet tidak boleh kosong');
        return;
    }
    
    try {
        const result = await API.createSheet(username, sheetName, token);
        
        if (result.success) {
            closeModal('createSheetModal');
            alert('✅ Sheet berhasil dibuat!');
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
        alert('❌ Terjadi kesalahan');
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
            tableRows = transResult.transactions || [];
            renderTable();
        } else {
            tableRows = [];
            renderTable();
        }
        
        if (summaryResult.success) {
            updateSummary(summaryResult.summary);
        } else {
            updateSummary({ total: 0, utang: 0, sisa: 0 });
        }
    } catch (error) {
        console.error('Error:', error);
        alert('❌ Gagal memuat data');
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
}

function renderTable() {
    const tbody = document.getElementById('tableBody');
    tbody.innerHTML = '';
    
    // Render existing rows
    tableRows.forEach((row, index) => {
        tbody.appendChild(createTableRow(row, index));
    });
    
    // Add 10 empty rows for new input
    for (let i = 0; i < 10; i++) {
        tbody.appendChild(createTableRow({
            tanggal: '',
            nama: '',
            jenis: '',
            harga: '',
            status: 'Belum',
            keterangan: ''
        }, tableRows.length + i, true));
    }
    
    updateRowCount();
}

function createTableRow(data, index, isNew = false) {
    const tr = document.createElement('tr');
    if (isNew) tr.classList.add('unsaved');
    tr.dataset.index = index;
    
    // Tanggal
    const tdTanggal = document.createElement('td');
    const inputTanggal = document.createElement('input');
    inputTanggal.type = 'date';
    inputTanggal.value = data.tanggal ? convertDateToInput(data.tanggal) : '';
    tdTanggal.appendChild(inputTanggal);
    
    // Nama
    const tdNama = document.createElement('td');
    const inputNama = document.createElement('input');
    inputNama.type = 'text';
    inputNama.value = data.nama || '';
    inputNama.placeholder = 'Nama transaksi';
    tdNama.appendChild(inputNama);
    
    // Jenis (dropdown)
    const tdJenis = document.createElement('td');
    const selectJenis = document.createElement('select');
    selectJenis.innerHTML = '<option value="">-- Pilih --</option>';
    CONFIG.JENIS_OPTIONS.forEach(opt => {
        const option = document.createElement('option');
        option.value = opt;
        option.textContent = opt;
        if (data.jenis === opt) option.selected = true;
        selectJenis.appendChild(option);
    });
    tdJenis.appendChild(selectJenis);
    
    // Harga
    const tdHarga = document.createElement('td');
    const inputHarga = document.createElement('input');
    inputHarga.type = 'number';
    inputHarga.value = data.harga || '';
    inputHarga.placeholder = '0';
    tdHarga.appendChild(inputHarga);
    
    // Konfirmasi (Toggle)
    const tdStatus = document.createElement('td');
    const divToggle = document.createElement('div');
    divToggle.className = 'confirm-toggle';
    divToggle.innerHTML = `<span class="confirm-icon">${data.status === 'Bayar' ? '✅' : '❌'}</span>`;
    divToggle.dataset.status = data.status || 'Belum';
    divToggle.addEventListener('click', () => {
        const newStatus = divToggle.dataset.status === 'Bayar' ? 'Belum' : 'Bayar';
        divToggle.dataset.status = newStatus;
        divToggle.innerHTML = `<span class="confirm-icon">${newStatus === 'Bayar' ? '✅' : '❌'}</span>`;
    });
    tdStatus.appendChild(divToggle);
    
    // Keterangan
    const tdKet = document.createElement('td');
    const inputKet = document.createElement('input');
    inputKet.type = 'text';
    inputKet.value = data.keterangan || '';
    inputKet.placeholder = 'Keterangan';
    tdKet.appendChild(inputKet);
    
    // Delete button
    const tdDelete = document.createElement('td');
    const btnDelete = document.createElement('button');
    btnDelete.className = 'btn-delete-row';
    btnDelete.innerHTML = '🗑️';
    btnDelete.addEventListener('click', () => {
        if (confirm('Hapus baris ini?')) {
            tr.remove();
            updateRowCount();
        }
    });
    tdDelete.appendChild(btnDelete);
    
    tr.appendChild(tdTanggal);
    tr.appendChild(tdNama);
    tr.appendChild(tdJenis);
    tr.appendChild(tdHarga);
    tr.appendChild(tdStatus);
    tr.appendChild(tdKet);
    tr.appendChild(tdDelete);
    
    return tr;
}

function addNewRow() {
    const tbody = document.getElementById('tableBody');
    tbody.appendChild(createTableRow({
        tanggal: '',
        nama: '',
        jenis: '',
        harga: '',
        status: 'Belum',
        keterangan: ''
    }, tbody.children.length, true));
    updateRowCount();
}

async function saveAllData() {
    if (!currentSheet) {
        alert('❌ Pilih sheet terlebih dahulu');
        return;
    }
    
    const tbody = document.getElementById('tableBody');
    const rows = Array.from(tbody.querySelectorAll('tr'));
    
    const transactions = [];
    const dates = [];
    
    // Collect data
    rows.forEach((tr, idx) => {
        const inputs = tr.querySelectorAll('input, select');
        const tanggal = inputs[0].value;
        const nama = inputs[1].value;
        const jenis = inputs[2].value;
        const harga = inputs[3].value;
        const status = tr.querySelector('.confirm-toggle').dataset.status;
        const keterangan = inputs[4].value;
        
        // Skip empty rows
        if (!nama && !jenis && !harga) return;
        
        transactions.push({
            index: idx,
            tanggal,
            nama,
            jenis,
            harga: parseInt(harga) || 0,
            status,
            keterangan
        });
        
        if (tanggal) dates.push({ index: idx, date: tanggal });
    });
    
    // Auto-fill dates
    if (dates.length >= 2) {
        const firstDate = new Date(dates[0].date);
        const lastIndex = dates[dates.length - 1].index;
        
        transactions.forEach(t => {
            if (!t.tanggal && t.index >= dates[0].index && t.index <= lastIndex) {
                const daysDiff = t.index - dates[0].index;
                const autoDate = new Date(firstDate);
                autoDate.setDate(autoDate.getDate() + daysDiff);
                t.tanggal = formatDateForSave(autoDate);
            }
        });
    }
    
    // Validate
    const invalid = transactions.find(t => !t.tanggal || !t.nama || !t.jenis);
    if (invalid) {
        alert('❌ Lengkapi data: Tanggal, Nama, dan Jenis wajib diisi');
        return;
    }
    
    // Save
    try {
        const result = await API.saveAllTransactions(currentSheet, transactions, token);
        
        if (result.success) {
            alert('✅ Data berhasil disimpan!');
            loadSheetData();
        } else {
            alert('❌ ' + result.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('❌ Terjadi kesalahan saat menyimpan');
    }
}

function updateRowCount() {
    const tbody = document.getElementById('tableBody');
    const count = tbody.querySelectorAll('tr').length;
    document.getElementById('rowCount').textContent = `${count} baris`;
}

function convertDateToInput(dateStr) {
    // Convert DD-MM-YYYY to YYYY-MM-DD
    const parts = dateStr.split('-');
    if (parts.length === 3) {
        return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return dateStr;
}

function formatDateForSave(date) {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
}

function openModal(id) {
    document.getElementById(id)?.classList.add('show');
}

function closeModal(id) {
    document.getElementById(id)?.classList.remove('show');
}
