// Admin Panel Script

// ========== CONFIG (INLINE) ==========
const CONFIG = {
    API_URL: 'https://script.google.com/macros/s/AKfycbxm6qwWstFfkaaaBTfcC4SZ1I8GU82MFnChgEHbjZJG2IbueZDL_4nhd_qsEZJYJ8OKWQ/exec',
    SPREADSHEET_ID: '1AHkRaRjdYbW2HlKx6_nfXk7HK0cR5CRnqoqJtHbEelw',
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
    async getAllSheets(token) {
        return await this.call('getAllSheets', { token });
    },
    async createSheet(username, sheetName, token) {
        return await this.call('createSheet', { username, sheetName, token });
    },
    async getTransactions(sheetName, token) {
        return await this.call('getTransactions', { sheetName, token });
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
const role = localStorage.getItem('role');

let allSheets = [];
let selectedSheet = null;
let adminTransactions = [];
let adminFilter = 'semua';

document.addEventListener('DOMContentLoaded', () => {
    initAdmin();
});

function initAdmin() {
    document.getElementById('backBtn')?.addEventListener('click', () => {
        window.location.href = '../dashboard.html';
    });
    
    document.getElementById('adminCreateSheetForm')?.addEventListener('submit', handleAdminCreateSheet);
    document.getElementById('refreshBtn')?.addEventListener('click', loadAllSheets);
    document.getElementById('adminFilter')?.addEventListener('change', (e) => {
        adminFilter = e.target.value;
        renderAdminTransactions();
    });
    
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', () => {
            const modalId = btn.getAttribute('data-modal');
            if (modalId) closeModal(modalId);
        });
    });
    
    loadAllSheets();
}

async function handleAdminCreateSheet(e) {
    e.preventDefault();
    
    const username = document.getElementById('adminUsername').value.trim();
    const sheetName = document.getElementById('adminSheetName').value.trim();
    
    if (!username || !sheetName) {
        alert('❌ Mohon lengkapi semua field');
        return;
    }
    
    try {
        const result = await API.createSheet(username, sheetName, token);
        
        if (result.success) {
            alert('✅ Sheet berhasil dibuat!');
            document.getElementById('adminCreateSheetForm').reset();
            loadAllSheets();
        } else {
            alert('❌ ' + result.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('❌ Terjadi kesalahan');
    }
}

async function loadAllSheets() {
    const list = document.getElementById('allSheetsList');
    list.innerHTML = '<div class="loading-state"><div class="loader"></div><p>Memuat data...</p></div>';
    
    try {
        const result = await API.getAllSheets(token);
        
        if (result.success) {
            allSheets = result.sheets || [];
            renderAllSheets();
        } else {
            list.innerHTML = `<div class="empty-state"><p>${result.message}</p></div>`;
        }
    } catch (error) {
        console.error('Error:', error);
        list.innerHTML = '<div class="empty-state"><p>Terjadi kesalahan</p></div>';
    }
}

function renderAllSheets() {
    const list = document.getElementById('allSheetsList');
    
    if (allSheets.length === 0) {
        list.innerHTML = '<div class="empty-state"><p>Belum ada sheet</p></div>';
        return;
    }
    
    // Group by user
    const grouped = {};
    allSheets.forEach(sheet => {
        const user = sheet.split('_')[0];
        if (!grouped[user]) grouped[user] = [];
        grouped[user].push(sheet);
    });
    
    list.innerHTML = Object.keys(grouped).map(user => `
        <div class="user-group">
            <h4 class="user-group-title">👤 ${user}</h4>
            <div class="sheets-grid">
                ${grouped[user].map(sheet => `
                    <div class="sheet-item">
                        <div class="sheet-name">📄 ${sheet.replace(user + '_', '')}</div>
                        <button class="btn-view-sheet" onclick="viewSheet('${sheet}')">Lihat Data</button>
                    </div>
                `).join('')}
            </div>
        </div>
    `).join('');
}

async function viewSheet(sheetName) {
    selectedSheet = sheetName;
    
    document.getElementById('viewSheetTitle').textContent = `📊 ${sheetName}`;
    document.getElementById('adminTransactionsList').innerHTML = '<div class="loading-state"><div class="loader"></div><p>Memuat...</p></div>';
    
    openModal('viewSheetModal');
    
    try {
        const [transResult, summaryResult] = await Promise.all([
            API.getTransactions(sheetName, token),
            API.getSummary(sheetName, token)
        ]);
        
        if (transResult.success) {
            adminTransactions = transResult.transactions || [];
            renderAdminTransactions();
        } else {
            document.getElementById('adminTransactionsList').innerHTML = '<div class="empty-state"><p>Gagal memuat transaksi</p></div>';
        }
        
        if (summaryResult.success) {
            const s = summaryResult.summary;
            document.getElementById('adminTotal').textContent = formatRupiah(s.total || 0);
            document.getElementById('adminUtang').textContent = formatRupiah(s.utang || 0);
            document.getElementById('adminSisa').textContent = formatRupiah(s.sisa || 0);
        }
    } catch (error) {
        console.error('Error:', error);
        document.getElementById('adminTransactionsList').innerHTML = '<div class="empty-state"><p>Terjadi kesalahan</p></div>';
    }
}

function renderAdminTransactions() {
    const list = document.getElementById('adminTransactionsList');
    
    let filtered = adminTransactions;
    if (adminFilter === 'belum') filtered = adminTransactions.filter(t => t.status === 'Belum');
    else if (adminFilter === 'bayar') filtered = adminTransactions.filter(t => t.status === 'Bayar');
    
    if (filtered.length === 0) {
        list.innerHTML = '<div class="empty-state"><p>Tidak ada transaksi</p></div>';
        return;
    }
    
    list.innerHTML = filtered.map(t => {
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
            </div>
        `;
    }).join('');
}

function openModal(id) {
    document.getElementById(id)?.classList.add('show');
}

function closeModal(id) {
    document.getElementById(id)?.classList.remove('show');
}

