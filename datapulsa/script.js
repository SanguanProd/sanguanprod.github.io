// Data Pulsa Main Script

// Check authentication
const token = localStorage.getItem('session_token');
const username = localStorage.getItem('username');
const role = localStorage.getItem('role');

if (!token || !username) {
    window.location.href = '../login.html';
}

// State
let currentTransactions = [];
let currentFilter = 'semua';
let deleteRowIndex = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initDataPulsa();
});

function initDataPulsa() {
    // Set current user
    const currentUserEl = document.getElementById('currentUser');
    if (currentUserEl) {
        currentUserEl.textContent = `User: ${username}`;
    }
    
    // Update time
    updateHeaderTime();
    setInterval(updateHeaderTime, 1000);
    
    // Back button
    const backBtn = document.getElementById('backBtn');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            window.location.href = '../dashboard.html';
        });
    }
    
    // Stor button
    const storBtn = document.getElementById('storBtn');
    if (storBtn) {
        storBtn.addEventListener('click', () => openStorModal());
    }
    
    // Add transaction button
    const addTransactionBtn = document.getElementById('addTransactionBtn');
    if (addTransactionBtn) {
        addTransactionBtn.addEventListener('click', () => openTransactionModal());
    }
    
    // Filter
    const filterStatus = document.getElementById('filterStatus');
    if (filterStatus) {
        filterStatus.addEventListener('change', (e) => {
            currentFilter = e.target.value;
            renderTransactions();
        });
    }
    
    // Modal close buttons
    document.querySelectorAll('.close-modal, .btn-cancel').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const modalId = btn.getAttribute('data-modal');
            if (modalId) {
                closeModal(modalId);
            }
        });
    });
    
    // Stor form
    const storForm = document.getElementById('storForm');
    if (storForm) {
        storForm.addEventListener('submit', handleStorSubmit);
    }
    
    // Transaction form
    const transactionForm = document.getElementById('transactionForm');
    if (transactionForm) {
        transactionForm.addEventListener('submit', handleTransactionSubmit);
    }
    
    // Delete confirmation
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', handleDeleteConfirm);
    }
    
    // Load data
    loadData();
}

function updateHeaderTime() {
    const headerTime = document.getElementById('headerTime');
    if (headerTime) {
        const now = new Date();
        const timeString = now.toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit'
        });
        const dateString = now.toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'short'
        });
        headerTime.textContent = `${dateString} ${timeString}`;
    }
}

async function loadData() {
    try {
        // Load transactions
        const transResult = await API.getTransactions(username, token);
        
        if (transResult.success) {
            currentTransactions = transResult.transactions || [];
            renderTransactions();
        } else {
            showError('Gagal memuat transaksi: ' + transResult.message);
            currentTransactions = [];
            renderTransactions();
        }
        
        // Load summary
        const summaryResult = await API.getSummary(username, token);
        
        if (summaryResult.success) {
            updateSummary(summaryResult.summary);
        } else {
            updateSummary({ total: 0, utang: 0, sisa: 0 });
        }
        
    } catch (error) {
        console.error('Error loading data:', error);
        showError('Terjadi kesalahan saat memuat data');
    }
}

function updateSummary(summary) {
    const totalUangEl = document.getElementById('totalUang');
    const jumlahUtangEl = document.getElementById('jumlahUtang');
    const sisaUangEl = document.getElementById('sisaUang');
    
    if (totalUangEl) totalUangEl.textContent = formatRupiah(summary.total || 0);
    if (jumlahUtangEl) jumlahUtangEl.textContent = formatRupiah(summary.utang || 0);
    if (sisaUangEl) sisaUangEl.textContent = formatRupiah(summary.sisa || 0);
}

