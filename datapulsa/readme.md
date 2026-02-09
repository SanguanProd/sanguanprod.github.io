# 💰 DATA PULSA - Sistem Manajemen Keuangan

Fitur manajemen keuangan dan tracking utang untuk website Sanguanprod dengan multi-user spreadsheet system.

## 🎯 Fitur Utama

### **Untuk User:**
- ✅ Lihat ringkasan keuangan (Total Uang, Jumlah Utang, Sisa Uang)
- ✅ Tambah transaksi (pemasukan/pengeluaran)
- ✅ Stor uang (pengeluaran dengan keterangan)
- ✅ Edit dan hapus transaksi
- ✅ Filter transaksi (Semua / Belum Bayar / Sudah Bayar)
- ✅ Data disimpan di spreadsheet pribadi user

### **Untuk Admin:**
- ✅ Tambah project baru (mapping user ke spreadsheet)
- ✅ Lihat semua user projects
- ✅ Lihat dan edit data semua user
- ✅ Maintenance data user
- ✅ Full CRUD transaksi untuk semua user

## 📁 Struktur File

```
datapulsa/
├── index.html           # Halaman utama user
├── admin.html           # Halaman admin panel
├── style.css            # Stylesheet futuristik
├── script.js            # Logic user interface
├── admin.js             # Logic admin panel
├── config.js            # API configuration
├── CodeDataPulsa.gs     # Backend Google Apps Script
└── README.md            # Dokumentasi ini
```

## 🗂️ Struktur Database

### **Spreadsheet Admin** (ID: 1AHkRaRjdYbW2HlKx6_nfXk7HK0cR5CRnqoqJtHbEelw)

**Sheet "Users"** (sudah ada dari sistem utama):
```
username | password | role | token | last_login
```

**Sheet "UserProjects"** (buat baru):
```
username | spreadsheet_url | created_date | status
user1    | https://...     | 09-02-2025   | active
user2    | https://...     | 09-02-2025   | active
```

### **Spreadsheet User** (milik masing-masing user)

User harus membuat spreadsheet sendiri dan share dengan "Anyone with link can edit"

**Sheet "Transaksi"**:
```
tanggal    | nama        | jenis      | harga    | status | keterangan
09-02-2025 | Pulsa Budi  | XL         | -30000   | Belum  | Hutang pulsa Februari
09-02-2025 | Isi Saldo   | Isi Saldo  | 100000   | Bayar  | Transfer dari rekening
09-02-2025 | Makan       | Stor       | -15000   | Bayar  | Makan siang warteg
```

**Keterangan Kolom:**
- **tanggal**: Format DD-MM-YYYY
- **nama**: Nama transaksi
- **jenis**: Jenis/kategori transaksi
- **harga**: Angka (positif = pemasukan, negatif = pengeluaran)
- **status**: "Bayar" atau "Belum"
- **keterangan**: Catatan tambahan

## 🚀 Setup Google Apps Script

### Langkah 1: Setup Spreadsheet Admin

1. Buka spreadsheet admin: `https://docs.google.com/spreadsheets/d/1AHkRaRjdYbW2HlKx6_nfXk7HK0cR5CRnqoqJtHbEelw/edit`
2. Buat sheet baru dengan nama **"UserProjects"**
3. Isi header row:
   ```
   username | spreadsheet_url | created_date | status
   ```

### Langkah 2: Deploy Google Apps Script

1. Buka **Extensions** > **Apps Script** (project BARU, terpisah dari Code.gs utama)
2. Buat project baru dengan nama "Data Pulsa Backend"
3. Copy semua kode dari **CodeDataPulsa.gs**
4. Paste ke editor
5. **Save** (Ctrl+S)

### Langkah 3: Initialize Spreadsheet (Opsional)

1. Di Apps Script Editor, pilih fungsi `initializeDataPulsaSpreadsheet`
2. Klik **Run**
3. Authorize aplikasi jika diminta

### Langkah 4: Deploy sebagai Web App

1. Klik **Deploy** > **New deployment**
2. Klik ⚙️ (gear icon) > pilih **Web app**
3. Isi deskripsi: "Data Pulsa API"
4. Execute as: **Me**
5. Who has access: **Anyone**
6. Klik **Deploy**
7. **Copy URL deployment**

Format URL:
```
https://script.google.com/macros/s/SCRIPT_ID/exec
```

### Langkah 5: Update config.js

1. Buka file `datapulsa/config.js`
2. Ganti `YOUR_DATAPULSA_APPS_SCRIPT_URL_HERE` dengan URL deployment:

```javascript
const CONFIG = {
    API_URL: 'https://script.google.com/macros/s/SCRIPT_ID/exec',
    // ...
};
```

## 📝 Cara Menggunakan

### **Setup User Baru (Admin)**

1. **User membuat spreadsheet:**
   - User buka Google Spreadsheet
   - Buat spreadsheet baru
   - Buat sheet dengan nama **"Transaksi"**
   - Isi header: `tanggal | nama | jenis | harga | status | keterangan`
   - Share dengan **"Anyone with link can edit"**
   - Copy link spreadsheet

2. **Admin menambahkan project:**
   - Login sebagai admin
   - Buka `datapulsa/admin.html`
   - Klik **"Tambah Project Baru"**
   - Input username (harus sudah terdaftar)
   - Paste link spreadsheet user
   - Klik **"Tambah Project"**

