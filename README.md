![React](https://img.shields.io/badge/React-19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-7-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![DaisyUI](https://img.shields.io/badge/DaisyUI-4.12-5A0EF8?style=for-the-badge&logo=daisyui&logoColor=white)
![TanStack Query](https://img.shields.io/badge/TanStack_Query-5-FF4154?style=for-the-badge&logo=reactquery&logoColor=white)
![Axios](https://img.shields.io/badge/Axios-1.13-5A29E4?style=for-the-badge&logo=axios&logoColor=white)

# FundRaise Frontend

Frontend dashboard FundRaise untuk mempertemukan UMKM dan investor melalui alur profil bisnis, pengajuan pendanaan, rekomendasi AI, negosiasi, invoice, investasi, dan distribusi profit.

## Role

- **UMKM**: kelola bisnis, dokumen, profil model bisnis, pengajuan, negosiasi, penjualan, dan profit.
- **Investor**: lihat peluang, rekomendasi, compare, negosiasi, invoice, wallet, portfolio, dan profit.
- **Admin**: review bisnis/dokumen, kelola pengajuan, user, invoice, investasi, profit, dan data operasional.

## Setup

```bash
npm install
npm run dev
```

Default dev server:

```text
http://localhost:5173
```

## Environment

Buat file `.env` dari `.env.example`.

```env
VITE_API_BASE_URL=http://localhost:5000/api/v1
VITE_API_KEY=your_api_key
```

## Scripts

```bash
npm run dev      # jalankan development server
npm run build    # build production
npm run preview  # preview hasil build
npm run lint     # cek lint
```

## Struktur Singkat

```text
src/
  components/        reusable UI dan dashboard layout
  lib/               api client, auth, i18n, formatter
  pages/auth/        login, register, reset password, verify email
  pages/public/      landing, about, services, portfolio, contact
  pages/dashboard/   halaman UMKM, investor, dan admin
```

## Repositori Terkait

Proyek backend ini merupakan bagian dari ekosistem aplikasi FundRaise. Berikut adalah repositori terkait lainnya:
- **Backend (fund-be)**: [github.com/kelpstones/fund-be](https://github.com/kelpstones/fund-be)
- **AI Service (fund-ai)**: [github.com/kelpstones/fund-ai](https://github.com/kelpstones/fund-ai)
- **Model Machine Learning**: [google drive](https://drive.google.com/drive/folders/1ARBgCh-3UrBW-yZY1RJW0xTPc5kv0hnt?usp=sharing)
- **Data Science (fund-ds)**: [github.com/kelpstones/fund-ds](https://github.com/kelpstones/fund-ds)

---

## Catatan

Pastikan backend `fund-be` berjalan dan CORS mengizinkan origin Vite sebelum menguji dashboard.
