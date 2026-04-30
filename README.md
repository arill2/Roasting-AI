# CV ROASTER — Edisi Jujur Tanpa Filter

Aplikasi web "CV Roaster" — tool yang menerima upload CV dari mahasiswa Indonesia dan memberikan feedback tajam ala HRD senior menggunakan AI. Target pengguna: mahasiswa yang mau masuk PTN, daftar beasiswa, atau melamar kerja pertama.

---

## 🌟 Fitur Utama

- **AI Roasting (Groq API)**: Menggunakan model `llama-3.3-70b-versatile` dengan system prompt khusus ala "HRD Senior Galak".
- **Sistem Voucher (Monetisasi)**: Sistem kuota berjenjang (Free 3x, Starter, Pro, Unlimited) menggunakan `localStorage`.
- **Vercel Serverless Proxy**: Backend ringan untuk menyembunyikan API key dari browser dan menangani keamanan.
- **UI/UX Premium**: Desain *dark editorial* dengan transisi halus dan animasi scroll-triggered.
- **Dual Mode Input**: Mendukung upload file PDF (parsing via `pdfjs-dist`) atau paste teks manual.
- **Keamanan Ganda**: Dilengkapi rate limiting, pembatasan ukuran file/teks, dan sanitasi error.

---

## 🏗️ Arsitektur & Keamanan

Awalnya project ini adalah *frontend-only*. Namun untuk skala produksi, telah ditambahkan **Vercel Serverless Function** (`api/roast.js`) sebagai proxy dengan fitur keamanan berikut:

1. **API Key Protection**: Key disimpan di Vercel Env, tidak diekspos ke frontend.
2. **Rate Limiting**: Frontend (12 detik debounce) & Backend (Max 5 request / menit / IP).
3. **Input Validation**: Batas ukuran PDF maksimal 5MB, batas panjang teks maksimal 10.000 karakter.
4. **Voucher Validation**: Memvalidasi input format kode voucher dan batas penggunaan free quota.
5. **Error Sanitization**: Menyaring error dari API agar info internal tidak bocor ke user.

---

## 🛠️ Tech Stack

- **Frontend**: React + Vite
- **Backend (API)**: Vercel Serverless Functions (`api/roast.js`)
- **Styling**: Vanilla CSS (`index.css`) + Inline Styles untuk komponen
- **AI Engine**: Groq API
- **PDF Parser**: `pdfjs-dist`
- **Deployment**: Vercel

---

## 📁 Struktur Folder Utama

```
cv-roaster/
├── api/
│   └── roast.js              ← Backend Proxy Vercel (Security & API Call)
├── src/
│   ├── components/
│   │   ├── CVRoaster.jsx     ← UI Utama (Upload, Paste, Surat Hasil)
│   │   └── VoucherGate.jsx   ← UI Bar Input Voucher & Status Kuota
│   ├── constants/
│   │   ├── prompt.js         ← System Prompt HRD Senior
│   │   └── vouchers.js       ← Konfigurasi & Mapping Kode Voucher
│   ├── hooks/
│   │   └── useScrollReveal.js← Custom hook untuk animasi scroll
│   ├── services/
│   │   ├── groqService.js    ← Dual-mode service (Dev: Direct, Prod: via /api)
│   │   └── voucherService.js ← Logika Kuota & LocalStorage Session
│   └── utils/
│       └── pdfParser.js      ← Parsing teks dari PDF
├── .env                      ← Berisi Kode Voucher (dan API Key lokal)
├── vercel.json               ← Konfigurasi routing Vercel
└── index.html                ← Entry point (dilengkapi CSP Header)
```

---

## 🎟️ Sistem Voucher (Cara Kerja)

Sistem voucher berjalan di sisi client (`localStorage`) untuk MVP:
- **FREE**: Default 3x penggunaan.
- **STARTER / PRO / UNLIMITED**: Diaktifkan melalui kode rahasia.
- **Kode**: Kode-kode voucher valid disimpan di file `.env` dan di-bundle ke build. Format kode: `STR-XXXXX`, `PRO-XXXXX`, `UNL-XXXXX`.
- Kode yang sudah terpakai di sebuah browser akan masuk daftar `cv_used_vouchers`.

*(Catatan Security: Karena menggunakan localStorage, sistem kuota ini bisa di-bypass oleh advanced user. Untuk upgrade selanjutnya, pindahkan validasi voucher sepenuhnya ke database backend seperti Supabase/Firebase).*

---

## 🚀 Cara Setup & Development Lokal

1. **Clone & Install**
   ```bash
   git clone https://github.com/arill2/Roasting-AI.git
   cd Roasting-AI
   npm install
   ```

2. **Setup Environment Variables**
   Buat file `.env` di root folder dan isi dengan:
   ```env
   VITE_GROQ_API_KEY=gsk_your_api_key_here
   
   # Kode Voucher Valid (pisahkan dengan koma)
   VITE_VOUCHERS_STARTER=STR-12345,STR-ABCDE
   VITE_VOUCHERS_PRO=PRO-99999,PRO-XYZ12
   VITE_VOUCHERS_UNLIMITED=UNL-BOSS0,UNL-ADMIN
   ```

3. **Jalankan Dev Server**
   ```bash
   npm run dev
   ```
   *(Saat mode dev lokal, aplikasi akan langsung memanggil Groq API memakai `VITE_GROQ_API_KEY` untuk kemudahan testing tanpa Vercel CLI).*

---

## 🌐 Panduan Deploy ke Vercel (Production)

Project ini **wajib** dideploy ke Vercel agar backend proxy `/api/roast` berfungsi:

1. Push repository ini ke GitHub.
2. Buka [Vercel Dashboard](https://vercel.com/) dan buat **New Project**.
3. Import repository GitHub ini.
4. Di bagian **Environment Variables**, tambahkan:
   - `GROQ_API_KEY` = `gsk_xxxx...` *(Key Groq untuk backend. Tidak perlu prefix VITE_)*
   - `VITE_VOUCHERS_STARTER` = *(daftar kode)*
   - `VITE_VOUCHERS_PRO` = *(daftar kode)*
   - `VITE_VOUCHERS_UNLIMITED` = *(daftar kode)*
5. Klik **Deploy**.

*(Saat di production, frontend akan memanggil endpoint `/api/roast` sehingga API Key aman dan tidak pernah dikirim ke browser pengguna).*