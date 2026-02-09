// Main JavaScript for Sanguanprod

// ==================== LOGIN PAGE ====================
if (window.location.pathname.includes('login.html')) {
    const loginForm = document.getElementById('loginForm');
    const errorMessage = document.getElementById('errorMessage');
    
    // Check if already logged in
    const token = localStorage.getItem('session_token');
    if (token) {
        window.location.href = 'dashboard.html';
    }
    
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        // Show loading state
        const submitBtn = loginForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.querySelector('.button-text').textContent;
        submitBtn.querySelector('.button-text').textContent = 'Memvalidasi...';
        submitBtn.disabled = true;
        
        try {
            const result = await API.login(username, password);
            
            if (result.success) {
                // Save session
                localStorage.setItem('session_token', result.token);
                localStorage.setItem('username', result.username);
                localStorage.setItem('role', result.role);
                localStorage.setItem('login_time', Date.now());
                
                // Redirect to dashboard
                window.location.href = 'dashboard.html';
            } else {
                // Show error
                errorMessage.textContent = result.message || 'Login gagal. Periksa kembali ID dan kode neural Anda.';
                errorMessage.classList.add('show');
                
                setTimeout(() => {
                    errorMessage.classList.remove('show');
                }, 5000);
            }
        } catch (error) {
            console.error('Login error:', error);
            errorMessage.textContent = 'Terjadi kesalahan sistem. Silakan coba lagi.';
            errorMessage.classList.add('show');
        } finally {
            submitBtn.querySelector('.button-text').textContent = originalText;
            submitBtn.disabled = false;
        }
    });
}