3. **User mulai menggunakan:**
   - User login
   - Buka menu **"Senjata"** > **"Data Pulsa"**
   - Mulai input transaksi

### **Penggunaan User**

**Tambah Transaksi Biasa:**
1. Klik tombol **"+ Tambah Transaksi"**
2. Isi form:
   - Tanggal
   - Nama (contoh: "Pulsa Budi")
   - Jenis (contoh: "XL")
   - Harga (contoh: -30000 untuk utang)
   - Status (Belum/Bayar)
   - Keterangan (opsional)
3. Klik **"Simpan"**

**Stor Uang (Pengeluaran):**
1. Klik tombol **"💸 Stor Uang"**
2. Input jumlah (contoh: 15000)
3. Input keterangan (contoh: "Makan siang")
4. Klik **"Simpan"**
5. Otomatis tersimpan sebagai pengeluaran dengan status "Bayar"

**Isi Saldo:**
1. Klik **"+ Tambah Transaksi"**
2. Isi:
   - Nama: "Isi Saldo"
   - Jenis: "Isi Saldo"
   - Harga: 100000 (positif, tanpa minus)
   - Status: Bayar
3. Klik **"Simpan"**

**Filter Transaksi:**
- Pilih dropdown filter
- "Semua" = tampilkan semua
- "Belum Bayar" = hanya yang belum lunas
- "Sudah Bayar" = hanya yang sudah lunas

### **Penggunaan Admin**

**Lihat Data User:**
1. Buka `admin.html`
2. Lihat daftar project
3. Klik **"📊 Lihat & Edit Data"** pada user yang diinginkan
4. Modal akan menampilkan semua transaksi user

**Edit Data User:**
1. Setelah buka data user
2. Klik **"✏️ Edit"** pada transaksi yang ingin diubah
3. Edit data
4. Klik **"Simpan"**

**Tambah Transaksi untuk User:**
1. Buka data user
2. Klik **"➕ Tambah Transaksi untuk User"**
3. Isi form transaksi
4. Klik **"Simpan"**

## 💡 Perhitungan Otomatis

```javascript
Total Uang = SUM(semua harga)
// Contoh: 100000 + (-30000) + (-15000) = 55000

Jumlah Utang = SUM(harga negatif yang status "Belum")
// Contoh: -30000 (belum bayar) = 30000

Sisa Uang = Total Uang - Jumlah Utang
// Contoh: 55000 - 30000 = 25000
```

## 🔗 Integrasi dengan Dashboard Utama

### Update dashboard.html (sedikit)

Tambahkan link di section **"Senjata"**:

```html
<!-- Di dashboard.html, section page-senjata -->
<div class="weapon-grid">
    <!-- Weapon items yang sudah ada -->
    
    <!-- Tambahkan item Data Pulsa -->
    <div class="weapon-item">
        <div class="weapon-icon">💰</div>
        <h4>Data Pulsa</h4>
        <p>Sistem manajemen keuangan dan tracking utang</p>
        <button class="app-launch" onclick="window.location.href='datapulsa/index.html'">
            Buka
        </button>
    </div>
</div>
```

## 🔒 Keamanan

✅ **Token Verification** - Setiap request diverifikasi dengan token
✅ **Role-Based Access** - User hanya akses data sendiri, admin akses semua
✅ **Spreadsheet Permission** - User spreadsheet harus di-share explicit
✅ **Input Validation** - Validasi di frontend dan backend

## 🐛 Troubleshooting

### "Spreadsheet user tidak ditemukan"

**Solusi:**
- Pastikan user sudah ditambahkan di admin panel
- Cek link spreadsheet sudah benar
- Pastikan spreadsheet di-share dengan "Anyone with link can edit"

### "Tidak dapat mengakses spreadsheet"

**Solusi:**
- User harus share spreadsheet dengan permission "edit"
- Coba re-deploy Apps Script
- Pastikan Apps Script execute as "Me" dan access "Anyone"

### Data tidak muncul

**Solusi:**
- Cek console browser (F12)
- Pastikan API URL di config.js sudah benar
- Cek Apps Script logs (Executions tab)
- Pastikan sheet "Transaksi" ada di spreadsheet user

### Perhitungan salah

**Solusi:**
- Pastikan harga ditulis dengan benar:
  - Pengeluaran: **-30000** (dengan minus)
  - Pemasukan: **100000** (tanpa minus)
- Refresh halaman untuk update perhitungan

## 📱 Mobile Optimization

Website sudah fully responsive untuk mobile:
- Touch-friendly buttons
- Optimized form layout
- Scrollable transaction list
- Compact summary cards

## 🎨 Customization

### Ubah Warna

Edit `style.css`:
```css
:root {
    --primary-blue: #89CFF0;
    --accent-cyan: #00D9FF;
    /* ... dst */
}
```

### Tambah Kolom Baru

1. Tambah kolom di spreadsheet
2. Update `CodeDataPulsa.gs` (function getTransactions, addTransaction, updateTransaction)
3. Update form di `index.html` dan `admin.html`
4. Update render di `script.js` dan `admin.js`

## 📞 Support

Jika ada masalah:
1. Cek console browser (F12 > Console)
2. Cek Apps Script logs (Apps Script Editor > Executions)
3. Pastikan semua setup sudah benar
4. Test dengan data sample dulu

---

**Version:** 1.0.0  
**Build Date:** 2025-02-09  
**Part of:** Sanguanprod - Kerajaan Xiawbowo

🚀 Selamat menggunakan Data Pulsa!
