// Configuration file for Sanguanprod

const CONFIG = {
    // Ganti URL ini dengan URL Google Apps Script Web App Anda setelah deploy
    // Format: https://script.google.com/macros/s/SCRIPT_ID/exec
    API_URL: 'https://script.google.com/macros/s/AKfycbz-qMGx1wo0BkwWMWk0BDSofHiAtyC1qT7Ig2FzvM_sWLZl8y1QI4tb6EaUFGFj1DBRhA/exec',
    
    // Spreadsheet ID (sudah disediakan)
    SPREADSHEET_ID: '1AHkRaRjdYbW2HlKx6_nfXk7HK0cR5CRnqoqJtHbEelw',
    
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
    
    async login(username, password) {
        return await this.call('login', { username, password });
    },
    
    async getHomeContent() {
        return await this.call('getHomeContent');
    },
    
    async updateHomeContent(content, token) {
        return await this.call('updateHomeContent', { content, token });
    },
    
    async verifyToken(token) {
        return await this.call('verifyToken', { token });
    }
};
