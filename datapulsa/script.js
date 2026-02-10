// Data Pulsa - Single Spreadsheet Multi-Sheet System

// ========== CONFIG (INLINE) ==========
const CONFIG = {
    API_URL: 'YOUR_DATAPULSA_APPS_SCRIPT_URL_HERE',
    SPREADSHEET_ID: '1AHkRaRjdYbW2HlKx6_nfXk7HK0cR5CRnqoqJtHbEelw',
    SESSION_TIMEOUT: 24 * 60 * 60 * 1000,
    ROLES: { ADMIN: 'admin', USER: 'user' }
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
    async getAllSheets(token) {
        return await this.call('getAllSheets', { token });
    },
    async createSheet(username, sheetName, token) {
        return await this.call('createSheet', { username, sheetName, token });
    },
    async getTransactions(sheetName, token) {
        return await this.call('getTransactions', { sheetName, token });
    },
    async addTransaction(sheetName, transaction, token) {
        return await this.call('addTransaction', { sheetName, transaction, token });
    },
    async updateTransaction(sheetName, rowIndex, transaction, token) {
        return await this.call('updateTransaction', { sheetName, rowIndex, transaction, token });
    },
    async deleteTransaction(sheetName, rowIndex, token) {
        return await this.call('deleteTransaction', { sheetName, rowIndex, token });
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

function formatDate(date) {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
}
// ========== END CONFIG ==========

const token = localStorage.getItem('session_token');
const username = localStorage.getItem('username');
const role = localStorage.getItem('role');

if (!token || !username) {
    window.location.href = '../login.html';
}

let userSheets = [];
let currentSheet = null;
let currentTransactions = [];
let currentFilter = 'semua';
let deleteRowIndex = null;

document.addEventListener('DOMContentLoaded', () => {
    initDataPulsa();
});

function initDataPulsa() {
    const currentUserEl = document.getElementById('currentUser');
    if (currentUserEl) {
        currentUserEl.textContent = `User: ${username}`;
    }
    
    updateHeaderTime();
    setInterval(updateHeaderTime, 1000);
    
    // Back button
    document.getElementById('backBtn')?.addEventListener('click', () => {
        window.location.href = '../dashboard.html';
    });
    
    // Mobile logout
    document.getElementById('mobileLogoutBtn')?.addEventListener('click', () => {
        if (confirm('Keluar dari sistem?')) {
            localStorage.clear();
            window.location.href = '../login.html';
        }
    });
    
    // Sheet selector
    document.getElementById('sheetSelect')?.addEventListener('change', (e) => {
        currentSheet = e.target.value;
        if (currentSheet) {
            loadSheetData();
        } else {
            hideDataSections();
        }
    });
    
    // Create sheet button
    document.getElementById('createSheetBtn')?.addEventListener('click', openCreateSheetModal);
    
    // Create sheet form
    document.getElementById('createSheetForm')?.addEventListener('submit', handleCreateSheet);
    
    // Stor & Add buttons
    document.getElementById('storBtn')?.addEventListener('click', openStorModal);
    document.getElementById('addTransactionBtn')?.addEventListener('click', () => openTransactionModal());
    
    // Filter
    document.getElementById('filterStatus')?.addEventListener('change', (e) => {
        currentFilter = e.target.value;
        renderTransactions();
    });
    
    // Forms
    document.getElementById('storForm')?.addEventListener('submit', handleStorSubmit);
    document.getElementById('transactionForm')?.addEventListener('submit', handleTransactionSubmit);
    document.getElementById('confirmDeleteBtn')?.addEventListener('click', handleDeleteConfirm);
    
    // Modal close
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
        console.error('Error loading sheets:', error);
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
    
    const fullSheetName = `${username}_${sheetName}`;
    
    try {
        const result = await API.createSheet(username, sheetName, token);
        
        if (result.success) {
            closeModal('createSheetModal');
            alert('✅ Sheet berhasil dibuat!');
            await loadUserSheets();
            document.getElementById('sheetSelect').value = fullSheetName;
            currentSheet = fullSheetName;
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
    
    document.getElementById('transactionsList').innerHTML = '<div class="loading-state"><div class="loader"></div><p>Memuat data...</p></div>';
    
    try {
        const [transResult, summaryResult] = await Promise.all([
            API.getTransactions(currentSheet, token),
            API.getSummary(currentSheet, token)
        ]);
        
        if (transResult.success) {
            currentTransactions = transResult.transactions || [];
            renderTransactions();
        } else {
            currentTransactions = [];
            renderTransactions();
        }
        
        if (summaryResult.success) {
            updateSummary(summaryResult.summary);
        } else {
            updateSummary({ total: 0, utang: 0, sisa: 0 });
        }
    } catch (error) {
        console.error('Error:', error);
        document.getElementById('transactionsList').innerHTML = '<div class="empty-state"><p>Terjadi kesalahan saat memuat data</p></div>';
    }
}

function showDataSections() {
    document.getElementById('summarySection').style.display = 'block';
    document.getElementById('filterSection').style.display = 'flex';
    document.getElementById('transactionsSection').style.display = 'block';
}

function hideDataSections() {
    document.getElementById('summarySection').style.display = 'none';
    document.getElementById('filterSection').style.display = 'none';
    document.getElementById('transactionsSection').style.display = 'none';
}

function updateSummary(summary) {
    document.getElementById('totalUang').textContent = formatRupiah(summary.total || 0);
    document.getElementById('jumlahUtang').textContent = formatRupiah(summary.utang || 0);
    document.getElementById('sisaUang').textContent = formatRupiah(summary.sisa || 0);
}

function renderTransactions() {
    const list = document.getElementById('transactionsList');
    const count = document.getElementById('transactionCount');
    
    let filtered = currentTransactions;
    if (currentFilter === 'belum') filtered = currentTransactions.filter(t => t.status === 'Belum');
    else if (currentFilter === 'bayar') filtered = currentTransactions.filter(t => t.status === 'Bayar');
    
    if (count) count.textContent = `${filtered.length} transaksi`;
    
    if (filtered.length === 0) {
        list.innerHTML = '<div class="empty-state"><p>Tidak ada transaksi</p></div>';
        return;
    }
    
    list.innerHTML = filtered.map((t, idx) => {
        const originalIdx = currentTransactions.indexOf(t);
        const harga = parseInt(t.harga) || 0;
        const priceClass = harga >= 0 ? 'price-positive' : 'price-negative';
        const statusClass = t.status === 'Bayar' ? 'status-bayar' : 'status-belum';
        const statusIcon = t.status === 'Bayar' ? '✅' : '❌';
        
        return `
            <div class="transaction-card">
                <div class="transaction-header">
                    <span class="transaction-date">📅 ${t.tanggal}</span>
                    <span class="transaction-status ${statusClass}">${statusIcon} ${t.status}</span>
                </div>
                <div class="transaction-info">
                    <div class="transaction-name">${t.nama}</div>
                    <div class="transaction-jenis">${t.jenis}</div>
                </div>
                <div class="transaction-price ${priceClass}">${formatRupiah(harga)}</div>
                ${t.keterangan ? `<div class="transaction-keterangan">${t.keterangan}</div>` : ''}
                <div class="transaction-actions">
                    <button class="btn-edit" onclick="editTransaction(${originalIdx})">✏️ Edit</button>
                    <button class="btn-delete" onclick="deleteTransaction(${originalIdx})">🗑️ Hapus</button>
                </div>
            </div>
        `;
    }).join('');
}

function openStorModal() {
    if (!currentSheet) {
        alert('❌ Pilih sheet terlebih dahulu');
        return;
    }
    document.getElementById('storForm').reset();
    openModal('storModal');
}

async function handleStorSubmit(e) {
    e.preventDefault();
    
    const jumlah = document.getElementById('storJumlah').value;
    const keterangan = document.getElementById('storKeterangan').value;
    
    const transaction = {
        tanggal: formatDate(new Date()),
        nama: `Stor - ${keterangan}`,
        jenis: 'Stor',
        harga: -Math.abs(parseInt(jumlah)),
        status: 'Bayar',
        keterangan: keterangan
    };
    
    try {
        const result = await API.addTransaction(currentSheet, transaction, token);
        
        if (result.success) {
            closeModal('storModal');
            loadSheetData();
            alert('✅ Stor berhasil disimpan');
        } else {
            alert('❌ ' + result.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('❌ Terjadi kesalahan');
    }
}

function openTransactionModal(editData = null, rowIndex = null) {
    if (!currentSheet) {
        alert('❌ Pilih sheet terlebih dahulu');
        return;
    }
    
    const form = document.getElementById('transactionForm');
    const title = document.getElementById('transactionModalTitle');
    
    form.reset();
    
    if (editData) {
        title.textContent = '✏️ Edit Transaksi';
        document.getElementById('transactionRowIndex').value = rowIndex;
        document.getElementById('transactionTanggal').value = editData.tanggal.split('-').reverse().join('-');
        document.getElementById('transactionNama').value = editData.nama;
        document.getElementById('transactionJenis').value = editData.jenis;
        document.getElementById('transactionHarga').value = editData.harga;
        document.getElementById('transactionStatus').value = editData.status;
        document.getElementById('transactionKeterangan').value = editData.keterangan || '';
    } else {
        title.textContent = '➕ Tambah Transaksi';
        document.getElementById('transactionRowIndex').value = '';
        document.getElementById('transactionTanggal').value = new Date().toISOString().split('T')[0];
    }
    
    openModal('transactionModal');
}

async function handleTransactionSubmit(e) {
    e.preventDefault();
    
    const rowIndex = document.getElementById('transactionRowIndex').value;
    const tanggalInput = document.getElementById('transactionTanggal').value;
    const [year, month, day] = tanggalInput.split('-');
    const tanggal = `${day}-${month}-${year}`;
    
    const transaction = {
        tanggal,
        nama: document.getElementById('transactionNama').value,
        jenis: document.getElementById('transactionJenis').value,
        harga: parseInt(document.getElementById('transactionHarga').value),
        status: document.getElementById('transactionStatus').value,
        keterangan: document.getElementById('transactionKeterangan').value
    };
    
    try {
        let result;
        
        if (rowIndex) {
            result = await API.updateTransaction(currentSheet, parseInt(rowIndex), transaction, token);
        } else {
            result = await API.addTransaction(currentSheet, transaction, token);
        }
        
        if (result.success) {
            closeModal('transactionModal');
            loadSheetData();
            alert('✅ ' + (rowIndex ? 'Transaksi diupdate' : 'Transaksi ditambahkan'));
        } else {
            alert('❌ ' + result.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('❌ Terjadi kesalahan');
    }
}

function editTransaction(index) {
    openTransactionModal(currentTransactions[index], index);
}

function deleteTransaction(index) {
    deleteRowIndex = index;
    openModal('deleteModal');
}

async function handleDeleteConfirm() {
    if (deleteRowIndex === null) return;
    
    try {
        const result = await API.deleteTransaction(currentSheet, deleteRowIndex, token);
        
        if (result.success) {
            closeModal('deleteModal');
            loadSheetData();
            alert('✅ Transaksi dihapus');
            deleteRowIndex = null;
        } else {
            alert('❌ ' + result.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('❌ Terjadi kesalahan');
    }
}

function openModal(id) {
    document.getElementById(id)?.classList.add('show');
}

function closeModal(id) {
    document.getElementById(id)?.classList.remove('show');
}