function renderTransactions() {
    const transactionsList = document.getElementById('transactionsList');
    const transactionCount = document.getElementById('transactionCount');
    
    if (!transactionsList) return;
    
    // Filter transactions
    let filtered = currentTransactions;
    if (currentFilter === 'belum') {
        filtered = currentTransactions.filter(t => t.status === 'Belum');
    } else if (currentFilter === 'bayar') {
        filtered = currentTransactions.filter(t => t.status === 'Bayar');
    }
    
    // Update count
    if (transactionCount) {
        transactionCount.textContent = `${filtered.length} transaksi`;
    }
    
    // Render
    if (filtered.length === 0) {
        transactionsList.innerHTML = `
            <div class="empty-state">
                <p>Tidak ada transaksi</p>
            </div>
        `;
        return;
    }
    
    transactionsList.innerHTML = filtered.map((trans, index) => {
        const originalIndex = currentTransactions.indexOf(trans);
        const harga = parseInt(trans.harga) || 0;
        const priceClass = harga >= 0 ? 'price-positive' : 'price-negative';
        const statusClass = trans.status === 'Bayar' ? 'status-bayar' : 'status-belum';
        const statusIcon = trans.status === 'Bayar' ? '✅' : '❌';
        
        return `
            <div class="transaction-card">
                <div class="transaction-header">
                    <span class="transaction-date">📅 ${trans.tanggal}</span>
                    <span class="transaction-status ${statusClass}">${statusIcon} ${trans.status}</span>
                </div>
                <div class="transaction-info">
                    <div class="transaction-name">${trans.nama}</div>
                    <div class="transaction-jenis">${trans.jenis}</div>
                </div>
                <div class="transaction-price ${priceClass}">
                    ${formatRupiah(harga)}
                </div>
                ${trans.keterangan ? `
                    <div class="transaction-keterangan">
                        ${trans.keterangan}
                    </div>
                ` : ''}
                <div class="transaction-actions">
                    <button class="btn-edit" onclick="editTransaction(${originalIndex})">
                        ✏️ Edit
                    </button>
                    <button class="btn-delete" onclick="deleteTransaction(${originalIndex})">
                        🗑️ Hapus
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// Stor Modal
function openStorModal() {
    const modal = document.getElementById('storModal');
    const form = document.getElementById('storForm');
    
    if (form) form.reset();
    
    if (modal) {
        modal.classList.add('show');
    }
}

async function handleStorSubmit(e) {
    e.preventDefault();
    
    const jumlah = document.getElementById('storJumlah').value;
    const keterangan = document.getElementById('storKeterangan').value;
    
    if (!jumlah || !keterangan) {
        alert('Mohon lengkapi semua field');
        return;
    }
    
    const transaction = {
        tanggal: formatDate(new Date()),
        nama: `Stor - ${keterangan}`,
        jenis: 'Stor',
        harga: -Math.abs(parseInt(jumlah)), // Negative for expense
        status: 'Bayar',
        keterangan: keterangan
    };
    
    try {
        const result = await API.addTransaction(username, transaction, token);
        
        if (result.success) {
            closeModal('storModal');
            loadData();
            showSuccess('Stor berhasil disimpan');
        } else {
            showError('Gagal menyimpan: ' + result.message);
        }
    } catch (error) {
        console.error('Error:', error);
        showError('Terjadi kesalahan');
    }
}

// Transaction Modal
function openTransactionModal(editData = null, rowIndex = null) {
    const modal = document.getElementById('transactionModal');
    const form = document.getElementById('transactionForm');
    const title = document.getElementById('transactionModalTitle');
    
    if (form) form.reset();
    
    if (editData) {
        // Edit mode
        if (title) title.textContent = '✏️ Edit Transaksi';
        
        document.getElementById('transactionRowIndex').value = rowIndex;
        document.getElementById('transactionTanggal').value = editData.tanggal.split('-').reverse().join('-');
        document.getElementById('transactionNama').value = editData.nama;
        document.getElementById('transactionJenis').value = editData.jenis;
        document.getElementById('transactionHarga').value = editData.harga;
        document.getElementById('transactionStatus').value = editData.status;
        document.getElementById('transactionKeterangan').value = editData.keterangan || '';
    } else {
        // Add mode
        if (title) title.textContent = '➕ Tambah Transaksi';
        document.getElementById('transactionRowIndex').value = '';
        document.getElementById('transactionTanggal').value = new Date().toISOString().split('T')[0];
    }
    
    if (modal) {
        modal.classList.add('show');
    }
}

async function handleTransactionSubmit(e) {
    e.preventDefault();
    
    const rowIndex = document.getElementById('transactionRowIndex').value;
    const tanggalInput = document.getElementById('transactionTanggal').value;
    const nama = document.getElementById('transactionNama').value;
    const jenis = document.getElementById('transactionJenis').value;
    const harga = document.getElementById('transactionHarga').value;
    const status = document.getElementById('transactionStatus').value;
    const keterangan = document.getElementById('transactionKeterangan').value;
    
    // Convert date format from YYYY-MM-DD to DD-MM-YYYY
    const [year, month, day] = tanggalInput.split('-');
    const tanggal = `${day}-${month}-${year}`;
    
    const transaction = {
        tanggal,
        nama,
        jenis,
        harga: parseInt(harga),
        status,
        keterangan
    };
    
    try {
        let result;
        
        if (rowIndex) {
            // Update existing
            result = await API.updateTransaction(username, parseInt(rowIndex), transaction, token);
        } else {
            // Add new
            result = await API.addTransaction(username, transaction, token);
        }
        
        if (result.success) {
            closeModal('transactionModal');
            loadData();
            showSuccess(rowIndex ? 'Transaksi berhasil diupdate' : 'Transaksi berhasil ditambahkan');
        } else {
            showError('Gagal menyimpan: ' + result.message);
        }
    } catch (error) {
        console.error('Error:', error);
        showError('Terjadi kesalahan');
    }
}

function editTransaction(index) {
    const transaction = currentTransactions[index];
    if (transaction) {
        openTransactionModal(transaction, index);
    }
}

function deleteTransaction(index) {
    deleteRowIndex = index;
    const modal = document.getElementById('deleteModal');
    if (modal) {
        modal.classList.add('show');
    }
}

async function handleDeleteConfirm() {
    if (deleteRowIndex === null) return;
    
    try {
        const result = await API.deleteTransaction(username, deleteRowIndex, token);
        
        if (result.success) {
            closeModal('deleteModal');
            loadData();
            showSuccess('Transaksi berhasil dihapus');
            deleteRowIndex = null;
        } else {
            showError('Gagal menghapus: ' + result.message);
        }
    } catch (error) {
        console.error('Error:', error);
        showError('Terjadi kesalahan');
    }
}

// Modal functions
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('show');
    }
}

// Notification functions
function showSuccess(message) {
    alert('✅ ' + message);
}

function showError(message) {
    alert('❌ ' + message);
}