// ==================== DASHBOARD PAGE ====================
if (window.location.pathname.includes('dashboard.html')) {
    // Check authentication
    const token = localStorage.getItem('session_token');
    const username = localStorage.getItem('username');
    const role = localStorage.getItem('role');
    const loginTime = localStorage.getItem('login_time');
    
    // Verify session
    if (!token || !username) {
        window.location.href = 'login.html';
    }
    
    // Check session timeout
    if (loginTime) {
        const elapsed = Date.now() - parseInt(loginTime);
        if (elapsed > CONFIG.SESSION_TIMEOUT) {
            localStorage.clear();
            window.location.href = 'login.html';
        }
    }
    
    // Initialize dashboard
    initDashboard();
    
    function initDashboard() {
        // Set user info
        const userInitial = document.getElementById('userInitial');
        const userName = document.getElementById('userName');
        const userRole = document.getElementById('userRole');
        const welcomeUser = document.getElementById('welcomeUser');
        const accessLevel = document.getElementById('accessLevel');
        
        if (userInitial) userInitial.textContent = username.charAt(0).toUpperCase();
        if (userName) userName.textContent = username;
        if (userRole) userRole.textContent = role;
        if (welcomeUser) welcomeUser.textContent = username;
        if (accessLevel) accessLevel.textContent = role === 'admin' ? 'Administrator' : 'User';
        
        // Show edit button for admin
        if (role === 'admin') {
            const editHomeBtn = document.getElementById('editHomeBtn');
            if (editHomeBtn) editHomeBtn.style.display = 'block';
        }
        
        // Sidebar functionality
        const sidebar = document.getElementById('sidebar');
        const sidebarToggle = document.getElementById('sidebarToggle');
        const mobileSidebarToggle = document.getElementById('mobileSidebarToggle');
        const navItems = document.querySelectorAll('.nav-item');
        
        // Desktop sidebar toggle
        if (sidebarToggle) {
            sidebarToggle.addEventListener('click', () => {
                sidebar.classList.toggle('collapsed');
            });
        }
        
        // Mobile sidebar toggle
        if (mobileSidebarToggle) {
            mobileSidebarToggle.addEventListener('click', () => {
                sidebar.classList.toggle('mobile-open');
            });
        }
        
        // Navigation
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                
                // Remove active class from all items
                navItems.forEach(nav => nav.classList.remove('active'));
                
                // Add active class to clicked item
                item.classList.add('active');
                
                // Get page to show
                const page = item.getAttribute('data-page');
                
                // Hide all pages
                document.querySelectorAll('.page-section').forEach(section => {
                    section.classList.remove('active');
                });
                
                // Show selected page
                const selectedPage = document.getElementById(`page-${page}`);
                if (selectedPage) {
                    selectedPage.classList.add('active');
                }
                
                // Update page title
                const pageTitle = document.getElementById('pageTitle');
                if (pageTitle) {
                    pageTitle.textContent = item.querySelector('.nav-text').textContent;
                }
                
                // Close mobile sidebar
                if (window.innerWidth <= 768) {
                    sidebar.classList.remove('mobile-open');
                }
            });
        });
        
        // Logout functionality
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                if (confirm('Apakah Anda yakin ingin keluar dari sistem?')) {
                    localStorage.clear();
                    window.location.href = 'login.html';
                }
            });
        }
        
        // Update time display
        updateTime();
        setInterval(updateTime, 1000);
        
        // Load home content
        loadHomeContent();
        
        // Home content editing (admin only)
        if (role === 'admin') {
            setupHomeContentEditor();
        }
    }
    
    function updateTime() {
        const timeDisplay = document.getElementById('currentTime');
        if (timeDisplay) {
            const now = new Date();
            const timeString = now.toLocaleTimeString('id-ID', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
            const dateString = now.toLocaleDateString('id-ID', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
            });
            timeDisplay.textContent = `${dateString} ${timeString}`;
        }
    }
    
    async function loadHomeContent() {
        const homeContentDisplay = document.getElementById('homeContentDisplay');
        
        if (homeContentDisplay) {
            homeContentDisplay.innerHTML = '<p style="color: var(--text-secondary);">Memuat konten...</p>';
            
            try {
                const result = await API.getHomeContent();
                
                if (result.success && result.content) {
                    homeContentDisplay.innerHTML = formatContent(result.content);
                } else {
                    homeContentDisplay.innerHTML = `
                        <h4>Selamat Datang di Kerajaan Xiawbowo</h4>
                        <p>Portal ini merupakan pusat komando utama untuk semua pewaris kerajaan. Dari sini, Anda dapat mengakses berbagai sistem dan informasi penting.</p>
                        <h5>Fitur Utama:</h5>
                        <ul>
                            <li><strong>Senjata</strong> - Akses arsenal senjata futuristik kerajaan</li>
                            <li><strong>Aplikasi</strong> - Sistem aplikasi neural dan quantum</li>
                            <li><strong>Tentang Web</strong> - Informasi teknologi dan versi sistem</li>
                        </ul>
                        <p>Sistem keamanan neural aktif. Semua akses terenkripsi dengan teknologi quantum level 5.</p>
                    `;
                }
            } catch (error) {
                console.error('Error loading content:', error);
                homeContentDisplay.innerHTML = '<p style="color: var(--accent-pink);">Gagal memuat konten. Menggunakan konten default.</p>';
            }
        }
    }
    
    function formatContent(content) {
        // Convert markdown-like syntax to HTML
        content = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        content = content.replace(/\*(.*?)\*/g, '<em>$1</em>');
        content = content.replace(/\n/g, '<br>');
        return content;
    }
    
    function setupHomeContentEditor() {
        const editHomeBtn = document.getElementById('editHomeBtn');
        const homeContentDisplay = document.getElementById('homeContentDisplay');
        const homeContentEditor = document.getElementById('homeContentEditor');
        const homeContentText = document.getElementById('homeContentText');
        const saveHomeBtn = document.getElementById('saveHomeBtn');
        const cancelHomeBtn = document.getElementById('cancelHomeBtn');
        
        if (!editHomeBtn) return;
        
        editHomeBtn.addEventListener('click', () => {
            // Get current content
            const currentContent = homeContentDisplay.innerHTML
                .replace(/<br>/g, '\n')
                .replace(/<strong>(.*?)<\/strong>/g, '**$1**')
                .replace(/<em>(.*?)<\/em>/g, '*$1*')
                .replace(/<[^>]+>/g, '');
            
            homeContentText.value = currentContent;
            
            // Show editor
            homeContentDisplay.style.display = 'none';
            homeContentEditor.style.display = 'block';
            editHomeBtn.style.display = 'none';
        });
        
        cancelHomeBtn.addEventListener('click', () => {
            // Hide editor
            homeContentDisplay.style.display = 'block';
            homeContentEditor.style.display = 'none';
            editHomeBtn.style.display = 'block';
        });
        
        saveHomeBtn.addEventListener('click', async () => {
            const content = homeContentText.value;
            const token = localStorage.getItem('session_token');
            
            saveHomeBtn.textContent = 'Menyimpan...';
            saveHomeBtn.disabled = true;
            
            try {
                const result = await API.updateHomeContent(content, token);
                
                if (result.success) {
                    homeContentDisplay.innerHTML = formatContent(content);
                    homeContentDisplay.style.display = 'block';
                    homeContentEditor.style.display = 'none';
                    editHomeBtn.style.display = 'block';
                    
                    alert('Konten berhasil disimpan!');
                } else {
                    alert('Gagal menyimpan konten: ' + (result.message || 'Error tidak diketahui'));
                }
            } catch (error) {
                console.error('Save error:', error);
                alert('Terjadi kesalahan saat menyimpan konten.');
            } finally {
                saveHomeBtn.textContent = 'Simpan';
                saveHomeBtn.disabled = false;
            }
        });
    }
    
    // App launch buttons
    const appLaunchButtons = document.querySelectorAll('.app-launch');
    appLaunchButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            alert('Fitur ini akan segera hadir dalam update berikutnya!');
        });
    });
}
