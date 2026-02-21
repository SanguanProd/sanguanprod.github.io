// Admin Panel V2

const CONFIG = {
    API_URL: 'https://script.google.com/macros/s/AKfycbwYIm4bfNT4qZWvlGCpWsDkMV5ko-RQa7wyVvHolcrGXX1iRyYeGiJJ_j_kRubhGJgfUw/exec',
    SPREADSHEET_ID: '1AHkRaRjdYbW2HlKx6_nfXk7HK0cR5CRnqoqJtHbEelw'
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
        return await this.call('getTransactionsV2', { sheetName, token });
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

const token = localStorage.getItem('session_token');
const role = localStorage.getItem('role');

if (!token || role !== 'admin') {
    alert('Hanya admin yang dapat mengakses');
    window.location.href = '../dashboard.html';
}

let allSheets = [];
let selectedSheet = null;

document.addEventListener('DOMContentLoaded', () => {
    initAdmin();
});

function initAdmin() {
    document.getElementById('backBtn')?.addEventListener('click', () => {
        window.location.href = '../dashboard.html';
    });
    
    document.getElementById('adminCreateSheetForm')?.addEventListener('submit', handleAdminCreateSheet);
    document.getElementById('refreshBtn')?.addEventListener('click', loadAllSheets);
    
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
        alert('❌ Lengkapi semua field');
        return;
    }
    
    try {
        const result = await API.createSheet(username, sheetName, token);
        
        if (result.success) {
            alert('✅ Sheet dibuat!');
            document.getElementById('adminCreateSheetForm').reset();
            loadAllSheets();
        } else {
            alert('❌ ' + result.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('❌ Error');
    }
}

async function loadAllSheets() {
    const list = document.getElementById('allSheetsList');
    list.innerHTML = '<div class="loading-state"><div class="loader"></div><p>Memuat...</p></div>';
    
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
        list.innerHTML = '<div class="empty-state"><p>Error loading</p></div>';
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
    document.getElementById('adminTableBody').innerHTML = '<tr><td colspan="8" style="text-align:center;padding:30px;">Memuat...</td></tr>';
    
    openModal('viewSheetModal');
    
    try {
        const [transResult, summaryResult] = await Promise.all([
            API.getTransactions(sheetName, token),
            API.getSummary(sheetName, token)
        ]);
        
        if (transResult.success) {
            renderAdminTransactions(transResult.transactions || []);
        } else {
            document.getElementById('adminTableBody').innerHTML = '<tr><td colspan="8" style="text-align:center;">Error</td></tr>';
        }
        
        if (summaryResult.success) {
            const s = summaryResult.summary;
            document.getElementById('adminTotal').textContent = formatRupiah(s.total || 0);
            document.getElementById('adminUtang').textContent = formatRupiah(s.utang || 0);
            document.getElementById('adminSisa').textContent = formatRupiah(s.sisa || 0);
            document.getElementById('adminIncome').textContent = formatRupiah(s.income || 0);
        }
    } catch (error) {
        console.error('Error:', error);
        document.getElementById('adminTableBody').innerHTML = '<tr><td colspan="8" style="text-align:center;">Error</td></tr>';
    }
}

function renderAdminTransactions(transactions) {
    const tbody = document.getElementById('adminTableBody');
    
    if (transactions.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:30px;">Belum ada transaksi</td></tr>';
        return;
    }
    
    tbody.innerHTML = transactions.map(t => `
        <tr>
            <td>${t.tanggal}</td>
            <td>${t.nama}</td>
            <td>${t.jenis}</td>
            <td>${t.nominal}</td>
            <td>${formatRupiah(t.harga_asli || 0)}</td>
            <td>${formatRupiah(t.harga_jual || 0)}</td>
            <td><span class="status-badge status-${t.status.toLowerCase()}">${t.status === 'Bayar' ? '✅' : '❌'}</span></td>
            <td>${t.keterangan || '-'}</td>
        </tr>
    `).join('');
}

function openModal(id) {
    document.getElementById(id)?.classList.add('show');
}

function closeModal(id) {
    document.getElementById(id)?.classList.remove('show');
}
