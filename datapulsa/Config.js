// Configuration for Data Pulsa - Single Spreadsheet System

const CONFIG = {
    // Ganti dengan URL Google Apps Script deployment
    API_URL: 'https://script.google.com/macros/s/AKfycbwYIm4bfNT4qZWvlGCpWsDkMV5ko-RQa7wyVvHolcrGXX1iRyYeGiJJ_j_kRubhGJgfUw/exec',
    
    // Spreadsheet ID (sama dengan spreadsheet utama)
    SPREADSHEET_ID: '1AHkRaRjdYbW2HlKx6_nfXk7HK0cR5CRnqoqJtHbEelw',
    
    SESSION_TIMEOUT: 24 * 60 * 60 * 1000,
    
    ROLES: {
        ADMIN: 'admin',
        USER: 'user'
    }
};

// API Helper
const API = {
    async call(action, data = {}) {
        try {
            const response = await fetch(CONFIG.API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'text/plain',
                },
                body: JSON.stringify({
                    action: action,
                    ...data
                })
            });
            
            const result = await response.json();
            return result;
        } catch (error) {
            console.error('API Error:', error);
            return { success: false, message: 'Koneksi ke server gagal' };
        }
    },
    
    // Get user's sheets
    async getUserSheets(username, token) {
        return await this.call('getUserSheets', { username, token });
    },
    
    // Get all sheets (admin only)
    async getAllSheets(token) {
        return await this.call('getAllSheets', { token });
    },
    
    // Create new sheet
    async createSheet(username, sheetName, token) {
        return await this.call('createSheet', { username, sheetName, token });
    },
    
    // Get transactions from sheet
    async getTransactions(sheetName, token) {
        return await this.call('getTransactions', { sheetName, token });
    },
    
    // Add transaction
    async addTransaction(sheetName, transaction, token) {
        return await this.call('addTransaction', { sheetName, transaction, token });
    },
    
    // Update transaction
    async updateTransaction(sheetName, rowIndex, transaction, token) {
        return await this.call('updateTransaction', { sheetName, rowIndex, transaction, token });
    },
    
    // Delete transaction
    async deleteTransaction(sheetName, rowIndex, token) {
        return await this.call('deleteTransaction', { sheetName, rowIndex, token });
    },
    
    // Get summary
    async getSummary(sheetName, token) {
        return await this.call('getSummary', { sheetName, token });
    }
};

// Helper functions
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


