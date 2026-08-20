# JobFlow AI — Intelligent Job Auto-Applier (Jobstreet Edition)

Platform otomasi pencari & pelamar kerja cerdas berbasis **Google Gemini AI** dan **Playwright Engine** dengan arsitektur backend **NestJS**, database **PostgreSQL (Prisma)**, dan antarmuka web modern **Next.js** terinspirasi dari estetika desain **Apple**.

---

## 🌟 Fitur Utama

1. **AI Resume Extractor**:
   - Unggah berkas CV (PDF/DOCX/TXT).
   - Gemini AI mengekstrak data profil kandidat, keahlian (*skills cloud*), riwayat pengalaman kerja, dan pendidikan secara terstruktur.
2. **Dynamic AI Job Matcher & Evaluator**:
   - Mengevaluasi lowongan kerja terhadap CV kandidat secara semantik.
   - Menghitung **Match Score (0–100%)**, menyajikan alasan kecocokan, kelebihan profil (*strengths*), dan kesenjangan keterampilan (*skill gaps*).
3. **Personalized Cover Letter & Screening QA Generator**:
   - Menulis *Cover Letter* kustom yang terarah untuk setiap perusahaan secara otomatis.
   - Menjawab pertanyaan *screening* Jobstreet secara natural dan faktual berdasarkan pengalaman nyata kandidat.
4. **Playwright Automation Engine & Simulation (Dry-Run) Mode**:
   - Otomasi background worker untuk mencari, memfilter, dan melamar lowongan di Jobstreet.
   - **Mode Simulasi (Dry-Run)** untuk menguji seluruh penalaran AI dan verifikasi data tanpa mengirimkan lamaran riil.
   - Fitur jeda keamanan (*anti-bot human delay*) dan pembatas kuota harian.
5. **Apple-Inspired Executive Dashboard & Real-Time Terminal Logs**:
   - Kartu metrik KPI interaktif (*Total Lamaran, Hari Ini, Rata-rata Skor, dsb.*).
   - Streaming aktivitas worker secara langsung (*Live SSE Terminal*).
   - Drawer inspeksi detail dengan 1-click copy cover letter dan breakdown visual.

---

## 🛠️ Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, Lucide React, Apple Vanilla CSS Design System, Server-Sent Events (SSE).
- **Backend**: NestJS 10, TypeScript, Playwright, `@google/generative-ai` (Gemini), Multer, pdf-parse.
- **Database**: PostgreSQL 16 + Prisma ORM.

---

## 🚀 Cara Menjalankan

### 1. Jalankan Backend (Port 4000)
```bash
cd backend
npm install
npx prisma db push
npm run start:dev
```

### 2. Jalankan Frontend (Port 3000)
```bash
cd frontend
npm install
npm run dev
```

Buka browser di **http://localhost:3000**.
