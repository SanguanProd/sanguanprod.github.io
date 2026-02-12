# 🎨 Logo & PWA Setup - Sanguanprod

Logo "Sanguan HD" sudah diproses dan siap dipasang!

## 📁 File yang Sudah Dibuat:

### **Folder `/icons/`:**
```
icons/
├── icon-512.png          (512x512 - Android high-res)
├── icon-192.png          (192x192 - Android standard)
├── apple-icon-180.png    (180x180 - iPhone/iPad)
├── favicon-32.png        (32x32 - favicon PNG)
├── favicon.ico           (favicon ICO)
└── logo-original.png     (backup logo asli)
```

### **File Root:**
```
manifest.json             (PWA manifest untuk install)
meta-tags.txt            (kode yang harus dicopy ke HTML)
```

---

## 🚀 Cara Pasang:

### **Step 1: Upload File ke GitHub**

Upload struktur folder seperti ini:
```
repository/
├── icons/                ← FOLDER BARU
│   ├── icon-512.png
│   ├── icon-192.png
│   ├── apple-icon-180.png
│   ├── favicon-32.png
│   └── favicon.ico
│
├── manifest.json         ← FILE BARU
├── index.html
├── login.html
├── dashboard.html
└── ...
```

### **Step 2: Update Semua File HTML**

Buka file `meta-tags.txt`, copy semua isinya.

Tambahkan ke **SEMUA file HTML** di dalam `<head>`:

**File yang perlu diedit:**
- ✅ `index.html`
- ✅ `login.html`
- ✅ `dashboard.html`
- ✅ `datapulsa/index.html`
- ✅ `datapulsa/admin.html`

**Contoh:**
```html
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    
    <!-- PASTE META TAGS DI SINI -->
    <link rel="manifest" href="/manifest.json">
    <meta name="theme-color" content="#89CFF0">
    <!-- ... dst (lihat meta-tags.txt) -->
    
    <title>Sanguanprod</title>
    <link rel="stylesheet" href="style.css">
</head>
```

### **Step 3: Commit & Push ke GitHub**

```bash
git add icons/ manifest.json *.html
git commit -m "Add logo & PWA support"
git push origin main
```

---

## 📱 Cara Install di HP:

### **Android (Chrome/Edge):**
1. Buka website di browser
2. Tap menu **⋮** (3 titik)
3. Pilih **"Add to Home screen"** atau **"Install app"**
4. Konfirmasi
5. ✅ Icon "Sanguan HD" muncul di home screen!

### **iOS (Safari):**
1. Buka website di Safari
2. Tap tombol **Share** (⬆️)
3. Scroll, pilih **"Add to Home Screen"**
4. Konfirmasi
5. ✅ Icon "Sanguan HD" muncul di home screen!

---

## ✅ Hasil Akhir:

- ✅ **Tab browser** → Logo Sanguan HD di favicon
- ✅ **Install di Android** → Logo Sanguan HD
- ✅ **Install di iPhone** → Logo Sanguan HD
- ✅ **Theme color** → Biru pastel (#89CFF0)
- ✅ **Fullscreen mode** → Seperti aplikasi native

---

## 🎨 Spesifikasi Logo:

- **Nama:** Sanguan HD
- **Style:** Geometric triangular "A" dengan gradient biru-cyan
- **Background:** Transparent/Black
- **Ukuran asli:** 1000x1000px
- **Format:** PNG (dengan transparency)

---

**Selamat! Website kamu sekarang bisa diinstall seperti aplikasi!** 🚀
