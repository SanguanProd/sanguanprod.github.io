// Configuration file for Data Pulsa

const CONFIG = {
    // Ganti URL ini dengan URL Google Apps Script Web App khusus Data Pulsa
    // Format: https://script.google.com/macros/s/SCRIPT_ID/exec
    API_URL: 'https://script.google.com/macros/s/AKfycbwzcqXneiM07qCiVN-NzPJymFAQ0JQHW4dCdJZ3sR5200cadAHFO2X06fuqKqK5SVgW/exec',
    
    // Spreadsheet ID Admin (sama dengan yang utama)
    ADMIN_SPREADSHEET_ID: '1AHkRaRjdYbW2HlKx6_nfXk7HK0cR5CRnqoqJtHbEelw',
    
    // Session timeout (dalam milidetik) - 24 jam
    SESSION_TIMEOUT: 24 * 60 * 60 * 1000,
    
    // Role types
    ROLES: {
        ADMIN: 'admin',
        USER: 'user'
    }
};

// Fungsi helper untuk API calls
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
    
    // Get user's spreadsheet URL
    async getUserSpreadsheet(username, token) {
        return await this.call('getUserSpreadsheet', { username, token });
    },
    
    // Add new user project (admin only)
    async addUserProject(username, spreadsheetUrl, token) {
        return await this.call('addUserProject', { username, spreadsheetUrl, token });
    },
    
    // Get all user projects (admin only)
    async getAllProjects(token) {
        return await this.call('getAllProjects', { token });
    },
    
    // Get transactions from user spreadsheet
    async getTransactions(username, token) {
        return await this.call('getTransactions', { username, token });
    },
    
    // Add transaction
    async addTransaction(username, transaction, token) {
        return await this.call('addTransaction', { username, transaction, token });
    },
    
    // Update transaction
    async updateTransaction(username, rowIndex, transaction, token) {
        return await this.call('updateTransaction', { username, rowIndex, transaction, token });
    },
    
    // Delete transaction
    async deleteTransaction(username, rowIndex, token) {
        return await this.call('deleteTransaction', { username, rowIndex, token });
    },
    
    // Get summary (total, utang, sisa)
    async getSummary(username, token) {
        return await this.call('getSummary', { username, token });
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

function parseRupiah(rupiah) {
    return parseInt(rupiah.replace(/[^0-9-]/g, '')) || 0;
}
