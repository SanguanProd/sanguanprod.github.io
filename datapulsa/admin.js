// Admin Panel Script for Data Pulsa

let allProjects = [];
let selectedUsername = null;
let adminCurrentTransactions = [];
let adminCurrentFilter = 'semua';

// Initialize admin panel
if (window.location.pathname.includes('admin.html')) {
    document.addEventListener('DOMContentLoaded', () => {
        initAdminPanel();
    });
}

function initAdminPanel() {
    // Back button
    const backBtn = document.getElementById('backBtn');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            window.location.href = '../dashboard.html';
        });
    }
    
    // Add project form
    const addProjectForm = document.getElementById('addProjectForm');
    if (addProjectForm) {
        addProjectForm.addEventListener('submit', handleAddProject);
    }
    
    // Refresh button
    const refreshProjectsBtn = document.getElementById('refreshProjectsBtn');
    if (refreshProjectsBtn) {
        refreshProjectsBtn.addEventListener('click', loadProjects);
    }
    
    // Admin filter
    const adminFilterStatus = document.getElementById('adminFilterStatus');
    if (adminFilterStatus) {
        adminFilterStatus.addEventListener('change', (e) => {
            adminCurrentFilter = e.target.value;
            renderAdminTransactions();
        });
    }
    
    // Admin add transaction button
    const adminAddTransactionBtn = document.getElementById('adminAddTransactionBtn');
    if (adminAddTransactionBtn) {
        adminAddTransactionBtn.addEventListener('click', () => {
            openAdminTransactionModal();
        });
    }
    
    // Admin transaction form
    const adminTransactionForm = document.getElementById('adminTransactionForm');
    if (adminTransactionForm) {
        adminTransactionForm.addEventListener('submit', handleAdminTransactionSubmit);
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
    
    // Load projects
    loadProjects();
}

async function handleAddProject(e) {
    e.preventDefault();
    
    const username = document.getElementById('projectUsername').value.trim();
    const spreadsheetUrl = document.getElementById('projectSpreadsheet').value.trim();
    
    if (!username || !spreadsheetUrl) {
        alert('Mohon lengkapi semua field');
        return;
    }
    
    // Validate spreadsheet URL
    if (!spreadsheetUrl.includes('docs.google.com/spreadsheets')) {
        alert('URL spreadsheet tidak valid. Pastikan menggunakan Google Spreadsheet.');
        return;
    }
    
    try {
        const result = await API.addUserProject(username, spreadsheetUrl, token);
        
        if (result.success) {
            showSuccess('Project berhasil ditambahkan');
            document.getElementById('addProjectForm').reset();
            loadProjects();
        } else {
            showError('Gagal menambahkan project: ' + result.message);
        }
    } catch (error) {
        console.error('Error:', error);
        showError('Terjadi kesalahan');
    }
}

async function loadProjects() {
    const projectsList = document.getElementById('projectsList');
    
    if (!projectsList) return;
    
    projectsList.innerHTML = `
        <div class="loading-state">
            <div class="loader"></div>
            <p>Memuat data...</p>
        </div>
    `;
    
    try {
        const result = await API.getAllProjects(token);
        
        if (result.success) {
            allProjects = result.projects || [];
            renderProjects();
        } else {
            projectsList.innerHTML = `
                <div class="empty-state">
                    <p>Gagal memuat project: ${result.message}</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error:', error);
        projectsList.innerHTML = `
            <div class="empty-state">
                <p>Terjadi kesalahan saat memuat data</p>
            </div>
        `;
    }
}

function renderProjects() {
    const projectsList = document.getElementById('projectsList');
    
    if (!projectsList) return;
    
    if (allProjects.length === 0) {
        projectsList.innerHTML = `
            <div class="empty-state">
                <p>Belum ada project yang ditambahkan</p>
            </div>
        `;
        return;
    }
    
    projectsList.innerHTML = allProjects.map((project, index) => `
        <div class="project-item">
            <div class="project-header">
                <div class="project-username">👤 ${project.username}</div>
                <span class="project-status">${project.status || 'active'}</span>
            </div>
            <div class="project-date">📅 Dibuat: ${project.created_date}</div>
            <div class="project-url">🔗 ${project.spreadsheet_url}</div>
            <button class="btn-view-data" onclick="viewUserData('${project.username}')">
                📊 Lihat & Edit Data
            </button>
        </div>
    `).join('');
}

async function viewUserData(username) {
    selectedUsername = username;
    
    const modal = document.getElementById('userDataModal');
    const title = document.getElementById('userDataTitle');
    const transactionsList = document.getElementById('adminTransactionsList');
    
    if (title) {
        title.textContent = `👤 Data User: ${username}`;
    }
    
    if (transactionsList) {
        transactionsList.innerHTML = `
            <div class="loading-state">
                <div class="loader"></div>
                <p>Memuat data...</p>
            </div>
        `;
    }
    
    if (modal) {
        modal.classList.add('show');
    }
    
    try {
        // Load transactions
        const transResult = await API.getTransactions(username, token);
        
        if (transResult.success) {
            adminCurrentTransactions = transResult.transactions || [];
            renderAdminTransactions();
        } else {
            if (transactionsList) {
                transactionsList.innerHTML = `
                    <div class="empty-state">
                        <p>Gagal memuat transaksi: ${transResult.message}</p>
                    </div>
                `;
            }
        }
        
        // Load summary
        const summaryResult = await API.getSummary(username, token);
        
        if (summaryResult.success) {
            updateAdminSummary(summaryResult.summary);
        } else {
            updateAdminSummary({ total: 0, utang: 0, sisa: 0 });
        }
        
    } catch (error) {
        console.error('Error:', error);
        if (transactionsList) {
            transactionsList.innerHTML = `
                <div class="empty-state">
                    <p>Terjadi kesalahan saat memuat data</p>
                </div>
            `;
        }
    }
}

function updateAdminSummary(summary) {
    const totalUangEl = document.getElementById('adminTotalUang');
    const jumlahUtangEl = document.getElementById('adminJumlahUtang');
    const sisaUangEl = document.getElementById('adminSisaUang');
    
    if (totalUangEl) totalUangEl.textContent = formatRupiah(summary.total || 0);
    if (jumlahUtangEl) jumlahUtangEl.textContent = formatRupiah(summary.utang || 0);
    if (sisaUangEl) sisaUangEl.textContent = formatRupiah(summary.sisa || 0);
}

function renderAdminTransactions() {
    const transactionsList = document.getElementById('adminTransactionsList');
    
    if (!transactionsList) return;
    
    // Filter transactions
    let filtered = adminCurrentTransactions;
    if (adminCurrentFilter === 'belum') {
        filtered = adminCurrentTransactions.filter(t => t.status === 'Belum');
    } else if (adminCurrentFilter === 'bayar') {
        filtered = adminCurrentTransactions.filter(t => t.status === 'Bayar');
    }
    
    if (filtered.length === 0) {
        transactionsList.innerHTML = `
            <div class="empty-state">
                <p>Tidak ada transaksi</p>
            </div>
        `;
        return;
    }
    
    transactionsList.innerHTML = filtered.map((trans, index) => {
        const originalIndex = adminCurrentTransactions.indexOf(trans);
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
                    <button class="btn-edit" onclick="editAdminTransaction(${originalIndex})">
                        ✏️ Edit
                    </button>
                    <button class="btn-delete" onclick="deleteAdminTransaction(${originalIndex})">
                        🗑️ Hapus
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function openAdminTransactionModal(editData = null, rowIndex = null) {
    const modal = document.getElementById('adminTransactionModal');
    const form = document.getElementById('adminTransactionForm');
    const title = document.getElementById('adminTransactionModalTitle');
    
    if (form) form.reset();
    
    document.getElementById('adminTransactionUsername').value = selectedUsername;
    
    if (editData) {
        // Edit mode
        if (title) title.textContent = '✏️ Edit Transaksi';
        
        document.getElementById('adminTransactionRowIndex').value = rowIndex;
        document.getElementById('adminTransactionTanggal').value = editData.tanggal.split('-').reverse().join('-');
        document.getElementById('adminTransactionNama').value = editData.nama;
        document.getElementById('adminTransactionJenis').value = editData.jenis;
        document.getElementById('adminTransactionHarga').value = editData.harga;
        document.getElementById('adminTransactionStatus').value = editData.status;
        document.getElementById('adminTransactionKeterangan').value = editData.keterangan || '';
    } else {
        // Add mode
        if (title) title.textContent = '➕ Tambah Transaksi';
        document.getElementById('adminTransactionRowIndex').value = '';
        document.getElementById('adminTransactionTanggal').value = new Date().toISOString().split('T')[0];
    }
    
    if (modal) {
        modal.classList.add('show');
    }
}

async function handleAdminTransactionSubmit(e) {
    e.preventDefault();
    
    const username = document.getElementById('adminTransactionUsername').value;
    const rowIndex = document.getElementById('adminTransactionRowIndex').value;
    const tanggalInput = document.getElementById('adminTransactionTanggal').value;
    const nama = document.getElementById('adminTransactionNama').value;
    const jenis = document.getElementById('adminTransactionJenis').value;
    const harga = document.getElementById('adminTransactionHarga').value;
    const status = document.getElementById('adminTransactionStatus').value;
    const keterangan = document.getElementById('adminTransactionKeterangan').value;
    
    // Convert date format
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
            closeModal('adminTransactionModal');
            viewUserData(username); // Reload data
            showSuccess(rowIndex ? 'Transaksi berhasil diupdate' : 'Transaksi berhasil ditambahkan');
        } else {
            showError('Gagal menyimpan: ' + result.message);
        }
    } catch (error) {
        console.error('Error:', error);
        showError('Terjadi kesalahan');
    }
}

function editAdminTransaction(index) {
    const transaction = adminCurrentTransactions[index];
    if (transaction) {
        openAdminTransactionModal(transaction, index);
    }
}

async function deleteAdminTransaction(index) {
    if (!confirm('Apakah Anda yakin ingin menghapus transaksi ini?')) {
        return;
    }
    
    try {
        const result = await API.deleteTransaction(selectedUsername, index, token);
        
        if (result.success) {
            viewUserData(selectedUsername); // Reload data
            showSuccess('Transaksi berhasil dihapus');
        } else {
            showError('Gagal menghapus: ' + result.message);
        }
    } catch (error) {
        console.error('Error:', error);
        showError('Terjadi kesalahan');
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('show');
    }
}

function showSuccess(message) {
    alert('✅ ' + message);
}

function showError(message) {
    alert('❌ ' + message);
}
